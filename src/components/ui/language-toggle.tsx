'use client'

import { useLanguage } from '@/contexts/language-context'

type Variant = 'minimal' | 'badge'

export function LanguageToggle({ variant = 'minimal' }: { variant?: Variant }) {
  const { lang, setLang } = useLanguage()

  function toggle() {
    setLang(lang === 'zh' ? 'en' : 'zh')
  }

  const switchLabel = lang === 'zh' ? 'Switch to English' : '切换为中文'

  if (variant === 'badge') {
    return (
      <button
        onClick={toggle}
        title={switchLabel}
        aria-label={switchLabel}
        className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border border-white/12 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-all"
      >
        <span aria-hidden="true" className="text-sm leading-none">{lang === 'zh' ? '🇨🇳' : '🇺🇸'}</span>
        <span>{lang === 'zh' ? 'EN' : '中'}</span>
      </button>
    )
  }

  // minimal: just the flag + label
  return (
    <button
      onClick={toggle}
      title={switchLabel}
      aria-label={switchLabel}
      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
    >
      <span aria-hidden="true">{lang === 'zh' ? '🇺🇸' : '🇨🇳'}</span>
      <span>{lang === 'zh' ? 'EN' : '中'}</span>
    </button>
  )
}
