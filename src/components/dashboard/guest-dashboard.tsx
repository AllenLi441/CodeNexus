import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BotMessageSquare,
  CloudOff,
  Code2,
  LockKeyhole,
  LogIn,
  MessageSquareText,
  MonitorPlay,
  Radar,
  Save,
  TerminalSquare,
} from 'lucide-react'
import { BrandHeader } from '@/components/layout/logo'
import { SiteFooter } from '@/components/layout/site-footer'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { CourseDisplaySwitcher } from '@/components/dashboard/course-display-switcher'
import { NewUserTutorial } from '@/components/dashboard/new-user-tutorial'
import { getMapLessonCount } from '@/lib/course-maps'
import { getLanguageModule } from '@/lib/language-modules'
import { getLanguageRouteSnapshot } from '@/lib/course-engagement'
import { getServerLang } from '@/lib/i18n-server'
import { translate } from '@/lib/i18n'

const GUEST_SETTINGS = {
  tauntFrequency: 62,
  fontMode: 'cyberpunk' as const,
  noiseBrightness: 48,
  chatDock: 'right' as const,
  chatPanelWidth: 390,
  autoOpenMentor: false,
  idleMentorDelay: 45,
  editorFontSize: 14,
  terminalFontSize: 14,
  mapAnimations: true,
  courseViewMode: 'picker' as const,
  assistantPersona: 'mika' as const,
  assistantLiveliness: 58,
  assistantMemory: false,
}

export async function GuestDashboard({ activeLanguageId = 'python' }: { activeLanguageId?: string }) {
  const lang = await getServerLang()
  const activeLanguage = getLanguageModule(activeLanguageId)
  const routeSnapshot = getLanguageRouteSnapshot(activeLanguage.name)
  const totalCourseTasks = activeLanguage.courseMaps.reduce((sum, map) => sum + getMapLessonCount(map), 0)

  return (
    <div className="min-h-[100dvh] overflow-hidden bg-background text-foreground cn-noise">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(103,232,249,0.18),transparent_30%),radial-gradient(circle_at_84%_10%,rgba(20,184,166,0.12),transparent_24%),linear-gradient(180deg,var(--background)_0%,var(--background)_70%)]" />
        <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-cyan-200/32 to-transparent" />
        <div className="absolute left-0 right-0 top-28 h-[560px] opacity-45 [background-image:linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.06)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_72%,transparent)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-cyan-300/12 bg-background/78 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <BrandHeader dark />
          <div className="flex items-center gap-2">
            <LanguageToggle variant="badge" />
            <span className="hidden rounded-lg border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-2 font-mono text-xs text-cyan-100/68 md:inline-flex">
              {translate('学习', lang)}
            </span>
            <Link
              href="/wall"
              className="cn-focus-ring hidden h-9 items-center justify-center rounded-lg border border-hairline px-3 text-sm font-semibold text-ink-mute transition-colors hover:border-cyan-300/28 hover:text-cyan-100 sm:inline-flex"
            >
              {translate('吐槽墙', lang)}
            </Link>
            <Link
              href="/login"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-hairline px-3 text-sm font-semibold text-ink-soft transition-colors hover:border-cyan-300/28 hover:text-cyan-100"
            >
              <LogIn className="h-3.5 w-3.5" />
              {translate('登录', lang)}
            </Link>
            <Link
              href="/register?from=play"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              <Save className="hidden h-3.5 w-3.5 sm:block" />
              <span className="hidden sm:inline">{translate('保存进度', lang)}</span>
              <span className="sm:hidden">{translate('保存', lang)}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="grid gap-6 pb-7 lg:grid-cols-[1fr_420px] lg:items-center lg:pb-9">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-1.5 text-xs font-medium text-cyan-100/78">
              <Radar className="h-3.5 w-3.5" />
              {translate('AI 编程学习 · 从 0 到实战', lang)}
            </div>
            <h1 className="mt-6 text-balance text-[2.65rem] font-semibold leading-[1.04] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              {translate('先把代码跑起来，', lang)}
              <span className="block text-primary">{translate('再谈长期学习。', lang)}</span>
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-base leading-8 text-ink-soft sm:text-lg">
              {translate('在 CodeNexus，你可以直接在浏览器里学编程、运行代码、获得小助手反馈。从第一句 `print()` 开始，逐步建立真正能动手的编程思维。', lang)}
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-hairline bg-foreground/[0.03] p-4 backdrop-blur transition-colors duration-300 hover:border-cyan-300/22 hover:bg-foreground/[0.05]">
                <Code2 className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">{translate('在线编程', lang)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-mute">{translate('浏览器内编辑、运行代码。', lang)}</p>
              </div>
              <div className="rounded-2xl border border-hairline bg-foreground/[0.03] p-4 backdrop-blur transition-colors duration-300 hover:border-cyan-300/22 hover:bg-foreground/[0.05]">
                <MessageSquareText className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">{translate('AI 小助手', lang)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-mute">{translate('登录后保留上下文和记忆。', lang)}</p>
              </div>
              <div className="rounded-2xl border border-hairline bg-foreground/[0.03] p-4 backdrop-blur transition-colors duration-300 hover:border-cyan-300/22 hover:bg-foreground/[0.05]">
                <MonitorPlay className="h-5 w-5 text-primary" />
                <p className="mt-3 text-sm font-semibold text-foreground">{translate('实战导向', lang)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-mute">{translate('从小练习走向项目作品。', lang)}</p>
              </div>
            </div>
          </div>

          <aside className="cn-panel-cyan rounded-[1.6rem] p-5 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/24 bg-cyan-200/[0.08]">
                <Image
                  src="/assistant-assets/nexus-default-chibi-avatar.png"
                  alt={translate('Nexus 小助手', lang)}
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[var(--code-green)] shadow-[0_0_14px_color-mix(in_oklab,var(--code-green)_70%,transparent)]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{translate('Nexus 小助手', lang)}</p>
                <p className="mt-1 text-xs text-emerald-200/72">{translate('游客模式在线', lang)}</p>
              </div>
            </div>

            <p className="mt-5 text-pretty text-sm leading-7 text-ink-soft">
              {translate('你好，我会在课程里解释概念、观察你的代码意图，并把你从“看懂了”拽到“真的写出来”。', lang)}
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-hairline bg-foreground/[0.03] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-ink-soft">
                  <BotMessageSquare className="h-4 w-4 text-primary" />
                  {translate('当前路线', lang)}
                </p>
                <p className="mt-2 text-sm font-semibold text-primary">{translate(activeLanguage.name, lang)}</p>
                <p className="mt-1 text-xs leading-5 text-ink-mute">{translate(activeLanguage.description, lang)}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-hairline bg-background/40 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft">
                    <CloudOff className="h-3.5 w-3.5 text-amber-200/75" />
                    {translate('进度状态', lang)}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-ink-soft">{translate('未保存', lang)}</p>
                  <p className="mt-1 text-xs leading-5 text-ink-mute">{translate('登录后才能跨设备保留学习记录。', lang)}</p>
                </div>
                <div className="rounded-xl border border-hairline bg-background/40 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-ink-soft">
                    <TerminalSquare className="h-3.5 w-3.5 text-primary/75" />
                    {translate('运行模式', lang)}
                  </p>
                  <p className="mt-2 text-xs leading-5 text-ink-mute">{translate(routeSnapshot.runtimeNote, lang)}</p>
                </div>
              </div>

              <Link
                href={`/play?language=${activeLanguage.route}&level=1`}
                className="cn-focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
              >
                {translate('进入第一课', lang)}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>

        <div className="pb-7 lg:pb-9">
          <NewUserTutorial
            codename={lang === 'en' ? 'Rookie' : '试玩新人'}
            languageName={activeLanguage.name}
            languageRoute={activeLanguage.route}
            startHref={`/play?language=${activeLanguage.route}&level=1`}
            settings={GUEST_SETTINGS}
            mode="guest"
          />
        </div>

        <section className="cn-panel-cyan rounded-[1.5rem] p-3 backdrop-blur-2xl sm:p-4">
          <div className="mb-4 flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/45">Course Launchpad</p>
              <h2 className="mt-1 text-xl font-semibold text-foreground">{translate('选择你的学习路径', lang)}</h2>
              <p className="mt-1 text-sm leading-6 text-ink-mute">{translate('先选语言，再选领域分支，最后进入具体课程。', lang)}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-ink-mute">
              <span className="rounded-lg border border-hairline bg-foreground/[0.03] px-2.5 py-1.5 tabular-nums">
                {activeLanguage.courseMaps.length} {translate('条分支', lang)}
              </span>
              <span className="rounded-lg border border-hairline bg-foreground/[0.03] px-2.5 py-1.5 tabular-nums">
                {totalCourseTasks} {translate('道训练', lang)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/16 bg-amber-300/[0.06] px-2.5 py-1.5 text-amber-100/62">
                <LockKeyhole className="h-3 w-3" />
                {translate('试玩不保存', lang)}
              </span>
            </div>
          </div>

          <CourseDisplaySwitcher
            key={activeLanguage.id}
            progress={[]}
            activeLanguageId={activeLanguage.id}
            initialSettings={GUEST_SETTINGS}
            demoMode
          />
        </section>
      </main>

      <SiteFooter lang={lang} />
    </div>
  )
}
