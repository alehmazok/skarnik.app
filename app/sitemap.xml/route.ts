import { buildSitemapIndex, getSitemapIndexUrls, xmlHeaders } from '@/lib/sitemap'

// Rendered per request (three small Supabase queries) because the Docker
// build has no Supabase access to prerender it; crawlers fetch it rarely.
export const dynamic = 'force-dynamic'

export async function GET() {
  const urls = await getSitemapIndexUrls()
  return new Response(buildSitemapIndex(urls), {
    headers: { ...xmlHeaders, 'Cache-Control': 'public, max-age=3600' },
  })
}
