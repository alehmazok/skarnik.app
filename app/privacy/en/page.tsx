import type { Metadata } from 'next'
import PrivacyPolicy from '@/components/PrivacyPolicy'
import { privacyPolicies } from '@/lib/privacy'

const policy = privacyPolicies.en

export const metadata: Metadata = {
  title: `${policy.title} — Skarnik.app`,
  description: policy.description,
  alternates: {
    canonical: '/privacy/en',
    languages: { be: '/privacy', en: '/privacy/en' },
  },
  openGraph: {
    title: `${policy.title} — Skarnik.app`,
    description: policy.description,
    url: '/privacy/en',
    locale: 'en_US',
  },
}

export default function PrivacyEnPage() {
  return <PrivacyPolicy policy={policy} />
}
