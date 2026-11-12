'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { isValidDict } from '@/lib/dict'
import { WORD_LABEL, headingFontSize, headwordLang } from '@/lib/heading'
import { readOfflineWord } from '@/lib/offline/offline-word'
import type { WordView } from '@/lib/word-view'
import Headword from './Headword'

const WORD_PATH = /^\/r\/(belrus|rusbel|tsbm)\/(\d+)\/?$/

/**
 * The service worker shows /~offline for a page that is neither online nor saved. On a word address
 * (`/r/<dict>/<id>`) this shows the word from a downloaded dictionary instead; otherwise, or when the
 * dictionary is not downloaded, `children` («Няма злучэння»).
 */
export default function OfflineWordShell({ children }: { children: ReactNode }) {
  const [state, setState] = useState<'checking' | 'missing' | WordView>('checking')

  useEffect(() => {
    const match = WORD_PATH.exec(window.location.pathname)
    if (!match || !isValidDict(match[1])) {
      setState('missing')
      return
    }
    let cancelled = false
    readOfflineWord(match[1], Number(match[2])).then(
      word => {
        if (cancelled) return
        setState(word ?? 'missing')
        if (word) document.title = `${word.text} — Skarnik.app`
      },
      () => !cancelled && setState('missing'),
    )
    return () => {
      cancelled = true
    }
  }, [])

  if (state === 'checking') return null
  if (state === 'missing') return <>{children}</>
  return (
    <main style={{
      flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      textAlign: 'center', padding: '32px clamp(20px,6vw,64px)',
    }}>
      <div style={{
        marginBottom: 'clamp(20px,4vh,38px)', fontFamily: 'var(--font-mono), monospace', fontSize: 12,
        letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--faint)',
      }}>
        {WORD_LABEL[state.dict]}
      </div>
      <Headword text={state.text} stress={state.stress} lang={headwordLang(state.dict)} fontSize={headingFontSize(state.text)} />
      <div
        className="translation-html"
        style={{
          margin: 'clamp(26px,5vh,44px) auto 0', maxWidth: '46ch', textAlign: 'left', width: '100%',
          fontSize: 'clamp(1rem,1.9vw,1.22rem)', lineHeight: 1.45, color: 'var(--soft)',
        }}
        dangerouslySetInnerHTML={{ __html: state.html }}
      />
    </main>
  )
}
