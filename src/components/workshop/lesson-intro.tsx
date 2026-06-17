'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Loader2,
  RotateCcw,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react'
import type { Level } from '@/lib/levels'
import { useLanguage, useTr } from '@/contexts/language-context'
import { getLevelMission, getLevelTeachingBlueprint } from '@/lib/course-engagement'
import { useSpeech } from '@/lib/speech'
import type { CommandSettings } from '@/hooks/use-command-settings'
import { CodeNexusLogo } from '@/components/layout/logo'
import { MarkdownMessage } from './markdown-message'
import { appleSpring } from '@/lib/motion'

type LessonIntroProps = {
  level: Level
  languageName: string
  codename: string
  settings: CommandSettings
  onStart: () => void
}

// Build a spoken-style introduction from the lesson's own written content, used
// when the live model is unavailable (guest with no key, offline, rate limit).
function fallbackLines(
  level: Level,
  languageName: string,
  codename: string,
  tr: (zh: string) => string,
): string[] {
  const mission = getLevelMission(languageName, level, tr)
  const teaching = getLevelTeachingBlueprint(languageName, level, tr)
  return [
    tr('{name}，这一关我们一起搞懂「{title}」。')
      .replace('{name}', codename)
      .replace('{title}', tr(level.title)),
    mission.brief,
    teaching.realUse,
    tr('抓住一个关键点就行：') + teaching.mentalModel,
    tr('目标很简单——{obj}。准备好就打开编辑器，我们边写边来。')
      .replace('{obj}', tr(level.objective)),
  ].filter(Boolean)
}

export function LessonIntro({ level, languageName, codename, settings, onStart }: LessonIntroProps) {
  const tr = useTr()
  const { lang } = useLanguage()
  const sp = useSpeech(lang)

  const [lines, setLines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(0)
  const [showFull, setShowFull] = useState(false)
  const fetchedFor = useRef<number | null>(null)

  // Fetch the assistant's live introduction for this level; fall back to the
  // written content if the model isn't available.
  useEffect(() => {
    if (fetchedFor.current === level.id) return
    fetchedFor.current = level.id
    let cancelled = false
    setLoading(true)
    setStep(0)
    sp.cancel()

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-codenexus-ai-provider': settings.aiProvider,
      'x-codenexus-lang': lang,
    }
    if (settings.aiApiKey) {
      headers['x-codenexus-ai-key'] = settings.aiApiKey
      headers['x-codenexus-ai-base-url'] = settings.aiBaseUrl
      headers['x-codenexus-ai-model'] = settings.aiModel
    }

    fetch('/api/intro', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        languageName,
        levelTitle: level.title,
        objective: level.objective,
        codename,
        assistantPersona: settings.assistantPersona,
      }),
    })
      .then(async (res) => (res.ok ? ((await res.json()) as { lines?: string[] }) : null))
      .then((data) => {
        if (cancelled) return
        const live = data?.lines?.filter((l) => typeof l === 'string' && l.trim())
        setLines(live && live.length ? live : fallbackLines(level, languageName, codename, tr))
        setLoading(false)
      })
      .catch(() => {
        if (cancelled) return
        setLines(fallbackLines(level, languageName, codename, tr))
        setLoading(false)
      })

    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level.id])

  const atEnd = step >= lines.length - 1

  function handleNext() {
    if (step < lines.length - 1) {
      const next = step + 1
      setStep(next)
      if (sp.enabled) sp.speak(lines[next])
    }
  }

  function handleToggleVoice() {
    const on = !sp.enabled
    sp.setEnabled(on)
    if (on && lines[step]) sp.speak(lines[step])
    else sp.cancel()
  }

  function handleReplay() {
    if (lines[step]) sp.speak(lines[step])
  }

  function handleRestart() {
    sp.cancel()
    setStep(0)
  }

  const revealed = lines.slice(0, step + 1)

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
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-white/45">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-200/70" />
              {tr('小助手正在组织语言…')}
            </div>
          ) : (
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
                    {line}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Controls */}
        {!loading && (
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
            {atEnd && (
              <span className="ml-auto text-[11px] text-white/30">
                {tr('随时可以直接开始，不必听完。')}
              </span>
            )}
          </div>
        )}

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
