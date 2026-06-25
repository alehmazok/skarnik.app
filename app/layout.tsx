import type { Metadata } from 'next'
import { Schibsted_Grotesk, Spline_Sans_Mono } from 'next/font/google'
import './globals.css'

const grotesk = Schibsted_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-grotesk',
  display: 'swap',
})

const mono = Spline_Sans_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Skarnik.app',
  description: 'Беларускі слоўнік',
  manifest: '/site.webmanifest',
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
      <body>{children}</body>
    </html>
  )
}
