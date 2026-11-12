import { describe, it, expect } from 'vitest'
import { pluralBe, wordsNoun } from '../plural'

describe('pluralBe', () => {
  it('follows the Belarusian rules', () => {
    expect([1, 21, 101].map(pluralBe)).toEqual(['one', 'one', 'one'])
    expect([2, 4, 23, 104].map(pluralBe)).toEqual(['few', 'few', 'few', 'few'])
    expect([0, 5, 11, 12, 14, 112457].map(pluralBe)).toEqual(['many', 'many', 'many', 'many', 'many', 'many'])
    expect(wordsNoun(96641)).toBe('слова')
    expect(wordsNoun(107139)).toBe('слоў')
  })
})
