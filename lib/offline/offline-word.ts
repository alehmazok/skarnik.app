/**
 * A word from the offline dictionaries, in the shape the search app and the offline word page show. An alias
 * shows the word it points to (one hop, like the word page's redirect).
 */
import type { DictDirection } from '@/lib/dict'
import type { WordView } from '@/lib/word-view'
import { openOfflineDb, readWord } from './index-db'

export async function readOfflineWord(dict: DictDirection, id: number, factory?: IDBFactory): Promise<WordView | null> {
  if (!factory && typeof indexedDB === 'undefined') return null
  let db: IDBDatabase
  try {
    db = await openOfflineDb(factory)
  } catch {
    return null
  }
  try {
    let word = await readWord(db, dict, id)
    if (word?.redirectTo) word = await readWord(db, word.redirectTo.dict, word.redirectTo.id)
    if (!word) return null
    return { dict: word.dict, id: word.id, text: word.text, stress: word.stress, html: word.html, redirectTo: null }
  } catch {
    return null
  } finally {
    db.close()
  }
}
