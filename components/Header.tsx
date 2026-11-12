import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import InstallButton from './InstallButton'

export default function Header() {
  return (
    <header style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: 'clamp(20px,5vw,56px)', paddingTop: 26, paddingBottom: 26,
    }}>
      <Link href="/" style={{
        fontFamily: 'var(--font-grotesk), Helvetica, Arial, sans-serif',
        fontWeight: 700, fontSize: 21, letterSpacing: '-.02em',
        color: 'var(--ink)', textDecoration: 'none',
      }}>
        Skarnik.app
      </Link>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <InstallButton />
        <ThemeToggle inHeader />
      </div>
    </header>
  )
}
