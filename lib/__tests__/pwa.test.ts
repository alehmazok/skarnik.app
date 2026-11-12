import { describe, it, expect } from 'vitest'
import { installUi, isMacSafariWithDock, isMobileDevice, type InstallContext } from '@/lib/pwa'

const UA = {
  chromeWindows: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  edgeLinux: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 Edg/142.0.0.0',
  chromeAndroid: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36',
  safariIphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  safariMac18: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15',
  safariMac16: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
  chromeMac: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
  firefoxLinux: 'Mozilla/5.0 (X11; Linux x86_64; rv:144.0) Gecko/20100101 Firefox/144.0',
}

function ctx(userAgent: string, overrides: Partial<InstallContext> = {}): InstallContext {
  return { userAgent, maxTouchPoints: 0, standalone: false, hasInstallPrompt: false, ...overrides }
}

describe('installUi', () => {
  it('shows the button on desktop Chrome and Edge once the browser offers install', () => {
    expect(installUi(ctx(UA.chromeWindows, { hasInstallPrompt: true }))).toBe('button')
    expect(installUi(ctx(UA.edgeLinux, { hasInstallPrompt: true }))).toBe('button')
    expect(installUi(ctx(UA.chromeMac, { hasInstallPrompt: true }))).toBe('button')
  })

  it('shows nothing before the browser offers install', () => {
    expect(installUi(ctx(UA.chromeWindows))).toBe('none')
    expect(installUi(ctx(UA.firefoxLinux))).toBe('none')
  })

  it('never offers web install on phones and tablets', () => {
    expect(installUi(ctx(UA.chromeAndroid, { hasInstallPrompt: true }))).toBe('none')
    expect(installUi(ctx(UA.safariIphone))).toBe('none')
    // iPadOS reports a Mac user agent but has touch.
    expect(installUi(ctx(UA.safariMac18, { maxTouchPoints: 5 }))).toBe('none')
  })

  it('gives Safari 17+ on macOS the Add to Dock hint', () => {
    expect(installUi(ctx(UA.safariMac18))).toBe('safari-hint')
    expect(installUi(ctx(UA.safariMac16))).toBe('none')
  })

  it('shows nothing inside the installed app', () => {
    expect(installUi(ctx(UA.chromeWindows, { hasInstallPrompt: true, standalone: true }))).toBe('none')
    expect(installUi(ctx(UA.safariMac18, { standalone: true }))).toBe('none')
  })
})

describe('device checks', () => {
  it('detects phones', () => {
    expect(isMobileDevice(UA.chromeAndroid, 5)).toBe(true)
    expect(isMobileDevice(UA.chromeWindows, 0)).toBe(false)
    expect(isMobileDevice(UA.chromeWindows, 10)).toBe(false)
  })

  it('tells Safari from Chrome on macOS', () => {
    expect(isMacSafariWithDock(UA.safariMac18)).toBe(true)
    expect(isMacSafariWithDock(UA.chromeMac)).toBe(false)
  })
})
