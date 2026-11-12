/**
 * Installable-app (PWA) helpers shared by the manifest, the install button and the service worker setup.
 */

/** Whether the site invites people to install the app (header button, landing line). On since the search app shipped (#22). */
export const PWA_INSTALL_PROMOTED = true

export const PWA_START_URL = '/search?source=pwa'

export const PLAY_STORE_ID = 'by.mazokaleh.skarnik'
export const APP_STORE_ID = '988334682'

/** What the install UI shows on this device. */
export type InstallUi = 'button' | 'safari-hint' | 'none'

export interface InstallContext {
  userAgent: string
  /** navigator.maxTouchPoints; iPadOS reports a Mac user agent but has touch. */
  maxTouchPoints: number
  /** Already running as an installed app (display-mode standalone or window-controls-overlay). */
  standalone: boolean
  /** The browser fired `beforeinstallprompt` and the event is kept for later. */
  hasInstallPrompt: boolean
}

/** Phones and tablets get the store badges instead of a web install. */
export function isMobileDevice(userAgent: string, maxTouchPoints: number): boolean {
  if (/Android|iPhone|iPad|iPod|Mobile|HarmonyOS/i.test(userAgent)) return true
  // iPadOS 13+ asks for the desktop site and reports "Macintosh".
  return /Macintosh/.test(userAgent) && maxTouchPoints > 1
}

/** Safari on macOS 17+, which installs with File → Add to Dock and has no install event. */
export function isMacSafariWithDock(userAgent: string): boolean {
  if (!/Macintosh/.test(userAgent)) return false
  if (/Chrome|Chromium|CriOS|Edg|Firefox|FxiOS|OPR|Opera/.test(userAgent)) return false
  const match = /Version\/(\d+)[.\d]* Safari\//.exec(userAgent)
  return match !== null && Number(match[1]) >= 17
}

export function installUi(ctx: InstallContext): InstallUi {
  if (ctx.standalone) return 'none'
  if (isMobileDevice(ctx.userAgent, ctx.maxTouchPoints)) return 'none'
  if (ctx.hasInstallPrompt) return 'button'
  if (isMacSafariWithDock(ctx.userAgent) && ctx.maxTouchPoints <= 1) return 'safari-hint'
  return 'none'
}
