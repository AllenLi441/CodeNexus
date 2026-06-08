'use client'

import { useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'
import { useTr } from '@/contexts/language-context'

// Multi-line code block: dark backdrop + cyan accents + copy button.
// Visually aligned with `CodeBlockCard` in guide-panel.tsx so the entire
// app speaks the same code-block dialect.
function CodeFence({ code, language }: { code: string; language?: string }) {
  const tr = useTr()
  const [copied, setCopied] = useState(false)
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard may be blocked (insecure context) — silently ignore.
    }
  }
  return (
    <div className="my-2 overflow-hidden rounded-lg border border-white/10 bg-black/55">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.025] px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
          {language ?? 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="cn-focus-ring inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/72"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? tr('已复制') : tr('复制')}
        </button>
      </div>
      <pre className="cn-scrollbar overflow-x-auto whitespace-pre p-3 font-mono text-xs leading-relaxed text-cyan-50/80">
        {code}
      </pre>
    </div>
  )
}

// Strip the trailing newline react-markdown leaves on the last `code` child.
function childrenToString(children: ReactNode): string {
  if (typeof children === 'string') return children
  if (Array.isArray(children)) return children.map(childrenToString).join('')
  return String(children ?? '')
}

const components: Components = {
  // Inline AND fenced code both come through as `code`. We distinguish by
  // checking for a `language-x` class (only fences have it) per CommonMark.
  code({ className, children, ...rest }) {
    const match = /language-([\w-]+)/.exec(className || '')
    const text = childrenToString(children).replace(/\n$/, '')
    if (match) {
      return <CodeFence code={text} language={match[1]} />
    }
    return (
      <code
        className="rounded bg-cyan-300/10 px-1 py-0.5 font-mono text-[0.85em] text-cyan-100"
        {...rest}
      >
        {children}
      </code>
    )
  },
  // react-markdown wraps fenced blocks in <pre><code>. The `code` handler
  // already returns the styled fence card, so neutralize the outer <pre>.
  pre({ children }) {
    return <>{children}</>
  },
  p({ children }) {
    return <p className="my-1 leading-relaxed">{children}</p>
  },
  ul({ children }) {
    return <ul className="my-2 list-disc space-y-1 pl-5 marker:text-cyan-300/55">{children}</ul>
  },
  ol({ children }) {
    return <ol className="my-2 list-decimal space-y-1 pl-5 marker:text-cyan-300/55">{children}</ol>
  },
  li({ children }) {
    return <li className="leading-relaxed">{children}</li>
  },
  strong({ children }) {
    return <strong className="font-semibold text-white">{children}</strong>
  },
  em({ children }) {
    return <em className="text-white/82">{children}</em>
  },
  a({ children, href }) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-cyan-200 underline underline-offset-2 transition-colors hover:text-cyan-100"
      >
        {children}
      </a>
    )
  },
  blockquote({ children }) {
    return (
      <blockquote className="my-2 border-l-2 border-cyan-300/35 pl-3 text-white/60">
        {children}
      </blockquote>
    )
  },
  h1: ({ children }) => <p className="mt-3 mb-1 text-sm font-semibold text-white">{children}</p>,
  h2: ({ children }) => <p className="mt-3 mb-1 text-sm font-semibold text-white">{children}</p>,
  h3: ({ children }) => <p className="mt-2 mb-1 text-[13px] font-semibold text-white/88">{children}</p>,
  hr: () => <hr className="my-3 border-white/10" />,
}

export function MarkdownMessage({ text }: { text: string }) {
  return (
    <div className="cn-md text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  )
}
