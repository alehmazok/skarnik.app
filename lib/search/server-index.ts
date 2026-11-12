import { createServerClient } from '@/lib/supabase'
import { DICT_DIRECTIONS, type DictDirection } from '@/lib/dict'
import { SearchEngine, type IndexWord } from './engine'

/** PostgREST on Supabase returns at most 1,000 rows per request, so each request asks for 1,000 ids. */
const ID_SPAN = 1000
const CONCURRENCY = 8
/** Words change rarely (admin pushes); reload the index in the background once a day. */
const MAX_AGE_MS = 24 * 60 * 60 * 1000

type Row = { external_id: number; text: string }

async function maxExternalId(dict: DictDirection): Promise<number> {
  const { data, error } = await createServerClient()
    .from('main_word')
    .select('external_id')
    .eq('direction', dict)
    .order('external_id', { ascending: false })
    .limit(1)
  if (error) throw new Error(`search index: max id of ${dict}: ${error.message}`)
  return (data?.[0] as Row | undefined)?.external_id ?? 0
}

async function fetchSpan(dict: DictDirection, from: number): Promise<IndexWord[]> {
  const { data, error } = await createServerClient()
    .from('main_word')
    .select('external_id,text')
    .eq('direction', dict)
    .gte('external_id', from)
    .lt('external_id', from + ID_SPAN)
    .limit(ID_SPAN)
  if (error) throw new Error(`search index: ${dict} from ${from}: ${error.message}`)
  return ((data ?? []) as Row[]).map(r => ({ dict, id: r.external_id, text: r.text }))
}

/** Every headword of the three dictionaries, read from `main_word` in id spans, a few requests at a time. */
export async function loadIndexWords(): Promise<IndexWord[]> {
  const jobs: Array<() => Promise<IndexWord[]>> = []
  for (const dict of DICT_DIRECTIONS) {
    const max = await maxExternalId(dict)
    for (let from = 0; from <= max; from += ID_SPAN) jobs.push(() => fetchSpan(dict, from))
  }
  const words: IndexWord[] = []
  let next = 0
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < jobs.length) {
        const job = jobs[next++]
        words.push(...(await job()))
      }
    }),
  )
  return words
}

let current: { engine: SearchEngine; loadedAt: number } | null = null
let loading: Promise<SearchEngine> | null = null

function load(): Promise<SearchEngine> {
  loading ??= loadIndexWords()
    .then(words => {
      const engine = new SearchEngine(words)
      current = { engine, loadedAt: Date.now() }
      return engine
    })
    .finally(() => {
      loading = null
    })
  return loading
}

/**
 * The search engine over the whole index, held in memory for the life of the server process. The first
 * call waits for the load (about 15 s); later calls get the loaded index at once and refresh it in the
 * background once it is a day old.
 */
export async function getSearchEngine(): Promise<SearchEngine> {
  if (!current) return load()
  if (Date.now() - current.loadedAt > MAX_AGE_MS && !loading) {
    load().catch(error => console.error('search index refresh failed', error))
  }
  return current.engine
}

/** Starts loading at server start, so the first search does not wait for it. */
export function warmSearchIndex(): void {
  if (!process.env.SUPABASE_URL) return
  getSearchEngine().catch(error => console.error('search index warm-up failed', error))
}
