'use client'

export default function RetryButton() {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      style={{
        height: 38, padding: '0 18px',
        border: '1px solid var(--accent)', borderRadius: 100,
        background: 'var(--accent)', color: 'var(--bg)',
        fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
      }}
    >
      Паспрабаваць яшчэ раз
    </button>
  )
}
