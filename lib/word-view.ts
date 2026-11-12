import type { DictDirection } from './dict'
import { redirectTarget } from './seo'
import { sanitizeTranslation } from './translation'
import type { WordRecord } from './supabase'

/** What the search app needs to show a word: sanitized HTML, ready to inject. */
export interface WordView {
  dict: DictDirection
  id: number
  text: string
  stress: string | null
  html: string
  /** Id of the word this alias points to, or null. */
  redirectTo: number | null
}

export function toWordView(dict: DictDirection, externalId: number, word: WordRecord): WordView {
  return {
    dict,
    id: externalId,
    text: word.text,
    stress: word.stress,
    html: sanitizeTranslation(word.translation),
    redirectTo: redirectTarget(word.redirect_to),
  }
}
