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

function useCompactCourseLayout() {
  const [compact, setCompact] = useState(true)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1279px)')
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
