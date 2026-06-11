'use client'

import { useEffect, useRef } from 'react'
import { Activity, Image as ImageIcon, Play } from 'lucide-react'
import type { RunResult } from '@/lib/python/PyodideRunner'
import { useTr } from '@/contexts/language-context'

type TerminalEntry = {
  id: string
  timestamp: string
  result: RunResult
}

type TerminalOutputProps = {
  entries: TerminalEntry[]
  isRunning: boolean
  pyStatus: string
  languageName?: string
  commandLabel?: string
}

export function TerminalOutput({ entries, isRunning, pyStatus, languageName = 'Python', commandLabel = 'python' }: TerminalOutputProps) {
  const tr = useTr()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [entries, isRunning])

  return (
    <div className="h-full flex flex-col bg-[var(--code-bg)] font-mono overflow-hidden" style={{ fontSize: 'var(--cn-terminal-font-size, 14px)' }}>
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[var(--code-bg-elevated)] flex-shrink-0">
        <div className="flex gap-1.5" aria-hidden>
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <span className="text-white/30 text-xs ml-2">CodeNexus {languageName} Terminal</span>
        <span className="ml-auto text-[10px] text-white/20">{pyStatus}</span>
      </div>

      <div className="cn-scrollbar flex-1 space-y-4 overflow-y-auto p-4" role="log" aria-live="polite">
        {entries.length === 0 && !isRunning && (
          <div className="flex items-center gap-1.5 text-xs text-white/20">
            <Play className="h-3.5 w-3.5 fill-cyan-300/60 text-cyan-300/60" />
            {tr('点击右上角')}{' '}
            <span className="text-cyan-200">{tr('运行')}</span> {tr('执行代码')}
          </div>
        )}

        {entries.map((entry) => (
          <div key={entry.id} className="space-y-2">
            {/* Run prompt */}
            <div className="text-white/25 text-xs flex items-center gap-2">
              <span className="text-cyan-300/50">$</span>
              <span>{commandLabel} &lt;workshop&gt;</span>
              <span className="ml-auto">{entry.timestamp}</span>
            </div>

            {/* stdout */}
            {entry.result.output && (
              <pre className="text-[var(--code-stdout)] whitespace-pre-wrap break-words leading-[1.65] text-sm">
                {entry.result.output}
              </pre>
            )}

            {/* stderr — tr() translates known runner messages and passes real
                tracebacks through unchanged */}
            {entry.result.error && (
              <pre className="text-[var(--code-stderr)] whitespace-pre-wrap break-words leading-[1.65] text-sm">
                {tr(entry.result.error)}
              </pre>
            )}

            {/* Graphic output */}
            {entry.result.imageBase64 && (
              <div className="overflow-hidden rounded-lg border border-white/8 bg-[var(--code-bg-elevated)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${entry.result.imageBase64}`}
                  alt={tr('代码图形输出')}
                  className="w-full max-w-md mx-auto block"
                />
                <p className="flex items-center justify-center gap-1.5 py-1.5 text-center text-[10px] text-white/20">
                  <ImageIcon className="h-3 w-3" />
                  {tr('matplotlib 图形输出')}
                </p>
              </div>
            )}

            {/* No output hint */}
            {!entry.result.output && !entry.result.error && !entry.result.imageBase64 && (
              <span className="text-white/25 text-xs italic">{tr('（代码运行完毕，无输出）')}</span>
            )}

            {/* Speed tier — Allen's performance ego boost */}
            <div className="flex items-center justify-end gap-2">
              {entry.result.speedTier.percentile && (
                <span className="text-[10px] text-indigo-400/50">
                  {tr(entry.result.speedTier.percentile)}
                </span>
              )}
              <span className="inline-flex items-center gap-1 text-[10px] text-white/20">
                <Activity className="h-3 w-3" />
                {entry.result.speedTier.label}
              </span>
            </div>
          </div>
        ))}

        {/* Running indicator */}
        {isRunning && (
          <div className="flex items-center gap-2 text-cyan-200/70 text-xs">
            <span className="inline-flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1 h-1 rounded-full bg-cyan-300 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
            {tr('正在执行...')}
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  )
}
