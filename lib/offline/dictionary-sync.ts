/**
 * Downloads an offline dictionary shard by shard into IndexedDB, and later re-downloads only the shards whose
 * hash changed. A shard that is already stored with the manifest's hash is skipped, so an interrupted download
 * resumes from the first missing shard and a daily update fetches only what admin changed.
 */
import type { DictDirection } from '@/lib/dict'
import { DICTIONARY_MANIFEST_PATH, decodeShard, type DictionaryInfo, type DictionaryManifest } from './dictionary-format'
import { contentHash } from './index-format'
import { deleteDictionary, readDictionaries, removeShards, replaceShard, type StoredDictionary } from './index-db'

export const DICTIONARY_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1000
const LAST_UPDATE_KEY = 'skarnik-offline-dictionaries-checked'

export interface DownloadProgress {
  dict: DictDirection
  words: number
  total: number
}

export interface DownloadOptions {
  fetchImpl?: typeof fetch
  onProgress?: (progress: DownloadProgress) => void
  signal?: AbortSignal
}

export async function fetchDictionaryManifest(fetchImpl: typeof fetch = fetch): Promise<DictionaryManifest> {
  const response = await fetchImpl(DICTIONARY_MANIFEST_PATH, { cache: 'no-store' })
  if (!response.ok) throw new Error(`manifest ${response.status}`)
  return (await response.json()) as DictionaryManifest
}

/** Words of `info` already stored with the right hash. */
function storedWords(info: DictionaryInfo, state: StoredDictionary | null): number {
  return info.shards.reduce((sum, s) => sum + (state?.shards[s.n] === s.hash ? s.words : 0), 0)
}

/**
 * Brings one dictionary up to date with `info` (from the manifest). Returns the shard numbers it downloaded.
 * Throws when a request fails or a shard does not match its hash; what was stored up to then stays.
 */
export async function downloadDictionary(
  db: IDBDatabase,
  info: DictionaryInfo,
  { fetchImpl = fetch, onProgress, signal }: DownloadOptions = {},
): Promise<number[]> {
  const dict = info.dict
  let state = (await readDictionaries(db)).find(d => d.dict === dict) ?? null
  let words = storedWords(info, state)
  onProgress?.({ dict, words, total: info.words })
  const downloaded: number[] = []
  for (const shard of info.shards) {
    if (state?.shards[shard.n] === shard.hash) continue
    signal?.throwIfAborted()
    const response = await fetchImpl(shard.path, { cache: 'no-store', signal })
    if (!response.ok) throw new Error(`${dict} shard ${shard.n}: ${response.status}`)
    const body = await response.text()
    // The shard may have been rebuilt after the manifest was read; the next check picks the new one up.
    if (contentHash(body) !== shard.hash) throw new Error(`${dict} shard ${shard.n}: hash mismatch`)
    const shardWords = decodeShard(body)
    state = await replaceShard(db, dict, shard.n, shardWords, current => {
      const shards = { ...(current?.shards ?? {}), [shard.n]: shard.hash }
      const next = { dict, shards, words: 0, total: info.words, bytes: info.bytes, checkedAt: Date.now() }
      return { ...next, words: storedWords(info, next) }
    })
    downloaded.push(shard.n)
    words = storedWords(info, state)
    onProgress?.({ dict, words, total: info.words })
  }
  const current = new Set(info.shards.map(s => s.n))
  const gone = Object.keys(state?.shards ?? {}).map(Number).filter(n => !current.has(n))
  const shards = Object.fromEntries(Object.entries(state?.shards ?? {}).filter(([n]) => current.has(Number(n))))
  const final: StoredDictionary = { dict, shards, words, total: info.words, bytes: info.bytes, checkedAt: Date.now() }
  await removeShards(db, final, gone)
  return downloaded
}

export function isComplete(state: StoredDictionary | undefined | null): boolean {
  return !!state && state.total > 0 && state.words >= state.total
}

/** Updates every dictionary the person downloaded (also one whose download was cut off). */
export async function updateDownloadedDictionaries(db: IDBDatabase, fetchImpl: typeof fetch = fetch): Promise<DictDirection[]> {
  const stored = await readDictionaries(db)
  if (stored.length === 0) return []
  const manifest = await fetchDictionaryManifest(fetchImpl)
  const updated: DictDirection[] = []
  for (const state of stored) {
    const info = manifest.dicts.find(d => d.dict === state.dict)
    if (!info) continue
    if ((await downloadDictionary(db, info, { fetchImpl })).length > 0) updated.push(state.dict)
  }
  return updated
}

export { deleteDictionary }

/** Whether the daily update check is due. */
export function dictionaryUpdateDue(now = Date.now(), storage: Pick<Storage, 'getItem'> | null = safeStorage()): boolean {
  const last = Number(storage?.getItem(LAST_UPDATE_KEY) ?? 0)
  return !last || now - last >= DICTIONARY_UPDATE_INTERVAL_MS
}

export function markDictionariesChecked(now = Date.now(), storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(LAST_UPDATE_KEY, String(now))
  } catch {}
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
