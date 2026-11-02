import { NextResponse } from 'next/server'
import { getAssetLinks } from '@/lib/assetlinks'

// Built once at build time. Android fetches this file without following redirects,
// so it must answer 200 with application/json on every host that serves the site.
export const dynamic = 'force-static'

export function GET() {
  return NextResponse.json(getAssetLinks(), {
    headers: { 'Cache-Control': 'public, max-age=3600' },
  })
}
