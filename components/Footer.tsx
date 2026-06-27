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
          <a
            href="https://apps.apple.com/pl/app/skarnik/id988334682"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('app_store_clicked', { store: 'app_store' })}
            style={{ display: 'flex', alignItems: 'center', height: 40 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/appstore-black.svg"
              alt="Download on the App Store"
              height={40}
            />
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=by.mazokaleh.skarnik"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => posthog.capture('app_store_clicked', { store: 'google_play' })}
            style={{ display: 'flex', alignItems: 'center', height: 40 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/badges/googleplay.svg"
              alt="Get it on Google Play"
              height={40}
            />
          </a>
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
            <FooterButton onClick={openAbout}>Пра Скарнік</FooterButton>
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
      height: 40, padding: '0 14px',
      border: '1px solid #a6a6a6', borderRadius: 10,
      background: '#000', textDecoration: 'none',
      transition: 'opacity .2s',
      }}>
      {icon}
      <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
        <span style={{
          fontFamily: 'var(--font-mono), monospace',
          fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.6)',
        }}>{eyebrow}</span>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: '#fff' }}>{label}</span>
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

function AppGalleryIcon() {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/badges/huawei-appgallery.svg" alt="" width={20} height={20} aria-hidden={true} />
  )
}
