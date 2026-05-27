import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PythonRunner } from '@/components/workshop/python-runner'
import { fetchUserProgress } from '@/app/actions/progress'
import { getLanguageModule } from '@/lib/language-modules'

export default async function LearnPythonPage({
  searchParams,
}: {
  searchParams: Promise<{ level?: string }>
}) {
  const { level: levelParam } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { progress, profile } = await fetchUserProgress()
  const language = getLanguageModule('python')
  const initialLevelId = Math.min(Math.max(parseInt(levelParam ?? '1', 10) || 1, 1), language.levels.length)
  const codename = profile.nickname?.trim() || (user.user_metadata?.display_name as string | undefined)?.trim() || '无名小白'

  return (
    <PythonRunner
      languageId={language.id}
      codename={codename}
      initialLevelId={initialLevelId}
      initialProgress={progress}
      initialSettings={{
        tauntFrequency: profile.mentor_taunt_frequency,
        fontMode: profile.mentor_font_mode,
        noiseBrightness: profile.noise_brightness,
        chatDock: profile.chat_dock,
        chatPanelWidth: profile.chat_panel_width,
        autoOpenMentor: profile.auto_open_mentor,
        idleMentorDelay: profile.idle_mentor_delay,
        editorFontSize: profile.editor_font_size,
        terminalFontSize: profile.terminal_font_size,
        mapAnimations: profile.map_animations,
        courseViewMode: profile.course_view_mode,
        assistantPersona: profile.assistant_persona,
        assistantLiveliness: profile.assistant_liveliness,
        assistantMemory: profile.assistant_memory,
      }}
    />
  )
}
