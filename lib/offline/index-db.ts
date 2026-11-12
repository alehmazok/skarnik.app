/**
 * The app's offline data in IndexedDB. Plain IndexedDB, no wrapper library.
 * - `search-index` (v1, #23): one record per dictionary holding its search index file as downloaded.
 * - `words` (v2, #24): every word of a downloaded dictionary, key `[dict, id]`.
 * - `dictionaries` (v2): per downloaded dictionary, the hash of each stored shard and the word counts.
 */
import type { DictDirection } from '@/lib/dict'
import { SHARD_SPAN, type OfflineWord } from './dictionary-format'

export const DB_NAME = 'skarnik-offline'
const DB_VERSION = 2
const INDEX_STORE = 'search-index'
const WORDS_STORE = 'words'
const DICTIONARIES_STORE = 'dictionaries'

export interface StoredIndex {
  dict: DictDirection
  hash: string
  words: number
  body: string
  savedAt: number
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export function openOfflineDb(factory: IDBFactory = indexedDB): Promise<IDBDatabase> {
  const req = factory.open(DB_NAME, DB_VERSION)
  req.onupgradeneeded = () => {
    const db = req.result
    if (!db.objectStoreNames.contains(INDEX_STORE)) db.createObjectStore(INDEX_STORE, { keyPath: 'dict' })
    if (!db.objectStoreNames.contains(WORDS_STORE)) db.createObjectStore(WORDS_STORE, { keyPath: ['dict', 'id'] })
    if (!db.objectStoreNames.contains(DICTIONARIES_STORE)) db.createObjectStore(DICTIONARIES_STORE, { keyPath: 'dict' })
  }
  return request(req).then(db => {
    // Another tab (or a new version of the app) asking for a newer version must not be blocked by this one.
    db.onversionchange = () => db.close()
    return db
  })
}

export async function readIndexes(db: IDBDatabase): Promise<StoredIndex[]> {
  return request(db.transaction(INDEX_STORE).objectStore(INDEX_STORE).getAll() as IDBRequest<StoredIndex[]>)
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error ?? new Error('transaction aborted'))
  })
}

export async function writeIndex(db: IDBDatabase, index: StoredIndex): Promise<void> {
  const tx = db.transaction(INDEX_STORE, 'readwrite')
  tx.objectStore(INDEX_STORE).put(index)
  await done(tx)
}

/** A downloaded (or partly downloaded) dictionary. */
export interface StoredDictionary {
  dict: DictDirection
  /** Hash of each stored shard, by shard number. */
  shards: Record<number, string>
  /** Words stored. */
  words: number
  /** Words in the dictionary when the download was last checked. */
  total: number
  /** Download size of the whole dictionary (gzip), for the panel. */
  bytes: number
  checkedAt: number
}

export interface StoredWord extends OfflineWord {
  dict: DictDirection
}

export async function readDictionaries(db: IDBDatabase): Promise<StoredDictionary[]> {
  return request(db.transaction(DICTIONARIES_STORE).objectStore(DICTIONARIES_STORE).getAll() as IDBRequest<StoredDictionary[]>)
}

export async function readWord(db: IDBDatabase, dict: DictDirection, id: number): Promise<StoredWord | null> {
  const word = await request(db.transaction(WORDS_STORE).objectStore(WORDS_STORE).get([dict, id]) as IDBRequest<StoredWord | undefined>)
  return word ?? null
}

function shardRange(dict: DictDirection, n: number): IDBKeyRange {
  return IDBKeyRange.bound([dict, n * SHARD_SPAN], [dict, (n + 1) * SHARD_SPAN], false, true)
}

/**
 * Replaces one shard's words and records its hash, in one transaction: an interrupted download leaves either
 * the old shard or the new one, never a mix.
 */
export async function replaceShard(
  db: IDBDatabase,
  dict: DictDirection,
  n: number,
  words: readonly OfflineWord[],
  update: (current: StoredDictionary | null) => StoredDictionary,
): Promise<StoredDictionary> {
  const tx = db.transaction([WORDS_STORE, DICTIONARIES_STORE], 'readwrite')
  const store = tx.objectStore(WORDS_STORE)
  store.delete(shardRange(dict, n))
  for (const word of words) store.put({ ...word, dict } satisfies StoredWord)
  const dictionaries = tx.objectStore(DICTIONARIES_STORE)
  let next: StoredDictionary | null = null
  dictionaries.get(dict).onsuccess = event => {
    next = update(((event.target as IDBRequest<StoredDictionary | undefined>).result) ?? null)
    dictionaries.put(next)
  }
  await done(tx)
  return next!
}

/** Drops shards the server no longer has and saves the dictionary record. */
export async function removeShards(db: IDBDatabase, state: StoredDictionary, numbers: readonly number[]): Promise<void> {
  const tx = db.transaction([WORDS_STORE, DICTIONARIES_STORE], 'readwrite')
  for (const n of numbers) tx.objectStore(WORDS_STORE).delete(shardRange(state.dict, n))
  tx.objectStore(DICTIONARIES_STORE).put(state)
  await done(tx)
}

export async function deleteDictionary(db: IDBDatabase, dict: DictDirection): Promise<void> {
  const tx = db.transaction([WORDS_STORE, DICTIONARIES_STORE], 'readwrite')
  tx.objectStore(WORDS_STORE).delete(IDBKeyRange.bound([dict, 0], [dict, Infinity]))
  tx.objectStore(DICTIONARIES_STORE).delete(dict)
  await done(tx)
}
