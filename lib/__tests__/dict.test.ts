import { describe, it, expect } from 'vitest'
import { isValidDict, DICT_DIRECTIONS } from '../dict'

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
