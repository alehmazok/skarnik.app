/**
 * The offline dictionaries as the server hands them out: every word of `main_word` with its sanitized
 * translation, cut into shards (lib/offline/dictionary-format.ts), gzipped and held in memory (about 21 MB).
 * Built in the background at server start, rebuilt after {@link MAX_AGE_MS}, and shard by shard when
 * `POST /api/revalidate-offline` says words changed. No Supabase query per download.
 */
import { gzipSync } from 'node:zlib'
import { createServerClient } from '@/lib/supabase'
import { DICT_DIRECTIONS, type DictDirection } from '@/lib/dict'
import { redirectTarget } from '@/lib/seo'
import { sanitizeTranslation } from '@/lib/translation'
import { contentHash } from './index-format'
import { SHARD_SPAN, encodeShard, shardPath, type DictionaryManifest, type OfflineWord, type ShardInfo } from './dictionary-format'

/** PostgREST returns at most 1,000 rows per request. */
const ROWS_PER_REQUEST = 1000
const CONCURRENCY = 4
/** Sanitizing is synchronous; yield to the event loop this often so requests keep being served. */
const YIELD_EVERY = 250
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

type Row = { external_id: number; text: string; stress: string | null; translation: string | null; redirect_to: string | null }

export interface ShardFile {
  info: ShardInfo
  gzip: Buffer
}

interface DictionaryFiles {
  shards: Map<number, ShardFile>
  builtAt: number
}

const yieldToEventLoop = () => new Promise<void>(resolve => setImmediate(resolve))

async function maxExternalId(dict: DictDirection): Promise<number> {
  const { data, error } = await createServerClient()
    .from('main_word')
    .select('external_id')
    .eq('direction', dict)
    .order('external_id', { ascending: false })
    .limit(1)
  if (error) throw new Error(`offline ${dict}: max id: ${error.message}`)
  return (data?.[0] as { external_id: number } | undefined)?.external_id ?? 0
}

async function fetchRows(dict: DictDirection, from: number): Promise<Row[]> {
  const { data, error } = await createServerClient()
    .from('main_word')
    .select('external_id,text,stress,translation,redirect_to')
    .eq('direction', dict)
    .gte('external_id', from)
    .lt('external_id', from + ROWS_PER_REQUEST)
    .limit(ROWS_PER_REQUEST)
  if (error) throw new Error(`offline ${dict} from ${from}: ${error.message}`)
  return (data ?? []) as Row[]
}

/** Reads and encodes one shard. Throws on any Supabase error, so a half-empty shard is never served. */
export async function buildShard(dict: DictDirection, n: number): Promise<ShardFile> {
  const starts = Array.from({ length: SHARD_SPAN / ROWS_PER_REQUEST }, (_, i) => n * SHARD_SPAN + i * ROWS_PER_REQUEST)
  const rows: Row[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < starts.length) {
        for (const row of await fetchRows(dict, starts[next++])) rows.push(row)
      }
    }),
  )
  const words: OfflineWord[] = []
  for (let i = 0; i < rows.length; i++) {
    if (i > 0 && i % YIELD_EVERY === 0) await yieldToEventLoop()
    const row = rows[i]
    words.push({
      id: row.external_id,
      text: row.text,
      stress: row.stress || null,
      html: sanitizeTranslation(row.translation ?? ''),
      redirectTo: redirectTarget(row.redirect_to, dict),
    })
  }
  const body = encodeShard(words)
  const gzip = gzipSync(body, { level: 9 })
  return { info: { n, words: words.length, bytes: gzip.length, hash: contentHash(body), path: shardPath(dict, n) }, gzip }
}

const files = new Map<DictDirection, DictionaryFiles>()
let building: Promise<void> | null = null

async function buildDictionary(dict: DictDirection): Promise<DictionaryFiles> {
  const shardCount = Math.floor((await maxExternalId(dict)) / SHARD_SPAN) + 1
  const shards = new Map<number, ShardFile>()
  for (let n = 0; n < shardCount; n++) {
    const shard = await buildShard(dict, n)
    if (shard.info.words > 0) shards.set(n, shard)
  }
  return { shards, builtAt: Date.now() }
}

/** Builds every dictionary that is missing or too old, one at a time (one build runs at once). */
function buildAll(force = false): Promise<void> {
  building ??= (async () => {
    for (const dict of DICT_DIRECTIONS) {
      const current = files.get(dict)
      if (!force && current && Date.now() - current.builtAt <= MAX_AGE_MS) continue
      files.set(dict, await buildDictionary(dict))
    }
  })().finally(() => {
    building = null
  })
  return building
}

/** The shards of every dictionary. The first call waits for the build; later ones refresh in the background. */
export async function getDictionaryFiles(): Promise<Map<DictDirection, DictionaryFiles>> {
  if (DICT_DIRECTIONS.some(d => !files.has(d))) await buildAll()
  else if (DICT_DIRECTIONS.some(d => Date.now() - files.get(d)!.builtAt > MAX_AGE_MS)) {
    buildAll().catch(error => console.error('offline dictionaries refresh failed', error))
  }
  return files
}

/**
 * Whether every dictionary is built. When not, starts the build (if none runs) and returns at once, so a
 * request right after a deploy gets a quick 503 instead of waiting for the whole build.
 */
export function dictionariesReady(): boolean {
  if (DICT_DIRECTIONS.every(d => files.has(d))) return true
  buildAll().catch(error => console.error('offline dictionaries build failed', error))
  return false
}

export async function getDictionaryManifest(): Promise<DictionaryManifest> {
  const all = await getDictionaryFiles()
  return {
    dicts: DICT_DIRECTIONS.map(dict => {
      const shards = [...all.get(dict)!.shards.values()].map(s => s.info).sort((a, b) => a.n - b.n)
      return {
        dict,
        words: shards.reduce((sum, s) => sum + s.words, 0),
        bytes: shards.reduce((sum, s) => sum + s.bytes, 0),
        shards,
      }
    }),
  }
}

export async function getShard(dict: DictDirection, n: number): Promise<ShardFile | null> {
  return (await getDictionaryFiles()).get(dict)?.shards.get(n) ?? null
}

/**
 * Rebuilds the shards holding `ids` of `dict` (a new id past the last shard adds a shard), or the whole
 * dictionary when `ids` is empty. Returns the rebuilt shard numbers.
 */
export async function rebuildShards(dict: DictDirection, ids: readonly number[] = []): Promise<number[]> {
  if (building) await building.catch(() => {})
  const current = files.get(dict)
  if (!current || ids.length === 0) {
    const rebuilt = await buildDictionary(dict)
    files.set(dict, rebuilt)
    return [...rebuilt.shards.keys()]
  }
  const numbers = [...new Set(ids.map(id => Math.floor(id / SHARD_SPAN)))].sort((a, b) => a - b)
  const shards = new Map(current.shards)
  for (const n of numbers) {
    const shard = await buildShard(dict, n)
    if (shard.info.words > 0) shards.set(n, shard)
    else shards.delete(n)
  }
  // Swap in one step, so a manifest never mixes old and new shards of one rebuild.
  files.set(dict, { shards, builtAt: current.builtAt })
  return numbers
}

/** Starts the build at server start (after the search index), so the first download does not wait. */
export function warmOfflineDictionaries(): void {
  if (!process.env.SUPABASE_URL) return
  buildAll().catch(error => console.error('offline dictionaries warm-up failed', error))
}

/** Test hook. */
export function resetOfflineDictionaries(): void {
  files.clear()
  building = null
}
