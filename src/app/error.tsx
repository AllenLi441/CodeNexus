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
    <main className="flex min-h-[100dvh] items-center justify-center bg-black px-4 text-white">
      <div className="w-full max-w-md space-y-5 rounded-lg border border-red-300/20 bg-black/80 p-7 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-red-300/30 bg-red-300/10 text-red-200">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-red-300/55">System Fault</p>
            <h1 className="text-lg font-semibold">这一段 Nexus 短路了</h1>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-white/55">
          页面遇到了一个未处理的异常。多数情况是临时的，先点重试一次；不行就回主控台。
        </p>

        {error.digest && (
          <p className="rounded border border-white/8 bg-white/[0.03] px-3 py-2 font-mono text-[11px] text-white/35">
            digest · {error.digest}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => unstable_retry()}
            className="cn-focus-ring flex items-center gap-2 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
          >
            <RotateCcw className="h-4 w-4" />
            重试
          </button>
          <Link
            href="/dashboard"
            className="cn-focus-ring flex items-center gap-2 rounded-lg border border-white/15 px-4 py-2 text-sm font-semibold text-white/65 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/35 hover:text-cyan-100"
          >
            <Home className="h-4 w-4" />
            回主控台
          </Link>
        </div>
      </div>
    </main>
  )
}
