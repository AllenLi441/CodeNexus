import 'server-only'
import { cookies } from 'next/headers'
import { DEFAULT_LANG, LANG_COOKIE, type Lang } from './i18n'

// Read the active language from the cookie in Server Components / route handlers.
export async function getServerLang(): Promise<Lang> {
  try {
    const store = await cookies()
    const value = store.get(LANG_COOKIE)?.value
    return value === 'en' || value === 'zh' ? value : DEFAULT_LANG
  } catch {
    return DEFAULT_LANG
  }
}
