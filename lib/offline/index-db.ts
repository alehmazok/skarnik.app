/**
 * The installed app's offline search index in IndexedDB: one record per dictionary holding its index file as
 * downloaded. Plain IndexedDB (no wrapper library): the app needs only get, put and getAll on one store.
 */
import type { DictDirection } from '@/lib/dict'

export const DB_NAME = 'skarnik-offline'
const DB_VERSION = 1
const INDEX_STORE = 'search-index'

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
  }
  return request(req)
}

export async function readIndexes(db: IDBDatabase): Promise<StoredIndex[]> {
  return request(db.transaction(INDEX_STORE).objectStore(INDEX_STORE).getAll() as IDBRequest<StoredIndex[]>)
}

export async function writeIndex(db: IDBDatabase, index: StoredIndex): Promise<void> {
  const tx = db.transaction(INDEX_STORE, 'readwrite')
  tx.objectStore(INDEX_STORE).put(index)
  await new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
    tx.onabort = () => reject(tx.error)
  })
}
