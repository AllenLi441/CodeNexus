import type { Metadata } from 'next'
import { PythonRunner } from '@/components/workshop/python-runner'
import { GuestDashboard } from '@/components/dashboard/guest-dashboard'
import { ProjectStudio } from '@/components/workshop/project-studio'
import { getProjectCheckpoint } from '@/lib/learning-profile'
import { getLanguageModule } from '@/lib/language-modules'
import { getServerLang } from '@/lib/i18n-server'

export async function generateMetadata(): Promise<Metadata> {
  const isEn = (await getServerLang()) === 'en'
  return isEn
    ? {
        title: 'Learn to code in your browser — free trial',
        description: 'No signup needed. Pick a language, a track, and a lesson — then write and run real code with AI guidance.',
        openGraph: { url: '/play' },
        alternates: { canonical: '/play' },
      }
    : {
        title: '在浏览器里学编程 · 免费试玩',
        description: '不用注册，选择语言、分支和课程，在 AI 引导下直接写代码、跑代码。',
        openGraph: { url: '/play' },
        alternates: { canonical: '/play' },
      }
}

export default async function PlayPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string; level?: string; project?: string }>
}) {
  const { language: languageParam, level: levelParam, project: projectParam } = await searchParams
  const lang = await getServerLang()
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
        fontMode: 'cyberpunk',
        noiseBrightness: 0,
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
