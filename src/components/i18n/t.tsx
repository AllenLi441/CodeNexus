'use client'

import { useTr } from '@/contexts/language-context'

// Client-side text leaf for Server Components. Renders tr(zh) so the text
// flips INSTANTLY when the user toggles language — no waiting on the server
// round-trip (router.refresh on data-heavy pages like /dashboard takes
// seconds behind auth + DB fetches). SSR still emits the correct language
// because LanguageProvider seeds from the cookie.
export function T({ zh, params }: { zh: string; params?: Record<string, string | number> }) {
  const tr = useTr()
  let text = tr(zh)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      text = text.replaceAll(`{${key}}`, String(value))
    }
  }
  return <>{text}</>
}
