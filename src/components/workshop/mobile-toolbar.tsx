'use client'

import type { CodeEditorHandle } from './code-editor'
import type { RefObject } from 'react'

const SYMBOLS = [
  { label: ':', ins: ':' },
  { label: '(', ins: '(' },
  { label: ')', ins: ')' },
  { label: '"…"', ins: '""', back: 1 },
  { label: "'…'", ins: "''", back: 1 },
  { label: '=', ins: ' = ' },
  { label: '+=', ins: ' += ' },
  { label: '==', ins: ' == ' },
  { label: '!=', ins: ' != ' },
  { label: '#', ins: '# ' },
  { label: '[…]', ins: '[]', back: 1 },
  { label: '→', ins: '    ', title: '缩进(4格)' },
  { label: '**', ins: '**' },
  { label: 'f"', ins: 'f""', back: 1 },
]

type MobileToolbarProps = {
  editorRef: RefObject<CodeEditorHandle | null>
}

export function MobileToolbar({ editorRef }: MobileToolbarProps) {
  function insert(sym: (typeof SYMBOLS)[0]) {
    editorRef.current?.insertAtCursor(sym.ins, sym.back)
  }

  return (
    <div className="flex-shrink-0 border-b border-white/5 bg-[var(--code-bg-elevated)] xl:hidden">
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none">
        {SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            onClick={() => insert(sym)}
            title={sym.title}
            aria-label={sym.title ?? `插入 ${sym.label}`}
            className="cn-focus-ring flex-shrink-0 h-11 min-w-[44px] px-2 rounded-md bg-white/5 border border-white/8 text-white/70 hover:bg-cyan-300/15 hover:border-cyan-300/30 hover:text-cyan-100 text-xs font-mono transition-all duration-150 active:scale-95"
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  )
}
