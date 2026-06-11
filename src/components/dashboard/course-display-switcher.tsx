'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ProgressRow } from '@/app/actions/progress'
import { CoursePicker } from '@/components/dashboard/course-picker'
import { useCommandSettings, type CommandSettings } from '@/hooks/use-command-settings'

// QuestMap pulls in the whole ReactFlow library but only renders in 'map' view
// on wide screens — load it on demand so the default picker view doesn't pay.
const QuestMap = dynamic(
  () => import('@/components/dashboard/quest-map').then((m) => m.QuestMap),
  {
    ssr: false,
    loading: () => <div className="h-[480px] animate-pulse rounded-lg border border-white/8 bg-black/40" />,
  }
)

// Below this width the ReactFlow star map is too cramped, so we fall back to the
// picker. Kept at the tablet breakpoint (was 1279px, which wrongly forced the
// picker on most laptops even when the user explicitly chose the map view).
const COMPACT_QUERY = '(max-width: 767px)'

function useCompactCourseLayout() {
  // Read the real viewport on the first client render so a user who chose the
  // map view doesn't see a flash of the picker before it switches.
  const [compact, setCompact] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(COMPACT_QUERY).matches
  )

  useEffect(() => {
    const media = window.matchMedia(COMPACT_QUERY)
    const update = () => setCompact(media.matches)
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  return compact
}

export function CourseDisplaySwitcher({
  progress,
  activeLanguageId = 'python',
  initialSettings,
  demoMode = false,
  unlockAll = true,
}: {
  progress: ProgressRow[]
  activeLanguageId?: string
  initialSettings?: Partial<CommandSettings> | null
  demoMode?: boolean
  unlockAll?: boolean
}) {
  const { settings } = useCommandSettings(initialSettings)
  const compactCourseLayout = useCompactCourseLayout()

  if (settings.courseViewMode === 'map' && !compactCourseLayout) {
    return (
      <QuestMap
        key={`map-${activeLanguageId}`}
        progress={progress}
        activeLanguageId={activeLanguageId}
        initialSettings={settings}
        demoMode={demoMode}
        unlockAll={unlockAll}
        showLanguageBack
      />
    )
  }

  return (
    <CoursePicker
      key={`picker-${activeLanguageId}`}
      progress={progress}
      activeLanguageId={activeLanguageId}
      demoMode={demoMode}
      unlockAll={unlockAll}
    />
  )
}
