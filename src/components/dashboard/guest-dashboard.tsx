import Link from 'next/link'
import { ArrowRight, EyeOff, LogIn, Route, TerminalSquare } from 'lucide-react'
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
            <Link
              href="/login"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/58 transition-colors hover:border-cyan-300/28 hover:text-cyan-100"
            >
              <LogIn className="h-3.5 w-3.5" />
              登录
            </Link>
            <Link
              href="/register?from=play"
              className="cn-focus-ring inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-black transition-colors hover:bg-cyan-200"
            >
              保存进度
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-3 py-5 sm:px-4 sm:py-7">
        <div className="mb-6 grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-cyan-300/45">Guest Mission Control</p>
              <h1 className="mt-2 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                试玩主界面已接入。
              </h1>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/48">
                你可以先选语言、选分支、进课程体验。小助手云端聊天和保存需要登录；没登录就没有用户身份，进度确实没地方写。
              </p>
            </div>

            <CourseDisplaySwitcher
              key={activeLanguage.id}
              progress={[]}
              activeLanguageId={activeLanguage.id}
              initialSettings={GUEST_SETTINGS}
              demoMode
            />
          </div>

          <div className="space-y-4">
            <section className="cn-panel-cyan p-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/20 bg-black/36 text-cyan-100">
                <Route className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-white">当前路线：{activeLanguage.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-white/40">{activeLanguage.description}</p>
              <Link
                href={`/play?language=${activeLanguage.route}&level=1`}
                className="cn-focus-ring mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-black transition-all duration-300 hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                进入第一课
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </section>

            <section className="cn-panel p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/72">
                <EyeOff className="h-4 w-4 text-cyan-200/65" />
                试玩限制
              </p>
              <div className="mt-3 grid gap-2 text-xs leading-relaxed text-white/40">
                <p className="rounded-lg border border-white/8 bg-black/36 px-3 py-2">小助手云端聊天关闭：避免未登录状态调用个人 AI 会话。</p>
                <p className="rounded-lg border border-white/8 bg-black/36 px-3 py-2">进度不保存：刷新或换设备后不会继承通关记录。</p>
                <p className="rounded-lg border border-white/8 bg-black/36 px-3 py-2">非 Python 语言使用本地结构检查；Python 仍可在浏览器里跑。</p>
              </div>
            </section>

            <section className="cn-panel px-4 py-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-white/72">
                <TerminalSquare className="h-4 w-4 text-cyan-200/65" />
                运行模式
              </p>
              <p className="mt-2 text-xs leading-relaxed text-white/36">{routeSnapshot.runtimeNote}</p>
            </section>

            <section className="cn-panel p-5">
              <p className="text-sm font-semibold text-white/72">领域规模</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div className="rounded-lg border border-white/8 bg-black/42 p-3">
                  <p className="font-mono text-2xl font-semibold text-white">{activeLanguage.courseMaps.length}</p>
                  <p className="mt-1 text-[10px] text-white/30">条分支</p>
                </div>
                <div className="rounded-lg border border-white/8 bg-black/42 p-3">
                  <p className="font-mono text-2xl font-semibold text-white">{totalCourseTasks}</p>
                  <p className="mt-1 text-[10px] text-white/30">道规划训练</p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  )
}
