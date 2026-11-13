import { createServerClient } from './supabase'
import { DICT_DIRECTIONS, type DictDirection } from './dict'
import { redirectTarget, SITE_URL, wordPath } from './seo'

/** Each word sitemap covers this many consecutive external ids (protocol limit: 50,000 URLs). */
export const SITEMAP_ID_SPAN = 50_000

/** PostgREST on Supabase returns at most 1,000 rows per request. */
const PAGE_ROWS = 1000

export const STATIC_PATHS = ['/', '/search', '/privacy', '/privacy/en'] as const

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export function buildUrlset(urls: readonly string[]): string {
  const body = urls.map(u => `<url><loc>${escapeXml(u)}</loc></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`
}

export function buildSitemapIndex(urls: readonly string[]): string {
  const body = urls.map(u => `<sitemap><loc>${escapeXml(u)}</loc></sitemap>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>\n`
}

export function wordSitemapPath(dict: DictDirection, page: number): string {
  return `/sitemaps/${dict}/${page}.xml`
}

/** Parses the `0.xml` segment of a word sitemap URL. */
export function parseSitemapPage(segment: string): number | null {
  const match = /^(\d{1,4})\.xml$/.exec(segment)
  return match ? Number(match[1]) : null
}

export const xmlHeaders = { 'Content-Type': 'application/xml; charset=utf-8' }

/** Highest external_id in a dictionary, or 0 when it is empty. */
export async function getMaxExternalId(dict: DictDirection): Promise<number> {
  const { data, error } = await createServerClient()
    .from('main_word')
    .select('external_id')
    .eq('direction', dict)
    .order('external_id', { ascending: false })
    .limit(1)
  if (error) throw new Error(`max external_id for ${dict}: ${error.message}`)
  const rows = (data ?? []) as unknown as { external_id: number }[]
  return rows[0]?.external_id ?? 0
}

/** Sitemap index entries: the static pages plus one file per id span of each dictionary. */
export async function getSitemapIndexUrls(): Promise<string[]> {
  const urls = [`${SITE_URL}/sitemaps/pages.xml`]
  for (const dict of DICT_DIRECTIONS) {
    const maxId = await getMaxExternalId(dict)
    const pages = maxId > 0 ? Math.floor(maxId / SITEMAP_ID_SPAN) + 1 : 0
    for (let page = 0; page < pages; page++) urls.push(`${SITE_URL}${wordSitemapPath(dict, page)}`)
  }
  return urls
}

/**
 * Word URLs with external_id in [page * span, (page + 1) * span). Aliases are
 * left out: they redirect to their target, which is listed on its own.
 * Throws on a Supabase error so a half-empty sitemap is never cached.
 */
export async function getWordSitemapUrls(dict: DictDirection, page: number): Promise<string[]> {
  const supabase = createServerClient()
  const end = (page + 1) * SITEMAP_ID_SPAN
  const urls: string[] = []
  let after = page * SITEMAP_ID_SPAN - 1
  for (;;) {
    const { data, error } = await supabase
      .from('main_word')
      .select('external_id, redirect_to')
      .eq('direction', dict)
      .gt('external_id', after)
      .lt('external_id', end)
      .order('external_id', { ascending: true })
      .limit(PAGE_ROWS)
    if (error) throw new Error(`sitemap ${dict}/${page}: ${error.message}`)
    const rows = (data ?? []) as unknown as { external_id: number; redirect_to: string | null }[]
    for (const row of rows) {
      if (redirectTarget(row.redirect_to) === null) urls.push(`${SITE_URL}${wordPath(dict, row.external_id)}`)
    }
    if (rows.length < PAGE_ROWS) break
    after = rows[rows.length - 1].external_id
  }
  return urls
}
