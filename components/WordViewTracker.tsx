'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

interface Props {
  dict: string
  wordId: number
}

export default function WordViewTracker({ dict, wordId }: Props) {
  useEffect(() => {
    posthog.capture('word_viewed', { dict, word_id: wordId })
  }, [dict, wordId])

  return null
}
