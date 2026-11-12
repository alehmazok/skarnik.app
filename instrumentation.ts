/**
 * Server start: load the search index, then build the offline dictionaries, in the background, so neither the
 * first search nor the first download waits. One after the other to keep the load on Supabase low.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs' || !process.env.SUPABASE_URL) return
  const { getSearchEngine } = await import('@/lib/search/server-index')
  const { warmOfflineDictionaries } = await import('@/lib/offline/server-dictionaries')
  getSearchEngine()
    .catch(error => console.error('search index warm-up failed', error))
    .finally(warmOfflineDictionaries)
}
