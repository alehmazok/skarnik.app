/// <reference lib="webworker" />
/**
 * Kill switch: a worker that removes itself and every cache it left behind.
 *
 * Built instead of app/sw.ts when the build runs with SW_KILL_SWITCH=1 (set the repository variable
 * SW_KILL_SWITCH to 1 and redeploy). Browsers fetch /sw.js on the next visit, install this one, and
 * every open tab reloads straight from the network. Unset the variable to bring the normal worker back.
 */
export {}

declare const self: ServiceWorkerGlobalScope & { __SW_MANIFEST: unknown }

// Referenced so the build plugin finds its injection point; the list itself is ignored.
void self.__SW_MANIFEST

self.addEventListener('install', () => {
  void self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.map(key => caches.delete(key)))
      await self.registration.unregister()
      const windows = await self.clients.matchAll({ type: 'window' })
      await Promise.all(windows.map(client => client.navigate(client.url)))
    })(),
  )
})
