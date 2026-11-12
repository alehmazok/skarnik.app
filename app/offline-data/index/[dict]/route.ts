import { NextResponse } from 'next/server'
import { DICT_DIRECTIONS, isValidDict } from '@/lib/dict'
import { INDEX_CONTENT_TYPE, indexPath, type IndexManifest } from '@/lib/offline/index-format'
import { getIndexFiles } from '@/lib/search/server-index'

export const dynamic = 'force-dynamic'

const HEADERS = { 'X-Robots-Tag': 'noindex', 'Cache-Control': 'public, max-age=3600' }

/**
 * `GET /offline-data/index/manifest`: word count and hash of each dictionary's file, for update checks.
 * `GET /offline-data/index/<dict>`: the dictionary's headwords (see lib/offline/index-format.ts), gzipped.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ dict: string }> }) {
  const { dict } = await params
  if (dict !== 'manifest' && !isValidDict(dict)) return new Response('not found', { status: 404 })
  let files
  try {
    files = await getIndexFiles()
  } catch (error) {
    console.error('offline index unavailable', error)
    return new Response('unavailable', { status: 503 })
  }

  if (dict === 'manifest') {
    const manifest: IndexManifest = {
      dicts: DICT_DIRECTIONS.map(d => {
        const file = files.get(d)!
        return { dict: d, words: file.words, hash: file.hash, path: indexPath(d) }
      }),
    }
    return NextResponse.json(manifest, { headers: { ...HEADERS, 'Cache-Control': 'no-cache' } })
  }

  const file = files.get(dict)!
  return new Response(new Uint8Array(file.gzip), {
    headers: {
      ...HEADERS,
      'Content-Type': INDEX_CONTENT_TYPE,
      'Content-Encoding': 'gzip',
      'Content-Length': String(file.gzip.length),
      'X-Content-Hash': file.hash,
    },
  })
}
