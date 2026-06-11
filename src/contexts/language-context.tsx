'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { type Lang, LANG_COOKIE, DEFAULT_LANG, TRANSLATIONS, translate } from '@/lib/i18n'

// Use a loose type so both zh/en translations are assignable
type AnyTranslation = typeof TRANSLATIONS.zh | typeof TRANSLATIONS.en

type LanguageContextValue = {
  lang: Lang
  t: AnyTranslation
  setLang: (lang: Lang) => void
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: DEFAULT_LANG,
  t: TRANSLATIONS[DEFAULT_LANG] as AnyTranslation,
  setLang: () => {},
})

export function LanguageProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const router = useRouter()
  const [lang, setLangState] = useState<Lang>(() => {
    if (initialLang) return initialLang
    if (typeof document === 'undefined') return DEFAULT_LANG
    const cookie = document.cookie.split('; ').find((c) => c.startsWith(`${LANG_COOKIE}=`))
    if (cookie) {
      const val = cookie.split('=')[1] as Lang
      if (val === 'zh' || val === 'en') return val
    }
    return DEFAULT_LANG
  })

  function setLang(newLang: Lang) {
    setLangState(newLang)
    // Persist in cookie for 1 year
    document.cookie = `${LANG_COOKIE}=${newLang};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
    // Re-render Server Components so server-rendered text (dashboard, wall, login,
    // share, etc.) picks up the new cookie too. Client state (editor, Pyodide) is
    // preserved across refresh.
    router.refresh()
  }

  return (
    <LanguageContext.Provider value={{ lang, t: TRANSLATIONS[lang] as AnyTranslation, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  return useContext(LanguageContext)
}

// Convenience hook: returns a `tr('中文')` function bound to the current language.
// Wrap display strings with it — missing translations fall back to Chinese.
export function useTr() {
  const { lang } = useLanguage()
  return useMemo(() => (zh: string) => translate(zh, lang), [lang])
}
