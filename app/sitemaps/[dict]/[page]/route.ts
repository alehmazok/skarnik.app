import { isValidDict } from '@/lib/dict'
import { buildUrlset, getWordSitemapUrls, parseSitemapPage, xmlHeaders } from '@/lib/sitemap'

export const revalidate = 86400

// Nothing at build time (no Supabase there): each file is generated on its
// first request and served from the cache for a day.
export function generateStaticParams() {
  return []
}

interface RouteContext {
  params: Promise<{ dict: string; page: string }>
}

export async function GET(_req: Request, { params }: RouteContext) {
  const { dict, page: segment } = await params
  const page = parseSitemapPage(segment)
  if (!isValidDict(dict) || page === null) return new Response('Not found', { status: 404 })
  const urls = await getWordSitemapUrls(dict, page)
  if (urls.length === 0) return new Response('Not found', { status: 404 })
  return new Response(buildUrlset(urls), { headers: xmlHeaders })
}
