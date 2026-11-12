import { describe, it, expect } from 'vitest'
import { isCacheablePage, SHELL_PATHS } from '@/lib/sw-routes'

describe('isCacheablePage', () => {
  it('keeps word pages and static pages', () => {
    expect(isCacheablePage('/r/belrus/27890')).toBe(true)
    expect(isCacheablePage('/')).toBe(true)
    expect(isCacheablePage('/privacy')).toBe(true)
  })

  it('never keeps live data, analytics or crawler files', () => {
    for (const path of ['/api/version', '/ingest/e/', '/sitemap.xml', '/sitemaps/belrus/0.xml', '/robots.txt', '/sw.js', '/.well-known/assetlinks.json']) {
      expect(isCacheablePage(path)).toBe(false)
    }
  })

  it('never keeps generated share images', () => {
    expect(isCacheablePage('/r/belrus/27890/opengraph-image')).toBe(false)
  })

  it('precaches the app shell', () => {
    expect(SHELL_PATHS).toEqual(['/search', '/~offline'])
  })
})
