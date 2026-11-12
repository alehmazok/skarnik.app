import { describe, it, expect } from 'vitest'
import {
  applySubstitutions,
  damerauLevenshtein,
  RESULT_LIMIT,
  SearchEngine,
  stripGluedPrefixLetter,
  type IndexWord,
} from '../engine'

const w = (dict: IndexWord['dict'], id: number, text: string): IndexWord => ({ dict, id, text })

const WORDS: IndexWord[] = [
  w('belrus', 1, 'прывітанне'),
  w('belrus', 2, 'прывітальны'),
  w('rusbel', 3, 'привет'),
  w('rusbel', 4, 'дом'),
  w('belrus', 5, 'дом'),
  w('tsbm', 6, 'дом'),
  w('rusbel', 7, 'домашний'),
  w('tsbm', 8, 'Мінск'),
  w('rusbel', 9, 'здравствуйте'),
  w('belrus', 10, 'ёлка'),
  w('belrus', 11, 'з‘езд'),
  w('rusbel', 12, 'съезд'),
]

const ids = (r: { words: { dict: string; id: number }[] }) => r.words.map(x => `${x.dict}/${x.id}`)

describe('SearchEngine', () => {
  const engine = new SearchEngine(WORDS)

  it('finds words by prefix, in alphabetical order', () => {
    expect(ids(engine.search('прыв'))).toEqual(['belrus/2', 'belrus/1'])
  })

  it('orders words with the same text Рус-Бел, Бел-Рус, Тлумачальны, like the apps', () => {
    expect(ids(engine.search('дом'))).toEqual(['rusbel/4', 'belrus/5', 'tsbm/6', 'rusbel/7'])
  })

  it('is case-insensitive and keeps the original spelling', () => {
    const result = engine.search('мінск')
    expect(result.words).toEqual([{ dict: 'tsbm', id: 8, text: 'Мінск' }])
  })

  it('finds a Belarusian word typed on a Russian keyboard', () => {
    expect(ids(engine.search('прывитанне'))).toEqual(['belrus/1'])
    expect(ids(engine.search('елка'))).toEqual(['belrus/10'])
    expect(ids(engine.search("з'езд"))).toEqual(['belrus/11'])
  })

  it('corrects a typo of 3+ letters by edit distance', () => {
    expect(ids(engine.search('прывітане'))).toEqual(['belrus/1'])
  })

  it('does not run fuzzy search for one or two letters', () => {
    expect(engine.search('йй').words).toEqual([])
  })

  it('strips a glued one-letter preposition when nothing else matches', () => {
    const result = engine.search('вздравствуйте')
    expect(result.usedPrepositionFallback).toBe(true)
    expect(ids(result)).toEqual(['rusbel/9'])
  })

  it('filters by dictionary', () => {
    expect(ids(engine.search('дом', 'tsbm'))).toEqual(['tsbm/6'])
    expect(ids(engine.search('дом', 'rusbel'))).toEqual(['rusbel/4', 'rusbel/7'])
  })

  it('returns nothing for an empty query or nonsense', () => {
    expect(engine.search('   ').words).toEqual([])
    expect(engine.search('щщщщщщщщ').words).toEqual([])
  })

  it('caps each of the two prefix stages at the result limit, like the apps', () => {
    const many = Array.from({ length: 40 }, (_, i) => w('belrus', 100 + i, `слова${String(i).padStart(2, '0')}`))
    const result = new SearchEngine(many).search('слова')
    // 15 by word, then 15 more by mask (the rest of the words, none repeated).
    expect(result.words).toHaveLength(2 * RESULT_LIMIT)
    expect(result.words.map(x => x.text)).toEqual(many.slice(0, 2 * RESULT_LIMIT).map(x => x.text))
  })

  it('adds mask matches after word matches without repeating them', () => {
    // «і» typed as «и»: «прыв» matches by word, «прывитальн» only through the substitution.
    expect(ids(engine.search('прывитальн'))).toEqual(['belrus/2'])
  })
})

describe('helpers', () => {
  it('maps Russian letters to Belarusian ones', () => {
    expect(applySubstitutions("щи'ъе")).toBe('ўі‘‘ё')
  })

  it('strips one glued preposition letter', () => {
    expect(stripGluedPrefixLetter('ўдом')).toBe('дом')
    expect(stripGluedPrefixLetter('дом')).toBeNull()
    expect(stripGluedPrefixLetter('в')).toBeNull()
  })

  it('counts an adjacent swap as one edit', () => {
    expect(damerauLevenshtein('дмо', 'дом')).toBe(1)
    expect(damerauLevenshtein('кот', 'кіт')).toBe(1)
    expect(damerauLevenshtein('', 'дом')).toBe(3)
    expect(damerauLevenshtein('абв', 'абв')).toBe(0)
  })
})
