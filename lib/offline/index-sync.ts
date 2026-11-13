/**
 * Downloads the offline search index (all three dictionaries, about 2.5 MB) into IndexedDB, and later only
 * the dictionaries whose hash changed. Runs in the installed app (decision 2026-11-12: automatic after install).
 */
import { readIndexes, writeIndex } from './index-db'
import type { IndexManifest } from './index-format'

export const MANIFEST_PATH = '/offline-data/index/manifest'
export const SYNC_INTERVAL_MS = 24 * 60 * 60 * 1000
const LAST_SYNC_KEY = 'skarnik-offline-index-checked'

export interface SyncResult {
  /** Dictionaries downloaded in this run. */
  updated: string[]
}

/** Brings the stored index up to date with the server. Throws when offline or the server fails. */
export async function syncOfflineIndex(db: IDBDatabase, fetchImpl: typeof fetch = fetch): Promise<SyncResult> {
  const response = await fetchImpl(MANIFEST_PATH, { cache: 'no-store' })
  if (!response.ok) throw new Error(`manifest ${response.status}`)
  const manifest = (await response.json()) as IndexManifest
  const stored = new Map((await readIndexes(db)).map(i => [i.dict, i.hash]))
  const updated: string[] = []
  for (const entry of manifest.dicts) {
    if (stored.get(entry.dict) === entry.hash) continue
    const file = await fetchImpl(entry.path, { cache: 'no-store' })
    if (!file.ok) throw new Error(`${entry.dict} ${file.status}`)
    const body = await file.text()
    await writeIndex(db, {
      dict: entry.dict,
      hash: file.headers.get('X-Content-Hash') ?? entry.hash,
      words: entry.words,
      body,
      savedAt: Date.now(),
    })
    updated.push(entry.dict)
  }
  return { updated }
}

/** Whether a check is due: never checked, or the last one was a day ago. */
export function syncDue(now = Date.now(), storage: Pick<Storage, 'getItem'> | null = safeStorage()): boolean {
  const last = Number(storage?.getItem(LAST_SYNC_KEY) ?? 0)
  return !last || now - last >= SYNC_INTERVAL_MS
}

export function markSynced(now = Date.now(), storage: Pick<Storage, 'setItem'> | null = safeStorage()): void {
  try {
    storage?.setItem(LAST_SYNC_KEY, String(now))
  } catch {}
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
