import React from 'react'
import { notFound } from 'next/navigation'
import { splitStressedText } from '@/lib/stress'
import type { Metadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import { isValidDict } from '@/lib/dict'
import { getWord } from '@/lib/words'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export const revalidate = 86400

interface PageProps {
  params: Promise<{ dict: string; id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dict, id } = await params
  if (!isValidDict(dict)) return {}
  const externalId = Number(id)
  if (!Number.isInteger(externalId) || externalId <= 0) return {}
  const word = await getWord(dict, externalId)
  if (!word) return {}
  return {
    title: `${word.stress ?? word.text} — Skarnik.app`,
    description: `Значэнне слова "${word.text}" у беларускім слоўніку`,
  }
}

export default async function WordPage({ params }: PageProps) {
  const { dict, id } = await params

  if (!isValidDict(dict)) notFound()

  const externalId = Number(id)
  if (!Number.isInteger(externalId) || externalId <= 0) notFound()

  const word = await getWord(dict, externalId)
  if (!word) notFound()

  if (word.redirect_to) {
    const redirectId = Number(word.redirect_to)
    if (Number.isInteger(redirectId) && redirectId > 0) {
      const { redirect } = await import('next/navigation')
      redirect(`/r/${dict}/${redirectId}`)
    }
  }

  const safeHtml = DOMPurify.sanitize(word.translation, {
    ALLOWED_TAGS: ['span', 'strong', 'em', 'i', 'b', 'br', 'font', 'a'],
    ALLOWED_ATTR: ['color', 'size', 'class', 'href'],
  })

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font-grotesk), Helvetica, Arial, sans-serif',
      transition: 'background .4s ease, color .4s ease',
    }}>
      <Header />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '32px clamp(20px,6vw,64px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 'clamp(20px,4vh,38px)',
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase',
          color: 'var(--faint)',
        }}>
          <span>{dictLabel(dict)}</span>
        </div>

        <h1 style={{
          margin: 0, fontWeight: 700,
          fontSize: headingFontSize(word.text),
          lineHeight: .98, letterSpacing: '-.035em',
          color: 'var(--ink)', maxWidth: '100%', overflowWrap: 'break-word',
        }}>
          {word.stress ? renderStressedWord(word.stress) : word.text}
        </h1>

        <div
          style={{
            margin: 'clamp(26px,5vh,44px) auto 0',
            maxWidth: '46ch', textAlign: 'left', width: '100%',
            fontSize: 'clamp(1rem,1.9vw,1.22rem)',
            lineHeight: 1.45, color: 'var(--soft)',
          }}
          dangerouslySetInnerHTML={{ __html: safeHtml }}
        />
      </main>

      <Footer />
    </div>
  )
}

function renderStressedWord(text: string): React.ReactNode {
  const segments = splitStressedText(text)
  return (
    <>
      {segments.map((seg, i) => (
        <React.Fragment key={i}>
          {i > 0 && ' | '}
          {typeof seg === 'string' ? seg : (
            <>
              {seg.before}
              <span style={{ color: 'var(--accent)' }}>{seg.stressed}</span>
              {seg.after}
            </>
          )}
        </React.Fragment>
      ))}
    </>
  )
}

function headingFontSize(text: string): string {
  const len = text.length
  if (len > 40) return 'clamp(1.9rem,9.5vw,2.8rem)'
  if (len > 20) return 'clamp(1.9rem,9.5vw,4.5rem)'
  return 'clamp(1.9rem,9.5vw,7rem)'
}

function dictLabel(dict: string): string {
  if (dict === 'belrus') return 'пераклад на рускую мову'
  if (dict === 'rusbel') return 'пераклад на беларускую мову'
  return 'тлумачальны слоўнік'
}
