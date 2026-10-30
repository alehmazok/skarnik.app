import type { DictDirection } from './dict'

// Average advance of a bold Cyrillic glyph in em, with the heading's
// -.035em tracking. Measured ~0.51–0.56 on real headwords in Helvetica/Arial
// bold; rounded up so the longest word fits with a little slack.
const GLYPH_EM = 0.62

// Must match the horizontal padding of <main> on the word page.
const MAIN_PADDING_X = 'clamp(20px,6vw,64px)'

const MIN_REM = 1.25

/** Length of the longest unbreakable run (words split on spaces and hyphens). */
export function longestWordLength(text: string): number {
  const plain = text.normalize('NFD').replace(/[̀-ͯ]/g, '')
  return plain.split(/[\s\-‐‑–—/|]+/u).reduce((max, w) => Math.max(max, [...w].length), 0)
}

/**
 * Font size for the word-page <h1>. The cap depends on total length (short
 * headwords get a big display size), and the fluid part shrinks the font so
 * the longest single word fits on one line of the viewport instead of
 * breaking mid-word.
 */
export function headingFontSize(text: string): string {
  const len = text.length
  const maxRem = len > 40 ? 2.8 : len > 20 ? 4.5 : 7
  const longest = Math.max(longestWordLength(text), 1)
  const fit = `calc((100vw - 2 * ${MAIN_PADDING_X}) / ${+(longest * GLYPH_EM).toFixed(2)})`
  return `clamp(${MIN_REM}rem,min(9.5vw,${fit}),${maxRem}rem)`
}

/**
 * Language of the headword, so `hyphens: auto` picks the right dictionary.
 * Russian→Belarusian headwords are Russian; the rest are Belarusian.
 */
export function headwordLang(dict: DictDirection): 'ru' | 'be' {
  return dict === 'rusbel' ? 'ru' : 'be'
}
