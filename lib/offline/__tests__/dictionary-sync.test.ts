import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, it, expect, beforeEach } from 'vitest'
import { encodeShard, shardPath, type DictionaryInfo, type OfflineWord } from '../dictionary-format'
import { contentHash } from '../index-format'
import { downloadDictionary, isComplete, updateDownloadedDictionaries } from '../dictionary-sync'
import { deleteDictionary, openOfflineDb, readDictionaries, readWord } from '../index-db'
import { readOfflineWord } from '../offline-word'

const word = (id: number, text = `слова${id}`, redirectTo: OfflineWord['redirectTo'] = null): OfflineWord =>
  ({ id, text, stress: null, html: `<b>${text}</b>`, redirectTo })

/** A fake server: shard bodies by path, and the manifest entry built from them. */
function server(shards: Record<number, OfflineWord[]>) {
  const bodies = new Map<string, string>()
  const requests: string[] = []
  const info: DictionaryInfo = { dict: 'belrus', words: 0, bytes: 0, shards: [] }
  for (const [n, words] of Object.entries(shards)) {
    const body = encodeShard(words)
    const path = shardPath('belrus', Number(n))
    bodies.set(path, body)
    info.shards.push({ n: Number(n), words: words.length, bytes: body.length, hash: contentHash(body), path })
    info.words += words.length
    info.bytes += body.length
  }
  let failAt: string | null = null
  const fetchImpl = (async (input: RequestInfo | URL) => {
    const url = String(input)
    requests.push(url)
    if (url === '/offline-data/manifest.json') return new Response(JSON.stringify({ dicts: [info] }))
    if (url === failAt) throw new TypeError('Failed to fetch')
    const body = bodies.get(url)
    return body === undefined ? new Response('', { status: 404 }) : new Response(body)
  }) as typeof fetch
  return { info, requests, fetchImpl, failOn: (path: string | null) => (failAt = path) }
}

let db: IDBDatabase

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  db = await openOfflineDb()
})

describe('downloadDictionary', () => {
  it('stores every word and reports progress shard by shard', async () => {
    const s = server({ 0: [word(1), word(2)], 1: [word(10_005)], 3: [word(30_000)] })
    const progress: number[] = []
    const downloaded = await downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl, onProgress: p => progress.push(p.words) })
    expect(downloaded).toEqual([0, 1, 3])
    expect(progress).toEqual([0, 2, 3, 4])
    expect(await readWord(db, 'belrus', 10_005)).toMatchObject({ dict: 'belrus', id: 10_005, html: '<b>слова10005</b>' })
    const [state] = await readDictionaries(db)
    expect(state).toMatchObject({ dict: 'belrus', words: 4, total: 4 })
    expect(isComplete(state)).toBe(true)
  })

  it('resumes an interrupted download from the first missing shard', async () => {
    const s = server({ 0: [word(1)], 1: [word(10_001)], 2: [word(20_001)] })
    s.failOn(shardPath('belrus', 1))
    await expect(downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl })).rejects.toThrow('Failed to fetch')
    const [partial] = await readDictionaries(db)
    expect(partial).toMatchObject({ words: 1, total: 3 })
    expect(isComplete(partial)).toBe(false)

    s.failOn(null)
    s.requests.length = 0
    expect(await downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl })).toEqual([1, 2])
    expect(s.requests).toEqual([shardPath('belrus', 1), shardPath('belrus', 2)])
    expect(isComplete((await readDictionaries(db))[0])).toBe(true)
  })

  it('re-downloads only the shards whose hash changed, and drops shards the server no longer has', async () => {
    const first = server({ 0: [word(1, 'стары')], 1: [word(10_001)], 2: [word(20_001)] })
    await downloadDictionary(db, first.info, { fetchImpl: first.fetchImpl })

    // Admin edits word 1 and deletes the only word of shard 2.
    const second = server({ 0: [word(1, 'новы')], 1: [word(10_001)] })
    expect(await updateDownloadedDictionaries(db, second.fetchImpl)).toEqual(['belrus'])
    expect(second.requests).toEqual(['/offline-data/manifest.json', shardPath('belrus', 0)])
    expect((await readWord(db, 'belrus', 1))?.text).toBe('новы')
    expect(await readWord(db, 'belrus', 20_001)).toBeNull()
    expect((await readDictionaries(db))[0]).toMatchObject({ words: 2, total: 2, shards: { 0: second.info.shards[0].hash } })

    second.requests.length = 0
    expect(await updateDownloadedDictionaries(db, second.fetchImpl)).toEqual([])
    expect(second.requests).toEqual(['/offline-data/manifest.json'])
  })

  it('replaces a shard whole: words removed in admin disappear', async () => {
    await downloadDictionary(db, server({ 0: [word(1), word(2)] }).info, { fetchImpl: server({ 0: [word(1), word(2)] }).fetchImpl })
    const s = server({ 0: [word(2)] })
    await downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl })
    expect(await readWord(db, 'belrus', 1)).toBeNull()
    expect(await readWord(db, 'belrus', 2)).not.toBeNull()
  })

  it('rejects a shard that does not match the manifest hash', async () => {
    const s = server({ 0: [word(1)] })
    s.info.shards[0].hash = 'deadbeef'
    await expect(downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl })).rejects.toThrow('hash mismatch')
    expect(await readWord(db, 'belrus', 1)).toBeNull()
  })

  it('does nothing on update when no dictionary was downloaded', async () => {
    const s = server({ 0: [word(1)] })
    expect(await updateDownloadedDictionaries(db, s.fetchImpl)).toEqual([])
    expect(s.requests).toEqual([])
  })
})

describe('deleteDictionary', () => {
  it('removes the words and the record of one dictionary only', async () => {
    const s = server({ 0: [word(1)] })
    await downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl })
    const tx = db.transaction('words', 'readwrite')
    tx.objectStore('words').put({ ...word(1, 'другі'), dict: 'tsbm' })
    await new Promise(r => (tx.oncomplete = r))
    await deleteDictionary(db, 'belrus')
    expect(await readWord(db, 'belrus', 1)).toBeNull()
    expect(await readWord(db, 'tsbm', 1)).not.toBeNull()
    expect(await readDictionaries(db)).toEqual([])
  })
})

describe('readOfflineWord', () => {
  it('reads a stored word and follows an alias one hop', async () => {
    const s = server({ 0: [word(1, 'дву...', { dict: 'belrus', id: 2 }), word(2, 'двух')] })
    await downloadDictionary(db, s.info, { fetchImpl: s.fetchImpl })
    expect(await readOfflineWord('belrus', 1)).toEqual({ dict: 'belrus', id: 2, text: 'двух', stress: null, html: '<b>двух</b>', redirectTo: null })
    expect(await readOfflineWord('belrus', 3)).toBeNull()
    expect(await readOfflineWord('tsbm', 1)).toBeNull()
  })
})
