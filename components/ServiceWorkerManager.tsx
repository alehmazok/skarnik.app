'use client'

import { useEffect, useRef, useState } from 'react'
import { Serwist } from '@serwist/window'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

/**
 * Registers /sw.js after the page has loaded (production only) and shows «Ёсць новая версія» when a
 * new worker is waiting. The new worker takes over only when the person presses «Абнавіць».
 */
export default function ServiceWorkerManager() {
  const [waiting, setWaiting] = useState(false)
  const serwistRef = useRef<Serwist | null>(null)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return

    const serwist = new Serwist('/sw.js', { scope: '/', type: 'classic' })
    serwistRef.current = serwist
    serwist.addEventListener('waiting', () => setWaiting(true))

    let lastCheck = Date.now()
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || Date.now() - lastCheck < UPDATE_CHECK_INTERVAL_MS) return
      lastCheck = Date.now()
      void serwist.update()
    }

    const register = () => void serwist.register()
    if (document.readyState === 'complete') register()
    else window.addEventListener('load', register, { once: true })
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.removeEventListener('load', register)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  function update() {
    const serwist = serwistRef.current
    if (!serwist) return
    serwist.addEventListener('controlling', () => window.location.reload())
    serwist.messageSkipWaiting()
  }

  if (!waiting) return null

  return <UpdateToast onUpdate={update} />
}

export function UpdateToast({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div
      role="status"
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 90,
        display: 'flex', justifyContent: 'center', pointerEvents: 'none',
        padding: 'clamp(12px,3vw,24px)',
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, pointerEvents: 'auto',
        background: 'var(--panel)', color: 'var(--ink)',
        border: '1px solid var(--line)', borderRadius: 14,
        padding: '12px 14px 12px 20px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      }}>
        <span style={{ fontSize: 14 }}>Ёсць новая версія</span>
        <button
          type="button"
          onClick={onUpdate}
          style={{
            height: 34, padding: '0 16px',
            border: '1px solid var(--accent)', borderRadius: 100,
            background: 'var(--accent)', color: 'var(--bg)',
            fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Абнавіць
        </button>
      </div>
    </div>
  )
}
