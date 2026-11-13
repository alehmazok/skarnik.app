import type { NextConfig } from 'next'
import { randomUUID } from 'node:crypto'
import withSerwistInit from '@serwist/next'
import { SHELL_PATHS } from './lib/sw-routes'

// Revision of the precached shell pages: the commit in CI, a fresh id for local builds.
const revision = process.env.GIT_SHA && process.env.GIT_SHA !== 'unknown' ? process.env.GIT_SHA : randomUUID()

const withSerwist = withSerwistInit({
  // SW_KILL_SWITCH=1 ships a worker that unregisters itself and clears its caches.
  swSrc: process.env.SW_KILL_SWITCH === '1' ? 'app/sw-kill-switch.ts' : 'app/sw.ts',
  swDest: 'public/sw.js',
  // Registered by components/ServiceWorkerManager.tsx after load, with the update toast.
  register: false,
  reloadOnOnline: false,
  disable: process.env.NODE_ENV !== 'production',
  additionalPrecacheEntries: SHELL_PATHS.map(url => ({ url, revision })),
  // Icons and badges only; the manifest screenshots are for install dialogs, not the app.
  globPublicPatterns: ['icons/**/*', 'badges/**/*'],
})

const nextConfig: NextConfig = {
  output: 'standalone',
  // OG images read the bundled font from disk (lib/og-font.ts); make sure standalone ships it.
  outputFileTracingIncludes: {
    '/r/[dict]/[id]/opengraph-image': ['./assets/fonts/Inter-Bold.ttf'],
  },
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/array/:path*',
        destination: 'https://eu-assets.i.posthog.com/array/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
    ]
  },
  async headers() {
    return [
      {
        // Browsers must always revalidate the worker, or an update could wait for the HTTP cache.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Content-Type', value: 'application/javascript; charset=utf-8' },
        ],
      },
    ]
  },
  skipTrailingSlashRedirect: true,
}

export default withSerwist(nextConfig)
