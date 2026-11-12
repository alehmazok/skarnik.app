/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig, SerwistPlugin } from 'serwist'
import { CacheFirst, CacheableResponsePlugin, ExpirationPlugin, NetworkFirst, Serwist } from 'serwist'
import { OFFLINE_PATH, PAGES_CACHE, PAGES_CACHE_MAX_ENTRIES, PAGE_NETWORK_TIMEOUT_SECONDS, isCacheablePage } from '@/lib/sw-routes'

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined
  }
}

declare const self: ServiceWorkerGlobalScope

/**
 * Keeps only plain 200 responses. A redirected response (an alias word answered with 308, or a
 * non-canonical id) must never be stored: replaying it for a navigation fails in the browser, and the
 * server has to keep deciding where aliases go.
 */
const onlyPlainOk: SerwistPlugin = {
  cacheWillUpdate: async ({ response }) => (response.status === 200 && !response.redirected ? response : null),
}

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  // The shell pages are precached under their bare path; `/search?source=pwa` and
  // `/search?dict=tsbm` read their parameters on the client.
  precacheOptions: { ignoreURLParametersMatching: [/.*/] },
  // A new worker waits until the page asks it to take over (the update toast), so a running
  // session never switches assets midway.
  skipWaiting: false,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      // Word pages, the landing page and the privacy policy: fresh from the server when online
      // (ISR stays in charge), the last copy when the network is slow or gone.
      matcher: ({ request, url, sameOrigin }) => sameOrigin && request.mode === 'navigate' && isCacheablePage(url.pathname),
      handler: new NetworkFirst({
        cacheName: PAGES_CACHE,
        networkTimeoutSeconds: PAGE_NETWORK_TIMEOUT_SECONDS,
        plugins: [
          onlyPlainOk,
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: PAGES_CACHE_MAX_ENTRIES }),
        ],
      }),
    },
    {
      // Build assets missing from the precache list (none expected) and public icons/badges.
      matcher: ({ url, sameOrigin }) =>
        sameOrigin && (url.pathname.startsWith('/_next/static/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/badges/')),
      handler: new CacheFirst({
        cacheName: 'static-assets',
        plugins: [new CacheableResponsePlugin({ statuses: [200] }), new ExpirationPlugin({ maxEntries: 200 })],
      }),
    },
    // Everything else (/api/, /ingest/, opengraph images, sitemaps, RSC fetches) has no route and
    // goes straight to the network without being cached.
  ],
  fallbacks: {
    entries: [
      {
        url: OFFLINE_PATH,
        matcher: ({ request }) => request.destination === 'document',
      },
    ],
  },
})

serwist.addEventListeners()
