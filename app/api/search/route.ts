import { NextResponse, type NextRequest } from 'next/server'
import { isValidDict } from '@/lib/dict'
import { getSearchEngine } from '@/lib/search/server-index'

export const dynamic = 'force-dynamic'

const MAX_QUERY_LENGTH = 100

/** `GET /api/search?q=…&dict=…`: the apps' search over all three dictionaries, or one when `dict` is set. */
export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').slice(0, MAX_QUERY_LENGTH)
  const dictParam = request.nextUrl.searchParams.get('dict')
  if (dictParam && !isValidDict(dictParam)) {
    return NextResponse.json({ error: 'unknown dict' }, { status: 400 })
  }
  try {
    const engine = await getSearchEngine()
    const result = engine.search(q, dictParam && isValidDict(dictParam) ? dictParam : undefined)
    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=3600' },
    })
  } catch (error) {
    console.error('search failed', error)
    return NextResponse.json({ error: 'search unavailable' }, { status: 503 })
  }
}
