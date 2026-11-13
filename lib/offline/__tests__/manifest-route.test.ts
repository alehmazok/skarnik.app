import { describe, it, expect, vi, beforeEach } from 'vitest'

const server = vi.hoisted(() => ({ ready: false, dictionariesReady: vi.fn(), getDictionaryManifest: vi.fn() }))
vi.mock('@/lib/offline/server-dictionaries', () => ({
  dictionariesReady: server.dictionariesReady,
  getDictionaryManifest: server.getDictionaryManifest,
}))

import { GET } from '@/app/offline-data/manifest.json/route'

beforeEach(() => {
  server.dictionariesReady.mockImplementation(() => server.ready)
  server.getDictionaryManifest.mockResolvedValue({ dicts: [] })
})

describe('GET /offline-data/manifest.json', () => {
  it('answers 503 with Retry-After at once while the dictionaries are being built', async () => {
    server.ready = false
    const response = await GET()
    expect(response.status).toBe(503)
    expect(response.headers.get('Retry-After')).toBe('20')
    expect(server.getDictionaryManifest).not.toHaveBeenCalled()
  })

  it('answers the manifest once they are built', async () => {
    server.ready = true
    const response = await GET()
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ dicts: [] })
  })
})
