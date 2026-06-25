import { describe, it, expect, vi, beforeEach } from 'vitest'

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

import { getWord } from '../words'

beforeEach(() => vi.clearAllMocks())

describe('getWord', () => {
  it('queries main_word by external_id and direction', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    await getWord('belrus', 27890)
    expect(mockFrom).toHaveBeenCalledWith('main_word')
    expect(mockEqId).toHaveBeenCalledWith('external_id', 27890)
    expect(mockEqDir).toHaveBeenCalledWith('direction', 'belrus')
  })

  it('returns null when Supabase returns error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: 'not found' } })
    const result = await getWord('rusbel', 999)
    expect(result).toBeNull()
  })

  it('returns word record on success', async () => {
    const row = { id: 1, external_id: 27890, direction: 'belrus', text: 'добразычлівасць', translation: '<p>test</p>', stress: null, letter: 'Д', redirect_to: null }
    mockSingle.mockResolvedValue({ data: row, error: null })
    const result = await getWord('belrus', 27890)
    expect(result).toEqual(row)
  })
})
