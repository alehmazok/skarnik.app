import { describe, it, expect } from 'vitest'
import robots from '../../app/robots'

describe('robots', () => {
  it('allows crawling and points to the sitemap index', () => {
    const r = robots()
    expect(r.sitemap).toBe('https://skarnik.app/sitemap.xml')
    expect(r.rules).toMatchObject({ userAgent: '*', allow: '/', disallow: ['/api/', '/ingest/', '/offline-data/'] })
  })
})
