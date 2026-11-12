/**
 * Routing rules of the service worker (app/sw.ts), kept here so they can be unit-tested.
 */

export const OFFLINE_PATH = '/~offline'
export const PAGES_CACHE = 'pages'
export const PAGES_CACHE_MAX_ENTRIES = 200
export const PAGE_NETWORK_TIMEOUT_SECONDS = 3

/** Shell pages precached with every build, so the installed app opens without a network. */
export const SHELL_PATHS = ['/search', OFFLINE_PATH] as const

/** Paths that are never stored by the worker: live data, analytics, the update check and generated images. */
const NEVER_CACHED_PREFIXES = ['/api/', '/ingest/', '/offline-data/', '/sitemaps/', '/_next/', '/.well-known/']
const NEVER_CACHED_EXACT = new Set(['/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/sw.js'])

/** Whether a page navigation may be kept in the runtime `pages` cache. */
export function isCacheablePage(pathname: string): boolean {
  if (NEVER_CACHED_EXACT.has(pathname)) return false
  if (NEVER_CACHED_PREFIXES.some(prefix => pathname.startsWith(prefix))) return false
  if (pathname.includes('opengraph-image') || pathname.includes('twitter-image')) return false
  return true
}
