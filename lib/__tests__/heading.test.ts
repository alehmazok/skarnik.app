import { describe, it, expect } from 'vitest'
import { headingFontSize, headwordLang, longestWordLength } from '../heading'

describe('longestWordLength', () => {
  it('counts a single word', () => {
    expect(longestWordLength('абажуродержатель')).toBe(16)
  })

  it('ignores combining stress marks', () => {
    expect(longestWordLength('заўсё́дны')).toBe(8)
  })

  it('returns the longest word of a phrase', () => {
    expect(longestWordLength('без абажуродержателя')).toBe(16)
  })

  it('splits on hyphens, since browsers can break there', () => {
    expect(longestWordLength('абы-што')).toBe(3)
  })
})

describe('headingFontSize', () => {
  it('fits the longest word to the viewport width', () => {
    expect(headingFontSize('абажуродержатель')).toBe(
      'clamp(1.25rem,min(9.5vw,calc((100vw - 2 * clamp(20px,6vw,64px)) / 9.92)),7rem)',
    )
  })

  it('keeps the big display cap for short words', () => {
    expect(headingFontSize('дом')).toMatch(/,7rem\)$/)
  })

  it('lowers the cap for long phrases', () => {
    expect(headingFontSize('а'.repeat(21))).toMatch(/,4\.5rem\)$/)
    expect(headingFontSize('а '.repeat(21).trim())).toMatch(/,2\.8rem\)$/)
  })
})

describe('headwordLang', () => {
  it('marks rusbel headwords as Russian and others as Belarusian', () => {
    expect(headwordLang('rusbel')).toBe('ru')
    expect(headwordLang('belrus')).toBe('be')
    expect(headwordLang('tsbm')).toBe('be')
  })
})
