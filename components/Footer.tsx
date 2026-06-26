'use client'

import { useRef } from 'react'
import posthog from 'posthog-js'

export default function Footer() {
  const dialogRef = useRef<HTMLDialogElement>(null)

  function openAbout() {
    dialogRef.current?.showModal()
    posthog.capture('about_opened')
  }

  function closeAbout() {
    dialogRef.current?.close()
  }

  function handleBackdropClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) closeAbout()
  }

  return (
    <>
      <footer style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 24, padding: '30px clamp(20px,5vw,56px)',
        borderTop: '1px solid var(--line)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
          <StoreButton
            href="https://apps.apple.com/pl/app/skarnik/id988334682"
            icon={<AppleIcon />}
            eyebrow="Download on the"
            label="App Store"
            store="app_store"
          />
          <StoreButton
            href="https://play.google.com/store/apps/details?id=by.mazokaleh.skarnik"
            icon={<GooglePlayIcon />}
            eyebrow="Get it on"
            label="Google Play"
            store="google_play"
          />
          <StoreButton
            href="https://appgallery.huawei.com/app/C108065259"
            icon={<AppGalleryIcon />}
            eyebrow="Explore it on"
            label="AppGallery"
            store="appgallery"
          />
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 14, width: '100%',
        }}>
          <span style={{
            fontFamily: 'var(--font-mono), monospace',
            fontSize: 12, color: 'var(--faint)', letterSpacing: '.02em',
          }}>
            © 2026 Skarnik.app
          </span>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 'clamp(16px,3vw,30px)' }}>
            <FooterButton onClick={openAbout}>About</FooterButton>
            <FooterLink href="https://starnik.by">Starnik.by</FooterLink>
            <FooterLink href="https://drukarnik.app">Drukarnik.app</FooterLink>
          </nav>
        </div>
      </footer>

      <dialog
        ref={dialogRef}
        onClick={handleBackdropClick}
        style={{
          background: 'var(--panel)',
          color: 'var(--ink)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          padding: 0,
          maxWidth: 480,
          width: 'calc(100vw - 40px)',
        }}
      >
        <div style={{ padding: '28px 28px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18 }}>
            <span style={{ fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>Пра слоўнік</span>
            <button
              onClick={closeAbout}
              aria-label="Закрыць"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--faint)', fontSize: 20, lineHeight: 1,
                padding: '0 0 0 16px', marginTop: -2,
              }}
            >
              ×
            </button>
          </div>
          <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--soft)' }}>
            Skarnik — электронны руска-беларускі слоўнік. За аснову ўзяты
            акадэмічны слоўнік, які быў выпушчаны ў 1953 годзе (пад рэдакцыяй
            Я. Коласа, К. Крапівы і П. Глебкі) і затым некалькі разоў
            перавыдаваўся з выпраўленнямі і дапаўненнямі.
          </p>
          <p style={{ margin: '14px 0 0', fontSize: 15, lineHeight: 1.65, color: 'var(--soft)' }}>
            Сайт skarnik.by пачаў працаваць 7 жніўня 2012 года.
          </p>
        </div>
      </dialog>

      <style>{`
        dialog::backdrop {
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(2px);
        }
        dialog[open] {
          animation: pop .18s ease;
        }
      `}</style>
    </>
  )
}

function StoreButton({ href, icon, eyebrow, label, store }: {
  href: string
  icon: React.ReactNode
  eyebrow: string
  label: string
  store: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => posthog.capture('app_store_clicked', { store })}
      style={{
      display: 'flex', alignItems: 'center', gap: 10,
      height: 48, padding: '0 18px',
      border: '1px solid var(--line)', borderRadius: 10,
      background: 'transparent', textDecoration: 'none',
      transition: 'border-color .2s, transform .2s',
      }}>
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'var(--faint)',
        }}>{eyebrow}</span>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{label}</span>
      </span>
    </a>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{ fontSize: 14, color: 'var(--soft)', textDecoration: 'none', transition: 'color .2s' }}>
      {children}
    </a>
  )
}

function FooterButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        fontSize: 14, color: 'var(--soft)', transition: 'color .2s',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--ink)" aria-hidden="true">
      <path d="M16.36 12.78c-.02-2.05 1.67-3.03 1.75-3.08-.95-1.4-2.44-1.59-2.97-1.61-1.26-.13-2.46.74-3.1.74-.64 0-1.62-.72-2.67-.7-1.37.02-2.64.8-3.35 2.03-1.43 2.48-.37 6.15 1.02 8.16.68.99 1.49 2.09 2.55 2.05 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.59.66 2.67.64 1.1-.02 1.8-1 2.47-1.99.78-1.14 1.1-2.25 1.12-2.31-.02-.01-2.15-.82-2.17-3.26zM14.3 6.83c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.98 1.56-.86 2.48.9.07 1.83-.46 2.39-1.14z" />
    </svg>
  )
}

function GooglePlayIcon() {
  return (
    <svg width="18" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.6 2.2c-.2.2-.32.53-.32.96v17.68c0 .43.12.76.33.96l.06.06 9.9-9.9v-.02L3.66 2.14l-.06.06z" fill="#34a853" />
      <path d="M16.86 15.36l-3.3-3.3v-.02l3.3-3.3.08.04 3.91 2.22c1.12.63 1.12 1.67 0 2.31l-3.91 2.22-.08.03z" fill="#fbbc04" />
      <path d="M16.94 15.33l-3.38-3.38-9.96 9.96c.37.39.98.44 1.67.05l11.67-6.63z" fill="#ea4335" />
      <path d="M16.94 8.62L5.27 1.99c-.69-.39-1.3-.34-1.67.05l9.96 9.96 3.38-3.38z" fill="#4285f4" />
    </svg>
  )
}

function AppGalleryIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path d="M24 4C13.5 4 5.5 9 4.2 9.8c-.4.2-.5.5-.3.9 4 9.4 13.6 30.5 19.3 33.1.5.2 1 .2 1.5 0C30.5 41.2 40.1 20.1 44.1 10.7c.2-.4.1-.7-.3-.9C42.5 9 34.5 4 24 4z" fill="#c8102e" />
      <path d="M24 28c-4.5 0-8.5-2.3-10.8-5.8-.3.7-.5 1.5-.5 2.3 0 3.9 5.1 7 11.3 7s11.3-3.1 11.3-7c0-.8-.2-1.6-.5-2.3C32.5 25.7 28.5 28 24 28z" fill="#fff" />
    </svg>
  )
}
