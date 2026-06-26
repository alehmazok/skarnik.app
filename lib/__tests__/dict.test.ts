import { describe, it, expect } from 'vitest'
import { isValidDict, DICT_DIRECTIONS, DICT_LABELS, buildOgDescription } from '../dict'

describe('isValidDict', () => {
  it('accepts valid directions', () => {
    expect(isValidDict('belrus')).toBe(true)
    expect(isValidDict('rusbel')).toBe(true)
    expect(isValidDict('tsbm')).toBe(true)
  })

  it('rejects unknown values', () => {
    expect(isValidDict('en')).toBe(false)
    expect(isValidDict('')).toBe(false)
    expect(isValidDict('BELRUS')).toBe(false)
    expect(isValidDict('belrus ')).toBe(false)
  })

  it('covers all DICT_DIRECTIONS', () => {
    for (const d of DICT_DIRECTIONS) {
      expect(isValidDict(d)).toBe(true)
    }
  })
})

describe('DICT_LABELS', () => {
  it('has a label for every direction', () => {
    for (const d of DICT_DIRECTIONS) {
      expect(DICT_LABELS[d]).toBeTruthy()
    }
  })

  it('returns correct labels', () => {
    expect(DICT_LABELS.belrus).toBe('Беларуска-рускі слоўнік')
    expect(DICT_LABELS.rusbel).toBe('Руска-беларускі слоўнік')
    expect(DICT_LABELS.tsbm).toBe('Тлумачальны слоўнік')
  })
})

describe('buildOgDescription', () => {
  it('wraps word in quotes and appends dict label', () => {
    expect(buildOgDescription('добразычлівасць', 'belrus'))
      .toBe('"добразычлівасць" — Беларуска-рускі слоўнік')
  })

  it('uses correct label per direction', () => {
    expect(buildOgDescription('слова', 'rusbel'))
      .toBe('"слова" — Руска-беларускі слоўнік')
    expect(buildOgDescription('слова', 'tsbm'))
      .toBe('"слова" — Тлумачальны слоўнік')
  })
})
