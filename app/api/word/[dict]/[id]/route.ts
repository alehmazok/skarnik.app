import { NextResponse } from 'next/server'
import { isValidDict } from '@/lib/dict'
import { getWord } from '@/lib/words'
import { toWordView } from '@/lib/word-view'

export const dynamic = 'force-dynamic'

/** `GET /api/word/<dict>/<id>`: one word for the search app, Supabase first, then the admin API. */
export async function GET(_request: Request, { params }: { params: Promise<{ dict: string; id: string }> }) {
  const { dict, id } = await params
  const externalId = Number(id)
  if (!isValidDict(dict) || !Number.isInteger(externalId) || externalId <= 0) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }
  const word = await getWord(dict, externalId)
  if (!word) return NextResponse.json({ error: 'not found' }, { status: 404 })
  return NextResponse.json(toWordView(dict, externalId, word), {
    headers: { 'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400' },
  })
}
