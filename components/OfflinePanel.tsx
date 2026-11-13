'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import posthog from 'posthog-js'
import { DICT_DIRECTIONS, DICT_LABELS, type DictDirection } from '@/lib/dict'
import type { DictionaryInfo } from '@/lib/offline/dictionary-format'
import { deleteDictionary, downloadDictionary, fetchDictionaryManifest, isComplete } from '@/lib/offline/dictionary-sync'
import { openOfflineDb, readDictionaries, type StoredDictionary } from '@/lib/offline/index-db'
import { OFFLINE_INDEX_UPDATED, markSynced, syncOfflineIndex } from '@/lib/offline/index-sync'
import { formatCount, wordsNoun } from '@/lib/plural'
import ThemeToggle from './ThemeToggle'
import styles from './OfflinePanel.module.css'

/** Flutter's `Dictionary` enum names, which the apps' `offline_dictionary_download_click` reports group by. */
const ANALYTICS_NAME: Record<DictDirection, string> = { belrus: 'belRus', rusbel: 'rusBel', tsbm: 'tsbm' }

// Same texts as the apps (skarnik_android res/values/strings.xml).
const TEXT = {
  section: 'Афлайн доступ',
  download: 'Спампаваць для афлайн доступу',
  resume: 'Працягнуць спампоўку',
  downloading: 'Спампоўваецца…',
  downloadError: 'Адбылася памылка падчас спампоўкі слоўніка.',
  delete: 'Выдаліць афлайн-копію',
  deleteConfirm: (name: string) => `Вы сапраўды жадаеце выдаліць афлайн-копію слоўніка «${name}»?`,
  deleted: 'Афлайн-копія слоўніка выдалена.',
  deleteError: 'Не атрымалася выдаліць афлайн-копію.',
  cancel: 'Скасаваць',
  offline: 'Падключыцеся да інтэрнэту, каб спампаваць слоўнік.',
  unavailable: 'Слоўнікі зараз недаступныя. Паспрабуем яшчэ раз праз некалькі секунд.',
  appearance: 'Выгляд',
  theme: 'Тэма',
}

export function progressText(words: number, total: number): string {
  return `${formatCount(words)} / ${formatCount(total)} ${wordsNoun(total)}`
}

export function downloadedText(words: number): string {
  return `Спампавана: ${formatCount(words)} ${wordsNoun(words)}`
}

export function sizeText(bytes: number): string {
  // Decimal comma, the Belarusian way (browsers disagree on `be` number formatting).
  return `${(bytes / 1_000_000).toFixed(1).replace('.', ',')} МБ`
}

export const MANIFEST_RETRY_MS = 15_000

interface RowState {
  progress: { words: number; total: number } | null
  busy: 'download' | 'delete' | null
  confirmDelete: boolean
  message: { text: string; error: boolean } | null
}

const IDLE: RowState = { progress: null, busy: null, confirmDelete: false, message: null }

/** The body of «Афлайн доступ»: download, update and delete the offline dictionaries; also the theme. */
export default function OfflinePanel() {
  const [manifest, setManifest] = useState<Map<DictDirection, DictionaryInfo> | null>(null)
  const [manifestFailed, setManifestFailed] = useState(false)
  const [stored, setStored] = useState<Map<DictDirection, StoredDictionary>>(new Map())
  const [rows, setRows] = useState<Record<DictDirection, RowState>>({ belrus: IDLE, rusbel: IDLE, tsbm: IDLE })
  const mounted = useRef(true)

  const setRow = useCallback((dict: DictDirection, patch: Partial<RowState>) => {
    if (mounted.current) setRows(r => ({ ...r, [dict]: { ...r[dict], ...patch } }))
  }, [])

  const reload = useCallback(async () => {
    const db = await openOfflineDb()
    try {
      const list = await readDictionaries(db)
      if (mounted.current) setStored(new Map(list.map(d => [d.dict, d])))
    } finally {
      db.close()
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    reload().catch(() => {})
    // The server answers 503 for about a minute after a deploy while it builds the dictionaries, and the
    // network may be down: keep asking while the panel is open.
    let retry: number | undefined
    const load = () =>
      fetchDictionaryManifest().then(
        m => mounted.current && setManifest(new Map(m.dicts.map(d => [d.dict, d]))),
        () => {
          if (!mounted.current) return
          setManifestFailed(true)
          retry = window.setTimeout(load, MANIFEST_RETRY_MS)
        },
      )
    load()
    return () => {
      mounted.current = false
      window.clearTimeout(retry)
    }
  }, [reload])

  async function download(dict: DictDirection) {
    const info = manifest?.get(dict)
    if (!info) return
    posthog.capture('offline_dictionary_download_click', { dict_name: ANALYTICS_NAME[dict], dict_path: dict })
    setRow(dict, { busy: 'download', message: null, confirmDelete: false, progress: { words: 0, total: info.words } })
    // Ask the browser not to clear the dictionaries under storage pressure.
    void navigator.storage?.persist?.().catch(() => false)
    let db: IDBDatabase | null = null
    try {
      db = await openOfflineDb()
      await downloadDictionary(db, info, { onProgress: p => setRow(dict, { progress: { words: p.words, total: p.total } }) })
      setRow(dict, { busy: null, progress: null })
      // Offline words need offline search too: fetch the search index (2.5 MB) if it is missing or old.
      const indexDb = db
      syncOfflineIndex(indexDb).then(
        ({ updated }) => {
          markSynced()
          if (updated.length > 0) window.dispatchEvent(new Event(OFFLINE_INDEX_UPDATED))
        },
        error => console.warn('offline index sync failed', error),
      ).finally(() => indexDb.close())
      db = null
    } catch (error) {
      console.warn('offline dictionary download failed', error)
      setRow(dict, { busy: null, progress: null, message: { text: TEXT.downloadError, error: true } })
    } finally {
      db?.close()
      await reload().catch(() => {})
    }
  }

  async function remove(dict: DictDirection) {
    setRow(dict, { busy: 'delete', confirmDelete: false, message: null })
    let db: IDBDatabase | null = null
    try {
      db = await openOfflineDb()
      await deleteDictionary(db, dict)
      setRow(dict, { busy: null, message: { text: TEXT.deleted, error: false } })
    } catch {
      setRow(dict, { busy: null, message: { text: TEXT.deleteError, error: true } })
    } finally {
      db?.close()
      await reload().catch(() => {})
    }
  }

  return (
    <div>
      <ul className={styles.list}>
        {DICT_DIRECTIONS.map(dict => {
          const info = manifest?.get(dict)
          const state = stored.get(dict)
          const row = rows[dict]
          const name = DICT_LABELS[dict]
          const complete = isComplete(state) && (!info || state!.total === info.words)
          const partial = !!state && !complete
          const bytes = info?.bytes ?? state?.bytes
          return (
            <li key={dict} className={styles.row} data-dict={dict}>
              <div style={{ flex: '1 1 220px', minWidth: 0 }}>
                <div className={styles.name}>{name}</div>
                <div className={styles.meta}>
                  {row.busy === 'download' && row.progress
                    ? `${TEXT.downloading} ${progressText(row.progress.words, row.progress.total)}`
                    : complete
                      ? downloadedText(state!.words)
                      : partial
                        ? progressText(state!.words, info?.words ?? state!.total)
                        : bytes ? sizeText(bytes) : ' '}
                </div>
                {row.busy === 'download' && row.progress && (
                  <progress className={styles.progress} max={row.progress.total || 1} value={row.progress.words} />
                )}
                {row.confirmDelete && <div className={styles.meta}>{TEXT.deleteConfirm(name)}</div>}
                {row.message && (
                  <div className={row.message.error ? styles.error : styles.meta} role={row.message.error ? 'alert' : 'status'}>
                    {row.message.text}
                  </div>
                )}
              </div>
              <div className={styles.actions}>
                {row.confirmDelete ? (
                  <>
                    <button type="button" className={`${styles.button} ${styles.primary}`} onClick={() => remove(dict)}>
                      {TEXT.delete}
                    </button>
                    <button type="button" className={styles.button} onClick={() => setRow(dict, { confirmDelete: false })}>
                      {TEXT.cancel}
                    </button>
                  </>
                ) : (
                  <>
                    {!complete && (
                      <button
                        type="button"
                        className={`${styles.button} ${styles.primary}`}
                        disabled={!info || row.busy !== null}
                        onClick={() => download(dict)}
                      >
                        {row.busy === 'download' ? TEXT.downloading : partial ? TEXT.resume : TEXT.download}
                      </button>
                    )}
                    {state && row.busy === null && (
                      <button type="button" className={styles.button} onClick={() => setRow(dict, { confirmDelete: true, message: null })}>
                        {TEXT.delete}
                      </button>
                    )}
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
      {manifestFailed && !manifest && (
        <p className={styles.meta}>{typeof navigator !== 'undefined' && navigator.onLine === false ? TEXT.offline : TEXT.unavailable}</p>
      )}

      <h3 className={styles.section}>{TEXT.appearance}</h3>
      <div className={styles.row}>
        <span>{TEXT.theme}</span>
        <ThemeToggle />
      </div>
    </div>
  )
}

/** The «Афлайн доступ» button of the search app and the dialog it opens. */
export function OfflineAccess() {
  const dialog = useRef<HTMLDialogElement>(null)
  // Stays mounted once opened, so a download keeps showing its progress after the dialog is closed and reopened.
  const [opened, setOpened] = useState(false)
  const [available, setAvailable] = useState(false)

  useEffect(() => setAvailable(typeof indexedDB !== 'undefined'), [])
  if (!available) return null

  return (
    <>
      <button
        type="button"
        className={styles.open}
        aria-haspopup="dialog"
        onClick={() => {
          setOpened(true)
          dialog.current?.showModal?.()
        }}
      >
        {TEXT.section}
      </button>
      <dialog ref={dialog} className={styles.dialog} aria-labelledby="offline-access-title">
        <div className={styles.head}>
          <h2 id="offline-access-title" className={styles.title}>{TEXT.section}</h2>
          <button type="button" className={styles.button} onClick={() => dialog.current?.close()}>
            Закрыць
          </button>
        </div>
        {opened && <OfflinePanel />}
      </dialog>
    </>
  )
}
