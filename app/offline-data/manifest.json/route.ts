import { NextResponse } from 'next/server'
import { getDictionaryManifest } from '@/lib/offline/server-dictionaries'

export const dynamic = 'force-dynamic'

/** `GET /offline-data/manifest.json`: every offline dictionary shard with its size and hash (#24). */
export async function GET() {
  try {
    return NextResponse.json(await getDictionaryManifest(), {
      headers: { 'Cache-Control': 'no-cache', 'X-Robots-Tag': 'noindex' },
    })
  } catch (error) {
    console.error('offline dictionaries unavailable', error)
    return new Response('unavailable', { status: 503 })
  }
}
