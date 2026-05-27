'use client'

import { useLanguage } from '@/contexts/language-context'

type Variant = 'minimal' | 'badge'

export function LanguageToggle({ variant = 'minimal' }: { variant?: Variant }) {
  const { lang, setLang } = useLanguage()

  function toggle() {
    setLang(lang === 'zh' ? 'en' : 'zh')
  }

  if (variant === 'badge') {
    return (
      <button
        onClick={toggle}
        title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-all"
      >
        <span className="text-sm leading-none">{lang === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
        <span>{lang === 'zh' ? 'EN' : '中'}</span>
      </button>
    )
  }

  // minimal: just the flag + label
  return (
    <button
      onClick={toggle}
      title={lang === 'zh' ? 'Switch to English' : '切换为中文'}
      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
    >
      <span>{lang === 'zh' ? '🇺🇸 EN' : '🇨🇳 中'}</span>
    </button>
  )
}
