'use client'

import { promptInstall } from '@/lib/install-prompt'
import { PWA_START_URL } from '@/lib/pwa'
import { useInstallUi } from './useInstallUi'

/**
 * The web app next to the store badges, for Windows, Linux and Mac. Desktop Chromium opens the
 * install dialog; Safari on macOS opens the app page, where File → Add to Dock installs it.
 */
export default function DesktopAppButton() {
  const ui = useInstallUi()

  if (ui === 'none') return null

  function onClick() {
    if (ui === 'button') void promptInstall('footer')
    else window.location.assign(PWA_START_URL.replace('source=pwa', 'source=footer'))
  }

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        height: 40, padding: '0 14px',
        border: '1px solid #a6a6a6', borderRadius: 10,
        background: '#000', cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icons/icon-192.png" alt="" width={20} height={20} aria-hidden={true} style={{ borderRadius: 4 }} />
      <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.05 }}>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
        }}>Для Windows, Linux і Mac</span>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>Усталяваць</span>
      </span>
    </button>
  )
}
