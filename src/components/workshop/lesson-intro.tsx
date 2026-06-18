'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  ListPlus,
  MessageCircleQuestion,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Level } from '@/lib/levels'
import { useLanguage, useTr } from '@/contexts/language-context'
import { getLevelTeachingBlueprint } from '@/lib/course-engagement'
import { useSpeech } from '@/lib/speech'
import { CodeNexusLogo } from '@/components/layout/logo'
import { MarkdownMessage } from './markdown-message'
import { appleSpring } from '@/lib/motion'

type LessonIntroProps = {
  level: Level
  languageName: string
  codename: string
  onStart: () => void
  onAsk?: () => void
}

// Build the assistant's spoken lesson script from the lesson's OWN authored
// teaching content — fixed (not AI-generated), so every lesson in every language
// has a full walkthrough, offline and free. The live AI is reserved for the
// learner's own questions (the "ask" button).
function buildScript(
  level: Level,
  languageName: string,
  codename: string,
  tr: (zh: string) => string,
): string[] {
  const teaching = getLevelTeachingBlueprint(languageName, level, tr)
  const lines: string[] = []

  lines.push(
    tr('{name}，这一关我们一起搞懂「{title}」。')
      .replace('{name}', codename)
      .replace('{title}', tr(level.title)),
  )
  lines.push(tr('先说这关到底在学什么：') + teaching.concept + '。' + teaching.mentalModel)
  lines.push(tr('为什么值得学？') + teaching.realUse)

  // Lead with the lesson's OWN authored sections (specific), including their
  // tips/warnings. Fall back to the generic walkthrough only when a lesson has
  // no written sections, so every one of the ~900 lessons gets a real talk.
  const richSections = level.sections.filter((s) => s.body && s.body.trim())
  if (richSections.length) {
    richSections.forEach((s) => {
      lines.push(`**${tr(s.heading)}** ${tr(s.body)}`)
      if (s.tip) lines.push(tr('提示：') + tr(s.tip))
      if (s.warning) lines.push(tr('小心：') + tr(s.warning))
    })
  } else {
    teaching.walkthrough.forEach((w) => lines.push(`**${w.title}** ${w.body}`))
  }
  if (level.sections.some((s) => s.codeBlock)) {
    lines.push(tr('具体怎么写，我把参考代码放进下面「完整图文讲义」了，需要就展开照着看。'))
  }
  if (teaching.pitfalls.length) lines.push(tr('提醒一个常见坑：') + teaching.pitfalls[0])
  if (teaching.learnFirst.length) lines.push(tr('动手前先想清楚：') + teaching.learnFirst.join('、') + '。')
  lines.push(tr('好，轮到你了。这关目标是：') + tr(level.objective) + '。')
  lines.push(tr('打开编辑器，从最小能跑的一版写起。有任何不懂的，直接点「问小助手」告诉我你卡在哪。'))

  return lines
}

// Strip markdown so speech synthesis reads clean prose, not `**` and backticks.
function plain(text: string): string {
  return text
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`*#>_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function LessonIntro({ level, languageName, codename, onStart, onAsk }: LessonIntroProps) {
  const tr = useTr()
  const { lang } = useLanguage()
  const sp = useSpeech(lang)

  // Keyed by level.id from the parent, so state resets fresh per level.
  const lines = useMemo(
    () => buildScript(level, languageName, codename, tr),
    [level, languageName, codename, tr],
  )
  const [step, setStep] = useState(0)
  const [showFull, setShowFull] = useState(false)

  const atEnd = step >= lines.length - 1
  const revealed = lines.slice(0, step + 1)

  function handleNext() {
    if (step < lines.length - 1) {
      const next = step + 1
      setStep(next)
      if (sp.enabled) sp.speak(plain(lines[next]))
    }
  }

  function handleRevealAll() {
    sp.cancel()
    setStep(lines.length - 1)
  }

  function handleToggleVoice() {
    const on = !sp.enabled
    sp.setEnabled(on)
    if (on && lines[step]) sp.speak(plain(lines[step]))
    else sp.cancel()
  }

  function handleReplay() {
    if (lines[step]) sp.speak(plain(lines[step]))
  }

  function handleRestart() {
    sp.cancel()
    setStep(0)
  }

  return (
    <div className="cn-scrollbar h-full w-full overflow-y-auto bg-[#020408]">
      <div className="mx-auto flex w-full max-w-3xl flex-col px-4 py-6 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-300/45">
              {languageName} · Lv.{level.id}
            </p>
            <h1 className="mt-1 truncate text-xl font-semibold tracking-tight text-white sm:text-2xl">
              {tr(level.title)}
            </h1>
          </div>
          {sp.supported && (
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={handleToggleVoice}
                aria-pressed={sp.enabled}
                className={`cn-focus-ring inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  sp.enabled
                    ? 'border-cyan-300/40 bg-cyan-300/12 text-cyan-100'
                    : 'border-white/12 text-white/45 hover:text-white/70'
                }`}
              >
                {sp.enabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                {tr('语音')}
              </button>
              {sp.enabled && sp.voices.length > 1 && (
                <select
                  value={sp.voiceURI}
                  onChange={(e) => sp.setVoiceURI(e.target.value)}
                  aria-label={tr('选择音色')}
                  className="cn-focus-ring max-w-[120px] rounded-lg border border-white/12 bg-black/40 px-2 py-1.5 text-[11px] text-white/60"
                >
                  <option value="">{tr('默认音色')}</option>
                  {sp.voices.map((v) => (
                    <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Assistant conversation */}
        <div className="flex-1 space-y-3">
          <AnimatePresence initial={false}>
            {revealed.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={appleSpring}
                className="flex items-start gap-2.5"
              >
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/10">
                  <CodeNexusLogo className="text-cyan-200" size={15} />
                </span>
                <div className="cn-frost max-w-[88%] rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed text-white/82">
                  <MarkdownMessage text={line} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Controls */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {!atEnd ? (
            <button
              type="button"
              onClick={handleNext}
              className="cn-focus-ring inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-4 py-2 text-sm font-semibold text-black transition-all hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              {tr('继续')}
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onStart}
              className="cn-focus-ring inline-flex items-center gap-1.5 rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-semibold text-black shadow-[0_14px_50px_rgba(34,211,238,0.16)] transition-all hover:-translate-y-0.5 hover:bg-cyan-200"
            >
              {tr('打开编辑器，开始实践')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {onAsk && (
            <button
              type="button"
              onClick={onAsk}
              className="cn-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-cyan-300/30 bg-cyan-300/[0.06] px-3 py-2 text-xs font-medium text-cyan-100/85 transition-colors hover:bg-cyan-300/12"
            >
              <MessageCircleQuestion className="h-3.5 w-3.5" />
              {tr('有不懂的？问小助手')}
            </button>
          )}

          {!atEnd && (
            <button
              type="button"
              onClick={handleRevealAll}
              className="cn-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs text-white/55 transition-colors hover:text-white/80"
            >
              <ListPlus className="h-3.5 w-3.5" />
              {tr('全部展开')}
            </button>
          )}

          {sp.supported && sp.enabled && (
            <button
              type="button"
              onClick={handleReplay}
              className="cn-focus-ring inline-flex items-center gap-1.5 rounded-lg border border-white/12 px-3 py-2 text-xs text-white/55 transition-colors hover:text-white/80"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {tr('重听这句')}
            </button>
          )}

          {step > 0 && (
            <button
              type="button"
              onClick={handleRestart}
              className="cn-focus-ring inline-flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs text-white/35 transition-colors hover:text-white/60"
            >
              {tr('从头讲一遍')}
            </button>
          )}
        </div>

        {/* Full written lesson (collapsible reference) */}
        <div className="mt-8 border-t border-white/8 pt-4">
          <button
            type="button"
            onClick={() => setShowFull((v) => !v)}
            className="cn-focus-ring flex w-full items-center justify-between rounded-lg px-1 py-2 text-left text-xs font-semibold text-white/55 transition-colors hover:text-white/80"
          >
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-cyan-200/70" />
              {tr('查看完整图文讲义')}
            </span>
            <motion.span animate={{ rotate: showFull ? 180 : 0 }} transition={{ duration: 0.2 }} className="text-white/30">
              <ChevronDown className="h-4 w-4" />
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {showFull && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.24, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="space-y-5 py-4">
                  <p className="text-sm leading-7 text-white/55">{tr(level.objective)}</p>
                  {level.sections.map((section, i) => (
                    <section key={`${section.heading}-${i}`} className="cn-frost rounded-lg p-4">
                      <h3 className="mb-2 text-sm font-semibold text-white/82">{tr(section.heading)}</h3>
                      <div className="text-sm leading-7 text-white/62">
                        <MarkdownMessage text={tr(section.body)} />
                      </div>
                      {section.codeBlock && (
                        <pre className="cn-scrollbar mt-3 overflow-x-auto rounded-lg border border-white/8 bg-black/50 p-3 font-mono text-xs leading-relaxed text-cyan-50/80">
                          {section.codeBlock.code}
                        </pre>
                      )}
                    </section>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
