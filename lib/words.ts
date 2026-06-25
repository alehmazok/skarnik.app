import { createServerClient, type WordRecord } from './supabase'
import type { DictDirection } from './dict'

export type { WordRecord }

export async function getWord(
  dict: DictDirection,
  externalId: number,
): Promise<WordRecord | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from('main_word')
    .select('*')
    .eq('external_id', externalId)
    .eq('direction', dict)
    .single()

  if (error || !data) return null
  return data
}
