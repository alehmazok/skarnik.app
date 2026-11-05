import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import PrivacyPolicy from '../PrivacyPolicy'
import { privacyPolicies, PRIVACY_CONTACT_EMAIL, type PrivacyPolicy as Policy } from '@/lib/privacy'

function text(policy: Policy): string {
  const rich = (r: unknown): string =>
    typeof r === 'string' ? r : (r as (string | { text: string })[]).map(x => typeof x === 'string' ? x : x.text).join('')
  return policy.sections
    .flatMap(s => [s.heading, ...s.blocks.flatMap(b => ('p' in b ? [rich(b.p)] : b.ul.map(rich)))])
    .join('\n')
}

describe('PrivacyPolicy', () => {
  it.each(['be', 'en'] as const)('renders the %s policy with title, date and every section', lang => {
    const policy = privacyPolicies[lang]
    render(<PrivacyPolicy policy={policy} />)
    expect(screen.getByRole('heading', { level: 1, name: policy.title })).toBeInTheDocument()
    expect(document.querySelector('time')).toHaveAttribute('dateTime', policy.updated)
    for (const section of policy.sections) {
      expect(screen.getByRole('heading', { level: 2, name: section.heading })).toBeInTheDocument()
    }
  })

  it.each(['be', 'en'] as const)('%s policy has a mailto contact link', lang => {
    render(<PrivacyPolicy policy={privacyPolicies[lang]} />)
    const links = screen.getAllByRole('link', { name: PRIVACY_CONTACT_EMAIL })
    expect(links.length).toBeGreaterThan(0)
    links.forEach(a => expect(a).toHaveAttribute('href', `mailto:${PRIVACY_CONTACT_EMAIL}`))
  })

  it('links each language to the other', () => {
    expect(privacyPolicies.be.otherLanguage.href).toBe('/privacy/en')
    expect(privacyPolicies.en.otherLanguage.href).toBe('/privacy')
  })

  it('both languages have the same sections in the same order', () => {
    expect(privacyPolicies.en.sections.map(s => s.id)).toEqual(privacyPolicies.be.sections.map(s => s.id))
  })

  it('uses the app contact address and names no person', () => {
    expect(PRIVACY_CONTACT_EMAIL).toBe('skarnikapp@gmail.com')
    for (const policy of Object.values(privacyPolicies)) {
      expect(text(policy)).not.toMatch(/belanghelp|Mazok|Мазок|Алег|Aleh/i)
    }
  })

  it('names the crash reporter of each platform', () => {
    const en = text(privacyPolicies.en)
    expect(en).toMatch(/Android: Sentry/)
    expect(en).toMatch(/iOS: Google Firebase Crashlytics/)
  })
})
