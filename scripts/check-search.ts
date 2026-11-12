/**
 * Compares /api/search on a running site with the apps' results in lib/search/__fixtures__/app-search.json.
 * Words with identical text may come in a different order (the apps' tie order is their index row order).
 *
 *   bun scripts/check-search.ts                  # http://localhost:3000
 *   bun scripts/check-search.ts https://skarnik.app
 */
import fixture from '../lib/search/__fixtures__/app-search.json'

type Hit = { dict: string; id: number; text: string }
const base = (process.argv[2] ?? 'http://localhost:3000').replace(/\/+$/, '')

let failed = 0
for (const [q, expected] of Object.entries(fixture.queries)) {
  const response = await fetch(`${base}/api/search?q=${encodeURIComponent(q)}`)
  const result = (await response.json()) as { words: Hit[]; usedPrepositionFallback: boolean }
  const got = result.words.map(w => `${w.dict}/${w.id}`)
  const sameSet = got.length === expected.ids.length && [...got].sort().join() === [...expected.ids].sort().join()
  const identical = got.join() === expected.ids.join()
  if (!sameSet || result.usedPrepositionFallback !== expected.usedPrepositionFallback) {
    failed++
    console.log(`✗ ${q}\n  got      ${got.join(' ')}\n  expected ${expected.ids.join(' ')}`)
  } else if (!identical) {
    console.log(`~ ${q}: same words, tie order differs`)
  }
}
const total = Object.keys(fixture.queries).length
console.log(`${total - failed}/${total} queries match`)
process.exit(failed ? 1 : 0)
