import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Version endpoint, the PostHog proxy and the installed app's bulk dictionary files have nothing to index.
      disallow: ['/api/', '/ingest/', '/offline-data/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
