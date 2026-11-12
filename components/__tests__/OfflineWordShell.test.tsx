import 'fake-indexeddb/auto'
import { IDBFactory } from 'fake-indexeddb'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import OfflineWordShell from '../OfflineWordShell'
import { openOfflineDb, replaceShard } from '@/lib/offline/index-db'

beforeEach(async () => {
  globalThis.indexedDB = new IDBFactory()
  const db = await openOfflineDb()
  await replaceShard(db, 'tsbm', 2, [{ id: 20_127, text: 'двух', stress: 'дву́х', html: '<i>значэнне</i>', redirectTo: null }],
    () => ({ dict: 'tsbm', shards: { 2: 'h' }, words: 1, total: 1, bytes: 1, checkedAt: 0 }))
  db.close()
})

function at(path: string) {
  window.history.replaceState(null, '', path)
  return render(<OfflineWordShell><h1>Няма злучэння</h1></OfflineWordShell>)
}

describe('OfflineWordShell', () => {
  it('shows a word from a downloaded dictionary', async () => {
    at('/r/tsbm/20127')
    expect((await screen.findByText('значэнне')).tagName).toBe('I')
    expect(screen.queryByText('Няма злучэння')).toBeNull()
    expect(document.title).toBe('двух — Skarnik.app')
  })

  it('says there is no connection when the dictionary is not downloaded', async () => {
    at('/r/belrus/1')
    expect(await screen.findByText('Няма злучэння')).toBeTruthy()
  })

  it('says there is no connection on other pages', async () => {
    at('/privacy')
    expect(await screen.findByText('Няма злучэння')).toBeTruthy()
  })
})
