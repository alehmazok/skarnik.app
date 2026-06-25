'use client'

import { useEffect, useState } from 'react'

type Theme = 'auto' | 'light' | 'dark'

const ORDER: Theme[] = ['auto', 'light', 'dark']
const LABELS: Record<Theme, { glyph: string; label: string }> = {
  auto:  { glyph: '◐', label: 'Аўта' },
  light: { glyph: '○', label: 'Дзень' },
  dark:  { glyph: '●', label: 'Ноч' },
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('auto')

  useEffect(() => {
    try {
      const saved = localStorage.getItem('skarnik-theme') as Theme | null
      if (saved && ORDER.includes(saved)) setTheme(saved)
    } catch {}
  }, [])

  function cycle() {
    const next = ORDER[(ORDER.indexOf(theme) + 1) % ORDER.length]
    if (next === 'auto') document.documentElement.removeAttribute('data-theme')
    else document.documentElement.setAttribute('data-theme', next)
    try { localStorage.setItem('skarnik-theme', next) } catch {}
    setTheme(next)
  }

  const { glyph, label } = LABELS[theme]

  return (
    <button onClick={cycle} title="Тэма" style={{
      display: 'flex', alignItems: 'center', gap: 8,
      height: 36, padding: '0 14px',
      border: '1px solid var(--line)', borderRadius: 100,
      background: 'transparent', color: 'var(--soft)',
      fontFamily: 'var(--font-mono), monospace',
      fontSize: 12.5, letterSpacing: '.02em',
      cursor: 'pointer', transition: 'color .2s, border-color .2s',
    }}>
      <span style={{ fontSize: 13, lineHeight: 1 }}>{glyph}</span>
      <span>{label}</span>
    </button>
  )
}
