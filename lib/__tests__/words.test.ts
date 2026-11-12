import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock createServerClient so tests don't need a real Supabase connection.
// This is intentionally shallow — it validates query construction only.
// Integration tests against the real DB should cover actual data shape.
const mockSingle = vi.fn()
const mockEqDir = vi.fn(() => ({ single: mockSingle }))
const mockEqId = vi.fn(() => ({ eq: mockEqDir }))
const mockSelect = vi.fn(() => ({ eq: mockEqId }))
const mockFrom = vi.fn(() => ({ select: mockSelect }))

vi.mock('../supabase', () => ({
  createServerClient: () => ({ from: mockFrom }),
}))

import { getWord, DEFAULT_ADMIN_API_URL } from '../words'

const row = { id: 1, external_id: 27890, direction: 'belrus', text: 'добразычлівасць', translation: '<p>test</p>', stress: null, letter: 'Д', redirect_to: null }
const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('getWord', () => {
  it('queries main_word by external_id and direction', async () => {
    mockSingle.mockResolvedValue({ data: row, error: null })
    await getWord('belrus', 27890)
    expect(mockFrom).toHaveBeenCalledWith('main_word')
    expect(mockEqId).toHaveBeenCalledWith('external_id', 27890)
    expect(mockEqDir).toHaveBeenCalledWith('direction', 'belrus')
  })

  it('returns the Supabase row without calling the admin API', async () => {
    mockSingle.mockResolvedValue({ data: row, error: null })
    expect(await getWord('belrus', 27890)).toEqual(row)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('falls back to the admin API when Supabase errors', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'timeout' } })
    fetchMock.mockResolvedValue(new Response(JSON.stringify({ ...row, id: 77, stress: 'добразычлі́васць' })))
    const result = await getWord('belrus', 27890)
    expect(fetchMock).toHaveBeenCalledWith(`${DEFAULT_ADMIN_API_URL}/api/words/belrus/27890/`, expect.anything())
    expect(result).toMatchObject({ external_id: 27890, direction: 'belrus', text: 'добразычлівасць', stress: 'добразычлі́васць' })
  })

  it('falls back to the admin API when the Supabase client throws', async () => {
    mockSingle.mockRejectedValue(new Error('network'))
    fetchMock.mockResolvedValue(new Response(JSON.stringify(row)))
    expect(await getWord('rusbel', 5)).toMatchObject({ text: row.text, direction: 'rusbel', external_id: 5 })
  })

  it('returns null when neither source has the word', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    fetchMock.mockResolvedValue(new Response('{"detail":"Not found"}', { status: 404 }))
    expect(await getWord('rusbel', 999)).toBeNull()
  })

  it('returns null when the admin API is unreachable', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'))
    expect(await getWord('tsbm', 1)).toBeNull()
  })
})
