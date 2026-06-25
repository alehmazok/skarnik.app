export interface StressParts {
  before: string
  stressed: string
  after: string
}

export function splitAtStress(text: string): StressParts | null {
  const accentIdx = text.indexOf('́')
  if (accentIdx <= 0) return null
  return {
    before: text.slice(0, accentIdx - 1),
    stressed: text.slice(accentIdx - 1, accentIdx + 1),
    after: text.slice(accentIdx + 1),
  }
}
