import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Activity, ArrowRight, GitBranch, LogOut, Route, Target, TerminalSquare } from 'lucide-react'
import { getCurrentUser } from '@/lib/supabase/server'
import { logout } from '@/app/(auth)/actions'
import { fetchUserProgress } from '@/app/actions/progress'
import { fetchAchievements } from '@/app/actions/achievements'
import { Button } from '@/components/ui/button'
import { BrandHeader } from '@/components/layout/logo'
import { CourseDisplaySwitcher } from '@/components/dashboard/course-display-switcher'
import { AchievementCabinet } from '@/components/dashboard/achievement-cabinet'
import { DashboardMentor } from '@/components/dashboard/dashboard-mentor'
import { CommandCenter } from '@/components/settings/command-center'
import { OnboardingClient } from '@/app/onboarding/onboarding-client'
import { getMapLessonCount } from '@/lib/course-maps'
import {
  completedModuleLevelIds,
  getLanguageModule,
  nextModuleLevelId,
} from '@/lib/language-modules'
import { getLanguageRouteSnapshot } from '@/lib/course-engagement'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>
}) {
  const { language: languageParam } = await searchParams
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const [{ progress, profile }, earnedIds] = await Promise.all([
    fetchUserProgress(),
    fetchAchievements(),
  ])

  const meta = user.user_metadata
  const savedName = profile.nickname?.trim() || (meta?.display_name as string | undefined)?.trim()

  if (!savedName) {
    return <OnboardingClient redirectTo="/dashboard" />
  }

  const displayName = savedName
  const preferredLanguage = typeof meta?.preferred_language === 'string' ? meta.preferred_language : undefined
  const activeLanguage = getLanguageModule(languageParam ?? preferredLanguage)
  const completedLevelIds = completedModuleLevelIds(activeLanguage, progress)
  const completedCount = completedLevelIds.length
  const totalCourseTasks = activeLanguage.courseMaps.reduce((sum, map) => sum + getMapLessonCount(map), 0)
  const routeSnapshot = getLanguageRouteSnapshot(activeLanguage.name)
  const mentorStage = completedCount === 0
    ? 'new-user'
    : completedCount === activeLanguage.levels.length
    ? 'branches-unlocked'
    : 'normal'
  const initialSettings = {
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
  }

  const nextLevelId = nextModuleLevelId(activeLanguage, progress)

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white cn-noise">
      <header className="sticky top-0 z-20 border-b border-cyan-300/12 bg-black/84 backdrop-blur-xl">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <BrandHeader dark />
          <div className="flex items-center gap-2">
            <Link
              href="/wall"
              className="cn-focus-ring hidden h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/48 transition-colors hover:border-cyan-300/28 hover:text-cyan-100 sm:inline-flex"
            >
              吐槽墙
            </Link>
            <CommandCenter initialCodename={displayName} initialSettings={initialSettings} compact />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2 text-white/45 hover:text-white">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">退出</span>
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-7">
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_320px]">

          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/45">Mission Control</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                {displayName}，{activeLanguage.name} 链路已接入。
              </h1>
              <p className="mt-1 text-sm text-white/48">
                {completedCount === 0
                  ? `从 ${activeLanguage.name} 第一个节点开始，先把入口、输出和类型打稳。`
                  : completedCount === activeLanguage.levels.length
                  ? `${activeLanguage.name} 基础节点已清理。现在可以去专业分支写点像项目的东西。`
                  : `已完成 ${completedCount} / ${activeLanguage.levels.length} 个节点，继续推进。`}
              </p>
            </div>

            <CourseDisplaySwitcher
              key={activeLanguage.id}
              progress={progress}
              activeLanguageId={activeLanguage.id}
              initialSettings={initialSettings}
            />
            <AchievementCabinet earnedIds={earnedIds} />
          </div>

          <div className="space-y-4">
            <section className="cn-panel-cyan p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-white/72">
                  <Activity className="h-4 w-4 text-cyan-200/70" />
                  基础进度
                </span>
                <span className="font-mono text-2xl font-bold text-cyan-200">{completedCount}/{activeLanguage.levels.length}</span>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-cyan-300 transition-all duration-700"
                  style={{ width: `${Math.round((completedCount / activeLanguage.levels.length) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-white/34">
                {activeLanguage.levels.length} 个基础节点清理完，后面的领域分支才算真正开门。
              </p>
            </section>

            <section className="cn-panel p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/72">
                <GitBranch className="h-4 w-4 text-cyan-200/65" />
                领域分支
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/8 bg-black/42 p-3">
                  <p className="font-mono text-2xl font-semibold text-white">{activeLanguage.courseMaps.length}</p>
                  <p className="mt-1 text-[10px] text-white/30">条领域枝干</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/42 p-3">
                  <p className="font-mono text-2xl font-semibold text-white">{totalCourseTasks}</p>
                  <p className="mt-1 text-[10px] text-white/30">道规划训练</p>
                </div>
              </div>
            </section>

            <section className="cn-panel px-4 py-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/72">
                <TerminalSquare className="h-4 w-4 text-cyan-200/65" />
                运行模式
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/36">{routeSnapshot.runtimeNote}</p>
            </section>

            <Link href={`/learn/${activeLanguage.route}?level=${nextLevelId}`}>
              <section className="group cursor-pointer rounded-lg border border-cyan-300/25 bg-cyan-300/8 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-300/13 hover:shadow-[0_18px_70px_rgba(34,211,238,0.12)]">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-black/36 text-cyan-100">
                  <Route className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-white">继续任务</p>
                  <p className="mt-0.5 text-xs text-white/42">
                    接入 Lv.{nextLevelId} 代码节点
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-cyan-200 transition-all group-hover:gap-2">
                  进入 <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </section>
            </Link>

            <section className="cn-panel px-4 py-4">
              <div className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-black/35 text-white/35">
                <Target className="h-4 w-4" />
              </div>
              <p className="text-center text-xs italic leading-relaxed text-white/38">
                &quot;先把第一行代码跑通，再聊天赋。&quot;
              </p>
              <p className="mt-1 text-center text-[10px] text-white/18">CodeNexus 小助手</p>
            </section>
          </div>

        </div>
      </main>
      <DashboardMentor
        codename={displayName}
        languageName={activeLanguage.name}
        languageRoute={activeLanguage.route}
        stage={mentorStage}
        nextLevelId={nextLevelId}
        settings={initialSettings}
      />
    </div>
  )
}
