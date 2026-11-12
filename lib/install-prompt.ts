'use client'

import posthog from 'posthog-js'

/** Chromium's install event; not in the DOM typings yet. */
export interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type Listener = () => void

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<Listener>()
let attached = false

function notify() {
  listeners.forEach(listener => listener())
}

/**
 * Keeps Chromium's install event so our own button can show the dialog later. Attached once, on the
 * first subscriber; the event normally fires after load, well after hydration.
 */
function attach() {
  if (attached || typeof window === 'undefined') return
  attached = true
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    deferred = event as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    posthog.capture('pwa_installed')
    notify()
  })
}

export function subscribeInstallPrompt(listener: Listener): () => void {
  attach()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function hasInstallPrompt(): boolean {
  return deferred !== null
}

/** Shows the browser's install dialog. Each event can be used once. */
export async function promptInstall(source: string): Promise<void> {
  const event = deferred
  if (!event) return
  deferred = null
  notify()
  posthog.capture('pwa_install_prompt_shown', { source })
  await event.prompt()
}

export function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as Navigator & { standalone?: boolean }
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)').matches ||
    nav.standalone === true
  )
}

/** Test hook: forget the kept event and the listeners. */
export function resetInstallPromptForTests() {
  deferred = null
  listeners.clear()
  attached = false
}
