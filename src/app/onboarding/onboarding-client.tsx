'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { saveNickname } from './actions'
import { LANGUAGE_MODULES } from '@/lib/language-modules'
import { AssistantAvatar } from '@/components/assistant/assistant-avatar'
import { ASSISTANT_PERSONAS, resolveAssistantPersona, type AssistantPersonaId } from '@/lib/assistant-persona'

type Phase = 'boot' | 'chat' | 'input' | 'confirmed' | 'redirecting'

const INTRO = `CodeNexus 工作台已上线。\n\n我是你的代码小助理。这里不是让你被动刷视频，也不是把答案塞进编辑器骗自己学会了。\n\n你会按这个节奏学习：先选一门语言，再选领域分支，进入课程后先听我讲“这关能干什么、为什么要学、最容易错在哪”，然后打开空编辑器自己写最小代码。\n\n运行后我会看终端、测试结果和你当前代码。报错不用慌，我们只抓第一个关键问题；停太久也没关系，我会提醒你下一步该动哪一行。\n\n**目标不是通关动画，是让你真的做出能运行、能解释、以后能扩成作品的东西。**`

function confirmMsg(name: string, assistantName: string) {
  return `好，**${name}**，代号入库。\n\n**${assistantName}** 会跟着你进入工作台：先介绍主界面，再带你进入第一关。你不用一开始就懂全部功能，先完成第一段可运行代码。\n\n进去吧。第一关的目标很小：让程序说出第一句话。但这一步会打开后面所有课程的门。`
}

// Renders **bold** and \n in mentor text
function MentorText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, li) => (
        <span key={li}>
          {li > 0 && <br />}
          {line.split(/(\*\*[^*]+\*\*)/).map((p, i) =>
            p.startsWith('**') && p.endsWith('**')
              ? <strong key={i} className="text-white/90 font-semibold">{p.slice(2, -2)}</strong>
              : <span key={i}>{p}</span>
          )}
        </span>
      ))}
    </>
  )
}

// Fullscreen neural-network particle canvas
function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let rafId: number
    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const t0 = performance.now()
    const nodes = Array.from({ length: 26 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: Math.random() * 2.1 + 0.7,
      opacity: 0,
      target: Math.random() * 0.55 + 0.18,
      delay: Math.random() * 1200,
    }))

    const draw = (ts: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const elapsed = ts - t0

      for (const n of nodes) {
        if (elapsed > n.delay) n.opacity = Math.min(n.opacity + 0.012, n.target)
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > canvas.width) n.vx *= -1
        if (n.y < 0 || n.y > canvas.height) n.vy *= -1
      }

      ctx.lineWidth = 0.5
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j]
          const d = Math.hypot(b.x - a.x, b.y - a.y)
          if (d < 185) {
            ctx.strokeStyle = `rgba(103,232,249,${(1 - d / 185) * a.opacity * b.opacity * 0.32})`
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
          }
        }
      }

      for (const n of nodes) {
        if (n.opacity < 0.01) continue
        ctx.save()
        ctx.shadowBlur = 12
        ctx.shadowColor = `rgba(103,232,249,${n.opacity})`
        ctx.fillStyle = `rgba(103,232,249,${n.opacity})`
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      }

      rafId = requestAnimationFrame(draw)
    }

    rafId = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(rafId); window.removeEventListener('resize', resize) }
  }, [])

  return <canvas ref={ref} className="absolute inset-0 pointer-events-none" />
}

// Mentor avatar chip
function MentorChip({ personaId }: { personaId: AssistantPersonaId }) {
  const persona = resolveAssistantPersona(personaId)
  return (
    <div className="flex items-center gap-2.5 mb-3">
      <AssistantAvatar personaId={persona.id} size="sm" />
      <div>
        <p className="text-xs font-semibold text-white/85 leading-none">{persona.name}</p>
        <p className="text-[10px] text-cyan-400/55 mt-0.5">{persona.role}</p>
      </div>
    </div>
  )
}

export function OnboardingClient({ redirectTo = '/dashboard' }: { redirectTo?: string }) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('boot')
  const [bootText, setBootText] = useState('')
  const [introTyped, setIntroTyped] = useState('')
  const [confirmTyped, setConfirmTyped] = useState('')
  const [inputVal, setInputVal] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('python')
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantPersonaId>('mika')
  const [nickname, setNickname] = useState('')
  const [saveComplete, setSaveComplete] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [, startTransition] = useTransition()

  // Phase: boot — type status text then advance
  useEffect(() => {
    if (phase !== 'boot') return
    const STATUS = 'NEXUS  //  ONLINE'
    let i = 0
    let t: ReturnType<typeof setTimeout>
    const iv = setInterval(() => {
      i++; setBootText(STATUS.slice(0, i))
      if (i >= STATUS.length) { clearInterval(iv); t = setTimeout(() => setPhase('chat'), 500) }
    }, 55)
    return () => { clearInterval(iv); clearTimeout(t) }
  }, [phase])

  // Phase: chat — typewriter intro, then show input
  useEffect(() => {
    if (phase !== 'chat') return
    let i = 0; let t: ReturnType<typeof setTimeout>
    const iv = setInterval(() => {
      i++; setIntroTyped(INTRO.slice(0, i))
      if (i >= INTRO.length) {
        clearInterval(iv)
        t = setTimeout(() => {
          setPhase('input')
          setTimeout(() => inputRef.current?.focus(), 50)
        }, 300)
      }
    }, 20)
    return () => { clearInterval(iv); clearTimeout(t) }
  }, [phase])

  // Phase: confirmed — typewriter confirm, then redirecting
  useEffect(() => {
    if (phase !== 'confirmed' || !nickname) return
    const text = confirmMsg(nickname, resolveAssistantPersona(selectedAssistant).name)
    let i = 0; let t: ReturnType<typeof setTimeout>
    const iv = setInterval(() => {
      i++; setConfirmTyped(text.slice(0, i))
      if (i >= text.length) { clearInterval(iv); t = setTimeout(() => setPhase('redirecting'), 800) }
    }, 20)
    return () => { clearInterval(iv); clearTimeout(t) }
  }, [phase, nickname, selectedAssistant])

  // Redirect once typewriter done AND save complete
  useEffect(() => {
    if (phase !== 'redirecting' || !saveComplete) return
    const separator = redirectTo.includes('?') ? '&' : '?'
    router.push(`${redirectTo}${separator}language=${selectedLanguage}`)
  }, [phase, saveComplete, router, redirectTo, selectedLanguage])

  function handleSubmit() {
    const name = inputVal.trim()
    if (!name) return
    setSaveError(null)
    setNickname(name)
    setPhase('confirmed')
    startTransition(async () => {
      const res = await saveNickname(name, selectedLanguage, selectedAssistant)
      if (!res.ok) {
        setSaveError(res.error ?? '保存失败。')
        setPhase('input')
        return
      }
      setSaveComplete(true)
    })
  }

  const chatVisible = phase !== 'boot'
  const inputVisible = phase === 'input'
  const confirmedVisible = phase === 'confirmed' || phase === 'redirecting'

  return (
    <div className="fixed inset-0 bg-black overflow-hidden text-white">
      <NeuralCanvas />

      {/* ── Boot overlay ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {phase === 'boot' && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-10"
          >
            <div className="text-center">
              <p className="text-cyan-300 font-mono text-xl tracking-[0.5em] mb-4">
                {bootText}<span className="animate-pulse">_</span>
              </p>
              <p className="text-white/12 font-mono text-xs tracking-[0.4em]">
                CodeNexus · AI 编程中枢
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat interface ────────────────────────────────────────────── */}
      <AnimatePresence>
        {chatVisible && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center z-10 p-4"
          >
            <div className="w-full max-w-[620px] space-y-4">

              <p className="text-center text-[10px] font-mono text-cyan-300/35 tracking-[0.4em] uppercase">
                First Contact · CodeNexus
              </p>

              {/* Intro card */}
              <motion.div
                initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 28 }}
                className="rounded-lg border border-cyan-400/20 bg-[#05080d]/95 p-5 backdrop-blur-sm"
              >
                <MentorChip personaId={selectedAssistant} />
                <p className="text-sm text-white/65 leading-relaxed">
                  <MentorText text={introTyped} />
                  {phase === 'chat' && <span className="animate-pulse text-cyan-300/50">_</span>}
                </p>
              </motion.div>

              {/* User name bubble */}
              <AnimatePresence>
                {confirmedVisible && (
                  <motion.div
                    initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 28 }}
                    className="flex justify-end"
                  >
                    <div className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm text-black shadow-lg">
                      {nickname}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Confirm card */}
              <AnimatePresence>
                {confirmedVisible && (
                  <motion.div
                    initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 280, damping: 28 }}
                    className="rounded-lg border border-cyan-400/20 bg-[#05080d]/95 p-5 backdrop-blur-sm"
                  >
                    <MentorChip personaId={selectedAssistant} />
                    <p className="text-sm text-white/65 leading-relaxed">
                      <MentorText text={confirmTyped} />
                      {confirmTyped.length < confirmMsg(nickname, resolveAssistantPersona(selectedAssistant).name).length && (
                        <span className="animate-pulse text-cyan-300/50">_</span>
                      )}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Name input */}
              <AnimatePresence>
                {inputVisible && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 28 }}
                    className="space-y-3"
                  >
                    <div className="rounded-lg border border-cyan-300/14 bg-black/55 p-3">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-cyan-300/42">
                        Choose Language
                      </p>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {LANGUAGE_MODULES.map((language) => {
                          const active = selectedLanguage === language.id
                          return (
                            <button
                              key={language.id}
                              type="button"
                              onClick={() => setSelectedLanguage(language.id)}
                              className={`cn-focus-ring rounded-lg border px-3 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                                active
                                  ? 'border-cyan-300/55 bg-cyan-300/13 text-cyan-50'
                                  : 'border-white/8 bg-white/[0.025] text-white/46 hover:border-cyan-300/24 hover:text-white/72'
                              }`}
                            >
                              <span className="font-mono text-xs font-semibold">{language.shortName}</span>
                              <span className="mt-1 line-clamp-2 block text-[10px] leading-relaxed opacity-70">{language.tagline}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="rounded-lg border border-cyan-300/14 bg-black/55 p-3">
                      <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.26em] text-cyan-300/42">
                        Choose Assistant
                      </p>
                      <div className="grid gap-2 sm:grid-cols-3">
                        {ASSISTANT_PERSONAS.map((persona) => {
                          const active = selectedAssistant === persona.id
                          return (
                            <button
                              key={persona.id}
                              type="button"
                              onClick={() => setSelectedAssistant(persona.id)}
                              className={`cn-focus-ring rounded-lg border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                                active
                                  ? 'border-cyan-300/55 bg-cyan-300/13 text-cyan-50'
                                  : 'border-white/8 bg-white/[0.025] text-white/46 hover:border-cyan-300/24 hover:text-white/72'
                              }`}
                            >
                              <div className="mb-2 flex items-center gap-2">
                                <AssistantAvatar personaId={persona.id} size="sm" active={active} />
                                <span>
                                  <span className="block text-xs font-semibold">{persona.name}</span>
                                  <span className="block text-[10px] text-white/34">{persona.pronoun}</span>
                                </span>
                              </div>
                              <span className="line-clamp-2 block text-[10px] leading-relaxed opacity-70">{persona.description}</span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        ref={inputRef}
                        value={inputVal}
                        onChange={(e) => setInputVal(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
                        placeholder="你的昵称..."
                        maxLength={20}
                        className="cn-focus-ring flex-1 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-cyan-300/60"
                      />
                      <button
                        onClick={handleSubmit}
                        disabled={!inputVal.trim()}
                        className="cn-focus-ring rounded-lg bg-cyan-300 px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-cyan-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-30"
                      >
                        确认
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {saveError && (
                <p className="rounded-lg border border-red-400/25 bg-red-400/[0.08] px-3 py-2 text-center text-xs text-red-200">
                  {saveError}
                </p>
              )}

              {/* Redirecting indicator */}
              {phase === 'redirecting' && (
                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="text-center text-[10px] font-mono text-white/18 tracking-[0.35em]"
                >
                  LOADING WORKSPACE...
                </motion.p>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
