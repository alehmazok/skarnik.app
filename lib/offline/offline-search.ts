'use client'

/**
 * The search app's handle on the offline index: a Web Worker running the same engine as /api/search over the
 * words stored in IndexedDB. One per page.
 */
import type { DictDirection } from '@/lib/dict'
import type { SearchResult } from '@/lib/search/engine'
import type { WorkerRequest, WorkerResponse } from './search-protocol'

export interface OfflineSearch {
  /** Loads (or reloads after an update) the index; resolves to whether a complete index is there. */
  load(): Promise<boolean>
  ready(): boolean
  search(q: string, dict: DictDirection | null): Promise<SearchResult>
}

export function createOfflineSearch(worker: Worker): OfflineSearch {
  let isReady = false
  let nextId = 1
  const pending = new Map<number, { resolve: (r: SearchResult) => void; reject: (e: Error) => void }>()
  let loadWaiter: ((ready: boolean) => void) | null = null

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const message = event.data
    if (message.type === 'loaded') {
      isReady = message.ready
      if (message.error) console.warn('offline index load failed', message.error)
      loadWaiter?.(message.ready)
      loadWaiter = null
      return
    }
    const waiter = pending.get(message.id)
    if (!waiter) return
    pending.delete(message.id)
    if (message.type === 'result') waiter.resolve(message.result)
    else waiter.reject(new Error(message.error))
  }

  const post = (message: WorkerRequest) => worker.postMessage(message)

  return {
    load() {
      return new Promise<boolean>(resolve => {
        loadWaiter = resolve
        post({ type: 'load' })
      })
    },
    ready: () => isReady,
    search(q, dict) {
      const id = nextId++
      return new Promise<SearchResult>((resolve, reject) => {
        pending.set(id, { resolve, reject })
        post({ type: 'search', id, q, dict })
      })
    },
  }
}

let shared: OfflineSearch | null = null

/** The page's offline search, or null where Web Workers or IndexedDB are missing. */
export function getOfflineSearch(): OfflineSearch | null {
  if (shared) return shared
  if (typeof window === 'undefined' || typeof Worker === 'undefined' || typeof indexedDB === 'undefined') return null
  shared = createOfflineSearch(new Worker(new URL('./search.worker.ts', import.meta.url)))
  return shared
}
