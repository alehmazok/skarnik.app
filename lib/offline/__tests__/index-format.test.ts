import { describe, it, expect } from 'vitest'
import { contentHash, decodeIndex, encodeIndex, indexPath } from '../index-format'

describe('offline index format', () => {
  it('writes one word per line, sorted by id', () => {
    expect(encodeIndex([{ id: 3, text: 'дом' }, { id: 1, text: 'Мінск' }])).toBe('1\tМінск\n3\tдом\n')
  })

  it('reads back what it wrote', () => {
    const words = [{ id: 1, text: 'Мінск' }, { id: 27890, text: 'добразычлівасць' }, { id: 5, text: 'з‘езд' }]
    expect(decodeIndex('belrus', encodeIndex(words))).toEqual([
      { dict: 'belrus', id: 1, text: 'Мінск' },
      { dict: 'belrus', id: 5, text: 'з‘езд' },
      { dict: 'belrus', id: 27890, text: 'добразычлівасць' },
    ])
  })

  it('never lets a word break the format', () => {
    const body = encodeIndex([{ id: 1, text: 'a\tb\nc' }])
    expect(decodeIndex('tsbm', body)).toEqual([{ dict: 'tsbm', id: 1, text: 'a b c' }])
  })

  it('skips broken lines', () => {
    expect(decodeIndex('rusbel', 'x\tbad\n\n7\tдом')).toEqual([{ dict: 'rusbel', id: 7, text: 'дом' }])
  })

  it('hashes content stably', () => {
    expect(contentHash('1\tдом\n')).toBe(contentHash('1\tдом\n'))
    expect(contentHash('1\tдом\n')).not.toBe(contentHash('1\tдым\n'))
    expect(contentHash('')).toMatch(/^[0-9a-f]{8}$/)
  })

  it('serves files under /offline-data/', () => {
    expect(indexPath('tsbm')).toBe('/offline-data/index/tsbm')
  })
})
