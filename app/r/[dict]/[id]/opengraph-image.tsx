import { ImageResponse } from 'next/og'
import { getWord } from '@/lib/words'
import { isValidDict, DICT_LABELS } from '@/lib/dict'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const revalidate = 86400

interface PageProps {
  params: Promise<{ dict: string; id: string }>
}

async function getFont(): Promise<ArrayBuffer | null> {
  try {
    const css = await fetch(
      'https://fonts.googleapis.com/css2?family=Inter:wght@700&subset=cyrillic',
      { headers: { 'User-Agent': 'curl/7.88.1' } }
    ).then(r => r.text())
    const url = css.match(/src:\s*url\(([^)]+)\)/)?.[1]
    if (!url) return null
    return fetch(url).then(r => r.arrayBuffer())
  } catch {
    return null
  }
}

export default async function OGImage({ params }: PageProps) {
  const { dict, id } = await params
  if (!isValidDict(dict)) return new Response(null, { status: 404 })
  const externalId = Number(id)
  if (!Number.isInteger(externalId) || externalId <= 0) return new Response(null, { status: 404 })
  const word = await getWord(dict, externalId)
  if (!word) return new Response(null, { status: 404 })

  const label = DICT_LABELS[dict]
  const font = await getFont()
  const wordLen = word.text.length
  const fontSize = wordLen > 20 ? 72 : wordLen > 12 ? 88 : 108

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#1c1c1e',
          padding: '60px 80px',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: 6,
            background: '#c0392b',
            display: 'flex',
          }}
        />

        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 22,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#9a9a9a',
            marginBottom: 40,
            display: 'flex',
          }}
        >
          {label}
        </div>

        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            fontSize,
            lineHeight: 1,
            letterSpacing: '-0.03em',
            color: '#f5f0eb',
            textAlign: 'center',
            maxWidth: '100%',
            display: 'flex',
          }}
        >
          {word.text}
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 80,
            fontFamily: 'Inter, sans-serif',
            fontSize: 20,
            color: '#5a5a5e',
            letterSpacing: '0.04em',
            display: 'flex',
          }}
        >
          skarnik.app
        </div>
      </div>
    ),
    {
      ...size,
      fonts: font
        ? [{ name: 'Inter', data: font, weight: 700 as const, style: 'normal' as const }]
        : [],
    }
  )
}
