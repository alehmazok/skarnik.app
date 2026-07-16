'use client'

import { useEffect, useState } from 'react'
import posthog from 'posthog-js'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (posthog.get_explicit_consent_status() === 'pending') {
      setVisible(true)
    }
  }, [])

  function accept() {
    posthog.opt_in_capturing()
    posthog.capture('cookie_consent_given', { choice: 'accepted' })
    setVisible(false)
  }

  function reject() {
    posthog.opt_out_capturing()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 100,
        display: 'flex', justifyContent: 'center',
        padding: 'clamp(12px,3vw,24px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 18,
          background: 'var(--panel)', color: 'var(--ink)',
          border: '1px solid var(--line)', borderRadius: 14,
          padding: '18px 22px', maxWidth: 560, width: '100%',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          animation: 'skarnikCookieSlideUp .25s ease',
        }}>
          <p style={{ margin: 0, flex: '1 1 260px', fontSize: 14, lineHeight: 1.55, color: 'var(--soft)' }}>
            Мы выкарыстоўваем аналітычныя cookies (PostHog), каб разумець, як
            наведвальнікі карыстаюцца сайтам. Дадзеныя збіраюцца толькі з вашай згоды.
          </p>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            <button
              onClick={reject}
              style={{
                height: 36, padding: '0 16px',
                border: '1px solid var(--line)', borderRadius: 100,
                background: 'transparent', color: 'var(--soft)',
                fontSize: 13.5, cursor: 'pointer',
                transition: 'color .2s, border-color .2s',
              }}
            >
              Адхіліць
            </button>
            <button
              onClick={accept}
              style={{
                height: 36, padding: '0 16px',
                border: '1px solid var(--accent)', borderRadius: 100,
                background: 'var(--accent)', color: '#fff',
                fontSize: 13.5, fontWeight: 600, cursor: 'pointer',
                transition: 'opacity .2s',
              }}
            >
              Прыняць
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes skarnikCookieSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  )
}
