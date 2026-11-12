'use client'

import { useState } from 'react'
import { promptInstall } from '@/lib/install-prompt'
import { useInstallUi } from './useInstallUi'

/** «Усталяваць» in the header: desktop Chromium gets the install dialog, Safari on macOS a short hint. */
export default function InstallButton() {
  const ui = useInstallUi()
  const [hintOpen, setHintOpen] = useState(false)

  if (ui === 'none') return null

  function onClick() {
    if (ui === 'button') void promptInstall('header')
    else setHintOpen(open => !open)
  }

  return (
    <span style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={onClick}
        aria-expanded={ui === 'safari-hint' ? hintOpen : undefined}
        style={{
          height: 36, padding: '0 14px',
          border: '1px solid var(--accent)', borderRadius: 100,
          background: 'transparent', color: 'var(--accent)',
          fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Усталяваць
      </button>
      {ui === 'safari-hint' && hintOpen && (
        <span
          role="status"
          style={{
            position: 'absolute', top: 44, right: 0, zIndex: 20, whiteSpace: 'nowrap',
            background: 'var(--panel)', color: 'var(--ink)',
            border: '1px solid var(--line)', borderRadius: 10,
            padding: '10px 14px', fontSize: 13.5,
          }}
        >
          Файл → Дадаць у Dock
        </span>
      )}
    </span>
  )
}
