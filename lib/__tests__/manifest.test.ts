import { describe, it, expect } from 'vitest'
import manifest from '@/app/manifest'

describe('manifest', () => {
  const m = manifest()

  it('opens the installed app on search', () => {
    expect(m.id).toBe('/search')
    expect(m.start_url).toBe('/search?source=pwa')
    expect(m.scope).toBe('/')
    expect(m.lang).toBe('be')
  })

  it('has what Chromium needs to offer install', () => {
    expect(m.name).toBeTruthy()
    expect(m.short_name).toBeTruthy()
    expect(['standalone', 'fullscreen', 'minimal-ui']).toContain(m.display)
    const sizes = (m.icons ?? []).filter(i => i.purpose === 'any').map(i => i.sizes)
    expect(sizes).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(m.icons?.some(i => i.purpose === 'maskable' && i.sizes === '512x512')).toBe(true)
  })

  it('prefers the window controls overlay on desktop', () => {
    expect(m.display_override).toEqual(['window-controls-overlay', 'standalone'])
  })

  it('has a shortcut per dictionary', () => {
    expect(m.shortcuts?.map(s => s.url)).toEqual([
      '/search?dict=belrus&source=pwa-shortcut',
      '/search?dict=rusbel&source=pwa-shortcut',
      '/search?dict=tsbm&source=pwa-shortcut',
    ])
  })

  it('has one wide and one narrow screenshot', () => {
    expect(m.screenshots?.map(s => s.form_factor)).toEqual(['wide', 'narrow'])
  })

  it('lists the native apps without preferring them', () => {
    expect(m.related_applications?.map(a => a.platform)).toEqual(['play', 'itunes'])
    expect(m.prefer_related_applications).toBe(false)
  })

  it('reuses an open window for links', () => {
    expect(m.launch_handler).toEqual({ client_mode: ['navigate-existing', 'auto'] })
  })
})
