import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { StoredIndex } from '../index-db'

const stored: StoredIndex[] = []
vi.mock('../index-db', () => ({
  readIndexes: vi.fn(async () => [...stored]),
  writeIndex: vi.fn(async (_db: unknown, index: StoredIndex) => {
    const at = stored.findIndex(i => i.dict === index.dict)
    if (at >= 0) stored[at] = index
    else stored.push(index)
  }),
}))

import { markSynced, MANIFEST_PATH, syncDue, syncOfflineIndex, SYNC_INTERVAL_MS } from '../index-sync'

const db = {} as IDBDatabase
const manifest = {
  dicts: [
    { dict: 'belrus', words: 1, hash: 'aaaa0001', path: '/offline-data/index/belrus' },
    { dict: 'rusbel', words: 1, hash: 'bbbb0001', path: '/offline-data/index/rusbel' },
    { dict: 'tsbm', words: 1, hash: 'cccc0001', path: '/offline-data/index/tsbm' },
  ],
}

function fakeFetch(): typeof fetch & { calls: string[] } {
  const calls: string[] = []
  const f = (async (url: string) => {
    calls.push(url)
    if (url === MANIFEST_PATH) return new Response(JSON.stringify(manifest))
    const dict = url.split('/').pop()!
    const hash = manifest.dicts.find(d => d.dict === dict)!.hash
    return new Response(`1\t${dict}\n`, { headers: { 'X-Content-Hash': hash } })
  }) as unknown as typeof fetch & { calls: string[] }
  f.calls = calls
  return f
}

beforeEach(() => {
  stored.length = 0
})

describe('syncOfflineIndex', () => {
  it('downloads every dictionary the first time', async () => {
    const f = fakeFetch()
    expect(await syncOfflineIndex(db, f)).toEqual({ updated: ['belrus', 'rusbel', 'tsbm'] })
    expect(stored.map(s => [s.dict, s.hash, s.body])).toEqual([
      ['belrus', 'aaaa0001', '1\tbelrus\n'],
      ['rusbel', 'bbbb0001', '1\trusbel\n'],
      ['tsbm', 'cccc0001', '1\ttsbm\n'],
    ])
  })

  it('downloads only the dictionaries whose hash changed', async () => {
    await syncOfflineIndex(db, fakeFetch())
    manifest.dicts[2].hash = 'cccc0002'
    const f = fakeFetch()
    expect(await syncOfflineIndex(db, f)).toEqual({ updated: ['tsbm'] })
    expect(f.calls).toEqual([MANIFEST_PATH, '/offline-data/index/tsbm'])
  })

  it('fails without touching the stored index when the server is down', async () => {
    const f = (async () => new Response('', { status: 503 })) as unknown as typeof fetch
    await expect(syncOfflineIndex(db, f)).rejects.toThrow('manifest 503')
    expect(stored).toEqual([])
  })
})

describe('sync schedule', () => {
  it('checks at most once a day', () => {
    const map = new Map<string, string>()
    const storage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => void map.set(k, v) }
    expect(syncDue(1000, storage)).toBe(true)
    markSynced(1000, storage)
    expect(syncDue(1000 + SYNC_INTERVAL_MS - 1, storage)).toBe(false)
    expect(syncDue(1000 + SYNC_INTERVAL_MS, storage)).toBe(true)
  })
})
