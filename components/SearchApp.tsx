'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import posthog from 'posthog-js'
import { DICT_DIRECTIONS, isValidDict, type DictDirection } from '@/lib/dict'
import { headwordLang } from '@/lib/heading'
import { wordPath } from '@/lib/seo'
import type { SearchHit, SearchResult } from '@/lib/search/engine'
import type { WordView } from '@/lib/word-view'
import { isStandalone } from '@/lib/install-prompt'
import { openOfflineDb } from '@/lib/offline/index-db'
import { markSynced, syncDue, syncOfflineIndex } from '@/lib/offline/index-sync'
import { getOfflineSearch, type OfflineSearch } from '@/lib/offline/offline-search'
import Headword from './Headword'
import styles from './SearchApp.module.css'

export const DICT_SHORT: Record<DictDirection, string> = {
  belrus: 'Бел-Рус',
  rusbel: 'Рус-Бел',
  tsbm: 'Тлумачальны',
}

const PANE_LABEL: Record<DictDirection, string> = {
  belrus: 'пераклад на рускую мову',
  rusbel: 'пераклад на беларускую мову',
  tsbm: 'тлумачальны слоўнік',
}

const WIDE_QUERY = '(min-width: 840px)'
const DEBOUNCE_MS = 150
const WORD_PATH = /^\/r\/(belrus|rusbel|tsbm)\/(\d+)\/?$/

type Selected = { dict: DictDirection; id: number }

/** `/search?q=…&dict=…` for the current query, so a reload or a shared link keeps it. */
export function searchUrl(q: string, dict: DictDirection | null): string {
  const params = new URLSearchParams()
  if (q) params.set('q', q)
  if (dict) params.set('dict', dict)
  const query = params.toString()
  return query ? `/search?${query}` : '/search'
}

function parseWordPath(pathname: string): Selected | null {
  const match = WORD_PATH.exec(pathname)
  return match ? { dict: match[1] as DictDirection, id: Number(match[2]) } : null
}

export default function SearchApp() {
  const [query, setQuery] = useState('')
  const [dict, setDict] = useState<DictDirection | null>(null)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [error, setError] = useState(false)
  const [selected, setSelected] = useState<Selected | null>(null)
  const [offline, setOffline] = useState<OfflineSearch | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // The installed app keeps the search index on the device and searches it locally, online or not.
  useEffect(() => {
    let cancelled = false
    const search = getOfflineSearch()
    if (!search) return
    const use = (ready: boolean) => {
      if (!cancelled && ready) setOffline(search)
    }
    search.load().then(use, () => {})
    if (isStandalone() && syncDue() && navigator.onLine !== false) {
      ;(async () => {
        try {
          void navigator.storage?.persist?.()
          const db = await openOfflineDb()
          const { updated } = await syncOfflineIndex(db)
          db.close()
          markSynced()
          if (updated.length > 0) use(await search.load())
        } catch (error) {
          console.warn('offline index sync failed', error)
        }
      })()
    }
    return () => {
      cancelled = true
    }
  }, [])

  // Start from the URL: `/search?q=дом&dict=tsbm`, or a dictionary shortcut of the installed app.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const d = params.get('dict')
    setQuery(params.get('q') ?? '')
    if (d && isValidDict(d)) setDict(d)
    inputRef.current?.focus()
  }, [])

  // Search as the person types.
  useEffect(() => {
    const q = query.trim()
    if (!q) {
      setResult(null)
      setError(false)
      return
    }
    if (offline) {
      let stale = false
      offline.search(q, dict).then(
        r => {
          if (!stale) {
            setResult(r)
            setError(false)
          }
        },
        () => !stale && setError(true),
      )
      return () => {
        stale = true
      }
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({ q })
      if (dict) params.set('dict', dict)
      try {
        const response = await fetch(`/api/search?${params}`, { signal: controller.signal })
        if (!response.ok) throw new Error(String(response.status))
        setResult((await response.json()) as SearchResult)
        setError(false)
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setError(true)
      }
    }, DEBOUNCE_MS)
    return () => {
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [query, dict, offline])

  // Keep the query in the address bar while the search screen is showing.
  useEffect(() => {
    if (window.location.pathname !== '/search') return
    window.history.replaceState(window.history.state, '', searchUrl(query.trim(), dict))
  }, [query, dict])

  // Back and forward between a word and the search screen.
  useEffect(() => {
    const onPop = () => setSelected(parseWordPath(window.location.pathname))
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const open = useCallback((word: Selected, event?: React.MouseEvent) => {
    // Narrow windows open the word page itself; wide ones show it beside the list.
    if (!window.matchMedia(WIDE_QUERY).matches) return
    event?.preventDefault()
    setSelected(word)
    const path = wordPath(word.dict, word.id)
    if (window.location.pathname !== path) window.history.pushState(window.history.state, '', path)
  }, [])

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const first = result?.words[0]
    if (event.key !== 'Enter' || !first) return
    if (window.matchMedia(WIDE_QUERY).matches) open(first)
    else window.location.assign(wordPath(first.dict, first.id))
  }

  return (
    <div className={styles.app}>
      <div className={styles.controls}>
        <input
          ref={inputRef}
          className={styles.input}
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          lang="be"
          aria-label="Пошук слова"
          placeholder="Пошук слова"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <div className={styles.chips} role="group" aria-label="Слоўнік">
          <button type="button" className={styles.chip} aria-pressed={dict === null} onClick={() => setDict(null)}>
            Усе
          </button>
          {DICT_DIRECTIONS.map(d => (
            <button key={d} type="button" className={styles.chip} aria-pressed={dict === d} onClick={() => setDict(d)}>
              {DICT_SHORT[d]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.body}>
        <Results query={query.trim()} result={result} error={error} selected={selected} onOpen={open} />
        <div className={styles.pane}>
          {selected && <WordPane key={`${selected.dict}/${selected.id}`} word={selected} onOpen={open} />}
        </div>
      </div>
    </div>
  )
}

function Results({ query, result, error, selected, onOpen }: {
  query: string
  result: SearchResult | null
  error: boolean
  selected: Selected | null
  onOpen: (word: Selected, event?: React.MouseEvent) => void
}) {
  if (!query) return <p className={styles.status}>Увядзіце слова па-беларуску або па-руску.</p>
  if (error) return <p className={styles.status} role="alert">Пошук зараз недаступны. Паспрабуйце пазней.</p>
  if (!result) return <ul className={styles.results} aria-busy="true" />
  if (result.words.length === 0) return <p className={styles.status}>Нічога не знойдзена.</p>
  return (
    <ul className={styles.results} aria-label="Вынікі пошуку">
      {result.words.map((w: SearchHit) => (
        <li key={`${w.dict}/${w.id}`}>
          <a
            className={styles.result}
            href={wordPath(w.dict, w.id)}
            aria-current={selected?.dict === w.dict && selected.id === w.id ? 'true' : undefined}
            onClick={e => onOpen({ dict: w.dict, id: w.id }, e)}
          >
            <span className={styles.resultText} lang={w.dict === 'rusbel' ? 'ru' : 'be'}>{w.text}</span>
            <span className={styles.resultDict}>{DICT_SHORT[w.dict]}</span>
          </a>
        </li>
      ))}
    </ul>
  )
}

function WordPane({ word, onOpen }: { word: Selected; onOpen: (word: Selected, event?: React.MouseEvent) => void }) {
  const [view, setView] = useState<WordView | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        let current = word
        // An alias shows the word it points to (one hop, like the word page's redirect).
        for (let hop = 0; hop < 2; hop++) {
          const response = await fetch(`/api/word/${current.dict}/${current.id}`, { signal: controller.signal })
          if (!response.ok) throw new Error(String(response.status))
          const data = (await response.json()) as WordView
          if (data.redirectTo && hop === 0) {
            current = { dict: current.dict, id: data.redirectTo }
            continue
          }
          setView(data)
          posthog.capture('word_viewed', { dict: data.dict, word_id: data.id, source: 'search' })
          return
        }
      } catch (e) {
        if ((e as Error).name !== 'AbortError') setFailed(true)
      }
    })()
    return () => controller.abort()
  }, [word])

  // Cross-references inside a translation open in the pane too.
  function onClick(event: React.MouseEvent<HTMLDivElement>) {
    const anchor = (event.target as HTMLElement).closest('a')
    const target = anchor ? parseWordPath(new URL(anchor.href, window.location.href).pathname) : null
    if (target) onOpen(target, event)
  }

  if (failed) return <p className={styles.status} role="alert">Не ўдалося загрузіць слова.</p>
  if (!view) return null
  return (
    <article>
      <div className={styles.paneLabel}>{PANE_LABEL[view.dict]}</div>
      <Headword text={view.text} stress={view.stress} lang={headwordLang(view.dict)} fontSize="clamp(2rem,4vw,3.6rem)" />
      <div
        className={`translation-html ${styles.translation}`}
        onClick={onClick}
        dangerouslySetInnerHTML={{ __html: view.html }}
      />
    </article>
  )
}
