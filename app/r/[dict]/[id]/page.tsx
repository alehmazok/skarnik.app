import { notFound, permanentRedirect } from 'next/navigation'
import type { Metadata } from 'next'
import { isValidDict } from '@/lib/dict'
import { redirectTarget, wordDescription, wordJsonLd, wordPath, wordTitle, SITE_NAME } from '@/lib/seo'
import { sanitizeTranslation } from '@/lib/translation'
import { getWord } from '@/lib/words'
import { headingFontSize, headwordLang } from '@/lib/heading'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Headword from '@/components/Headword'
import WordViewTracker from '@/components/WordViewTracker'
import JsonLd from '@/components/JsonLd'

export const revalidate = 86400

// No paths at build time (the build has no Supabase access): each word is
// rendered on its first visit and then served from the ISR cache for a day.
// Without this, a dynamic segment is rendered on every request.
export function generateStaticParams() {
  return []
}

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
  const target = redirectTarget(word.redirect_to)
  const canonical = wordPath(dict, target ?? externalId)
  const description = wordDescription(word, dict)
  // og:title keeps the stress mark: it shows in link previews when a word is shared.
  const ogTitle = `${word.stress ?? word.text} — ${SITE_NAME}`
  return {
    title: wordTitle(word.text, dict),
    description,
    alternates: { canonical },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
    },
  }
}

export default async function WordPage({ params }: PageProps) {
  const { dict, id } = await params

  if (!isValidDict(dict)) notFound()

  const externalId = Number(id)
  if (!Number.isInteger(externalId) || externalId <= 0) notFound()

  const word = await getWord(dict, externalId)
  if (!word) notFound()

  // Aliases and non-canonical ids (`/r/belrus/027890`) move permanently to
  // one URL per word, so search engines index it once.
  const target = redirectTarget(word.redirect_to)
  if (target) permanentRedirect(wordPath(dict, target))
  if (id !== String(externalId)) permanentRedirect(wordPath(dict, externalId))

  const safeHtml = sanitizeTranslation(word.translation)

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

        <Headword
          text={word.text}
          stress={word.stress}
          lang={headwordLang(dict)}
          fontSize={headingFontSize(word.text)}
        />

        <div
          className="translation-html"
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
      <WordViewTracker dict={dict} wordId={externalId} />
      <JsonLd data={wordJsonLd(word, dict, externalId)} />
    </div>
  )
}

function dictLabel(dict: string): string {
  if (dict === 'belrus') return 'пераклад на рускую мову'
  if (dict === 'rusbel') return 'пераклад на беларускую мову'
  return 'тлумачальны слоўнік'
}
