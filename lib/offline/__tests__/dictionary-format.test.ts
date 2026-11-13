import { describe, it, expect } from 'vitest'
import { decodeShard, encodeShard, parseShardFile, shardOf, shardPath } from '../dictionary-format'

describe('dictionary format', () => {
  it('round-trips a shard, sorted by id', () => {
    const words = [
      { id: 12, text: 'дом', stress: 'до́м', html: '<b>дом</b>\nдалей', redirectTo: null },
      { id: 3, text: 'дву...', stress: null, html: '', redirectTo: { dict: 'tsbm' as const, id: 4 } },
    ]
    const body = encodeShard(words)
    expect(body.split('\n')).toHaveLength(3)
    expect(decodeShard(body)).toEqual([words[1], words[0]])
  })

  it('rejects a broken line', () => {
    expect(() => decodeShard('{"id":1}\n')).toThrow('bad shard line')
  })

  it('names shards by id span', () => {
    expect(shardOf(9_999)).toBe(0)
    expect(shardOf(10_000)).toBe(1)
    expect(shardPath('tsbm', 9)).toBe('/offline-data/tsbm/9.ndjson')
    expect(parseShardFile('9.ndjson')).toBe(9)
    expect(parseShardFile('x.ndjson')).toBeNull()
    expect(parseShardFile('9.json')).toBeNull()
  })
})
