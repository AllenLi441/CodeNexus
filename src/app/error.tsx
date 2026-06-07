'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCcw, Home } from 'lucide-react'

export default function Error({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error('[CodeNexus] segment error:', error)
  }, [error])

  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-background px-4 text-foreground">
      <div className="w-full max-w-md space-y-5 rounded-2xl border border-red-300/20 bg-background/80 p-7 shadow-[0_24px_90px_color-mix(in_oklab,oklch(0.06_0.02_240)_55%,transparent)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-red-300/30 bg-red-300/10 text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300/55">System Fault</p>
            <h1 className="text-lg font-semibold">这一段 Nexus 短路了</h1>
          </div>
        </div>

        <p className="text-pretty text-sm leading-relaxed text-ink-soft">
          页面遇到了一个未处理的异常。多数情况是临时的，先点重试一次；不行就回主控台。
        </p>

        {error.digest && (
          <p className="rounded border border-hairline bg-foreground/[0.03] px-3 py-2 font-mono text-[11px] text-ink-mute">
            digest · {error.digest}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="cn-focus-ring flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
          >
            <RotateCcw className="h-4 w-4" />
            重试
          </button>
          <Link
            href="/dashboard"
            className="cn-focus-ring flex items-center gap-2 rounded-lg border border-hairline px-4 py-2 text-sm font-semibold text-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:text-cyan-100"
          >
            <Home className="h-4 w-4" />
            回主控台
          </Link>
        </div>
      </div>
    </main>
  )
}
