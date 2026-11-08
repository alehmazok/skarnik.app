import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/seo'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      // Version endpoint and the PostHog proxy have nothing to index.
      disallow: ['/api/', '/ingest/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
