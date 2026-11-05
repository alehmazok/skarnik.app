import Header from '@/components/Header'
import Footer from '@/components/Footer'
import type { PolicyBlock, PrivacyPolicy as Policy, Rich } from '@/lib/privacy'
import styles from './PrivacyPolicy.module.css'

function RichText({ value }: { value: Rich }) {
  if (typeof value === 'string') return <>{value}</>
  return (
    <>
      {value.map((part, i) =>
        typeof part === 'string'
          ? <span key={i}>{part}</span>
          : part.href.startsWith('mailto:')
            ? <a key={i} href={part.href}>{part.text}</a>
            : <a key={i} href={part.href} target="_blank" rel="noopener noreferrer">{part.text}</a>,
      )}
    </>
  )
}

function Block({ block }: { block: PolicyBlock }) {
  if ('p' in block) return <p><RichText value={block.p} /></p>
  return (
    <ul>
      {block.ul.map((item, i) => <li key={i}><RichText value={item} /></li>)}
    </ul>
  )
}

export default function PrivacyPolicy({ policy }: { policy: Policy }) {
  return (
    <div className={styles.page} lang={policy.lang}>
      <Header />
      <main className={styles.main}>
        <div className={styles.meta}>
          <span>
            {policy.updatedLabel}: <time dateTime={policy.updated}>{policy.updatedText}</time>
          </span>
          <a href={policy.otherLanguage.href} hrefLang={policy.lang === 'be' ? 'en' : 'be'}>
            {policy.otherLanguage.text}
          </a>
        </div>
        <h1 className={styles.title}>{policy.title}</h1>
        {policy.sections.map(section => (
          <section key={section.id} id={section.id} className={styles.section}>
            <h2>{section.heading}</h2>
            {section.blocks.map((block, i) => <Block key={i} block={block} />)}
          </section>
        ))}
      </main>
      <Footer />
    </div>
  )
}
