'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import type { EditorLanguage } from '@/lib/language-modules'
import { useTr } from '@/contexts/language-context'

/* Code surfaces stay dark regardless of page theme — high contrast, eye-friendly. */
const nexusTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--cn-editor-font-size, 14px)',
    fontFamily: 'var(--font-geist-mono), "JetBrains Mono", "Fira Code", monospace',
    backgroundColor: 'var(--code-bg, #0d0d18)',
  },
  '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto', lineHeight: '1.65' },
  '.cm-content': { lineHeight: '1.65' },
  '.cm-gutters': {
    backgroundColor: 'var(--code-bg-elevated, #12121f)',
    borderRight: '1px solid color-mix(in oklab, var(--nexus, cyan) 14%, transparent)',
    color: 'var(--code-line-number, #6b8a96)',
  },
  '.cm-activeLineGutter': { backgroundColor: 'color-mix(in oklab, var(--nexus, cyan) 8%, transparent)' },
  '.cm-activeLine': { backgroundColor: 'color-mix(in oklab, var(--nexus, cyan) 5%, transparent)' },
  '.cm-cursor': { borderLeftColor: 'var(--nexus, cyan)' },
  '.cm-selectionBackground': { backgroundColor: 'color-mix(in oklab, var(--nexus, cyan) 20%, transparent) !important' },
  '.cm-focused .cm-selectionBackground': { backgroundColor: 'color-mix(in oklab, var(--nexus, cyan) 28%, transparent) !important' },
  /* Lift the dimmest one-dark token (comments) above 7:1 on the near-black bg */
  '.cm-line .tok-comment, .cm-line .tok-lineComment, .cm-line .tok-blockComment': {
    color: 'oklch(0.68 0.03 220)',
  },
})

export type CodeEditorHandle = {
  insertAtCursor: (text: string, backChars?: number) => void
}

type CodeEditorProps = {
  value: string
  onChange: (val: string) => void
  language?: EditorLanguage
}

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  function CodeEditor({ value, onChange, language = 'python' }, ref) {
    const cmRef = useRef<ReactCodeMirrorRef>(null)
    const tr = useTr()

    useImperativeHandle(ref, () => ({
      insertAtCursor(text: string, backChars = 0) {
        const view = cmRef.current?.view
        if (!view) return
        const { from, to } = view.state.selection.main
        // Replace selection or insert at cursor
        const insertPos = from
        view.dispatch({
          changes: { from: insertPos, to, insert: text },
          selection: { anchor: insertPos + text.length - backChars },
        })
        view.focus()
      },
    }))

    return (
      <CodeMirror
        ref={cmRef}
        value={value}
        height="100%"
        theme={oneDark}
        extensions={[
          ...(language === 'python' ? [python()] : []),
          nexusTheme,
          EditorView.contentAttributes.of({ 'aria-label': tr('代码编辑器') }),
        ]}
        onChange={onChange}
        basicSetup={{
          lineNumbers: true,
          foldGutter: true,
          dropCursor: true,
          allowMultipleSelections: true,
          indentOnInput: true,
          syntaxHighlighting: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: true,
          rectangularSelection: true,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: true,
          closeBracketsKeymap: true,
          searchKeymap: true,
        }}
        className="h-full"
      />
    )
  }
)
