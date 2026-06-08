'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'
import { useTr } from '@/contexts/language-context'

const FRIENDLY = '⚠️ 后台一个异步任务报错了。再试一次通常就好。'

function reasonText(reason: unknown): string {
  if (reason instanceof Error) return reason.message
  if (typeof reason === 'string') return reason
  try {
    return JSON.stringify(reason)
  } catch {
    return String(reason)
  }
}

// Mounts once globally. Catches:
//  - unhandledrejection: a Promise rejected with no .catch()
//  - error: an uncaught synchronous error in a non-React callback
// React render errors are caught by error.tsx / global-error.tsx, not here.
export function ErrorTap() {
  const tr = useTr()
  useEffect(() => {
    const onRejection = (event: PromiseRejectionEvent) => {
      // Sonner sometimes proxies its own rejections during navigation; skip
      // those so the toast doesn't recursively warn about itself.
      const text = reasonText(event.reason)
      if (text.includes('AbortError') || text.includes('aborted')) return

      if (process.env.NODE_ENV !== 'production') {
        console.error('[CodeNexus unhandled rejection]', event.reason)
      }
      toast.error(tr(FRIENDLY), {
        description: text.slice(0, 240),
        duration: 5000,
      })
    }

    const onError = (event: ErrorEvent) => {
      if (process.env.NODE_ENV !== 'production') {
        console.error('[CodeNexus uncaught error]', event.error)
      }
      toast.error(tr(FRIENDLY), {
        description: (event.error?.message ?? event.message ?? '').toString().slice(0, 240),
        duration: 5000,
      })
    }

    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('error', onError)
    return () => {
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('error', onError)
    }
  }, [tr])

  return null
}
