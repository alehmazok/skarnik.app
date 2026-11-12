import { describe, it, expect, vi, beforeEach } from 'vitest'
import { gunzipSync } from 'node:zlib'

type Row = { direction: string; external_id: number; text: string; stress: string | null; translation: string; redirect_to: string | null }

// An in-memory `main_word` behind a PostgREST-shaped builder (eq, gte, lt, order desc, limit).
const table: Row[] = []
let requests = 0
function query() {
  const filters: Array<(r: Row) => boolean> = []
  let desc = false
  let limit = Infinity
  const builder: Record<string, unknown> = {
    select: () => builder,
    eq: (col: keyof Row, v: unknown) => (filters.push(r => r[col] === v), builder),
    gte: (col: keyof Row, v: number) => (filters.push(r => (r[col] as number) >= v), builder),
    lt: (col: keyof Row, v: number) => (filters.push(r => (r[col] as number) < v), builder),
    order: (_: string, o: { ascending: boolean }) => ((desc = !o.ascending), builder),
    limit: (n: number) => ((limit = n), builder),
    then: (resolve: (v: unknown) => unknown) => {
      requests++
      const rows = table.filter(r => filters.every(f => f(r))).sort((a, b) => (desc ? b.external_id - a.external_id : a.external_id - b.external_id))
      return Promise.resolve({ data: rows.slice(0, limit), error: null }).then(resolve)
    },
  }
  return builder
}
vi.mock('@/lib/supabase', () => ({ createServerClient: () => ({ from: () => query() }) }))

import { buildShard, getDictionaryManifest, getShard, rebuildShards, resetOfflineDictionaries } from '../server-dictionaries'
import { decodeShard } from '../dictionary-format'
import { contentHash } from '../index-format'

const row = (direction: string, external_id: number, text: string, translation = `<font color="#008000">${text}</font><script>x()</script>`, redirect_to: string | null = null): Row =>
  ({ direction, external_id, text, stress: null, translation, redirect_to })

beforeEach(() => {
  resetOfflineDictionaries()
  requests = 0
  table.length = 0
  table.push(
    row('belrus', 1, 'дом'),
    row('belrus', 999, 'дуб'),
    row('belrus', 1000, 'дуда'),
    row('belrus', 20_126, 'дву...', 'Глядзі <a href="/tsbm/20127">сюды</a>', '/belrus/20127'),
    row('belrus', 20_127, 'двух'),
    row('rusbel', 5, 'дом'),
    row('tsbm', 7, 'дом'),
  )
})

describe('buildShard', () => {
  it('reads one id span in 1,000-id requests and keeps sanitized html and alias targets', async () => {
    const shard = await buildShard('belrus', 0)
    expect(requests).toBe(10)
    const words = decodeShard(gunzipSync(shard.gzip).toString('utf8'))
    expect(words.map(w => w.id)).toEqual([1, 999, 1000])
    expect(words[0].html).toBe('<font color="#008000">дом</font>')
    expect(shard.info).toMatchObject({ n: 0, words: 3, path: '/offline-data/belrus/0.ndjson', bytes: shard.gzip.length })
    expect(shard.info.hash).toBe(contentHash(gunzipSync(shard.gzip).toString('utf8')))

    const alias = decodeShard(gunzipSync((await buildShard('belrus', 2)).gzip).toString('utf8'))[0]
    expect(alias).toMatchObject({ id: 20_126, redirectTo: { dict: 'belrus', id: 20_127 } })
    expect(alias.html).toBe('Глядзі <a href="/r/tsbm/20127">сюды</a>')
  })
})

describe('manifest and rebuilds', () => {
  it('lists the non-empty shards of every dictionary', async () => {
    const manifest = await getDictionaryManifest()
    const belrus = manifest.dicts.find(d => d.dict === 'belrus')!
    expect(belrus.shards.map(s => s.n)).toEqual([0, 2])
    expect(belrus.words).toBe(5)
    expect(belrus.bytes).toBe(belrus.shards[0].bytes + belrus.shards[1].bytes)
    expect(manifest.dicts.map(d => d.words)).toEqual([5, 1, 1])
    expect(await getShard('belrus', 1)).toBeNull()
  })

  it('rebuilds only the shards of the changed ids', async () => {
    const before = await getDictionaryManifest()
    table.find(r => r.external_id === 20_127)!.translation = 'новы пераклад'
    table.push(row('belrus', 31_000, 'новае'))
    requests = 0
    expect(await rebuildShards('belrus', [20_127, 31_000])).toEqual([2, 3])
    expect(requests).toBe(20)
    const after = (await getDictionaryManifest()).dicts.find(d => d.dict === 'belrus')!
    const old = before.dicts.find(d => d.dict === 'belrus')!
    expect(after.shards[0].hash).toBe(old.shards[0].hash)
    expect(after.shards[1].hash).not.toBe(old.shards[1].hash)
    expect(after.shards.map(s => s.n)).toEqual([0, 2, 3])
  })

  it('drops a shard whose words were all deleted', async () => {
    await getDictionaryManifest()
    table.splice(0, table.length, ...table.filter(r => !(r.direction === 'belrus' && r.external_id > 20_000)))
    await rebuildShards('belrus', [20_126])
    expect((await getDictionaryManifest()).dicts[0].shards.map(s => s.n)).toEqual([0])
  })
})
