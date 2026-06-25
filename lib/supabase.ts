import { createClient } from '@supabase/supabase-js'

export type WordRecord = {
  id: number
  external_id: number
  direction: string
  text: string
  translation: string
  stress: string | null
  letter: string
  redirect_to: string | null
}

export function createServerClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY ?? process.env.SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY')
  return createClient<{ public: { Tables: { main_word: { Row: WordRecord } } } }>(url, key)
}
