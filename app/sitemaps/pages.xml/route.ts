import { SITE_URL } from '@/lib/seo'
import { buildUrlset, STATIC_PATHS, xmlHeaders } from '@/lib/sitemap'

export const dynamic = 'force-static'

export function GET() {
  return new Response(buildUrlset(STATIC_PATHS.map(p => `${SITE_URL}${p}`)), { headers: xmlHeaders })
}
