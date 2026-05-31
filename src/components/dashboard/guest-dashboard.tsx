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
import { CourseDisplaySwitcher } from '@/components/dashboard/course-display-switcher'
import { getMapLessonCount } from '@/lib/course-maps'
import { getLanguageModule } from '@/lib/language-modules'
import { getLanguageRouteSnapshot } from '@/lib/course-engagement'

const GUEST_SETTINGS = {
  tauntFrequency: 62,
  fontMode: 'hacker' as const,
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

export function GuestDashboard({ activeLanguageId = 'python' }: { activeLanguageId?: string }) {
  const activeLanguage = getLanguageModule(activeLanguageId)
  const routeSnapshot = getLanguageRouteSnapshot(activeLanguage.name)
  const totalCourseTasks = activeLanguage.courseMaps.reduce((sum, map) => sum + getMapLessonCount(map), 0)

  return (
    <div className="min-h-screen overflow-hidden bg-black text-white cn-noise">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(103,232,249,0.18),transparent_30%),radial-gradient(circle_at_84%_10%,rgba(20,184,166,0.12),transparent_24%),linear-gradient(180deg,#020409_0%,#000_70%)]" />
        <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-cyan-200/32 to-transparent" />
        <div className="absolute left-0 right-0 top-28 h-[560px] opacity-45 [background-image:linear-gradient(rgba(103,232,249,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(103,232,249,0.06)_1px,transparent_1px)] [background-size:72px_72px] [mask-image:linear-gradient(to_bottom,transparent,black_18%,black_72%,transparent)]" />
      </div>

      <header className="sticky top-0 z-20 border-b border-cyan-300/12 bg-black/78 backdrop-blur-2xl">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-4 py-2 sm:px-6">
          <BrandHeader dark />
          <div className="flex items-center gap-2">
            <span className="hidden rounded-lg border border-cyan-300/18 bg-cyan-300/[0.06] px-3 py-2 font-mono text-xs text-cyan-100/68 md:inline-flex">
              学习
            </span>
            <Link
              href="/wall"
              className="cn-focus-ring hidden h-9 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/48 transition-colors hover:border-cyan-300/28 hover:text-cyan-100 sm:inline-flex"
            >
              吐槽墙
            </Link>
            <Link
              href="/login"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/64 transition-colors hover:border-cyan-300/28 hover:text-cyan-100"
            >
              <LogIn className="h-3.5 w-3.5" />
              登录
            </Link>
            <Link
              href="/register?from=play"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              <Save className="hidden h-3.5 w-3.5 sm:block" />
              <span className="hidden sm:inline">保存进度</span>
              <span className="sm:hidden">保存</span>
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
              AI 编程学习 · 从 0 到实战
            </div>
            <h1 className="mt-6 text-[2.65rem] font-semibold leading-[1.06] tracking-tight text-white sm:text-6xl lg:text-7xl">
              先把代码跑起来，
              <span className="block text-cyan-200">再谈长期学习。</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/54 sm:text-lg">
              在 CodeNexus，你可以直接在浏览器里学编程、运行代码、获得小助手反馈。从第一句 `print()` 开始，逐步建立真正能动手的编程思维。
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur">
                <Code2 className="h-5 w-5 text-cyan-200" />
                <p className="mt-3 text-sm font-semibold text-white/86">在线编程</p>
                <p className="mt-1 text-xs leading-5 text-white/38">浏览器内编辑、运行代码。</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur">
                <MessageSquareText className="h-5 w-5 text-cyan-200" />
                <p className="mt-3 text-sm font-semibold text-white/86">AI 小助手</p>
                <p className="mt-1 text-xs leading-5 text-white/38">登录后保留上下文和记忆。</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.035] p-4 backdrop-blur">
                <MonitorPlay className="h-5 w-5 text-cyan-200" />
                <p className="mt-3 text-sm font-semibold text-white/86">实战导向</p>
                <p className="mt-1 text-xs leading-5 text-white/38">从小练习走向项目作品。</p>
              </div>
            </div>
          </div>

          <aside className="rounded-[1.4rem] border border-cyan-200/18 bg-[#05080d]/82 p-5 shadow-2xl shadow-cyan-950/25 backdrop-blur-2xl">
            <div className="flex items-center gap-4">
              <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-cyan-200/24 bg-cyan-200/[0.08]">
                <Image
                  src="/assistant-assets/nexus-default-chibi-avatar.png"
                  alt="Nexus 小助手"
                  width={56}
                  height={56}
                  className="h-14 w-14 object-contain"
                />
                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.8)]" />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Nexus 小助手</p>
                <p className="mt-1 text-xs text-emerald-200/72">游客模式在线</p>
              </div>
            </div>

            <p className="mt-5 text-sm leading-7 text-white/52">
              你好，我会在课程里解释概念、观察你的代码意图，并把你从“看懂了”拽到“真的写出来”。
            </p>

            <div className="mt-5 grid gap-3">
              <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/78">
                  <BotMessageSquare className="h-4 w-4 text-cyan-200" />
                  当前路线
                </p>
                <p className="mt-2 text-sm font-semibold text-cyan-100">{activeLanguage.name}</p>
                <p className="mt-1 text-xs leading-5 text-white/38">{activeLanguage.description}</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-xl border border-white/8 bg-black/34 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-white/58">
                    <CloudOff className="h-3.5 w-3.5 text-amber-200/75" />
                    进度状态
                  </p>
                  <p className="mt-2 text-sm font-semibold text-white/78">未保存</p>
                  <p className="mt-1 text-xs leading-5 text-white/34">登录后才能跨设备保留学习记录。</p>
                </div>
                <div className="rounded-xl border border-white/8 bg-black/34 p-4">
                  <p className="inline-flex items-center gap-2 text-xs font-semibold text-white/58">
                    <TerminalSquare className="h-3.5 w-3.5 text-cyan-200/75" />
                    运行模式
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/36">{routeSnapshot.runtimeNote}</p>
                </div>
              </div>

              <Link
                href={`/play?language=${activeLanguage.route}&level=1`}
                className="cn-focus-ring inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 text-sm font-semibold text-black shadow-lg shadow-cyan-500/16 transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                进入第一课
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </aside>
        </section>

        <section className="rounded-[1.35rem] border border-cyan-200/16 bg-[#05080d]/76 p-3 shadow-2xl shadow-cyan-950/20 backdrop-blur-2xl sm:p-4">
          <div className="mb-4 flex flex-col justify-between gap-3 px-1 sm:flex-row sm:items-end">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-cyan-300/45">Course Launchpad</p>
              <h2 className="mt-1 text-xl font-semibold text-white">选择你的学习路径</h2>
              <p className="mt-1 text-sm leading-6 text-white/42">先选语言，再选领域分支，最后进入具体课程。</p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] text-white/38">
              <span className="rounded-lg border border-white/8 bg-white/[0.035] px-2.5 py-1.5">
                {activeLanguage.courseMaps.length} 条分支
              </span>
              <span className="rounded-lg border border-white/8 bg-white/[0.035] px-2.5 py-1.5">
                {totalCourseTasks} 道训练
              </span>
              <span className="inline-flex items-center gap-1 rounded-lg border border-amber-300/16 bg-amber-300/[0.06] px-2.5 py-1.5 text-amber-100/62">
                <LockKeyhole className="h-3 w-3" />
                试玩不保存
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
    </div>
  )
}
