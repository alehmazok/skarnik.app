/**
 * Wire format of the offline search index: one dictionary per file, one word per line, `<external_id>\t<text>`,
 * sorted by id. About 4–6 MB raw and 0.7–1 MB gzip per dictionary (#20). Shared by the server route and the app.
 */
import type { DictDirection } from '@/lib/dict'
import type { IndexWord } from '@/lib/search/engine'

export const INDEX_CONTENT_TYPE = 'text/tab-separated-values; charset=utf-8'

export function encodeIndex(words: ReadonlyArray<{ id: number; text: string }>): string {
  return [...words]
    .sort((a, b) => a.id - b.id)
    .map(w => `${w.id}\t${w.text.replace(/[\t\r\n]+/g, ' ')}\n`)
    .join('')
}

export function decodeIndex(dict: DictDirection, body: string): IndexWord[] {
  const words: IndexWord[] = []
  let start = 0
  while (start < body.length) {
    let end = body.indexOf('\n', start)
    if (end === -1) end = body.length
    const tab = body.indexOf('\t', start)
    if (tab > start && tab < end) {
      const id = Number(body.slice(start, tab))
      if (Number.isInteger(id) && id > 0) words.push({ dict, id, text: body.slice(tab + 1, end) })
    }
    start = end + 1
  }
  return words
}

/** FNV-1a (32-bit) of the body, as 8 hex digits: identifies a version of a file, not a security hash. */
export function contentHash(body: string): string {
  let hash = 0x811c9dc5
  for (let i = 0; i < body.length; i++) {
    hash ^= body.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

/** `/offline-data/index/manifest` lists each dictionary's file with its word count and hash. */
export interface IndexManifest {
  dicts: Array<{ dict: DictDirection; words: number; hash: string; path: string }>
}

export function indexPath(dict: DictDirection): string {
  return `/offline-data/index/${dict}`
}
