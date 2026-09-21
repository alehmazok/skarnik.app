import { describe, it, expect } from 'vitest'
import { rewriteLegacyHref, sanitizeTranslation } from '../translation'

describe('rewriteLegacyHref', () => {
  it('rewrites absolute skarnik.by links', () => {
    expect(rewriteLegacyHref('http://www.skarnik.by/rusbel/47880')).toBe('/r/rusbel/47880')
    expect(rewriteLegacyHref('https://skarnik.by/belrus/12')).toBe('/r/belrus/12')
    expect(rewriteLegacyHref('http://www.skarnik.by/tsbm/5/')).toBe('/r/tsbm/5')
  })

  it('rewrites root-relative legacy links', () => {
    expect(rewriteLegacyHref('/rusbel/101010')).toBe('/r/rusbel/101010')
  })

  it('leaves external and unrelated links untouched', () => {
    const lj = 'http://by-mova.livejournal.com/1012016.html'
    expect(rewriteLegacyHref(lj)).toBe(lj)
    expect(rewriteLegacyHref('http://www.skarnik.by/unknown/1')).toBe('http://www.skarnik.by/unknown/1')
    expect(rewriteLegacyHref('http://evil.com/rusbel/1')).toBe('http://evil.com/rusbel/1')
    expect(rewriteLegacyHref('/r/rusbel/1')).toBe('/r/rusbel/1')
  })
})

describe('sanitizeTranslation', () => {
  it('rewrites cross-reference anchors (word 47902 "нервы")', () => {
    const html = `&nbsp;<i><font color="#008000">смотрите</font></i> <a href="http://www.skarnik.by/rusbel/47880">нерв</a>`
    const out = sanitizeTranslation(html)
    expect(out).toContain('<a href="/r/rusbel/47880">нерв</a>')
    expect(out).not.toContain('skarnik.by')
  })

  it('keeps external links and strips disallowed markup', () => {
    const out = sanitizeTranslation('<a href="http://by-mova.livejournal.com/1.html" onclick="x()">t</a><script>alert(1)</script>')
    expect(out).toContain('href="http://by-mova.livejournal.com/1.html"')
    expect(out).not.toContain('onclick')
    expect(out).not.toContain('script')
  })

  it('keeps font color', () => {
    expect(sanitizeTranslation('<font color="#008000">x</font>')).toContain('color="#008000"')
  })
})
