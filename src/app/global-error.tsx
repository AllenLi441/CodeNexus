'use client'

import { useEffect, useState } from 'react'

// Renders outside all providers, so read the language cookie directly.
function readLangCookie(): 'zh' | 'en' {
  if (typeof document === 'undefined') return 'zh'
  return /(?:^|;\s*)zf-lang=en(?:;|$)/.test(document.cookie) ? 'en' : 'zh'
}

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  const [lang] = useState(readLangCookie)
  const isEn = lang === 'en'
  useEffect(() => {
    console.error('[CodeNexus] global error:', error)
  }, [error])

  return (
    <html lang={isEn ? 'en' : 'zh-CN'}>
      <body
        style={{
          margin: 0,
          minHeight: '100dvh',
          backgroundColor: '#000',
          color: '#fff',
          fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: '100%',
            border: '1px solid rgba(248,113,113,0.22)',
            borderRadius: 10,
            padding: 28,
            background: 'rgba(0,0,0,0.78)',
            boxShadow: '0 24px 90px rgba(0,0,0,0.55)',
          }}
        >
          <p
            style={{
              fontFamily: 'ui-monospace, monospace',
              fontSize: 10,
              letterSpacing: '0.32em',
              textTransform: 'uppercase',
              color: 'rgba(252,165,165,0.55)',
              margin: 0,
            }}
          >
            Critical Fault
          </p>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: '8px 0 16px' }}>
            {isEn ? 'Something went wrong' : '出了点问题'}
          </h1>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.55)',
              marginBottom: 20,
            }}
          >
            {isEn
              ? 'An unexpected error occurred. Try again; if it persists, reload the tab.'
              : '遇到一个意外错误。先重试；问题持续就刷新整个标签页。'}
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              border: 'none',
              borderRadius: 8,
              background: '#67e8f9',
              color: '#000',
              fontSize: 14,
              fontWeight: 600,
              padding: '10px 18px',
              cursor: 'pointer',
            }}
          >
            {isEn ? 'Retry' : '重试'}
          </button>
        </div>
      </body>
    </html>
  )
}
