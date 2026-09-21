import { NextResponse } from 'next/server'
import { getVersion } from '@/lib/version'

export const dynamic = 'force-dynamic'

export function GET() {
  return NextResponse.json(getVersion(), {
    headers: { 'Cache-Control': 'no-store' },
  })
}
