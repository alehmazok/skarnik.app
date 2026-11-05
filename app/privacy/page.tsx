import type { Metadata } from 'next'
import PrivacyPolicy from '@/components/PrivacyPolicy'
import { privacyPolicies } from '@/lib/privacy'

const policy = privacyPolicies.be

export const metadata: Metadata = {
  title: `${policy.title} — Skarnik.app`,
  description: policy.description,
  alternates: {
    canonical: '/privacy',
    languages: { be: '/privacy', en: '/privacy/en' },
  },
  openGraph: { title: `${policy.title} — Skarnik.app`, description: policy.description, url: '/privacy' },
}

export default function PrivacyPage() {
  return <PrivacyPolicy policy={policy} />
}
