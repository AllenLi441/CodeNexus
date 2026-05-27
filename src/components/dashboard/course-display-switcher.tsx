'use client'

import { useEffect, useState } from 'react'
import type { ProgressRow } from '@/app/actions/progress'
import { CoursePicker } from '@/components/dashboard/course-picker'
import { QuestMap } from '@/components/dashboard/quest-map'
import { useCommandSettings, type CommandSettings } from '@/hooks/use-command-settings'

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
}: {
  progress: ProgressRow[]
  activeLanguageId?: string
  initialSettings?: Partial<CommandSettings> | null
  demoMode?: boolean
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
    />
  )
}
