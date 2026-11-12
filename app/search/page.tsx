import type { Metadata } from 'next'
import Header from '@/components/Header'
import SearchApp from '@/components/SearchApp'
import styles from '@/components/SearchApp.module.css'

const description =
  'Пошук па беларуска-рускім, руска-беларускім і тлумачальным слоўніках беларускай мовы з націскамі.'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q } = await searchParams
  return {
    title: 'Пошук у слоўніку — Skarnik.app',
    description,
    alternates: { canonical: '/search' },
    // Result pages would compete with the word pages, so only the bare search page is indexed.
    robots: q ? { index: false, follow: true } : undefined,
    openGraph: { title: 'Пошук у слоўніку — Skarnik.app', description, url: '/search' },
  }
}

/** The search app, and the start page of the installed app. */
export default function SearchPage() {
  return (
    <div className={styles.page}>
      <Header />
      <h1 className={styles.visuallyHidden}>Пошук у слоўніку</h1>
      <SearchApp />
    </div>
  )
}
