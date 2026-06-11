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
import { NewUserTutorial } from '@/components/dashboard/new-user-tutorial'
import { CommandCenter } from '@/components/settings/command-center'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { OnboardingClient } from '@/app/onboarding/onboarding-client'
import { getMapLessonCount } from '@/lib/course-maps'
import {
  completedModuleLevelIds,
  getLanguageModule,
  nextModuleLevelId,
} from '@/lib/language-modules'
import { getLanguageRouteSnapshot } from '@/lib/course-engagement'
import { getServerLang } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ language?: string }>
}) {
  const { language: languageParam } = await searchParams
  const lang = await getServerLang()
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
    <div className="min-h-[100dvh] overflow-hidden bg-background text-foreground cn-noise">
      <header className="cn-frost-bar sticky top-0 z-20 border-b border-hairline">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
          <BrandHeader dark />
          <div className="flex items-center gap-2">
            <LanguageToggle variant="badge" />
            <CommandCenter initialCodename={displayName} initialSettings={initialSettings} compact />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="gap-2 text-ink-mute hover:text-foreground">
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{translate('退出', lang)}</span>
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
              <h1 className="mt-2 text-balance text-xl font-semibold leading-tight tracking-tight text-foreground sm:text-2xl">
                {displayName}{translate('，', lang)}{translate(activeLanguage.name, lang)}{translate(' 链路已接入。', lang)}
              </h1>
              <p className="mt-1 text-pretty text-sm text-ink-mute">
                {completedCount === 0
                  ? translate('从 {language} 第一个节点开始，先把入口、输出和类型打稳。', lang).replace('{language}', translate(activeLanguage.name, lang))
                  : completedCount === activeLanguage.levels.length
                  ? translate('{language} 基础节点已清理。现在可以去专业分支写点像项目的东西。', lang).replace('{language}', translate(activeLanguage.name, lang))
                  : translate('已完成 {done} / {total} 个节点，继续推进。', lang).replace('{done}', String(completedCount)).replace('{total}', String(activeLanguage.levels.length))}
              </p>
            </div>

            {completedCount === 0 && (
              <NewUserTutorial
                codename={displayName}
                languageName={activeLanguage.name}
                languageRoute={activeLanguage.route}
                startHref={`/learn/${activeLanguage.route}?level=${nextLevelId}`}
                settings={initialSettings}
                mode="authenticated"
              />
            )}
            <CourseDisplaySwitcher
              key={activeLanguage.id}
              progress={progress}
              activeLanguageId={activeLanguage.id}
              initialSettings={initialSettings}
            />
            <AchievementCabinet earnedIds={earnedIds} />
          </div>

          <div className="space-y-4">
            <Link href={`/learn/${activeLanguage.route}?level=${nextLevelId}`}>
              <section className="group cursor-pointer rounded-2xl border border-primary/30 bg-primary/8 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/13 active:scale-[0.99]">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/20 bg-background/40 text-primary">
                  <Route className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <p className="text-sm font-semibold text-foreground">{translate('继续任务', lang)}</p>
                  <p className="mt-0.5 text-xs text-ink-mute">
                    {translate('接入 Lv.', lang)}<span className="tabular-nums">{nextLevelId}</span>{translate(' 代码节点', lang)}
                  </p>
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-primary transition-all group-hover:gap-2">
                  {translate('进入', lang)} <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </section>
            </Link>

            <section className="cn-panel-cyan rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <Activity className="h-4 w-4 text-primary/70" />
                  {translate('基础进度', lang)}
                </span>
                <span className="font-mono text-2xl font-bold tabular-nums text-primary">{completedCount}/{activeLanguage.levels.length}</span>
              </div>
              <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-foreground/8">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    completedCount === activeLanguage.levels.length ? 'bg-[var(--code-green)]' : 'bg-primary'
                  }`}
                  style={{ width: `${Math.round((completedCount / activeLanguage.levels.length) * 100)}%` }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-ink-mute">
                {completedCount === activeLanguage.levels.length
                  ? translate('基础节点全部点亮，领域分支已经为你开门。', lang)
                  : translate('{total} 个基础节点点亮后，领域分支就会开门。', lang).replace('{total}', String(activeLanguage.levels.length))}
              </p>
            </section>

            <section className="cn-panel rounded-2xl p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <GitBranch className="h-4 w-4 text-primary/65" />
                {translate('领域分支', lang)}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-hairline bg-foreground/[0.025] p-3">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{activeLanguage.courseMaps.length}</p>
                  <p className="mt-1 text-[10px] text-ink-mute">{translate('条领域枝干', lang)}</p>
                </div>
                <div className="rounded-xl border border-hairline bg-foreground/[0.025] p-3">
                  <p className="font-mono text-2xl font-semibold tabular-nums text-foreground">{totalCourseTasks}</p>
                  <p className="mt-1 text-[10px] text-ink-mute">{translate('道规划训练', lang)}</p>
                </div>
              </div>
            </section>

            <section className="cn-panel rounded-2xl px-4 py-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                <TerminalSquare className="h-4 w-4 text-primary/65" />
                {translate('运行模式', lang)}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-ink-mute">{translate(routeSnapshot.runtimeNote, lang)}</p>
            </section>

            <p className="flex items-start gap-2 px-1.5 text-[11px] italic leading-relaxed text-ink-mute">
              <Target className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/45" />
              <span>&quot;{translate('先把第一行代码跑通，其他都会跟上。', lang)}&quot; {translate('— CodeNexus 小助手', lang)}</span>
            </p>
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
