import { describe, it, expect } from 'vitest'
import { splitAtStress } from '../stress'

describe('splitAtStress', () => {
  it('splits word at combining acute accent', () => {
    const result = splitAtStress('заўсё́дны')
    expect(result).toEqual({
      before: 'заўс',
      stressed: 'ё́',
      after: 'дны',
    })
  })

  it('handles stress on first letter', () => {
    const result = splitAtStress('о́зера')
    expect(result).toEqual({
      before: '',
      stressed: 'о́',
      after: 'зера',
    })
  })

  it('handles stress on last letter', () => {
    const result = splitAtStress('рака́')
    expect(result).toEqual({
      before: 'рак',
      stressed: 'а́',
      after: '',
    })
  })

  it('returns null when no accent mark present', () => {
    expect(splitAtStress('слова')).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(splitAtStress('')).toBeNull()
  })

  it('returns null when accent is at index 0 (no letter before it)', () => {
    expect(splitAtStress('́слова')).toBeNull()
  })

  it('preserves combining accent in stressed segment', () => {
    const result = splitAtStress('до́бры')
    expect(result?.stressed).toBe('о́')
  })
})
