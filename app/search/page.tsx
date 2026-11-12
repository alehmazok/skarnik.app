import type { Metadata } from 'next'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Пошук — Skarnik.app',
  // Placeholder until the search app ships (#22); kept out of the index until then.
  robots: { index: false, follow: true },
  alternates: { canonical: '/search' },
}

/** Start page of the installed app. The search itself arrives in the next phase (#22). */
export default function SearchPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font-grotesk), Helvetica, Arial, sans-serif',
    }}>
      <Header />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 14, textAlign: 'center', padding: '32px clamp(20px,6vw,64px)',
      }}>
        <h1 style={{ margin: 0, fontSize: 'clamp(1.6rem,5vw,2.6rem)', letterSpacing: '-.02em' }}>Пошук</h1>
        <p style={{ margin: 0, maxWidth: '40ch', fontSize: 16, lineHeight: 1.6, color: 'var(--soft)' }}>
          Пошук па слоўніках з&apos;явіцца тут у наступным абнаўленні.
        </p>
      </main>
    </div>
  )
}
