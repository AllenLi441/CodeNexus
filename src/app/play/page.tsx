import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { PythonRunner } from '@/components/workshop/python-runner'
import { GuestDashboard } from '@/components/dashboard/guest-dashboard'
import { ProjectStudio } from '@/components/workshop/project-studio'
import { getProjectCheckpoint } from '@/lib/learning-profile'
import { getLanguageModule } from '@/lib/language-modules'

export const metadata: Metadata = {
  title: '免费试玩 | CodeNexus',
  description: '不用注册，直接进入 CodeNexus 主界面，选择语言、分支和课程。',
}

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string; level?: string; project?: string }>
}) {
  const { language: languageParam, level: levelParam, project: projectParam } = await searchParams
  const lang = (await cookies()).get('zf-lang')?.value === 'en' ? 'en' : 'zh'
  const codename = lang === 'en' ? 'Rookie' : '试玩新人'
  const language = getLanguageModule(languageParam)
  const levelId = Math.min(Math.max(parseInt(levelParam ?? '', 10) || 0, 1), language.levels.length)
  const projectAfter = parseInt(projectParam ?? '', 10)

  if (projectParam && Number.isFinite(projectAfter) && getProjectCheckpoint(language.name, projectAfter)) {
    return (
      <ProjectStudio
        languageId={language.id}
        codename={codename}
        afterLevel={projectAfter}
        demoMode
      />
    )
  }

  if (!levelParam) {
    return <GuestDashboard activeLanguageId={language.id} />
  }

  return (
    <PythonRunner
      mode="guest-play"
      languageId={language.id}
      codename={codename}
      initialLevelId={levelId}
      initialProgress={[]}
      initialSettings={{
        tauntFrequency: 62,
        fontMode: 'hacker',
        noiseBrightness: 48,
        chatDock: 'right',
        chatPanelWidth: 390,
        autoOpenMentor: false,
        idleMentorDelay: 45,
        editorFontSize: 14,
        terminalFontSize: 14,
        mapAnimations: true,
        courseViewMode: 'picker',
        assistantPersona: 'mika',
        assistantLiveliness: 58,
        assistantMemory: false,
      }}
    />
  )
}
