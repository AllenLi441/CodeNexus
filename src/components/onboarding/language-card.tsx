'use client'

import { cn } from '@/lib/utils'

type Language = {
  id: string
  name: string
  icon: string
  tagline: string
  active: boolean
}

const languages: Language[] = [
  {
    id: 'python',
    name: 'Python',
    icon: 'PY',
    tagline: 'AI、自动化、数据与 Web',
    active: true,
  },
  {
    id: 'c',
    name: 'C',
    icon: 'C',
    tagline: '系统、内存与底层基础',
    active: true,
  },
  {
    id: 'cpp',
    name: 'C++',
    icon: 'C++',
    tagline: '高性能工程与游戏引擎',
    active: true,
  },
  {
    id: 'java',
    name: 'Java',
    icon: 'J',
    tagline: '后端、Android 与企业系统',
    active: true,
  },
  {
    id: 'csharp',
    name: 'C#',
    icon: 'C#',
    tagline: '.NET、Unity 与桌面工具',
    active: true,
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    icon: 'JS',
    tagline: 'Web、Node 与全栈应用',
    active: true,
  },
  {
    id: 'visual-basic',
    name: 'Visual Basic',
    icon: 'VB',
    tagline: '桌面、Office 与业务系统',
    active: true,
  },
]

export function LanguageSelector({ selected, onSelect }: {
  selected: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {languages.map((lang) => (
        <button
          key={lang.id}
          type="button"
          disabled={!lang.active}
          onClick={() => lang.active && onSelect(lang.id)}
          className={cn(
            'relative flex flex-col items-center gap-3 rounded-xl border-2 p-5 text-center transition-all duration-200',
            lang.active
              ? [
                  'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
                  selected === lang.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border bg-card hover:border-primary/40',
                ]
              : 'cursor-not-allowed opacity-45 bg-muted/40 border-border/40 select-none',
          )}
        >
          <span className="font-mono text-2xl leading-none text-cyan-200">{lang.icon}</span>
          <div className="space-y-1">
            <p className="font-semibold text-sm">{lang.name}</p>
            <p className="text-xs text-muted-foreground leading-snug">{lang.tagline}</p>
          </div>
          {selected === lang.id && lang.active && (
            <span className="absolute top-2 right-2 text-primary text-sm">✓</span>
          )}
        </button>
      ))}
    </div>
  )
}
