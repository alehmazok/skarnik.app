import type { MetadataRoute } from 'next'
import { DICT_DIRECTIONS, type DictDirection } from '@/lib/dict'
import { APP_STORE_ID, PLAY_STORE_ID, PWA_START_URL } from '@/lib/pwa'

const SHORTCUT_NAMES: Record<DictDirection, string> = {
  belrus: 'Бел-Рус',
  rusbel: 'Рус-Бел',
  tsbm: 'Тлумачальны',
}

// Fields newer than Next's MetadataRoute.Manifest type.
type Manifest = MetadataRoute.Manifest & {
  display_override?: string[]
  launch_handler?: { client_mode: string | string[] }
  screenshots?: Array<{ src: string; sizes: string; type: string; form_factor?: 'wide' | 'narrow'; label?: string }>
}

export default function manifest(): Manifest {
  return {
    id: '/search',
    name: 'Скарнік — беларускі слоўнік',
    short_name: 'Скарнік',
    description: 'Беларуска-рускі, руска-беларускі і тлумачальны слоўнік беларускай мовы з націскамі.',
    lang: 'be',
    dir: 'ltr',
    start_url: PWA_START_URL,
    scope: '/',
    display: 'standalone',
    display_override: ['window-controls-overlay', 'standalone'],
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['education', 'reference', 'books'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // The mark sits inside the 80% safe zone on a white square, so the same file works when masked.
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: DICT_DIRECTIONS.map(dict => ({
      name: SHORTCUT_NAMES[dict],
      url: `/search?dict=${dict}&source=pwa-shortcut`,
      icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
    })),
    screenshots: [
      {
        src: '/screenshots/wide.png',
        sizes: '1280x800',
        type: 'image/png',
        form_factor: 'wide',
        label: 'Слова ў беларуска-рускім слоўніку',
      },
      {
        src: '/screenshots/narrow.png',
        sizes: '750x1334',
        type: 'image/png',
        form_factor: 'narrow',
        label: 'Слова ў беларуска-рускім слоўніку',
      },
    ],
    related_applications: [
      { platform: 'play', id: PLAY_STORE_ID, url: `https://play.google.com/store/apps/details?id=${PLAY_STORE_ID}` },
      { platform: 'itunes', url: `https://apps.apple.com/app/id${APP_STORE_ID}` },
    ],
    // We hide the web install on phones ourselves; desktop has no native app to prefer.
    prefer_related_applications: false,
    launch_handler: { client_mode: ['navigate-existing', 'auto'] },
  }
}
