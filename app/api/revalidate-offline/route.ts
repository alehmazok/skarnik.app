import { timingSafeEqual } from 'node:crypto'
import { DICT_DIRECTIONS, isValidDict, type DictDirection } from '@/lib/dict'
import { rebuildShards } from '@/lib/offline/server-dictionaries'

export const dynamic = 'force-dynamic'

const MAX_IDS = 10_000

function authorized(request: Request, secret: string): boolean {
  const given = Buffer.from(request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '')
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}

/**
 * `POST /api/revalidate-offline` with `Authorization: Bearer $OFFLINE_REVALIDATE_SECRET` and
 * `{"dict": "belrus", "ids": [27890]}`: rebuilds the offline shards holding those words, so installed apps
 * pick the change up on their next daily check. Leave out `ids` to rebuild the dictionary, `dict` for all
 * three. Answers once the rebuild is done. Off (404) while the secret is not set. Called by skarnik_admin.
 */
export async function POST(request: Request) {
  const secret = process.env.OFFLINE_REVALIDATE_SECRET
  if (!secret) return new Response('not found', { status: 404 })
  if (!authorized(request, secret)) return new Response('unauthorized', { status: 401 })

  let body: { dict?: unknown; ids?: unknown }
  try {
    body = (await request.json()) as typeof body
  } catch {
    return new Response('bad json', { status: 400 })
  }
  const dicts: DictDirection[] =
    body.dict === undefined ? [...DICT_DIRECTIONS] : typeof body.dict === 'string' && isValidDict(body.dict) ? [body.dict] : []
  if (dicts.length === 0) return new Response('bad dict', { status: 400 })
  const ids = body.ids ?? []
  if (!Array.isArray(ids) || ids.length > MAX_IDS || !ids.every(id => Number.isInteger(id) && id > 0)) {
    return new Response('bad ids', { status: 400 })
  }
  if (ids.length > 0 && dicts.length !== 1) return new Response('ids need a dict', { status: 400 })

  try {
    const rebuilt: Record<string, number[]> = {}
    for (const dict of dicts) rebuilt[dict] = await rebuildShards(dict, ids as number[])
    return Response.json({ rebuilt })
  } catch (error) {
    console.error('offline revalidate failed', error)
    return new Response('rebuild failed', { status: 502 })
  }
}
