'use client'

import { forwardRef, useImperativeHandle, useRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import { python } from '@codemirror/lang-python'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import type { EditorLanguage } from '@/lib/language-modules'

const nexusTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--cn-editor-font-size, 14px)',
    fontFamily: 'var(--font-geist-mono), "JetBrains Mono", "Fira Code", monospace',
    backgroundColor: '#020408',
  },
  '.cm-scroller': { fontFamily: 'inherit', overflow: 'auto' },
  '.cm-gutters': { backgroundColor: '#03070d', borderRight: '1px solid rgba(103,232,249,0.14)', color: '#24404a' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(103,232,249,0.08)' },
  '.cm-activeLine': { backgroundColor: 'rgba(103,232,249,0.05)' },
  '.cm-cursor': { borderLeftColor: '#67e8f9' },
  '.cm-selectionBackground': { backgroundColor: 'rgba(103,232,249,0.20) !important' },
  '.cm-focused .cm-selectionBackground': { backgroundColor: 'rgba(103,232,249,0.28) !important' },
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
        extensions={[...(language === 'python' ? [python()] : []), nexusTheme]}
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
