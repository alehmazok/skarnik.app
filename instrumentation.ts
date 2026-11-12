/** Server start: load the search index in the background so the first search does not wait for it. */
export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return
  const { warmSearchIndex } = await import('@/lib/search/server-index')
  warmSearchIndex()
}
