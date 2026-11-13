/** Belarusian plural category of `n`, the same rules as Android's `plurals` for `be`. */
export function pluralBe(n: number): 'one' | 'few' | 'many' {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few'
  return 'many'
}

/** `слова` / `словы` / `слоў` for `n`. */
export function wordsNoun(n: number): string {
  return { one: 'слова', few: 'словы', many: 'слоў' }[pluralBe(n)]
}

/** A count as the apps show it (`%d`: no grouping). */
export function formatCount(n: number): string {
  return String(n)
}
