import type { Metadata } from 'next'
import localFont from 'next/font/local'
import CookieConsent from '@/components/CookieConsent'
import './globals.css'

// Self-hosted (latin subset, variable weight) so the Docker build doesn't
// depend on fonts.googleapis.com, whose dynamic `/l/font?kit=` URLs crash
// next/font/google.
const grotesk = localFont({
  src: './fonts/SchibstedGrotesk-latin.woff2',
  weight: '400 700',
  variable: '--font-grotesk',
  display: 'swap',
})

const mono = localFont({
  src: './fonts/SplineSansMono-latin.woff2',
  weight: '400 500',
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL('https://skarnik.app'),
  title: 'Skarnik.app',
  description: 'Беларускі слоўнік',
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'Skarnik.app',
    locale: 'be',
  },
  twitter: {
    card: 'summary_large_image',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="be" suppressHydrationWarning className={`${grotesk.variable} ${mono.variable}`}>
      <head>
        {/* Applies saved theme before React hydrates — prevents FOUC */}
        <script dangerouslySetInnerHTML={{ __html:
          `(function(){try{var t=localStorage.getItem('skarnik-theme');if(t&&t!=='auto')document.documentElement.setAttribute('data-theme',t)}catch(e){}})()`
        }} />
      </head>
      <body>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
