import { describe, it, expect } from 'vitest'
import {
  htmlToPlainText, truncate, wordTitle, wordDescription, wordJsonLd, redirectTarget,
  serializeJsonLd, siteJsonLd, wordPath,
} from '../seo'

describe('htmlToPlainText', () => {
  it('drops tags and collapses whitespace', () => {
    expect(htmlToPlainText('<font color="#831b03">благожелательность</font>,\n  <b>зычлівасць</b>'))
      .toBe('благожелательность, зычлівасць')
  })

  it('keeps words apart across line breaks', () => {
    expect(htmlToPlainText('першы<br>другі<br/>трэці')).toBe('першы другі трэці')
  })

  it('decodes entities and non-breaking spaces', () => {
    expect(htmlToPlainText('a&nbsp;&amp;&nbsp;b <span>&nbsp;</span> &lt;c&gt;')).toBe('a & b <c>')
  })

  it('returns an empty string for empty markup', () => {
    expect(htmlToPlainText('<span> </span>')).toBe('')
  })
})

describe('truncate', () => {
  it('leaves short text alone', () => {
    expect(truncate('кароткі', 10)).toBe('кароткі')
  })

  it('cuts at a word boundary and adds an ellipsis', () => {
    const out = truncate('адзін два тры чатыры пяць', 16)
    expect(out).toBe('адзін два тры…')
    expect(out.length).toBeLessThanOrEqual(16)
  })

  it('drops trailing punctuation before the ellipsis', () => {
    expect(truncate('адзін, два, тры, чатыры', 13)).toBe('адзін, два…')
  })
})

describe('wordTitle', () => {
  it('names the action per dictionary', () => {
    expect(wordTitle('слова', 'belrus')).toBe('слова — пераклад на рускую мову | Skarnik.app')
    expect(wordTitle('слово', 'rusbel')).toBe('слово — пераклад на беларускую мову | Skarnik.app')
    expect(wordTitle('слова', 'tsbm')).toBe('слова — значэнне слова | Skarnik.app')
  })
})

describe('wordDescription', () => {
  it('starts with the word and dictionary, then the translation text', () => {
    expect(wordDescription({ text: 'добразычлівасць', translation: '<b>благожелательность</b>' }, 'belrus'))
      .toBe('добразычлівасць — Беларуска-рускі слоўнік. благожелательность')
  })

  it('falls back to the prefix when the translation is empty', () => {
    expect(wordDescription({ text: 'слова', translation: '' }, 'tsbm')).toBe('слова — Тлумачальны слоўнік')
  })

  it('stays within 160 characters', () => {
    const long = '<p>' + 'вельмі доўгае тлумачэнне '.repeat(20) + '</p>'
    const out = wordDescription({ text: 'слова', translation: long }, 'tsbm')
    expect(out.length).toBeLessThanOrEqual(160)
    expect(out.endsWith('…')).toBe(true)
  })
})

describe('redirectTarget', () => {
  it('reads the stored path of the target word', () => {
    expect(redirectTarget('/tsbm/20127', 'tsbm')).toEqual({ dict: 'tsbm', id: 20127 })
    expect(redirectTarget('/rusbel/81075/', 'rusbel')).toEqual({ dict: 'rusbel', id: 81075 })
    expect(redirectTarget('https://skarnik.by/belrus/7', 'tsbm')).toEqual({ dict: 'belrus', id: 7 })
    expect(redirectTarget('https://skarnik.app/r/belrus/7', 'belrus')).toEqual({ dict: 'belrus', id: 7 })
  })

  it('reads a bare id as the same dictionary', () => {
    expect(redirectTarget('123', 'belrus')).toEqual({ dict: 'belrus', id: 123 })
  })

  it('ignores empty and unknown values', () => {
    expect(redirectTarget(null, 'belrus')).toBeNull()
    expect(redirectTarget('', 'belrus')).toBeNull()
    expect(redirectTarget('0', 'belrus')).toBeNull()
    expect(redirectTarget('1.5', 'belrus')).toBeNull()
    expect(redirectTarget('/other/5', 'belrus')).toBeNull()
    expect(redirectTarget('https://example.com/belrus/5', 'belrus')).toBeNull()
  })
})

describe('wordJsonLd', () => {
  it('describes the entry as a DefinedTerm in its dictionary', () => {
    const ld = wordJsonLd({ text: 'слово', translation: '<b>слова</b>' }, 'rusbel', 42)
    expect(ld).toMatchObject({
      '@type': 'DefinedTerm',
      name: 'слово',
      description: 'слова',
      inLanguage: 'ru',
      url: 'https://skarnik.app/r/rusbel/42',
      inDefinedTermSet: { '@type': 'DefinedTermSet', name: 'Руска-беларускі слоўнік' },
    })
  })

  it('marks Belarusian headwords as be', () => {
    expect(wordJsonLd({ text: 'слова', translation: '' }, 'belrus', 1).inLanguage).toBe('be')
  })
})

describe('serializeJsonLd', () => {
  it('escapes < so the data cannot close the script tag', () => {
    const out = serializeJsonLd({ name: '</script><script>alert(1)</script>' })
    expect(out).not.toContain('<')
    expect(JSON.parse(out).name).toBe('</script><script>alert(1)</script>')
  })
})

describe('siteJsonLd', () => {
  it('is a WebSite on the canonical origin', () => {
    expect(siteJsonLd()).toMatchObject({ '@type': 'WebSite', url: 'https://skarnik.app/' })
  })
})

describe('wordPath', () => {
  it('builds the share URL path', () => {
    expect(wordPath('belrus', 27890)).toBe('/r/belrus/27890')
  })
})
