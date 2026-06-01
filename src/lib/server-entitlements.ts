import 'server-only'

import { LANGUAGE_MODULES, toStorageLevelId } from '@/lib/language-modules'

type ProgressLike = {
  level_id: number
  is_completed: boolean
  attempts: number
}

function getFullUnlockEmails() {
  return new Set(
    (process.env.FULL_UNLOCK_EMAILS ?? '')
      .split(',')
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

export function hasFullUnlockAccess(email: string | null | undefined) {
  return Boolean(email && getFullUnlockEmails().has(email.trim().toLowerCase()))
}

export function mergeFullUnlockProgress(progress: ProgressLike[]): ProgressLike[] {
  const merged = new Map<number, ProgressLike>()

  for (const row of progress) {
    merged.set(row.level_id, row)
  }

  for (const languageModule of LANGUAGE_MODULES) {
    for (const level of languageModule.levels) {
      const levelId = toStorageLevelId(languageModule, level.id)
      const existing = merged.get(levelId)
      merged.set(levelId, {
        level_id: levelId,
        is_completed: true,
        attempts: Math.max(existing?.attempts ?? 0, 1),
      })
    }
  }

  return [...merged.values()]
}
