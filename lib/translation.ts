import sanitizeHtml from 'sanitize-html'

// Legacy cross-references: absolute skarnik.by URLs or root-relative `/dict/id`.
const LEGACY_WORD_HREF = /^(?:https?:\/\/(?:www\.)?skarnik\.by)?\/(belrus|rusbel|tsbm)\/(\d+)\/?$/i

export function rewriteLegacyHref(href: string): string {
  const match = LEGACY_WORD_HREF.exec(href.trim())
  if (!match) return href
  return `/r/${match[1].toLowerCase()}/${match[2]}`
}

export function sanitizeTranslation(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ['span', 'strong', 'em', 'i', 'b', 'br', 'font', 'a'],
    allowedAttributes: {
      'font': ['color', 'size'],
      'a': ['href'],
      '*': ['class'],
    },
    transformTags: {
      a: (tagName, attribs) => ({
        tagName,
        attribs: attribs.href ? { ...attribs, href: rewriteLegacyHref(attribs.href) } : attribs,
      }),
    },
  })
}
