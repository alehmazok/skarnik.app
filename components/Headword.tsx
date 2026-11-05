import React from 'react'
import { splitStressedText } from '@/lib/stress'
import styles from './Headword.module.css'

interface HeadwordProps {
  /** Plain headword, shown when there is no stress mark. */
  text: string
  /** Headword with a combining acute (U+0301) after the stressed vowel. */
  stress: string | null
  lang: string
  fontSize: string
}

/**
 * Word-page <h1>. On load the word settles into focus, then each stressed
 * vowel drops into its place and turns red, as if the stress lands on it.
 * Pure CSS, so it runs on the ISR HTML without JS; it is skipped for
 * prefers-reduced-motion. The text itself is never hidden, so the word stays
 * readable (and counts for LCP) from the first frame.
 */
export default function Headword({ text, stress, lang, fontSize }: HeadwordProps) {
  return (
    <h1 lang={lang} className={styles.headword} style={{ fontSize }}>
      {stress ? renderStressed(stress) : text}
    </h1>
  )
}

function renderStressed(text: string): React.ReactNode {
  let stressIndex = 0
  return splitStressedText(text).map((seg, i) => (
    <React.Fragment key={i}>
      {i > 0 && ' | '}
      {typeof seg === 'string' ? seg : (
        <>
          {seg.before}
          <span
            className={styles.stress}
            data-stress=""
            style={{ '--i': stressIndex++ } as React.CSSProperties}
          >
            {seg.stressed}
          </span>
          {seg.after}
        </>
      )}
    </React.Fragment>
  ))
}
