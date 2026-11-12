/// <reference lib="webworker" />
/**
 * Runs the search engine over the offline index off the main thread, so typing never stalls (the fuzzy step
 * scores up to 65k words). Loads the index from IndexedDB on `load`, answers `search` messages.
 */
import { SearchEngine, type IndexWord } from '@/lib/search/engine'
import { decodeIndex } from './index-format'
import { openOfflineDb, readIndexes } from './index-db'
import { DICT_DIRECTIONS, type DictDirection } from '@/lib/dict'
import type { WorkerRequest, WorkerResponse } from './search-protocol'

declare const self: DedicatedWorkerGlobalScope

let engine: SearchEngine | null = null

async function load(): Promise<WorkerResponse> {
  const db = await openOfflineDb()
  const indexes = await readIndexes(db)
  db.close()
  // Only a complete index answers searches; a partial one would silently miss a dictionary.
  if (!DICT_DIRECTIONS.every(d => indexes.some(i => i.dict === d))) {
    engine = null
    return { type: 'loaded', ready: false, words: 0 }
  }
  // concat, not push(...): spreading 100k+ words overflows the call stack.
  const words = indexes.reduce<IndexWord[]>((all, index) => all.concat(decodeIndex(index.dict, index.body)), [])
  engine = new SearchEngine(words)
  return { type: 'loaded', ready: true, words: engine.size }
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data
  try {
    if (message.type === 'load') {
      self.postMessage(await load())
    } else if (message.type === 'search') {
      if (!engine) {
        self.postMessage({ type: 'error', id: message.id, error: 'not loaded' } satisfies WorkerResponse)
        return
      }
      const result = engine.search(message.q, (message.dict ?? undefined) as DictDirection | undefined)
      self.postMessage({ type: 'result', id: message.id, result } satisfies WorkerResponse)
    }
  } catch (error) {
    if (message.type === 'load') {
      engine = null
      self.postMessage({ type: 'loaded', ready: false, words: 0, error: String(error) } satisfies WorkerResponse)
    } else {
      self.postMessage({ type: 'error', id: message.id, error: String(error) } satisfies WorkerResponse)
    }
  }
}
