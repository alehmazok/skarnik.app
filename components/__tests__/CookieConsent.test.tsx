import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import posthog from 'posthog-js'
import CookieConsent from '../CookieConsent'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('CookieConsent', () => {
  it('shows banner when consent decision is pending', () => {
    vi.spyOn(posthog, 'get_explicit_consent_status').mockReturnValue('pending')
    render(<CookieConsent />)
    expect(screen.getByRole('button', { name: 'Прыняць' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Адхіліць' })).toBeInTheDocument()
  })

  it('does not show banner when user already granted consent', () => {
    vi.spyOn(posthog, 'get_explicit_consent_status').mockReturnValue('granted')
    render(<CookieConsent />)
    expect(screen.queryByRole('button', { name: 'Прыняць' })).not.toBeInTheDocument()
  })

  it('does not show banner when user already denied consent', () => {
    vi.spyOn(posthog, 'get_explicit_consent_status').mockReturnValue('denied')
    render(<CookieConsent />)
    expect(screen.queryByRole('button', { name: 'Прыняць' })).not.toBeInTheDocument()
  })

  it('accepting calls opt_in_capturing and hides banner', () => {
    vi.spyOn(posthog, 'get_explicit_consent_status').mockReturnValue('pending')
    const optIn = vi.spyOn(posthog, 'opt_in_capturing').mockImplementation(() => {})
    vi.spyOn(posthog, 'capture').mockImplementation(() => ({}) as ReturnType<typeof posthog.capture>)

    render(<CookieConsent />)
    fireEvent.click(screen.getByRole('button', { name: 'Прыняць' }))

    expect(optIn).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Прыняць' })).not.toBeInTheDocument()
  })

  it('rejecting calls opt_out_capturing and hides banner', () => {
    vi.spyOn(posthog, 'get_explicit_consent_status').mockReturnValue('pending')
    const optOut = vi.spyOn(posthog, 'opt_out_capturing').mockImplementation(() => {})

    render(<CookieConsent />)
    fireEvent.click(screen.getByRole('button', { name: 'Адхіліць' }))

    expect(optOut).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('button', { name: 'Адхіліць' })).not.toBeInTheDocument()
  })
})
