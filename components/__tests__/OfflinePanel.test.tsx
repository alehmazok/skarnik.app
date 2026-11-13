import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import posthog from 'posthog-js'
import OfflinePanel, { MANIFEST_RETRY_MS, downloadedText, progressText, sizeText } from '../OfflinePanel'
import { encodeShard, shardPath, type DictionaryInfo } from '@/lib/offline/dictionary-format'
import { contentHash } from '@/lib/offline/index-format'
import { openOfflineDb, readWord } from '@/lib/offline/index-db'

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }))

const body = encodeShard([
  { id: 1, text: 'дом', stress: null, html: 'house', redirectTo: null },
  { id: 2, text: 'дуб', stress: null, html: 'oak', redirectTo: null },
])
const info = (dict: 'belrus' | 'rusbel' | 'tsbm'): DictionaryInfo => ({
  dict, words: 2, bytes: 4_100_000, shards: [{ n: 0, words: 2, bytes: 4_100_000, hash: contentHash(body), path: shardPath(dict, 0) }],
})
const fetchMock = vi.fn(async (url: string) =>
  url === '/offline-data/manifest.json'
    ? new Response(JSON.stringify({ dicts: [info('belrus'), info('rusbel'), info('tsbm')] }))
    : new Response(body),
)

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockClear()
  vi.mocked(posthog.capture).mockClear()
})
afterEach(() => vi.unstubAllGlobals())

const row = (dict: string) => document.querySelector(`[data-dict="${dict}"]`) as HTMLElement

describe('OfflinePanel', () => {
  it('formats sizes and counts like the apps', () => {
    expect(progressText(1234, 112457)).toBe('1234 / 112457 слоў')
    expect(downloadedText(96641)).toBe('Спампавана: 96641 слова')
    expect(sizeText(4_100_000)).toBe('4,1 МБ')
  })

  it('downloads a dictionary, then offers to delete it', async () => {
    render(<OfflinePanel />)
    const belrus = await waitFor(() => within(row('belrus')).getByRole('button', { name: 'Спампаваць для афлайн доступу' }))
    expect(within(row('belrus')).getByText('4,1 МБ')).toBeTruthy()
    fireEvent.click(belrus)
    await waitFor(() => expect(within(row('belrus')).getByText('Спампавана: 2 словы')).toBeTruthy())
    expect(posthog.capture).toHaveBeenCalledWith('offline_dictionary_download_click', { dict_name: 'belRus', dict_path: 'belrus' })
    const db = await openOfflineDb()
    expect((await readWord(db, 'belrus', 2))?.html).toBe('oak')
    db.close()

    fireEvent.click(within(row('belrus')).getByRole('button', { name: 'Выдаліць афлайн-копію' }))
    expect(within(row('belrus')).getByText('Вы сапраўды жадаеце выдаліць афлайн-копію слоўніка «Беларуска-рускі слоўнік»?')).toBeTruthy()
    fireEvent.click(within(row('belrus')).getByRole('button', { name: 'Выдаліць афлайн-копію' }))
    await waitFor(() => expect(within(row('belrus')).getByText('Афлайн-копія слоўніка выдалена.')).toBeTruthy())
    expect(within(row('belrus')).getByRole('button', { name: 'Спампаваць для афлайн доступу' })).toBeTruthy()
  })

  it('shows an error and keeps the button when the download fails', async () => {
    fetchMock.mockImplementation(async (url: string) =>
      url === '/offline-data/manifest.json'
        ? new Response(JSON.stringify({ dicts: [info('belrus'), info('rusbel'), info('tsbm')] }))
        : new Response('', { status: 503 }),
    )
    render(<OfflinePanel />)
    fireEvent.click(await waitFor(() => within(row('tsbm')).getByRole('button', { name: 'Спампаваць для афлайн доступу' })))
    await waitFor(() => expect(within(row('tsbm')).getByRole('alert').textContent).toBe('Адбылася памылка падчас спампоўкі слоўніка.'))
  })

  it('says to connect when the manifest cannot be loaded', async () => {
    fetchMock.mockImplementation(async () => {
      throw new TypeError('offline')
    })
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    try {
      render(<OfflinePanel />)
      expect(await screen.findByText('Падключыцеся да інтэрнэту, каб спампаваць слоўнік.')).toBeTruthy()
      expect((within(row('belrus')).getByRole('button', { name: 'Спампаваць для афлайн доступу' }) as HTMLButtonElement).disabled).toBe(true)
    } finally {
      onLine.mockRestore()
    }
  })

  it('keeps asking for the manifest while the server is still building the dictionaries', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      let building = true
      fetchMock.mockImplementation(async (url: string) =>
        url === '/offline-data/manifest.json' && building
          ? new Response('building', { status: 503 })
          : new Response(JSON.stringify({ dicts: [info('belrus'), info('rusbel'), info('tsbm')] })),
      )
      render(<OfflinePanel />)
      expect(await screen.findByText('Слоўнікі зараз недаступныя. Паспрабуем яшчэ раз праз некалькі секунд.')).toBeTruthy()
      building = false
      await vi.advanceTimersByTimeAsync(MANIFEST_RETRY_MS)
      await waitFor(() => expect(within(row('belrus')).getByText('4,1 МБ')).toBeTruthy())
      expect((within(row('belrus')).getByRole('button', { name: 'Спампаваць для афлайн доступу' }) as HTMLButtonElement).disabled).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })
})
