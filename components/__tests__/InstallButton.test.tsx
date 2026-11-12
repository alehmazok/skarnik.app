import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import posthog from 'posthog-js'
import InstallButton from '../InstallButton'
import { resetInstallPromptForTests } from '@/lib/install-prompt'

vi.mock('posthog-js', () => ({ default: { capture: vi.fn() } }))
vi.mock('@/lib/pwa', async importOriginal => ({
  ...(await importOriginal<typeof import('@/lib/pwa')>()),
  PWA_INSTALL_PROMOTED: true,
}))

const CHROME_WINDOWS = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36'
const CHROME_ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Mobile Safari/537.36'
const SAFARI_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15'

function setUserAgent(ua: string) {
  vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(ua)
}

function fireInstallPrompt() {
  const event = new Event('beforeinstallprompt') as Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> }
  event.prompt = vi.fn().mockResolvedValue(undefined)
  event.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
  act(() => {
    window.dispatchEvent(event)
  })
  return event
}

beforeEach(() => {
  resetInstallPromptForTests()
  window.matchMedia = vi.fn().mockReturnValue({ matches: false }) as unknown as typeof window.matchMedia
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('InstallButton', () => {
  it('stays hidden until the browser offers install', () => {
    setUserAgent(CHROME_WINDOWS)
    render(<InstallButton />)
    expect(screen.queryByRole('button', { name: 'Усталяваць' })).not.toBeInTheDocument()
  })

  it('shows on desktop Chrome and opens the install dialog', async () => {
    setUserAgent(CHROME_WINDOWS)
    render(<InstallButton />)
    const event = fireInstallPrompt()
    const button = screen.getByRole('button', { name: 'Усталяваць' })
    await act(async () => {
      fireEvent.click(button)
    })
    expect(event.prompt).toHaveBeenCalledTimes(1)
    expect(posthog.capture).toHaveBeenCalledWith('pwa_install_prompt_shown', { source: 'header' })
    // An install event can be used once, so the button goes away.
    expect(screen.queryByRole('button', { name: 'Усталяваць' })).not.toBeInTheDocument()
  })

  it('never shows on Android, even when Chrome offers install', () => {
    setUserAgent(CHROME_ANDROID)
    render(<InstallButton />)
    fireInstallPrompt()
    expect(screen.queryByRole('button', { name: 'Усталяваць' })).not.toBeInTheDocument()
  })

  it('shows the Add to Dock hint in Safari on macOS', () => {
    setUserAgent(SAFARI_MAC)
    render(<InstallButton />)
    fireEvent.click(screen.getByRole('button', { name: 'Усталяваць' }))
    expect(screen.getByText('Файл → Дадаць у Dock')).toBeInTheDocument()
  })

  it('counts an install', () => {
    setUserAgent(CHROME_WINDOWS)
    render(<InstallButton />)
    act(() => {
      window.dispatchEvent(new Event('appinstalled'))
    })
    expect(posthog.capture).toHaveBeenCalledWith('pwa_installed')
  })
})
