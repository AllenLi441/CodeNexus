'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Keyboard,
  MessageCircle,
  MousePointerClick,
  Play,
  RotateCcw,
  Settings2,
  Sparkles,
  TerminalSquare,
  X,
  type LucideIcon,
} from 'lucide-react'
import { AssistantAvatar } from '@/components/assistant/assistant-avatar'
import { resolveAssistantPersona } from '@/lib/assistant-persona'
import { appleSpring } from '@/lib/motion'
import { useTr } from '@/contexts/language-context'
import type { CommandSettings } from '@/hooks/use-command-settings'

type TutorialStep = {
  icon: LucideIcon
  title: string
  body: string
  checkpoints: string[]
}

type NewUserTutorialProps = {
  codename: string
  languageName: string
  languageRoute: string
  startHref: string
  settings: Partial<CommandSettings>
  mode: 'guest' | 'authenticated'
}

const AUTH_STEPS: TutorialStep[] = [
  {
    icon: Compass,
    title: '先选学习路径',
    body: '主界面不是关卡堆叠，而是三段式入口：语言、领域分支、具体课程。新手先走基础分支，把入口、输出、变量、条件、循环和函数打稳。',
    checkpoints: ['左侧/中间选择语言', '再选基础或领域分支', '最后进入一节具体课程'],
  },
  {
    icon: BookOpen,
    title: '每关先看教学',
    body: '课程不会一上来塞答案。小助手会先讲这关解决什么、脑内模型是什么、最容易错在哪里，然后编辑器才出现。',
    checkpoints: ['读完本课路线', '看常见坑和术语速查', '点“打开空编辑器”再实践'],
  },
  {
    icon: Keyboard,
    title: '编辑器默认空白',
    body: '真正的学习发生在你自己写第一行代码时。先写最小可运行版本，别一开始就堆框架、堆长答案。',
    checkpoints: ['先写最短代码', '一次只验证一个目标', '失败时只改最关键的一处'],
  },
  {
    icon: TerminalSquare,
    title: '运行结果就是证据',
    body: '点运行后先看终端输出和测试项。能跑不等于做对，测试项会告诉你目标有没有对齐。',
    checkpoints: ['看第一条报错', '看失败测试的提示', '通关后复盘哪一行真正起作用'],
  },
  {
    icon: MessageCircle,
    title: '卡住就叫小助手',
    body: '小助手会读取当前课程、代码、报错和你的提问。你可以打字，也可以用语音输入把问题说出来。',
    checkpoints: ['点击右下角 Q 版小助手', '选择“观察当前代码”', '用麦克风把问题填进对话框'],
  },
  {
    icon: Settings2,
    title: '把工作台调顺手',
    body: '命令中心可以调代号、小助手人格、字体、聊天面板宽度、活人感和课程显示方式。先让界面适合你，再长期学。',
    checkpoints: ['不想被打扰就降低活人感', '喜欢列表就用选择入口', '喜欢地图就切回领域分析'],
  },
]

const GUEST_STEPS: TutorialStep[] = [
  {
    icon: Play,
    title: '先试玩，不先注册',
    body: '游客模式能浏览课程、进入第一课、运行代码和体验小助手。本质限制只有一个：未登录不能保存跨设备进度。',
    checkpoints: ['先体验第一课', '确认自己喜欢这套流程', '想保存再注册'],
  },
  {
    icon: Code2,
    title: '不是看视频，是边学边写',
    body: '你会先读一段清楚的教学，再自己打开空编辑器实践。平台会用运行结果和测试项判断你是不是真的写对。',
    checkpoints: ['看教学页', '打开空编辑器', '运行并观察输出'],
  },
  {
    icon: Sparkles,
    title: '登录后才有完整记忆',
    body: '正式账号会保存进度、设置、小助手偏好和长期学习上下文。试玩助手只给本地提示，不会替你保存。',
    checkpoints: ['试玩不写入进度', '登录后同步设置', '后续可以继续领域分支'],
  },
]

function storageKey(mode: NewUserTutorialProps['mode'], languageRoute: string) {
  return `codenexus.beginner-tutorial.${mode}.${languageRoute}.dismissed.v1`
}

export function NewUserTutorial({
  codename,
  languageName,
  languageRoute,
  startHref,
  settings,
  mode,
}: NewUserTutorialProps) {
  const tr = useTr()
  const persona = resolveAssistantPersona(settings.assistantPersona)
  const steps = mode === 'guest' ? GUEST_STEPS : AUTH_STEPS
  const key = useMemo(() => storageKey(mode, languageRoute), [languageRoute, mode])
  const [stepIndex, setStepIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const StepIcon = step.icon
  const isLast = stepIndex === steps.length - 1

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      try {
        setDismissed(window.localStorage.getItem(key) === '1')
      } catch {
        setDismissed(false)
      }
    })
    return () => { cancelled = true }
  }, [key])

  function closeTutorial() {
    setDismissed(true)
    try {
      window.localStorage.setItem(key, '1')
    } catch {
      // localStorage may be unavailable in locked-down browsers.
    }
  }

  if (dismissed) {
    return (
      <button
        type="button"
        onClick={() => {
          setDismissed(false)
          setStepIndex(0)
          try {
            window.localStorage.removeItem(key)
          } catch {
            // ignore
          }
        }}
        className="cn-focus-ring inline-flex w-full items-center justify-between rounded-lg border border-cyan-300/14 bg-cyan-300/[0.045] px-4 py-3 text-left text-sm text-cyan-50/68 transition-colors hover:border-cyan-300/28 hover:bg-cyan-300/[0.075]"
      >
        <span className="inline-flex items-center gap-2">
          <RotateCcw className="h-4 w-4 text-cyan-200/70" />
          {tr('重看')} {languageName} {tr('新手教程')}
        </span>
        <ArrowRight className="h-4 w-4" />
      </button>
    )
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={appleSpring}
      className="relative overflow-hidden rounded-lg border border-cyan-300/18 bg-[#05090d]/86 p-4 shadow-[0_22px_80px_rgba(8,145,178,0.12)] backdrop-blur-2xl sm:p-5"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_0%,rgba(103,232,249,0.15),transparent_34%),linear-gradient(90deg,rgba(103,232,249,0.05),transparent_42%)]" />
      <div className="relative grid gap-4 lg:grid-cols-[280px_1fr] lg:items-stretch">
        <div className="flex flex-col justify-between rounded-lg border border-white/8 bg-black/32 p-4">
          <div>
            <div className="flex items-center justify-between gap-3">
              <AssistantAvatar
                personaId={persona.id}
                size="md"
                active={(settings.assistantLiveliness ?? 55) > 45}
              />
              <button
                type="button"
                onClick={closeTutorial}
                title={tr('关闭新手教程')}
                className="cn-focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-white/32 transition-colors hover:bg-white/[0.06] hover:text-white/68"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/48">
              Beginner Protocol
            </p>
            <h2 className="mt-2 text-xl font-semibold leading-snug text-white">
              {codename}{tr('，先用 3 分钟搞懂 CodeNexus。')}
            </h2>
            <p className="mt-3 text-sm leading-7 text-white/48">
              {tr(persona.name)} {tr('会把新手第一轮路线讲清楚：怎么选课、怎么写、怎么运行、什么时候问小助手。')}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-1.5">
            {steps.map((item, index) => (
              <button
                key={item.title}
                type="button"
                onClick={() => setStepIndex(index)}
                className={`cn-focus-ring h-2 rounded-full transition-all duration-300 ${
                  index === stepIndex ? 'w-9 bg-cyan-200' : 'w-2 bg-white/16 hover:bg-white/28'
                }`}
                title={item.title}
              />
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-cyan-300/14 bg-black/28 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-300/22 bg-cyan-300/10 text-cyan-100">
                <StepIcon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-300/45">
                  Step {stepIndex + 1}/{steps.length}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-white">{tr(step.title)}</h3>
              </div>
            </div>
            <span className="inline-flex w-fit items-center gap-1.5 rounded-lg border border-cyan-300/16 bg-cyan-300/[0.07] px-2.5 py-1.5 text-[11px] text-cyan-50/58">
              <MousePointerClick className="h-3.5 w-3.5" />
              {mode === 'guest' ? tr('试玩教程') : tr('新账号教程')}
            </span>
          </div>

          <p className="mt-4 text-sm leading-7 text-white/56">{tr(step.body)}</p>

          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {step.checkpoints.map((checkpoint) => (
              <div key={checkpoint} className="rounded-lg border border-white/8 bg-white/[0.025] px-3 py-2.5 text-xs leading-relaxed text-white/45">
                <CheckCircle2 className="mb-2 h-4 w-4 text-cyan-200/65" />
                {tr(checkpoint)}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            {!isLast ? (
              <button
                type="button"
                onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                className="cn-focus-ring inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                {tr('下一步')}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={startHref}
                className="cn-focus-ring inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-4 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
              >
                {tr('进入第一课')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <button
              type="button"
              onClick={closeTutorial}
              className="cn-focus-ring inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/52 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/24 hover:text-cyan-100 sm:flex-none"
            >
              {tr('我知道了')}
            </button>
          </div>
        </div>
      </div>
    </motion.section>
  )
}
