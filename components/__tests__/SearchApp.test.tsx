import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import SearchApp, { searchUrl } from '../SearchApp'

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }))

const offline = vi.hoisted(() => ({ search: null as null | { load: () => Promise<boolean>; ready: () => boolean; search: (q: string, d: string | null) => Promise<unknown> } }))
vi.mock('@/lib/offline/offline-search', () => ({ getOfflineSearch: () => offline.search }))

const fetchMock = vi.fn()
let wide = false

function json(data: unknown) {
  return Promise.resolve(new Response(JSON.stringify(data)))
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock)
  fetchMock.mockReset()
  offline.search = null
  wide = false
  window.matchMedia = vi.fn((query: string) => ({ matches: query.includes('840') ? wide : false })) as unknown as typeof window.matchMedia
  window.history.replaceState(null, '', '/search')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

const RESULT = {
  usedPrepositionFallback: false,
  words: [
    { dict: 'rusbel', id: 4, text: 'дом' },
    { dict: 'belrus', id: 5, text: 'дом' },
  ],
}

describe('SearchApp', () => {
  it('builds the address of a search', () => {
    expect(searchUrl('', null)).toBe('/search')
    expect(searchUrl('дом', 'tsbm')).toBe('/search?q=%D0%B4%D0%BE%D0%BC&dict=tsbm')
  })

  it('shows results as links to the word pages', async () => {
    fetchMock.mockImplementation(() => json(RESULT))
    render(<SearchApp />)
    fireEvent.change(screen.getByRole('searchbox', { name: 'Пошук слова' }), { target: { value: 'дом' } })
    const links = await screen.findAllByRole('link')
    expect(links.map(a => a.getAttribute('href'))).toEqual(['/r/rusbel/4', '/r/belrus/5'])
    expect(fetchMock).toHaveBeenCalledWith('/api/search?q=%D0%B4%D0%BE%D0%BC', expect.anything())
    expect(window.location.search).toBe('?q=%D0%B4%D0%BE%D0%BC')
  })

  it('filters by the chosen dictionary', async () => {
    fetchMock.mockImplementation(() => json(RESULT))
    render(<SearchApp />)
    fireEvent.click(screen.getByRole('button', { name: 'Тлумачальны' }))
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'дом' } })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/search?q=%D0%B4%D0%BE%D0%BC&dict=tsbm', expect.anything()))
  })

  it('starts from the query and dictionary in the address', async () => {
    window.history.replaceState(null, '', '/search?q=%D0%B4%D0%BE%D0%BC&dict=belrus')
    fetchMock.mockImplementation(() => json(RESULT))
    render(<SearchApp />)
    expect(screen.getByRole('searchbox')).toHaveValue('дом')
    expect(screen.getByRole('button', { name: 'Бел-Рус' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('says when nothing is found', async () => {
    fetchMock.mockImplementation(() => json({ words: [], usedPrepositionFallback: false }))
    render(<SearchApp />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'щщщ' } })
    expect(await screen.findByText('Нічога не знойдзена.')).toBeInTheDocument()
  })

  it('on a wide window shows the word beside the list and puts its URL in the address bar', async () => {
    wide = true
    fetchMock.mockImplementation((url: string) =>
      url.startsWith('/api/word/')
        ? json({ dict: 'belrus', id: 5, text: 'дом', stress: null, html: '<b>house</b>', redirectTo: null })
        : json(RESULT),
    )
    render(<SearchApp />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'дом' } })
    const links = await screen.findAllByRole('link')
    await act(async () => {
      fireEvent.click(links[1])
    })
    expect(await screen.findByText('house')).toBeInTheDocument()
    expect(window.location.pathname).toBe('/r/belrus/5')
    expect(links[1]).toHaveAttribute('aria-current', 'true')
  })

  it('follows an alias to its target word', async () => {
    wide = true
    fetchMock.mockImplementation((url: string) => {
      if (url === '/api/word/rusbel/4') return json({ dict: 'rusbel', id: 4, text: 'дом', stress: null, html: '', redirectTo: { dict: 'rusbel', id: 9 } })
      if (url === '/api/word/rusbel/9') return json({ dict: 'rusbel', id: 9, text: 'жилище', stress: null, html: '<i>target</i>', redirectTo: null })
      return json(RESULT)
    })
    render(<SearchApp />)
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'дом' } })
    const links = await screen.findAllByRole('link')
    await act(async () => {
      fireEvent.click(links[0])
    })
    expect(await screen.findByText('target')).toBeInTheDocument()
  })

  it('searches the stored offline index instead of the server once it is loaded', async () => {
    const search = vi.fn(async () => RESULT)
    offline.search = { load: async () => true, ready: () => true, search }
    render(<SearchApp />)
    await act(async () => {})
    fireEvent.change(screen.getByRole('searchbox'), { target: { value: 'дом' } })
    await waitFor(() => expect(screen.getAllByRole('link')).toHaveLength(2))
    expect(search).toHaveBeenCalledWith('дом', null)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
