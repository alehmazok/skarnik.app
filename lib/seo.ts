import sanitizeHtml from 'sanitize-html'
import { DICT_LABELS, type DictDirection } from './dict'
import type { WordRecord } from './supabase'

export const SITE_URL = 'https://skarnik.app'
export const SITE_NAME = 'Skarnik.app'

const DESCRIPTION_MAX = 160

/** What the page does for the headword, used in the <title>. */
const TITLE_ACTION: Record<DictDirection, string> = {
  belrus: 'пераклад на рускую мову',
  rusbel: 'пераклад на беларускую мову',
  tsbm: 'значэнне слова',
}

export function wordPath(dict: DictDirection, externalId: number): string {
  return `/r/${dict}/${externalId}`
}

/** A word addressed by dictionary and id, e.g. the target of an alias. */
export interface WordRef {
  dict: DictDirection
  id: number
}

// `/tsbm/20127` as stored in `redirect_to`, or a full skarnik.by / skarnik.app word link (skarnik_android's WordLink).
const WORD_LINK = /^(?:https?:\/\/(?:www\.)?(?:skarnik\.by|skarnik\.app))?\/(?:r\/)?(belrus|rusbel|tsbm)\/(\d+)\/?(?:[?#].*)?$/

/**
 * The word an alias points to, or null when the word is shown itself. `redirect_to` holds a path like
 * `/rusbel/81075`; a bare id means the same dictionary. Mirrors the redirect on the word page.
 */
export function redirectTarget(redirectTo: string | null, dict: DictDirection): WordRef | null {
  const value = redirectTo?.trim()
  if (!value) return null
  if (/^\d+$/.test(value)) {
    const id = Number(value)
    return id > 0 ? { dict, id } : null
  }
  const match = WORD_LINK.exec(value)
  if (!match) return null
  const id = Number(match[2])
  return id > 0 ? { dict: match[1] as DictDirection, id } : null
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'", '&nbsp;': ' ',
}

/** Translation HTML as one line of plain text (tags dropped, whitespace collapsed). */
export function htmlToPlainText(html: string): string {
  // Line-level tags become spaces so words on both sides don't stick together.
  const spaced = html.replace(/<\/?(?:br|p|div|li|tr|td)\b[^>]*>/gi, ' ')
  const text = sanitizeHtml(spaced, { allowedTags: [], allowedAttributes: {} })
  return text
    .replace(/&(?:amp|lt|gt|quot|#39|#x27|nbsp);/g, e => ENTITIES[e])
    .replace(/\s+/g, ' ')
    .trim()
}

/** Cuts at a word boundary and adds an ellipsis when the text is too long. */
export function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  const cut = text.slice(0, max - 1)
  const lastSpace = cut.lastIndexOf(' ')
  const head = lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut
  return `${head.replace(/[\s,;:.—–-]+$/u, '')}…`
}

export function wordTitle(text: string, dict: DictDirection): string {
  return `${text} — ${TITLE_ACTION[dict]} | ${SITE_NAME}`
}

/** Meta description: dictionary name plus the start of the translation. */
export function wordDescription(word: Pick<WordRecord, 'text' | 'translation'>, dict: DictDirection): string {
  const prefix = `${word.text} — ${DICT_LABELS[dict]}`
  const body = htmlToPlainText(word.translation)
  if (!body) return prefix
  return truncate(`${prefix}. ${body}`, DESCRIPTION_MAX)
}

/** schema.org DefinedTerm for a dictionary entry. */
export function wordJsonLd(word: Pick<WordRecord, 'text' | 'translation'>, dict: DictDirection, externalId: number) {
  return {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    name: word.text,
    description: truncate(htmlToPlainText(word.translation), 500),
    inLanguage: dict === 'rusbel' ? 'ru' : 'be',
    url: `${SITE_URL}${wordPath(dict, externalId)}`,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      name: DICT_LABELS[dict],
      url: SITE_URL,
    },
  }
}

export function siteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    alternateName: ['Скарнік', 'Skarnik'],
    url: `${SITE_URL}/`,
    inLanguage: 'be',
  }
}

/** JSON for a <script type="application/ld+json">, safe against `</script>` in the data. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
