/**
 * Wire format of the offline dictionaries (#24). Each dictionary is cut into shards of {@link SHARD_SPAN}
 * `external_id`s; a shard is newline-delimited JSON, one {@link OfflineWord} per line, sorted by id, with the
 * translation already sanitized by `sanitizeTranslation`. The manifest lists every shard with its hash, so the
 * app downloads only shards that changed and resumes an interrupted download from the first missing one.
 * Shared by the server routes and the app.
 */
import type { DictDirection } from '@/lib/dict'
import type { WordRef } from '@/lib/seo'

export const SHARD_SPAN = 10_000
export const DICTIONARY_MANIFEST_PATH = '/offline-data/manifest.json'
export const SHARD_CONTENT_TYPE = 'application/x-ndjson; charset=utf-8'

/** One word as stored on the device: what the word page shows. */
export interface OfflineWord {
  id: number
  text: string
  stress: string | null
  /** Sanitized translation HTML. */
  html: string
  /** The word this alias points to, or null. */
  redirectTo: WordRef | null
}

export interface ShardInfo {
  /** Shard number: ids in [n * SHARD_SPAN, (n + 1) * SHARD_SPAN). */
  n: number
  words: number
  /** Download size (gzip). */
  bytes: number
  hash: string
  path: string
}

export interface DictionaryInfo {
  dict: DictDirection
  words: number
  bytes: number
  shards: ShardInfo[]
}

/** `/offline-data/manifest.json`. */
export interface DictionaryManifest {
  dicts: DictionaryInfo[]
}

export function shardOf(id: number): number {
  return Math.floor(id / SHARD_SPAN)
}

export function shardPath(dict: DictDirection, n: number): string {
  return `/offline-data/${dict}/${n}.ndjson`
}

/** The shard number in `<n>.ndjson`, or null. */
export function parseShardFile(file: string): number | null {
  const match = /^(\d{1,4})\.ndjson$/.exec(file)
  return match ? Number(match[1]) : null
}

export function encodeShard(words: readonly OfflineWord[]): string {
  return [...words]
    .sort((a, b) => a.id - b.id)
    .map(w => JSON.stringify({ id: w.id, text: w.text, stress: w.stress, html: w.html, redirectTo: w.redirectTo }) + '\n')
    .join('')
}

export function decodeShard(body: string): OfflineWord[] {
  const words: OfflineWord[] = []
  for (const line of body.split('\n')) {
    if (!line) continue
    const row = JSON.parse(line) as Partial<OfflineWord>
    if (typeof row.id !== 'number' || typeof row.text !== 'string' || typeof row.html !== 'string') {
      throw new Error('bad shard line')
    }
    words.push({ id: row.id, text: row.text, stress: row.stress ?? null, html: row.html, redirectTo: row.redirectTo ?? null })
  }
  return words
}
