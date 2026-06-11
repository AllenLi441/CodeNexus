'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code2,
  Compass,
  Map,
  MousePointerClick,
  Play,
  Settings2,
  Sparkles,
  TerminalSquare,
  X,
  type LucideIcon,
} from 'lucide-react'
import { appleSpring } from '@/lib/motion'
import type { CommandSettings } from '@/hooks/use-command-settings'
import { AssistantAvatar } from '@/components/assistant/assistant-avatar'
import { resolveAssistantPersona } from '@/lib/assistant-persona'
import { useTr } from '@/contexts/language-context'

type MentorStage = 'new-user' | 'branches-unlocked' | 'normal'

type DashboardMentorProps = {
  codename: string
  languageName: string
  languageRoute: string
  stage: MentorStage
  nextLevelId: number
  settings: Partial<CommandSettings>
}

type TutorialStep = {
  icon: LucideIcon
  title: string
  body: string
  bullets: string[]
}

function mentorCopy(stage: MentorStage, codename: string, languageName: string, languageRoute: string, assistantName: string, tr: (zh: string) => string) {
  if (stage === 'branches-unlocked') {
    return {
      kicker: 'ROOT CLEAR · BRANCHES ONLINE',
      title: tr('{codename}，基础根系打通了。{assistant} 带你选后续路线。').replace('{codename}', codename).replace('{assistant}', assistantName),
      body: tr('{lang} 基础已经够你进入领域分支。接下来别刷散题，去选一个方向做成作品。').replace('{lang}', languageName),
      bullets: ['从 Pygame、CV、数据、Web、AI 里选一个方向', '先看分支目标，再进具体课程', '每条分支最终都应该产出一个能展示的小项目'],
      primaryLabel: '查看领域分支',
      primaryHref: '#course-branches',
      secondaryLabel: '看 Pygame / CV',
      secondaryHref: '#course-branches',
    }
  }

  return {
    kicker: 'FIRST RUN · NEXUS GUIDE',
    title: tr('{codename}，欢迎接入。{assistant} 先带你走一圈。').replace('{codename}', codename).replace('{assistant}', assistantName),
    body: tr('这里不是单纯看视频，也不是把答案喂进编辑器。你会先听小助手讲清楚概念，再自己写代码，用真实运行和测试确认你真的会了。'),
    bullets: ['先选语言，再选分支，再选课程', '每关先看小助手教学，再打开空编辑器实践', '运行失败时，小助手会根据当前代码和报错给下一步提示'],
    primaryLabel: '接入第一关',
    primaryHref: `/learn/${languageRoute}?level=1`,
    secondaryLabel: '先看分支',
    secondaryHref: '#course-branches',
  }
}

function tutorialSteps(stage: MentorStage, languageName: string, assistantName: string, tr: (zh: string) => string): TutorialStep[] {
  if (stage === 'branches-unlocked') {
    return [
      {
        icon: Compass,
        title: '你现在该选方向了',
        body: tr('基础关不是终点，只是让你看得懂 {lang} 程序怎么入口、怎么传数据、怎么把结果交出去。接下来要把这些能力接到真实领域。').replace('{lang}', languageName),
        bullets: ['想做可视化就进数据/CV', '想做作品展示就进 Pygame/Web', '想做智能应用就进 AI 分支'],
      },
      {
        icon: Sparkles,
        title: '每条分支都要有作品感',
        body: tr('后面的课程不应该只是“又学一个语法”。目标是做出能运行、能截图、能解释给别人听的小项目。'),
        bullets: ['分支课程先看路线，不要乱跳', '遇到报错让小助手读上下文', '完成后把代码和结果变成作品素材'],
      },
    ]
  }

  return [
    {
      icon: Compass,
      title: '先认路：语言、分支、课程',
      body: tr('仪表盘中间是课程入口。你先选 {lang}，再选一个领域分支，最后进入具体课程。这样不会被一堆关卡糊脸。').replace('{lang}', languageName),
      bullets: ['基础分支负责入口、变量、条件、循环、函数', '领域分支负责把基础能力接到游戏、数据、Web、AI、CV 等方向', '搜索栏可以直接找课程，不必死翻地图'],
    },
    {
      icon: BookOpen,
      title: '每一关先听我讲，再动手',
      body: tr('{assistant} 会先用人话讲清楚“这关有什么用、脑子里怎么建模、最容易错在哪里”。读完以后编辑器才上场，而且是空的。').replace('{assistant}', assistantName),
      bullets: ['不是复制答案，而是先理解最小结构', '教学页会给术语、真实用途、常见坑和自测问题', '你写出的第一版越短，越容易找到问题'],
    },
    {
      icon: Code2,
      title: '写代码时，我会看上下文',
      body: tr('你不用每次点运行我才知道发生了什么。停顿、语法异常、运行错误、测试失败都会进入小助手上下文。'),
      bullets: ['空编辑器会提醒你先写最小代码', '报错时优先读第一行错误', '测试失败时先对齐目标输出或核心结构'],
    },
    {
      icon: TerminalSquare,
      title: '运行不是仪式，是验证',
      body: tr('点运行后，{lang} 代码会交给当前运行模式处理。你要看的是：终端输出、测试检查、以及失败提示里最关键的一处。').replace('{lang}', languageName),
      bullets: ['先让代码跑起来，再追求漂亮', '一次只修一个问题', '通关后回想：是哪一行真正让目标成立'],
    },
    {
      icon: Settings2,
      title: '把工作台调成你的习惯',
      body: tr('右上角命令中心可以改代号、小助手人格、字体、面板宽度和活人感。它是学习工具，不是固定死的考试界面。'),
      bullets: ['不喜欢小助手多话，可以降低活人感', '想换角色，可以在命令中心切换', '移动端也可以用，只是建议第一轮学习先用桌面更舒服'],
    },
  ]
}

export function DashboardMentor({ codename, languageName, languageRoute, stage, nextLevelId, settings }: DashboardMentorProps) {
  const tr = useTr()
  const [isOpen, setIsOpen] = useState(stage !== 'normal')
  const [stepIndex, setStepIndex] = useState(0)
  const persona = resolveAssistantPersona(settings.assistantPersona)
  const copy = mentorCopy(stage, codename, languageName, languageRoute, persona.name, tr)
  const steps = tutorialSteps(stage, languageName, persona.name, tr)
  const step = steps[Math.min(stepIndex, steps.length - 1)]
  const StepIcon = step.icon
  const isLastStep = stepIndex === steps.length - 1

  if (stage === 'normal') return null

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          initial={{ opacity: 0, y: 24, scale: 0.97, filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: 18, scale: 0.98, filter: 'blur(8px)' }}
          transition={appleSpring}
          className="fixed bottom-4 left-3 right-3 z-40 max-h-[calc(100dvh-32px)] overflow-hidden rounded-lg border border-cyan-300/22 bg-black/94 text-white shadow-[0_28px_100px_rgba(0,0,0,0.68),0_0_70px_rgba(34,211,238,0.14)] backdrop-blur-2xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-[min(520px,calc(100vw-32px))]"
        >
          <div className="flex items-center gap-3 border-b border-white/8 bg-white/[0.035] px-4 py-3">
            <AssistantAvatar personaId={persona.id} size="sm" active={(settings.assistantLiveliness ?? 55) > 55} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{persona.name}</p>
              <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/45">{copy.kicker}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              title={tr('关闭导师')}
              className="cn-focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/8 hover:text-white/75"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="cn-scrollbar max-h-[calc(100dvh-104px)] space-y-4 overflow-y-auto p-4 sm:p-5">
            <div>
              <h2 className="text-lg font-semibold leading-snug text-white">{copy.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-white/56">{copy.body}</p>
            </div>

            <div className="rounded-lg border border-cyan-300/16 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.12),transparent_38%),rgba(255,255,255,0.025)] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-cyan-300/22 bg-cyan-300/10 text-cyan-100">
                    <StepIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-cyan-300/42">
                      {tr('小助手教程')} {stepIndex + 1}/{steps.length}
                    </p>
                    <h3 className="mt-1 text-sm font-semibold text-white/86">{tr(step.title)}</h3>
                  </div>
                </div>
                <div className="flex gap-1">
                  {steps.map((item, index) => (
                    <span
                      key={item.title}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === stepIndex ? 'w-6 bg-cyan-200' : 'w-1.5 bg-white/16'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm leading-relaxed text-white/58">{step.body}</p>
              <div className="mt-3 grid gap-2">
                {step.bullets.map((item) => (
                  <div key={item} className="flex items-start gap-2 rounded-lg border border-white/8 bg-black/28 px-3 py-2 text-xs leading-relaxed text-white/48">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-200/70" />
                    <span>{tr(item)}</span>
                  </div>
                ))}
              </div>
            </div>

            {stage === 'new-user' && (
              <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.045] px-3 py-3 text-xs leading-relaxed text-cyan-50/62">
                <span className="inline-flex items-center gap-2 font-semibold text-cyan-50/82">
                  <MousePointerClick className="h-3.5 w-3.5" />
                  {tr('第一件事')}
                </span>
                <p className="mt-1">
                  {tr('进入 Lv.{n}，先看教学页，再自己写第一段 {lang} 代码。过关不是为了亮一个勾，而是证明你能把“概念 → 代码 → 输出”接起来。')
                    .replace('{n}', String(nextLevelId))
                    .replace('{lang}', languageName)}
                </p>
              </div>
            )}

            <div className="grid gap-2">
              {copy.bullets.map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-lg border border-white/8 bg-white/[0.018] px-3 py-2 text-xs text-white/42">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-200/55" />
                  <span>{tr(item)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                disabled={stepIndex === 0}
                className="cn-focus-ring flex h-10 w-12 items-center justify-center rounded-lg border border-white/10 text-white/45 transition-colors hover:border-cyan-300/24 hover:text-cyan-100 disabled:pointer-events-none disabled:opacity-30"
                title={tr('上一步')}
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              {!isLastStep ? (
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.min(steps.length - 1, current + 1))}
                  className="cn-focus-ring flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  {tr('继续听')} {persona.name} {tr('介绍')}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  href={copy.primaryHref}
                  className="cn-focus-ring flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 text-sm font-semibold text-black transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200"
                >
                  {stage === 'new-user' ? <Play className="h-4 w-4" /> : <Map className="h-4 w-4" />}
                  {stage === 'new-user' ? `${tr('接入 Lv.')}${nextLevelId}` : tr(copy.primaryLabel)}
                </Link>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href={copy.secondaryHref}
                className="cn-focus-ring flex h-10 flex-1 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/58 transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/28 hover:text-cyan-100"
              >
                {tr(copy.secondaryLabel)}
              </Link>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="cn-focus-ring flex h-10 flex-1 items-center justify-center rounded-lg border border-white/10 px-3 text-sm font-semibold text-white/38 transition-all duration-200 hover:-translate-y-0.5 hover:border-white/20 hover:text-white/65"
              >
                {tr('我自己看看')}
              </button>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
