import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const { rebuildShards } = vi.hoisted(() => ({ rebuildShards: vi.fn(async (_dict: string, ids: number[] = []) => (ids.length ? [Math.floor(ids[0] / 10_000)] : [0, 1])) }))
vi.mock('@/lib/offline/server-dictionaries', () => ({ rebuildShards }))

import { POST } from '@/app/api/revalidate-offline/route'

const post = (body: unknown, token?: string) =>
  POST(new Request('http://x/api/revalidate-offline', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: typeof body === 'string' ? body : JSON.stringify(body),
  }))

beforeEach(() => {
  rebuildShards.mockClear()
  vi.stubEnv('OFFLINE_REVALIDATE_SECRET', 's3cret')
})
afterEach(() => vi.unstubAllEnvs())

describe('POST /api/revalidate-offline', () => {
  it('is off while the secret is not set', async () => {
    vi.stubEnv('OFFLINE_REVALIDATE_SECRET', '')
    expect((await post({}, 's3cret')).status).toBe(404)
  })

  it('needs the secret', async () => {
    expect((await post({ dict: 'belrus' })).status).toBe(401)
    expect((await post({ dict: 'belrus' }, 'wrong')).status).toBe(401)
    expect(rebuildShards).not.toHaveBeenCalled()
  })

  it('rebuilds the shards of the given words', async () => {
    const response = await post({ dict: 'belrus', ids: [27890] }, 's3cret')
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ rebuilt: { belrus: [2] } })
    expect(rebuildShards).toHaveBeenCalledWith('belrus', [27890])
  })

  it('rebuilds every dictionary when no dict is given', async () => {
    const response = await post({}, 's3cret')
    expect(Object.keys((await response.json()).rebuilt)).toEqual(['belrus', 'rusbel', 'tsbm'])
  })

  it('rejects bad input', async () => {
    expect((await post('{', 's3cret')).status).toBe(400)
    expect((await post({ dict: 'xx' }, 's3cret')).status).toBe(400)
    expect((await post({ dict: 'belrus', ids: [0] }, 's3cret')).status).toBe(400)
    expect((await post({ ids: [5] }, 's3cret')).status).toBe(400)
  })
})
