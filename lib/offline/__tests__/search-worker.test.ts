import { describe, it, expect, vi, beforeEach } from 'vitest'
import { encodeIndex } from '../index-format'
import type { StoredIndex } from '../index-db'
import type { WorkerRequest, WorkerResponse } from '../search-protocol'

const stored: StoredIndex[] = []
vi.mock('../index-db', () => ({
  openOfflineDb: async () => ({ close() {} }),
  readIndexes: async () => stored,
}))

/** Loads the worker module against a fake `self` and returns a function that sends it one message. */
async function startWorker() {
  const replies: WorkerResponse[] = []
  const scope = { onmessage: null as ((e: MessageEvent<WorkerRequest>) => Promise<void>) | null, postMessage: (r: WorkerResponse) => replies.push(r) }
  vi.stubGlobal('self', scope)
  vi.resetModules()
  await import('../search.worker')
  return async (message: WorkerRequest) => {
    await scope.onmessage!({ data: message } as MessageEvent<WorkerRequest>)
    return replies.at(-1)!
  }
}

function index(dict: StoredIndex['dict'], count: number, word: (i: number) => string): StoredIndex {
  const words = Array.from({ length: count }, (_, i) => ({ id: i + 1, text: word(i) }))
  return { dict, hash: 'h', words: count, body: encodeIndex(words), savedAt: 0 }
}

describe('search worker', () => {
  beforeEach(() => {
    stored.length = 0
  })

  it('loads an index too big to spread into push() and searches it', async () => {
    stored.push(
      index('belrus', 400_000, i => (i === 0 ? 'прывітанне' : `слова${i}`)),
      index('rusbel', 110_000, i => `слово${i}`),
      index('tsbm', 100_000, i => `тлум${i}`),
    )
    const send = await startWorker()
    expect(await send({ type: 'load' })).toEqual({ type: 'loaded', ready: true, words: 610_000 })
    const reply = await send({ type: 'search', id: 7, q: 'прывитанне', dict: null })
    expect(reply).toMatchObject({ type: 'result', id: 7 })
    expect(reply.type === 'result' && reply.result.words[0]).toEqual({ dict: 'belrus', id: 1, text: 'прывітанне' })
  })

  it('is not ready while a dictionary is missing', async () => {
    stored.push(index('belrus', 3, i => `а${i}`))
    const send = await startWorker()
    expect(await send({ type: 'load' })).toEqual({ type: 'loaded', ready: false, words: 0 })
    expect(await send({ type: 'search', id: 1, q: 'а', dict: null })).toEqual({ type: 'error', id: 1, error: 'not loaded' })
  })
})
