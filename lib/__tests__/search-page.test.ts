import { describe, it, expect } from 'vitest'
import { generateMetadata } from '@/app/search/page'
import { STATIC_PATHS } from '@/lib/sitemap'

const meta = (params: Record<string, string>) => generateMetadata({ searchParams: Promise.resolve(params) })

describe('search page SEO', () => {
  it('indexes the bare search page with its own title and canonical', async () => {
    const m = await meta({})
    expect(m.title).toBe('Пошук у слоўніку — Skarnik.app')
    expect(m.alternates?.canonical).toBe('/search')
    expect(m.robots).toBeUndefined()
  })

  it('keeps result pages out of the index but lets crawlers follow the words', async () => {
    const m = await meta({ q: 'дом', dict: 'tsbm' })
    expect(m.robots).toEqual({ index: false, follow: true })
    expect(m.alternates?.canonical).toBe('/search')
  })

  it('lists /search in the pages sitemap', () => {
    expect(STATIC_PATHS).toContain('/search')
  })
})
