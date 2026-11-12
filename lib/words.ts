import { createServerClient, type WordRecord } from './supabase'
import type { DictDirection } from './dict'

export type { WordRecord }

/** skarnik_admin, the source the apps fall back to when Supabase fails (public config, not a secret). */
export const DEFAULT_ADMIN_API_URL = 'https://skarnik.play.of.by'
const ADMIN_TIMEOUT_MS = 5000

function adminApiUrl(): string {
  return (process.env.ADMIN_API_URL || DEFAULT_ADMIN_API_URL).replace(/\/+$/, '')
}

async function getWordFromSupabase(dict: DictDirection, externalId: number): Promise<WordRecord | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from('main_word')
      .select('*')
      .eq('external_id', externalId)
      .eq('direction', dict)
      .single()
    if (error || !data) return null
    return data
  } catch {
    return null
  }
}

/** `GET <admin>/api/words/<dict>/<id>/` (WordSerializer: the same fields as `main_word`). */
export async function getWordFromAdmin(dict: DictDirection, externalId: number): Promise<WordRecord | null> {
  try {
    const response = await fetch(`${adminApiUrl()}/api/words/${dict}/${externalId}/`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(ADMIN_TIMEOUT_MS),
      // Same freshness as the word pages that call it.
      next: { revalidate: 86400 },
    })
    if (!response.ok) return null
    const row = (await response.json()) as Partial<WordRecord>
    if (typeof row.text !== 'string' || typeof row.translation !== 'string') return null
    return {
      id: row.id ?? 0,
      external_id: externalId,
      direction: dict,
      text: row.text,
      translation: row.translation,
      stress: row.stress ?? null,
      letter: row.letter ?? '',
      redirect_to: row.redirect_to ?? null,
    }
  } catch {
    return null
  }
}

/**
 * A word by dictionary and id: Supabase first, then skarnik_admin when Supabase errors or has no row. The
 * same order every Skarnik client uses after its offline data.
 */
export async function getWord(dict: DictDirection, externalId: number): Promise<WordRecord | null> {
  return (await getWordFromSupabase(dict, externalId)) ?? (await getWordFromAdmin(dict, externalId))
}
