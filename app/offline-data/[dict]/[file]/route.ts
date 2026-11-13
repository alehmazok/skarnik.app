import { isValidDict } from '@/lib/dict'
import { SHARD_CONTENT_TYPE, parseShardFile } from '@/lib/offline/dictionary-format'
import { getShard } from '@/lib/offline/server-dictionaries'

export const dynamic = 'force-dynamic'

/** `GET /offline-data/<dict>/<n>.ndjson`: one shard of an offline dictionary, gzipped (#24). */
export async function GET(_request: Request, { params }: { params: Promise<{ dict: string; file: string }> }) {
  const { dict, file } = await params
  const n = parseShardFile(file)
  if (!isValidDict(dict) || n === null) return new Response('not found', { status: 404 })
  let shard
  try {
    shard = await getShard(dict, n)
  } catch (error) {
    console.error('offline dictionaries unavailable', error)
    return new Response('unavailable', { status: 503 })
  }
  if (!shard) return new Response('not found', { status: 404 })
  return new Response(new Uint8Array(shard.gzip), {
    headers: {
      'Content-Type': SHARD_CONTENT_TYPE,
      'Content-Encoding': 'gzip',
      'Content-Length': String(shard.gzip.length),
      // The app checks the hash against the manifest it read, so a shard rebuilt in between is caught.
      'X-Content-Hash': shard.info.hash,
      'Cache-Control': 'no-cache',
      'X-Robots-Tag': 'noindex',
    },
  })
}
