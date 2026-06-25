import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LandingPage() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', color: 'var(--ink)',
      fontFamily: 'var(--font-grotesk), Helvetica, Arial, sans-serif',
      transition: 'background .4s ease, color .4s ease',
    }}>
      <Header />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '32px clamp(20px,6vw,64px)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          marginBottom: 'clamp(20px,4vh,38px)',
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 12, letterSpacing: '.16em', textTransform: 'uppercase',
          color: 'var(--faint)',
        }}>
          <span>пераклад на рускую мову</span>
        </div>

        <h1 style={{
          margin: 0, fontWeight: 700,
          fontSize: 'clamp(1.9rem,9.5vw,7rem)',
          lineHeight: .98, letterSpacing: '-.035em',
          color: 'var(--ink)', maxWidth: '100%', overflowWrap: 'break-word',
        }}>
          добразычл<span style={{ color: 'var(--accent)' }}>і́</span>васць
        </h1>

        <div style={{
          margin: 'clamp(26px,5vh,44px) auto 0',
          maxWidth: '46ch', textAlign: 'left',
          display: 'flex', flexDirection: 'column', gap: 11, width: '100%',
        }}>
          <Definition
            ru="благожелательность"
            be={[
              { word: 'добразычлівасць', gram: '-ці жен.' },
              { word: 'зычлівасць', gram: '-ці жен.' },
            ]}
          />
          <Definition
            ru="благосклонность"
            be={[{ word: 'добразычлівасць', gram: '-ці жен.' }]}
          />
          <Definition
            ru="доброжелательность"
            be={[{ word: 'добразычлівасць', gram: '-ці жен.' }]}
          />
          <Definition
            ru="доброхотство"
            be={[{ word: 'добразычлівасць', gram: '-ці жен.' }]}
            note="ср. устарэлае слова, устарэлы выраз"
          />
        </div>
      </main>

      <Footer />
    </div>
  )
}

function Definition({ ru, be, note }: {
  ru: string
  be: { word: string; gram: string }[]
  note?: string
}) {
  return (
    <p style={{
      margin: 0,
      fontSize: 'clamp(1rem,1.9vw,1.22rem)',
      lineHeight: 1.45, color: 'var(--soft)',
    }}>
      <span style={{ color: 'var(--ink)', fontWeight: 500 }}>{ru}</span>
      <span style={{ color: 'var(--faint)', padding: '0 8px' }}>—</span>
      {note && (
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: '.8em', fontStyle: 'italic', color: 'var(--faint)',
        }}>{note} </span>
      )}
      {be.map(({ word, gram }, i) => (
        <span key={word}>
          {i > 0 && <span style={{ color: 'var(--faint)', padding: '0 4px' }}>,</span>}
          {word}
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: '.8em', color: 'var(--faint)',
          }}> {gram}</span>
        </span>
      ))}
    </p>
  )
}
