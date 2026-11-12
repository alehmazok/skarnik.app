/**
 * Word search over the whole dictionary index, ported from skarnik_android's `SearchWordsUseCase`
 * (itself a port of skarnik-flutter's `ObjectboxSearchRepository`). Pure TypeScript with no I/O, so the same
 * code runs on the server (/api/search) and, from #23, in the browser over the offline index.
 *
 * 1. Lowercase the query.
 * 2. Prefix match on `lword`, then on the letter mask, each for the query as typed and with
 *    {@link LETTER_SUBSTITUTIONS} applied. Up to {@link RESULT_LIMIT} words per stage, ordered by the field.
 * 3. Nothing found and at least 3 letters: Damerau–Levenshtein over the words filed under the query's first
 *    letter (distance 1 up to 5 letters, else 2).
 * 4. Still nothing: if the query starts with a one-letter preposition typed glued to the next word, run 2–3
 *    once more without it.
 */
import type { DictDirection } from '@/lib/dict'

/** Results per stage (`AppConfig.wordsSearchLimit` in the apps). */
export const RESULT_LIMIT = 15
export const FUZZY_MIN_QUERY_LENGTH = 3
const FUZZY_SHORT_QUERY_LENGTH = 5

/**
 * Candidates scored by the fuzzy step. Covers the largest first-letter bucket («п», ~62k words), same as
 * Android, so a typo's target is never cut off before it is scored.
 */
export const FUZZY_CANDIDATE_LIMIT = 65_000

/** Russian letters (and the ASCII apostrophe) mapped to their Belarusian counterparts. */
export const LETTER_SUBSTITUTIONS: ReadonlyArray<readonly [string, string]> = [
  ['и', 'і'],
  ['е', 'ё'],
  ['щ', 'ў'],
  ['ъ', '‘'],
  ["'", '‘'],
]

/** One-letter prepositions and conjunctions that people type glued to the next word. */
const GLUED_PREFIX_LETTERS = new Set(['а', 'в', 'ж', 'з', 'и', 'і', 'к', 'о', 'с', 'у', 'ў'])

/**
 * Order of the dictionaries when two words have the same text. Matches the row order of the apps' bundled
 * index (Рус-Бел, then Бел-Рус, then Тлумачальны, each by id), which is how ObjectBox breaks ties.
 */
export const DICT_SEARCH_ORDER: readonly DictDirection[] = ['rusbel', 'belrus', 'tsbm']

export function applySubstitutions(text: string): string {
  const result = LETTER_SUBSTITUTIONS.reduce((acc, [from, to]) => (acc.includes(from) ? acc.split(from).join(to) : acc), text)
  // Keep one string when nothing changed: the index holds 316k of these.
  return result === text ? text : result
}

/** `query` without a leading glued preposition, or null. Only ever strips one letter. */
export function stripGluedPrefixLetter(query: string): string | null {
  return query.length >= 2 && GLUED_PREFIX_LETTERS.has(query[0]) ? query.slice(1) : null
}

/** Damerau–Levenshtein (optimal string alignment) distance. Case-sensitive; callers lowercase first. */
export function damerauLevenshtein(a: string, b: string): number {
  return boundedDamerauLevenshtein(a, b, Infinity)
}

let matrix = new Uint16Array(0)

/**
 * {@link damerauLevenshtein}, capped at `max + 1`, and gives up as soon as it can no longer end within `max`.
 * The fuzzy step only asks "within 1 or 2?", so most of its 60k candidates stop after a row or two.
 */
export function boundedDamerauLevenshtein(a: string, b: string, max: number): number {
  if (a.length === 0 || b.length === 0) return Math.min(Math.max(a.length, b.length), max + 1)
  const cols = b.length + 1
  const size = (a.length + 1) * cols
  if (matrix.length < size) matrix = new Uint16Array(Math.max(size, 1024))
  const d = matrix
  for (let i = 0; i <= a.length; i++) d[i * cols] = i
  for (let j = 0; j <= b.length; j++) d[j] = j
  for (let i = 1; i <= a.length; i++) {
    let rowMin = d[i * cols]
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      let value = Math.min(d[(i - 1) * cols + j] + 1, d[i * cols + j - 1] + 1, d[(i - 1) * cols + j - 1] + cost)
      if (i >= 2 && j >= 2 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        value = Math.min(value, d[(i - 2) * cols + j - 2] + cost)
      }
      d[i * cols + j] = value
      if (value < rowMin) rowMin = value
    }
    // A transposition reads two rows back, so stop only when this row and the previous one are both over.
    if (rowMin > max && i >= 2 && minOfRow(d, (i - 1) * cols, cols) > max) return max + 1
  }
  return Math.min(d[a.length * cols + b.length], max + 1)
}

function minOfRow(d: Uint16Array, start: number, cols: number): number {
  let min = d[start]
  for (let j = 1; j < cols; j++) if (d[start + j] < min) min = d[start + j]
  return min
}

/** A word in the index as it comes from `main_word`. */
export interface IndexWord {
  dict: DictDirection
  id: number
  text: string
}

/** A search hit. */
export interface SearchHit {
  dict: DictDirection
  id: number
  text: string
}

export interface SearchResult {
  words: SearchHit[]
  /** The words were found only after dropping a glued one-letter preposition. */
  usedPrepositionFallback: boolean
}

/** Code-unit comparison, the same order as ObjectBox's case-sensitive string sort for Cyrillic text. */
function compareStrings(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

export class SearchEngine {
  private readonly dicts: DictDirection[]
  private readonly ids: Int32Array
  private readonly texts: string[]
  private readonly lwords: string[]
  private readonly masks: string[]
  /** Row numbers sorted by lword (ties: index row order). */
  private readonly byLword: Int32Array
  /** Row numbers sorted by mask (ties: index row order). */
  private readonly byMask: Int32Array
  /** Row numbers per first letter, in index row order. */
  private readonly byLetter: Map<string, Int32Array>

  readonly size: number

  constructor(words: readonly IndexWord[]) {
    // Index row order: dictionary order, then id, like the apps' bundled index.
    const rank = new Map(DICT_SEARCH_ORDER.map((d, i) => [d, i]))
    const rows = [...words].sort((a, b) => (rank.get(a.dict)! - rank.get(b.dict)!) || a.id - b.id)
    const n = rows.length
    this.size = n
    this.dicts = rows.map(w => w.dict)
    this.ids = Int32Array.from(rows, w => w.id)
    this.texts = rows.map(w => w.text)
    this.lwords = rows.map(w => {
      const lower = w.text.toLowerCase()
      return lower === w.text ? w.text : lower
    })
    this.masks = this.lwords.map(applySubstitutions)

    const order = (keys: string[]) =>
      Int32Array.from({ length: n }, (_, i) => i).sort((a, b) => compareStrings(keys[a], keys[b]) || a - b)
    this.byLword = order(this.lwords)
    this.byMask = order(this.masks)

    const buckets = new Map<string, number[]>()
    for (let i = 0; i < n; i++) {
      const letter = this.lwords[i].charAt(0)
      let bucket = buckets.get(letter)
      if (!bucket) buckets.set(letter, (bucket = []))
      bucket.push(i)
    }
    this.byLetter = new Map([...buckets].map(([k, v]) => [k, Int32Array.from(v)]))
  }

  search(query: string, dict?: DictDirection): SearchResult {
    const lowercased = query.trim().toLowerCase()
    if (!lowercased) return { words: [], usedPrepositionFallback: false }
    const primary = this.searchOnce(lowercased, dict)
    const stripped = primary.length === 0 ? stripGluedPrefixLetter(lowercased) : null
    if (stripped === null) return { words: primary.map(i => this.hit(i)), usedPrepositionFallback: false }
    return { words: this.searchOnce(stripped, dict).map(i => this.hit(i)), usedPrepositionFallback: true }
  }

  private searchOnce(query: string, dict?: DictDirection): number[] {
    const substituted = applySubstitutions(query)
    const prefixes = [...new Set([query, substituted])]
    const byWord = this.findByPrefix(this.byLword, this.lwords, prefixes, new Set(), RESULT_LIMIT, dict)
    const byMask = this.findByPrefix(this.byMask, this.masks, prefixes, new Set(byWord), RESULT_LIMIT, dict)
    const exact = [...new Set([...byWord, ...byMask])]
    if (exact.length > 0 || query.length < FUZZY_MIN_QUERY_LENGTH) return exact
    return this.fuzzy(substituted, dict)
  }

  /** Rows whose key starts with any of `prefixes`, in key order, leaving out `excluded`. */
  private findByPrefix(
    sorted: Int32Array,
    keys: string[],
    prefixes: string[],
    excluded: Set<number>,
    limit: number,
    dict?: DictDirection,
  ): number[] {
    // Each prefix is one contiguous range of the sorted array; merge the ranges in key order.
    const ranges = prefixes.map(prefix => {
      let lo = 0
      let hi = sorted.length
      while (lo < hi) {
        const mid = (lo + hi) >>> 1
        if (keys[sorted[mid]] < prefix) lo = mid + 1
        else hi = mid
      }
      return { pos: lo, prefix }
    })
    const result: number[] = []
    const seen = new Set<number>()
    const matches = (r: { pos: number; prefix: string }) => r.pos < sorted.length && keys[sorted[r.pos]].startsWith(r.prefix)
    while (result.length < limit) {
      let best: { pos: number; prefix: string } | null = null
      for (const r of ranges) {
        if (!matches(r)) continue
        if (best === null || compareStrings(keys[sorted[r.pos]], keys[sorted[best.pos]]) < 0 ||
          (keys[sorted[r.pos]] === keys[sorted[best.pos]] && r.pos < best.pos)) best = r
      }
      if (best === null) break
      const row = sorted[best.pos]
      // Overlapping ranges (one prefix extends the other) meet the same row; advance them all past it.
      for (const r of ranges) if (matches(r) && sorted[r.pos] === row) r.pos++
      if (seen.has(row) || excluded.has(row) || (dict && this.dicts[row] !== dict)) continue
      seen.add(row)
      result.push(row)
    }
    return result
  }

  private fuzzy(query: string, dict?: DictDirection): number[] {
    const bucket = this.byLetter.get(query.charAt(0))
    if (!bucket) return []
    const maxDistance = query.length <= FUZZY_SHORT_QUERY_LENGTH ? 1 : 2
    const scored: Array<{ row: number; distance: number }> = []
    const end = Math.min(bucket.length, FUZZY_CANDIDATE_LIMIT)
    for (let k = 0; k < end; k++) {
      const row = bucket[k]
      if (dict && this.dicts[row] !== dict) continue
      const lword = this.lwords[row]
      // The distance is at least the length difference, so skip the matrix for words that cannot match.
      if (Math.abs(lword.length - query.length) > maxDistance) continue
      const distance = boundedDamerauLevenshtein(query, lword, maxDistance)
      if (distance <= maxDistance) scored.push({ row, distance })
    }
    // Array.prototype.sort is stable, so ties keep index row order, like Kotlin's sortedWith.
    scored.sort((a, b) => a.distance - b.distance || compareStrings(this.lwords[a.row], this.lwords[b.row]))
    return scored.slice(0, RESULT_LIMIT).map(s => s.row)
  }

  /** The words of one dictionary as loaded, for the offline index files. */
  wordsOf(dict: DictDirection): Array<{ id: number; text: string }> {
    const out: Array<{ id: number; text: string }> = []
    for (let i = 0; i < this.size; i++) if (this.dicts[i] === dict) out.push({ id: this.ids[i], text: this.texts[i] })
    return out
  }

  private hit(row: number): SearchHit {
    return { dict: this.dicts[row], id: this.ids[row], text: this.texts[row] }
  }
}
