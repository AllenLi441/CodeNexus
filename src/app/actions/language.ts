'use server'

import { cookies } from 'next/headers'
import { LANG_COOKIE, type Lang } from '@/lib/i18n'

// Set the language cookie server-side. Done as a Server Action so the new cookie
// is committed authoritatively (Set-Cookie) and server-rendered text re-reads it
// on the follow-up router.refresh() — the client-only `document.cookie` +
// refresh combo did not reliably re-render Server Components in Next 16.
export async function persistLanguage(lang: Lang): Promise<void> {
  if (lang !== 'zh' && lang !== 'en') return
  const store = await cookies()
  store.set(LANG_COOKIE, lang, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })
}
