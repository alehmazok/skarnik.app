import { NextResponse } from 'next/server'
import { dictionariesReady, getDictionaryManifest } from '@/lib/offline/server-dictionaries'

export const dynamic = 'force-dynamic'

/** Seconds the app waits before asking again while the server builds the dictionaries (about a minute). */
const BUILDING_RETRY_AFTER = 20

/**
 * `GET /offline-data/manifest.json`: every offline dictionary shard with its size and hash (#24). Right after
 * a deploy the dictionaries are still being built: answer 503 with Retry-After at once instead of holding the
 * request for a minute or more (Cloudflare gives up at 100 s).
 */
export async function GET() {
  if (!dictionariesReady()) {
    return new Response('building', {
      status: 503,
      headers: { 'Retry-After': String(BUILDING_RETRY_AFTER), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    })
  }
  try {
    return NextResponse.json(await getDictionaryManifest(), {
      headers: { 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex' },
    })
  } catch (error) {
    console.error('offline dictionaries unavailable', error)
    return new Response('unavailable', { status: 503 })
  }
}
