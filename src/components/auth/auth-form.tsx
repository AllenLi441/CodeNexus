'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CloudOff,
  Code2,
  LogIn,
  Play,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  UserPlus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage, useTr } from '@/contexts/language-context'
import { login, register } from '@/app/(auth)/actions'
import { BrandHeader } from '@/components/layout/logo'

type Mode = 'login' | 'register'
type ActionState = { error?: string; needsConfirmation?: boolean } | null

const PRODUCT_POINTS = [
  '先试玩，再决定是否注册',
  '课程、编辑器、运行结果在同一屏',
  '登录后同步进度和小助手记忆',
]

function isServiceOfflineError(message?: string) {
  return Boolean(message?.includes('认证服务暂时连接不上') || message?.includes('Supabase 项目可能处于暂停'))
}

function getSupabaseDashboardUrl() {
  try {
    const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').hostname
    const ref = host.split('.')[0]
    return ref ? `https://supabase.com/dashboard/project/${ref}` : null
  } catch {
    return null
  }
}

export function AuthForm({ mode, initialError }: { mode: Mode; initialError?: string }) {
  const { t } = useLanguage()
  const tr = useTr()
  const isLogin = mode === 'login'
  const strings = isLogin ? t.auth.login : t.auth.register

  const [state, action, isPending] = useActionState<ActionState, FormData>(
    isLogin ? login : register,
    null
  )

  // Email confirmation screen
  if (state?.needsConfirmation) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background px-4 py-8 text-foreground cn-noise">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(103,232,249,0.24),transparent_36%),linear-gradient(180deg,rgba(8,12,20,0.8),var(--background)_62%)]" />
        <div className="relative z-10 w-full max-w-md space-y-6 text-center">
          <div className="inline-flex justify-center">
            <BrandHeader />
          </div>
          <div className="rounded-2xl border border-cyan-200/16 bg-white/[0.04] p-7 shadow-2xl shadow-cyan-950/30 backdrop-blur-2xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-200/25 bg-cyan-200/10 text-cyan-100">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div className="mt-5 space-y-3">
              <div className="space-y-2">
                <h2 className="text-xl font-bold">{t.auth.confirmTitle}</h2>
                <p className="text-sm leading-relaxed text-white/58">
                  {t.auth.confirmDesc}
                  <br />
                  {t.auth.confirmSub}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/36 px-4 py-3 text-xs text-white/44">
                {t.auth.noEmailHint}
              </div>
              <Link href="/register">
                <Button variant="outline" className="mt-2 h-11 w-full border-white/12 bg-white/5 text-white hover:bg-white/10">
                  {t.auth.backToRegister}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const errorMessage = state?.error ?? initialError
  const serviceOffline = isServiceOfflineError(errorMessage)
  const supabaseDashboardUrl = serviceOffline ? getSupabaseDashboardUrl() : null

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background text-foreground cn-noise">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(103,232,249,0.18),transparent_27%),radial-gradient(circle_at_78%_22%,rgba(20,184,166,0.13),transparent_25%),linear-gradient(180deg,var(--background)_0%,var(--background)_64%)]" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />
        <div className="absolute left-[7%] top-[18%] h-60 w-60 rounded-full border border-cyan-200/10 blur-3xl" />
        <div className="absolute bottom-[-16%] right-[8%] h-72 w-72 rounded-full bg-cyan-300/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto grid min-h-[100dvh] w-full max-w-6xl items-center gap-8 px-4 py-7 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-xl">
            <BrandHeader dark />
            <div className="mt-14 space-y-5">
              <p className="font-mono text-xs uppercase tracking-[0.36em] text-cyan-200/50">AI Programming Campus</p>
              <h1 className="text-balance text-5xl font-semibold leading-[1.04] tracking-tight text-foreground">
                {tr('先把代码跑起来，再谈长期学习。')}
              </h1>
              <p className="max-w-lg text-pretty text-base leading-8 text-ink-soft">
                {tr('CodeNexus 把课程讲解、练习编辑器、运行反馈和小助手合到一个工作台里。不是把视频搬进网页，而是让你边理解边动手。')}
              </p>
            </div>

            <div className="mt-10 grid gap-3">
              {PRODUCT_POINTS.map((point) => (
                <div
                  key={point}
                  className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/[0.035] px-4 py-3 text-sm text-white/68 backdrop-blur"
                >
                  <CheckCircle2 className="h-4 w-4 text-cyan-200" />
                  <span>{tr(point)}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-cyan-200/14 bg-black/45 p-4 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-white/8 pb-3">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-amber-300" />
                  <span className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="font-mono text-xs text-white/30">lesson.preview.ts</span>
              </div>
              <div className="grid gap-4 py-4 sm:grid-cols-[0.8fr_1fr]">
                <div className="rounded-xl border border-cyan-200/12 bg-cyan-200/[0.045] p-4">
                  <TerminalSquare className="h-5 w-5 text-cyan-100" />
                  <p className="mt-4 text-sm font-semibold text-white">{tr('第一课不是看完就算')}</p>
                  <p className="mt-2 text-xs leading-6 text-white/42">{tr('读教学、写代码、看运行结果，然后再进入下一步。')}</p>
                </div>
                <div className="space-y-2 rounded-xl border border-white/8 bg-black/40 p-4 font-mono text-xs text-white/44">
                  <p><span className="text-cyan-200">1</span> print(&quot;Hello, CodeNexus&quot;)</p>
                  <p><span className="text-cyan-200">2</span> {tr('# 运行后马上看到反馈')}</p>
                  <p className="pt-2 text-[var(--code-green)]">Output: Hello, CodeNexus</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[460px]">
          <div className="mb-7 flex items-center justify-between lg:hidden">
            <BrandHeader dark />
            <LanguageToggle variant="badge" />
          </div>

          <div className="rounded-[1.35rem] border border-cyan-200/18 bg-[#05080d]/86 shadow-2xl shadow-cyan-950/28 backdrop-blur-2xl">
            <div className="border-b border-white/8 px-5 py-4 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
                    {isLogin ? <LogIn className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
                  </div>
                  <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground">{strings.title}</h2>
                  <p className="mt-2 text-pretty text-sm leading-6 text-ink-mute">{strings.desc}</p>
                </div>
                <div className="hidden items-center gap-1.5 text-xs text-white/38 sm:flex">
                  <span>{t.nav.language}:</span>
                  <LanguageToggle variant="badge" />
                </div>
              </div>
            </div>

            <form action={action} className="px-5 py-5 sm:px-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-white/74">{t.auth.emailLabel}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete={isLogin ? 'username' : 'email'}
                    className="h-12 border-white/10 bg-white/[0.06] px-4 text-white placeholder:text-white/22 focus-visible:border-cyan-200/70 focus-visible:ring-cyan-200/18"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-white/74">{t.auth.passwordLabel}</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder={isLogin ? t.auth.passwordPlaceholderLogin : t.auth.passwordPlaceholderRegister}
                    required
                    minLength={6}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    className="h-12 border-white/10 bg-white/[0.06] px-4 text-white placeholder:text-white/22 focus-visible:border-cyan-200/70 focus-visible:ring-cyan-200/18"
                  />
                </div>

                {errorMessage && (
                  <div
                    className={
                      serviceOffline
                        ? 'rounded-xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3 text-sm text-amber-50/88'
                        : 'rounded-xl border border-red-300/20 bg-red-400/[0.08] px-4 py-3 text-sm text-red-50/88'
                    }
                  >
                    <div className="flex items-start gap-3">
                      {serviceOffline ? (
                        <CloudOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-200" />
                      ) : (
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-200" />
                      )}
                      <div className="space-y-1">
                        <p className="font-semibold">{serviceOffline ? tr('认证服务离线') : tr('登录请求失败')}</p>
                        <p className="leading-6 opacity-80">{errorMessage}</p>
                        {serviceOffline && (
                          <p className="text-xs leading-5 opacity-64">
                            {tr('这个需要在 Supabase Dashboard 恢复项目 ZeroForge。恢复后不用改代码，刷新再登录即可。')}
                          </p>
                        )}
                        {supabaseDashboardUrl && (
                          <a
                            href={supabaseDashboardUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-2 inline-flex text-xs font-semibold text-amber-100 underline underline-offset-4 hover:text-white"
                          >
                            {tr('打开 Supabase 项目')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-5 flex flex-col gap-3">
                <Button
                  type="submit"
                  className="h-12 w-full bg-primary text-sm font-semibold text-primary-foreground shadow-[0_8px_22px_color-mix(in_oklab,var(--primary)_22%,transparent)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
                  disabled={isPending}
                >
                  {isPending ? t.auth.loading : strings.submit}
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <Link
                  href="/play"
                  className="cn-focus-ring inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-4 text-sm font-semibold text-white/74 transition-all duration-300 hover:border-cyan-200/26 hover:bg-cyan-200/[0.07] hover:text-white"
                >
                  <Play className="h-4 w-4" />
                  {tr('先不注册，进入试玩主界面')}
                </Link>
              </div>
            </form>

            <div className="border-t border-white/8 px-5 py-4 sm:px-6">
              <p className="text-center text-sm text-white/48">
                {strings.switchText}{' '}
                <Link
                  href={isLogin ? '/register' : '/login'}
                  className="font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  {strings.switchLink}
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4 text-sm text-white/52 backdrop-blur">
              <Sparkles className="h-4 w-4 text-cyan-200" />
              <p className="mt-3 font-semibold text-white/78">{tr('新手友好')}</p>
              <p className="mt-1 text-xs leading-5 text-white/38">{tr('先读教学，再进入空编辑器实践。')}</p>
            </div>
            <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4 text-sm text-white/52 backdrop-blur">
              <Code2 className="h-4 w-4 text-cyan-200" />
              <p className="mt-3 font-semibold text-white/78">{tr('多语言路线')}</p>
              <p className="mt-1 text-xs leading-5 text-white/38">{tr('Python、C、C++、Java、C#、JS、VB。')}</p>
            </div>
          </div>

          <p className="mt-5 px-2 text-center text-xs leading-relaxed text-white/34">{t.auth.terms}</p>
        </section>
      </main>
    </div>
  )
}
