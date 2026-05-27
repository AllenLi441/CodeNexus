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
    <div className="flex-shrink-0 border-b border-white/5 bg-[#0d0d1a] xl:hidden">
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto scrollbar-none">
        {SYMBOLS.map((sym) => (
          <button
            key={sym.label}
            onClick={() => insert(sym)}
            title={sym.title}
            className="flex-shrink-0 h-8 min-w-[36px] px-2 rounded-md bg-white/5 border border-white/8 text-white/70 hover:bg-indigo-500/20 hover:border-indigo-500/30 hover:text-indigo-300 text-xs font-mono transition-all active:scale-95"
          >
            {sym.label}
          </button>
        ))}
      </div>
    </div>
  )
}
