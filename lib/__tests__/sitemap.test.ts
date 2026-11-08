import { describe, it, expect, vi, beforeEach } from 'vitest'

// Shallow mock of the PostgREST query builder: records each call and resolves
// with the next queued response. It validates query construction only.
type Call = [string, ...unknown[]]
const calls: Call[][] = []
const responses: { data: unknown; error: { message: string } | null }[] = []

function query() {
  const log: Call[] = []
  calls.push(log)
  const builder: Record<string, unknown> = {}
  for (const method of ['select', 'eq', 'gt', 'lt', 'order', 'limit']) {
    builder[method] = (...args: unknown[]) => { log.push([method, ...args]); return builder }
  }
  builder.then = (resolve: (v: unknown) => unknown) =>
    Promise.resolve(responses.shift() ?? { data: [], error: null }).then(resolve)
  return builder
}

vi.mock('../supabase', () => ({
  createServerClient: () => ({ from: () => query() }),
}))

import {
  buildSitemapIndex, buildUrlset, getMaxExternalId, getSitemapIndexUrls, getWordSitemapUrls,
  parseSitemapPage, wordSitemapPath,
} from '../sitemap'

beforeEach(() => {
  calls.length = 0
  responses.length = 0
})

describe('XML builders', () => {
  it('builds a urlset with escaped locations', () => {
    const xml = buildUrlset(['https://skarnik.app/?a=1&b=2'])
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
    expect(xml).toContain('<url><loc>https://skarnik.app/?a=1&amp;b=2</loc></url>')
  })

  it('builds a sitemap index', () => {
    const xml = buildSitemapIndex(['https://skarnik.app/sitemaps/pages.xml'])
    expect(xml).toContain('<sitemapindex')
    expect(xml).toContain('<sitemap><loc>https://skarnik.app/sitemaps/pages.xml</loc></sitemap>')
  })
})

describe('parseSitemapPage', () => {
  it('reads the page number', () => {
    expect(parseSitemapPage('0.xml')).toBe(0)
    expect(parseSitemapPage('12.xml')).toBe(12)
  })

  it('rejects anything else', () => {
    expect(parseSitemapPage('0')).toBeNull()
    expect(parseSitemapPage('-1.xml')).toBeNull()
    expect(parseSitemapPage('a.xml')).toBeNull()
    expect(parseSitemapPage('99999.xml')).toBeNull()
  })

  it('round-trips wordSitemapPath', () => {
    expect(wordSitemapPath('tsbm', 3)).toBe('/sitemaps/tsbm/3.xml')
  })
})

describe('getMaxExternalId', () => {
  it('takes the highest external_id of the direction', async () => {
    responses.push({ data: [{ external_id: 123456 }], error: null })
    expect(await getMaxExternalId('belrus')).toBe(123456)
    expect(calls[0]).toEqual([
      ['select', 'external_id'],
      ['eq', 'direction', 'belrus'],
      ['order', 'external_id', { ascending: false }],
      ['limit', 1],
    ])
  })

  it('returns 0 for an empty dictionary', async () => {
    responses.push({ data: [], error: null })
    expect(await getMaxExternalId('tsbm')).toBe(0)
  })

  it('throws on a Supabase error', async () => {
    responses.push({ data: null, error: { message: 'boom' } })
    await expect(getMaxExternalId('tsbm')).rejects.toThrow('boom')
  })
})

describe('getSitemapIndexUrls', () => {
  it('lists static pages and one file per 50k ids of each dictionary', async () => {
    responses.push(
      { data: [{ external_id: 120000 }], error: null }, // belrus → pages 0..2
      { data: [{ external_id: 49999 }], error: null }, // rusbel → page 0
      { data: [], error: null }, // tsbm → none
    )
    expect(await getSitemapIndexUrls()).toEqual([
      'https://skarnik.app/sitemaps/pages.xml',
      'https://skarnik.app/sitemaps/belrus/0.xml',
      'https://skarnik.app/sitemaps/belrus/1.xml',
      'https://skarnik.app/sitemaps/belrus/2.xml',
      'https://skarnik.app/sitemaps/rusbel/0.xml',
    ])
  })
})

describe('getWordSitemapUrls', () => {
  it('pages through the id span by keyset and skips aliases', async () => {
    const full = Array.from({ length: 1000 }, (_, i) => ({ external_id: 50000 + i, redirect_to: null }))
    responses.push(
      { data: full, error: null },
      { data: [{ external_id: 51500, redirect_to: '7' }, { external_id: 51501, redirect_to: '' }], error: null },
    )
    const urls = await getWordSitemapUrls('rusbel', 1)
    expect(urls).toHaveLength(1001)
    expect(urls[0]).toBe('https://skarnik.app/r/rusbel/50000')
    expect(urls.at(-1)).toBe('https://skarnik.app/r/rusbel/51501')
    expect(calls[0]).toEqual([
      ['select', 'external_id, redirect_to'],
      ['eq', 'direction', 'rusbel'],
      ['gt', 'external_id', 49999],
      ['lt', 'external_id', 100000],
      ['order', 'external_id', { ascending: true }],
      ['limit', 1000],
    ])
    expect(calls[1]).toContainEqual(['gt', 'external_id', 50999])
  })

  it('throws on a Supabase error so the sitemap is not cached half-empty', async () => {
    responses.push({ data: null, error: { message: 'timeout' } })
    await expect(getWordSitemapUrls('belrus', 0)).rejects.toThrow('timeout')
  })
})
