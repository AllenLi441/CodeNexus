'use client'

import { useState } from 'react'
import { ArrowRight, CheckCircle2, Circle, Loader2, RotateCcw, Route, Sparkles } from 'lucide-react'
import type { Level } from '@/lib/levels'
import {
  clearCustomRoute,
  saveCustomRoute,
  toggleRouteStep,
  type CustomRoute,
  type LearningProfile,
} from '@/lib/learning-profile'
import { useCommandSettings } from '@/hooks/use-command-settings'

// Honest preview shown to logged-out visitors so they see what they'd get,
// without any fake generation or live level links.
const GUEST_EXAMPLE: Array<{ title: string; why: string; concept: string; task: string }> = [
  { title: '让程序先开口说话', why: '游戏得先能跟玩家打招呼、出题', concept: '输出 print', task: '让它打印「我想了一个 1-100 的数字」' },
  { title: '记住那个神秘数字', why: '猜数字的核心是有个被猜的目标', concept: '变量 / 随机数', task: '用一个变量存住答案，先写死成 42' },
  { title: '听玩家猜了几', why: '要拿到玩家输入才能判断', concept: '输入 input', task: '读入一个数字并打印出来确认拿到了' },
  { title: '告诉玩家大了还是小了', why: '这一步让它真正像个游戏', concept: '条件 if / else', task: '比较猜测和答案，分三种情况回应' },
]

type Props = {
  route?: CustomRoute
  levels: Level[]
  languageName: string
  guestMode?: boolean
  onChangeLevel: (id: number) => void
  onProfileChange?: (profile: LearningProfile) => void
}

const SECTION_WRAP = 'border-b border-white/5 px-4 pb-3 pt-2'
const CARD = 'rounded-lg border border-white/8 bg-black/28 p-3'

export function CustomRoutePanel({ route, levels, languageName, guestMode, onChangeLevel, onProfileChange }: Props) {
  const { settings } = useCommandSettings()
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generate() {
    const trimmed = goal.trim()
    if (!trimmed || loading) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/custom-route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(settings.aiApiKey
            ? {
                'x-codenexus-ai-key': settings.aiApiKey,
                'x-codenexus-ai-base-url': settings.aiBaseUrl,
                'x-codenexus-ai-model': settings.aiModel,
              }
            : {}),
        },
        body: JSON.stringify({ goal: trimmed, languageName }),
      })
      const data = (await res.json().catch(() => ({}))) as { steps?: unknown; error?: string }
      if (!res.ok) {
        setError(typeof data.error === 'string' ? data.error : '生成失败，稍后再试。')
        return
      }
      const incoming = Array.isArray(data.steps)
        ? (data.steps as Array<{ title: string; why?: string; concept?: string; task: string; levelId?: number | null }>)
        : []
      if (incoming.length < 2) {
        setError('这次没生成出清晰的路线，换个说法再试。')
        return
      }
      const next = saveCustomRoute({ goal: trimmed, steps: incoming })
      onProfileChange?.(next)
      setGoal('')
    } catch {
      setError('网络打了个盹，再试一次。')
    } finally {
      setLoading(false)
    }
  }

  function toggle(stepId: string) {
    onProfileChange?.(toggleRouteStep(stepId))
  }

  function reset() {
    onProfileChange?.(clearCustomRoute())
    setError('')
  }

  // ── Header (shared) ─────────────────────────────────────────────────────────
  const header = (
    <div className="mb-2 flex items-center gap-2">
      <Route className="h-3.5 w-3.5 text-cyan-200/70" />
      <p className="text-xs font-semibold text-white/72">{route ? '我的定制路线' : '你想做个什么？'}</p>
      <Sparkles className="ml-auto h-3 w-3 text-cyan-200/45" />
    </div>
  )

  // ── State: an active route exists ───────────────────────────────────────────
  if (route) {
    const doneCount = route.steps.filter((s) => s.done).length
    const allDone = doneCount === route.steps.length
    return (
      <div className={SECTION_WRAP}>
        <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.035] p-3">
          {header}
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="min-w-0 flex-1 truncate text-[11px] text-white/45">
              目标：<span className="text-cyan-100/75">{route.goal}</span>
            </p>
            <span className="flex-shrink-0 font-mono text-[10px] text-cyan-200/60">{doneCount}/{route.steps.length}</span>
          </div>

          <div className="grid gap-2">
            {route.steps.map((step, index) => {
              const linked = typeof step.levelId === 'number' ? levels.find((l) => l.id === step.levelId) : undefined
              return (
                <div
                  key={step.id}
                  className={`${CARD} ${step.done ? 'border-emerald-300/20 bg-emerald-300/[0.05]' : ''}`}
                >
                  <button
                    type="button"
                    onClick={() => toggle(step.id)}
                    className="cn-focus-ring flex w-full items-start gap-2 text-left"
                  >
                    {step.done ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-300" />
                    ) : (
                      <Circle className="mt-0.5 h-4 w-4 flex-shrink-0 text-white/22" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className={`flex items-center gap-2 text-xs font-semibold ${step.done ? 'text-emerald-100/70 line-through' : 'text-white/78'}`}>
                        <span className="font-mono text-[10px] text-cyan-200/55">{index + 1}</span>
                        {step.title}
                      </span>
                      {step.why ? <span className="mt-0.5 block text-[11px] leading-relaxed text-white/42">{step.why}</span> : null}
                    </span>
                  </button>

                  <div className="mt-1.5 pl-6">
                    {step.concept ? (
                      <span className="inline-block rounded border border-cyan-300/14 bg-cyan-300/[0.04] px-1.5 py-0.5 font-mono text-[9px] text-cyan-100/70">
                        {step.concept}
                      </span>
                    ) : null}
                    <p className="mt-1 text-[11px] leading-relaxed text-white/40">{step.task}</p>
                    {linked ? (
                      <button
                        type="button"
                        onClick={() => onChangeLevel(linked.id)}
                        className="cn-focus-ring mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-cyan-300/70 transition-colors hover:text-cyan-200"
                      >
                        去 Lv.{linked.id} 练手 <ArrowRight className="h-3 w-3" />
                      </button>
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>

          {allDone ? (
            <p className="mt-2 text-[11px] leading-relaxed text-emerald-200/70">
              整条路线都打勾了 —— 你已经把「{route.goal}」拆开走了一遍。可以重新定制下一个目标。
            </p>
          ) : null}

          <button
            type="button"
            onClick={reset}
            className="cn-focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-[10px] text-white/35 transition-colors hover:border-cyan-300/25 hover:text-cyan-100/65"
          >
            <RotateCcw className="h-3 w-3" />
            重新定制
          </button>
        </div>
      </div>
    )
  }

  // ── State: guest — honest preview, no live generation ───────────────────────
  if (guestMode) {
    return (
      <div className={SECTION_WRAP}>
        <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.035] p-3">
          {header}
          <p className="text-[11px] leading-relaxed text-white/45">
            说出你真正想做的东西（记账小工具、猜数字游戏…），登录后我会把它拆成 4–6 步专属路线，每步还标好可以去练的关卡。下面是一个示例：
          </p>
          <div className="mt-2 grid gap-1.5 opacity-70">
            {GUEST_EXAMPLE.map((step, index) => (
              <div key={step.title} className={`${CARD} border-dashed`}>
                <p className="flex items-center gap-2 text-xs font-semibold text-white/65">
                  <span className="font-mono text-[10px] text-cyan-200/55">{index + 1}</span>
                  {step.title}
                </p>
                <p className="mt-0.5 pl-5 text-[11px] leading-relaxed text-white/40">{step.why} · {step.task}</p>
              </div>
            ))}
          </div>
          <a
            href="/login"
            className="cn-focus-ring mt-2 inline-flex items-center gap-1 font-mono text-[10px] text-cyan-300/75 transition-colors hover:text-cyan-200"
          >
            登录后生成我的专属路线 <ArrowRight className="h-3 w-3" />
          </a>
        </div>
      </div>
    )
  }

  // ── State: logged-in, no route yet — the entry ──────────────────────────────
  return (
    <div className={SECTION_WRAP}>
      <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.035] p-3">
        {header}
        <p className="mb-2 text-[11px] leading-relaxed text-white/45">
          说出你真正想做的东西，我帮你拆成 4–6 步专属路线，每步标好概念、动手任务，还能跳去练对应关卡。
        </p>
        <input
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              void generate()
            }
          }}
          disabled={loading}
          placeholder="记账小工具、猜数字游戏、每日一句…"
          className="cn-focus-ring w-full rounded-lg border border-white/10 bg-black/35 px-2.5 py-2 text-xs text-white/80 placeholder:text-white/25 disabled:opacity-50"
        />
        {error ? <p className="mt-1.5 text-[11px] leading-relaxed text-amber-300/80">{error}</p> : null}
        <button
          type="button"
          onClick={generate}
          disabled={loading || !goal.trim()}
          className="cn-focus-ring mt-2 inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-cyan-300/[0.08] px-3 py-1.5 text-[11px] font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {loading ? '正在为你定制…' : '生成定制路线'}
        </button>
      </div>
    </div>
  )
}
