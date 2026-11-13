import { describe, it, expect } from 'vitest'
import { ogFont, OG_FONT_PATH } from '../og-font'

describe('ogFont', () => {
  it('loads the bundled Inter Bold from the repo', () => {
    expect(OG_FONT_PATH.endsWith('assets/fonts/Inter-Bold.ttf')).toBe(true)
    expect(ogFont.byteLength).toBeGreaterThan(100_000)
  })

  it('is a TrueType font (satori cannot read woff2)', () => {
    expect(ogFont.readUInt32BE(0)).toBe(0x00010000)
  })
})
