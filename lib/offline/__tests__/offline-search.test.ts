import { describe, it, expect } from 'vitest'
import { createOfflineSearch } from '../offline-search'
import type { WorkerRequest, WorkerResponse } from '../search-protocol'
import { SearchEngine } from '@/lib/search/engine'

/** A worker double that runs the real engine in the same thread. */
function fakeWorker(words: ConstructorParameters<typeof SearchEngine>[0] | null) {
  const worker = { onmessage: null as ((e: MessageEvent<WorkerResponse>) => void) | null, postMessage: (() => {}) as (m: WorkerRequest) => void }
  let engine: SearchEngine | null = null
  worker.postMessage = (m: WorkerRequest) => {
    const reply = (r: WorkerResponse) => queueMicrotask(() => worker.onmessage?.({ data: r } as MessageEvent<WorkerResponse>))
    if (m.type === 'load') {
      engine = words ? new SearchEngine(words) : null
      reply({ type: 'loaded', ready: !!engine, words: engine?.size ?? 0 })
    } else if (engine) reply({ type: 'result', id: m.id, result: engine.search(m.q, m.dict ?? undefined) })
    else reply({ type: 'error', id: m.id, error: 'not loaded' })
  }
  return worker as unknown as Worker
}

describe('createOfflineSearch', () => {
  it('searches the loaded index through the worker', async () => {
    const search = createOfflineSearch(fakeWorker([{ dict: 'belrus', id: 1, text: 'прывітанне' }]))
    expect(await search.load()).toBe(true)
    expect(search.ready()).toBe(true)
    const result = await search.search('прывитанне', null)
    expect(result.words).toEqual([{ dict: 'belrus', id: 1, text: 'прывітанне' }])
  })

  it('reports no index before the download', async () => {
    const search = createOfflineSearch(fakeWorker(null))
    expect(await search.load()).toBe(false)
    expect(search.ready()).toBe(false)
    await expect(search.search('дом', null)).rejects.toThrow('not loaded')
  })
})
