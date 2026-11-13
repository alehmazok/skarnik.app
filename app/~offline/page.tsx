import type { Metadata } from 'next'
import Header from '@/components/Header'
import RetryButton from '@/components/RetryButton'

export const metadata: Metadata = {
  title: 'Няма злучэння — Skarnik.app',
  robots: { index: false, follow: false },
}

/** Shown by the service worker when a page is neither online nor saved on this device. */
export default function OfflinePage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font-grotesk), Helvetica, Arial, sans-serif',
    }}>
      <Header />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 18, textAlign: 'center', padding: '32px clamp(20px,6vw,64px)',
      }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,5vw,2.6rem)', letterSpacing: '-.02em' }}>Няма злучэння</h1>
        <p style={{ margin: 0, maxWidth: '40ch', fontSize: 16, lineHeight: 1.6, color: 'var(--soft)' }}>
          Гэтая старонка не захавана на прыладзе. Падключыцеся да інтэрнэту і паспрабуйце яшчэ раз.
        </p>
        <RetryButton />
      </main>
    </div>
  )
}
