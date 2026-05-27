import { notFound, redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/server'
import { fetchUserProgress } from '@/app/actions/progress'
import { ProjectStudio } from '@/components/workshop/project-studio'
import { getProjectCheckpoint } from '@/lib/learning-profile'
import {
  LANGUAGE_MODULES,
  getLanguageModule,
  isModuleLevelCompleted,
} from '@/lib/language-modules'

function parseAfter(value: string | undefined, maxLevel: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  if (parsed < 5 || parsed > maxLevel || parsed % 5 !== 0) return null
  return parsed
}

export default async function ProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ language: string }>
  searchParams: Promise<{ after?: string }>
}) {
  const [{ language: languageParam }, { after }] = await Promise.all([params, searchParams])
  const language = getLanguageModule(languageParam)
  if (!LANGUAGE_MODULES.some((item) => item.route === languageParam || item.id === languageParam)) notFound()

  const afterLevel = parseAfter(after, language.levels.length)
  if (!afterLevel || !getProjectCheckpoint(language.name, afterLevel)) notFound()

  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const { progress, profile } = await fetchUserProgress()
  if (!isModuleLevelCompleted(language, afterLevel, progress)) {
    redirect(`/dashboard?language=${language.route}`)
  }

  const codename = profile.nickname?.trim() || (user.user_metadata?.display_name as string | undefined)?.trim() || '无名小白'

  return (
    <ProjectStudio
      languageId={language.id}
      codename={codename}
      afterLevel={afterLevel}
    />
  )
}
