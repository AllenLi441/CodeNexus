'use client'

import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import type { CSSProperties } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, Copy, Mic, MicOff, RotateCcw, Send, ShieldCheck, Square, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CommandSettings } from '@/hooks/use-command-settings'
import { useLanguage, useTr } from '@/contexts/language-context'
import { appleEase, appleSpring, softSpring } from '@/lib/motion'
import { MarkdownMessage } from './markdown-message'
import {
  AssistantAnimePortrait,
  AssistantAvatar,
  AssistantCompanionFigure,
  type AssistantCompanionMood,
} from '@/components/assistant/assistant-avatar'
import {
  assistantWelcome,
  readAssistantMemory,
  rememberAssistantEvent,
  resolveAssistantPersona,
  summarizeAssistantMemory,
  type AssistantMemorySnapshot,
} from '@/lib/assistant-persona'
import { detectPythonLint, detectRunawayPython } from '@/lib/mentor'

type Message = { id: string; role: 'user' | 'assistant'; content: string }
type LastRunState = 'success' | 'error' | 'failed-test' | null
type MediaKind = 'microphone' | 'camera'
type MediaPermissionStatus = 'idle' | 'requesting' | 'granted' | 'denied' | 'unsupported'
type VoiceStatus = 'idle' | 'listening' | 'unsupported' | 'error'

type SpeechRecognitionAlternativeLike = {
  transcript: string
}

type SpeechRecognitionResultLike = {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternativeLike | undefined
}

type SpeechRecognitionResultsLike = {
  length: number
  [index: number]: SpeechRecognitionResultLike | undefined
}

type SpeechRecognitionEventLike = Event & {
  results: SpeechRecognitionResultsLike
}

type SpeechRecognitionErrorEventLike = Event & {
  error?: string
}

type BrowserSpeechRecognition = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: SpeechRecognitionEventLike) => void) | null
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor
  }
}

type InstantInsight = {
  mood: AssistantCompanionMood
  status: string
  detail: string
  autoHint: string | null
}

const EMPTY_ASSISTANT_MEMORY: AssistantMemorySnapshot = {
  version: 1,
  seenRuns: 0,
  recentEvents: [],
}

function hasOutputIntent(code: string) {
  return /\b(print|console\.log|System\.out\.print|printf|cout|Console\.WriteLine|Debug\.Print)\b/.test(code)
}

function detectBracketIssue(code: string) {
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' }
  const opens = new Set(Object.values(pairs))
  const stack: string[] = []
  let quote: '"' | "'" | '`' | null = null
  let escaped = false

  for (const ch of code) {
    if (quote) {
      if (escaped) {
        escaped = false
      } else if (ch === '\\') {
        escaped = true
      } else if (ch === quote) {
        quote = null
      }
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch
      continue
    }
    if (opens.has(ch)) stack.push(ch)
    if (ch in pairs && stack.pop() !== pairs[ch]) return '括号配对不对，解释器会先在这里翻车。'
  }
  return stack.length > 0 ? '括号还没收口，先把结构闭合。' : null
}

function buildInstantInsight({
  code,
  languageName,
  objective,
  briefingComplete,
  isRunning,
  lastRunState,
  lastRunMessage,
  recentlyEdited,
  lang = 'zh',
}: {
  code: string
  languageName: string
  objective?: string
  briefingComplete: boolean
  isRunning: boolean
  lastRunState: LastRunState
  lastRunMessage?: string
  recentlyEdited: boolean
  lang?: 'zh' | 'en'
}): InstantInsight {
  const en = lang === 'en'
  const trimmed = code.trim()
  const wantsOutput = /输出|打印|print|display|log/i.test(objective ?? '')

  if (!briefingComplete) {
    return {
      mood: 'wave',
      status: '等你看完教学',
      detail: '先把这一关在干什么搞清楚，再让编辑器上场。',
      autoHint: null,
    }
  }

  if (isRunning) {
    return {
      mood: 'running',
      status: '正在盯终端',
      detail: '我在看运行结果，先别乱改代码。',
      autoHint: null,
    }
  }

  if (lastRunState === 'success') {
    return {
      mood: 'celebrate',
      status: '刚跑通',
      detail: '这一关过了。别急着飘，记住你刚才改对的是哪一行。',
      autoHint: null,
    }
  }

  if (lastRunState === 'error') {
    const msg = lastRunMessage?.slice(0, 90) ?? '终端已经报错。'
    return {
      mood: 'alert',
      status: '发现运行错误',
      detail: msg,
      autoHint: en
        ? `The terminal threw this error: \`${msg}\`\n\nRead the first line and change the smallest one thing. Almost everyone has hit this one.`
        : `终端报了这个错：\`${msg}\`\n\n先读第一行错误，改最小的一处就好。这种错几乎人人都踩过。`,
    }
  }

  if (lastRunState === 'failed-test') {
    return {
      mood: 'explain',
      status: '测试还差一点',
      detail: lastRunMessage?.slice(0, 90) ?? '代码能跑了，离目标输出只差对齐这一步。',
      autoHint: null,
    }
  }

  if (!trimmed) {
    return {
      mood: 'idle',
      status: '等第一行代码',
      detail: '编辑器还是空的。先写最小可运行代码。',
      autoHint: null,
    }
  }

  if (languageName === 'Python') {
    const runaway = detectRunawayPython(trimmed)
    if (runaway) {
      return {
        mood: 'alert',
        status: '疑似死循环',
        detail: runaway,
        autoHint: en
          ? `Stop — ${runaway}\n\nAdd an exit condition or a counter first. You're here to learn loops, not to stress-test the browser.`
          : `停，${runaway}\n\n先加退出条件或者计数器。你要学循环，不是训练浏览器抗冻。`,
      }
    }

    const lint = detectPythonLint(trimmed, lang)
    if (lint) {
      return {
        mood: 'alert',
        status: '语法有疑点',
        detail: lint,
        autoHint: en
          ? `I can see it without even running it: ${lint}\n\nFix this first, then hit run. Don't make the terminal find what your eyes already can.`
          : `我没点运行也看到了：${lint}\n\n先修这个，再按运行。别让终端替你发现肉眼能看到的问题。`,
      }
    }
  } else {
    const bracketIssue = detectBracketIssue(trimmed)
    if (bracketIssue) {
      return {
        mood: 'alert',
        status: '结构没闭合',
        detail: bracketIssue,
        autoHint: en
          ? `Your ${languageName} structure isn't closed: ${bracketIssue}\n\nPair up the parentheses, braces and quotes first.`
          : `${languageName} 这段代码结构没收好：${bracketIssue}\n\n先让括号、花括号、引号成对。`,
      }
    }
  }

  if (wantsOutput && !hasOutputIntent(trimmed)) {
    return {
      mood: recentlyEdited ? 'think' : 'explain',
      status: '目标还没对齐',
      detail: '这一关要输出内容，但我还没看到输出语句。',
      autoHint: null,
    }
  }

  if (recentlyEdited) {
    return {
      mood: 'think',
      status: '正在读你写的代码',
      detail: '我看到你在改。先别急着加功能，确认当前目标能跑。',
      autoHint: null,
    }
  }

  return {
    mood: 'think',
    status: '上下文已读取',
    detail: '代码有内容了。下一步检查目标文本、输出位置和最小运行路径。',
    autoHint: null,
  }
}

function guestMentorReply({
  text,
  code,
  languageName,
  assistantName,
  lang = 'zh',
}: {
  text: string
  code: string
  languageName: string
  assistantName: string
  lang?: 'zh' | 'en'
}) {
  const lower = text.toLowerCase()
  const hasCode = code.trim().length > 0

  if (lang === 'en') {
    if (!hasCode) {
      return `Trial mode gives short local hints by default. Want ${assistantName} hooked up to the cloud brain? Log in to use the platform model for free, or add your own API key (DeepSeek / Kimi) in the command center.\n\nThis level is simple: print a given line of text in ${languageName}. Write the smallest code first, then run.`
    }
    if (/答案|直接|代码|answer|solution/.test(lower)) {
      return "Want to just copy the answer? Bold. First confirm three things: you used an output statement, your brackets are paired, and the string matches the target exactly."
    }
    if (/报错|error|错|不会|help|提示/.test(lower)) {
      return "Read the first red line in the terminal. 80% of beginner problems aren't talent — they're quotes, brackets and capitalization throwing a party."
    }
    return "The local trial mentor only gives short hints. Log in to use the platform model for free, or add your own API key in the command center for live conversation. For now, don't drift: make the code output the target text and clear level one first."
  }

  if (!hasCode) {
    return `试玩模式默认只给本地短提示。想让 ${assistantName} 真正接上云端大脑？登录后免费用平台模型，或在命令中心填入你自己的 API Key（DeepSeek / Kimi 都行）。\n\n这一关很简单：在编辑器里用 ${languageName} 打印一句指定文本。先写最小代码，再点运行。`
  }

  if (/答案|直接|代码|answer|solution/.test(lower)) {
    return '想直接抄答案？算盘打得挺响。先确认三件事：用了输出语句、括号成对、字符串内容和目标完全一致。'
  }

  if (/报错|error|错|不会|help|提示/.test(lower)) {
    return '先看终端红字第一行。新手 80% 的问题不是天赋，是引号、括号、大小写这些低级坑在开派对。'
  }

  return '本地试玩小助手只能给短提示。登录后免费用平台模型，或在命令中心填入你自己的 API Key 就能开启实时对话。现在别发散：让代码输出目标文本，跑通第一关再说。'
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function describePointerZone(clientX: number, clientY: number) {
  if (typeof window === 'undefined') return '未知区域'
  const width = Math.max(window.innerWidth, 1)
  const height = Math.max(window.innerHeight, 1)
  const x = clientX / width
  const y = clientY / height

  if (y < 0.12) return '顶部控制栏'
  if (x < 0.2) return '左侧课程导航'
  if (x > 0.78) return '右侧终端 / 小助手区'
  if (y > 0.82) return '底部输入或操作区'
  return '课程正文 / 编辑区'
}

function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function mediaPermissionCopy(kind: MediaKind, status: MediaPermissionStatus) {
  const noun = kind === 'microphone' ? '麦克风' : '摄像头'
  if (status === 'requesting') return `${noun}申请中`
  if (status === 'granted') return `${noun}已授权`
  if (status === 'denied') return `${noun}被拒绝`
  if (status === 'unsupported') return `${noun}不可用`
  return `申请${noun}`
}

function mediaErrorMessage(kind: MediaKind, err: unknown) {
  const noun = kind === 'microphone' ? '麦克风' : '摄像头'
  const name = err instanceof DOMException ? err.name : ''
  if (name === 'NotAllowedError') return `${noun}权限被浏览器拒绝。到地址栏权限设置里打开它。`
  if (name === 'NotFoundError') return `没有检测到可用${noun}设备。`
  if (name === 'NotReadableError') return `${noun}正被别的应用占用，关掉占用的软件再试。`
  return `${noun}权限申请失败。`
}

function ProactiveBubble({
  hint,
  assistantName,
  personaId,
  dock,
  onAccept,
  onDismiss,
}: {
  hint: string
  assistantName: string
  personaId: CommandSettings['assistantPersona']
  dock: CommandSettings['chatDock']
  onAccept: () => void
  onDismiss: () => void
}) {
  const tr = useTr()
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.9 }}
      transition={softSpring}
      className={`fixed bottom-36 left-3 right-3 z-50 rounded-lg border border-cyan-300/18 bg-black/92 p-4 shadow-2xl shadow-cyan-950/50 backdrop-blur-xl sm:w-80 ${
        dock === 'right' ? 'sm:left-auto sm:right-6' : 'sm:left-6 sm:right-auto'
      }`}
    >
      <div className={`absolute -bottom-2 h-4 w-4 rotate-45 border-b border-l border-cyan-300/18 bg-black ${
        dock === 'right' ? 'right-10' : 'left-7'
      }`} />
      <div className="flex items-start gap-3">
        <AssistantAvatar personaId={personaId} size="sm" active />
        <div className="flex-1 space-y-2">
          <p className="text-[11px] font-semibold leading-none text-white/82">{tr(assistantName)} {tr('插话')}</p>
          <div className="line-clamp-4 text-xs leading-relaxed text-white/55">
            <MarkdownMessage text={hint} />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onAccept}
              className="cn-focus-ring rounded-lg border border-cyan-300/30 bg-cyan-300/14 px-2.5 py-1 text-xs text-cyan-100 transition-colors hover:bg-cyan-300/24"
            >
              {tr('打开')}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="cn-focus-ring rounded px-1.5 py-1 text-xs text-white/28 transition-colors hover:text-white/55"
            >
              {tr('略过')}
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function AssistantToolbar({ onCopy, onRetry, copied }: {
  onCopy: () => void
  onRetry?: () => void
  copied: boolean
}) {
  const tr = useTr()
  return (
    <div className="mt-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
      <button
        type="button"
        onClick={onCopy}
        title={tr('复制')}
        className="cn-focus-ring inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/72"
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? tr('已复制') : tr('复制')}
      </button>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          title={tr('让小助手重答')}
          className="cn-focus-ring inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/35 transition-colors hover:bg-white/[0.06] hover:text-white/72"
        >
          <RotateCcw className="h-3 w-3" />
          {tr('重答')}
        </button>
      )}
    </div>
  )
}

export function AIChat({
  currentCode,
  codename,
  languageName,
  tauntFrequency,
  settings,
  proactiveHint,
  onProactiveAccept,
  onProactiveDismiss,
  guestMode = false,
  levelTitle,
  levelObjective,
  briefingComplete = true,
  isRunning = false,
  lastRunState = null,
  lastRunMessage,
  lastEditAt,
  onOpenChange,
}: {
  currentCode: string
  codename: string
  languageName: string
  tauntFrequency: number
  settings: CommandSettings
  proactiveHint: string | null
  onProactiveAccept: () => void
  onProactiveDismiss: () => void
  guestMode?: boolean
  levelTitle?: string
  levelObjective?: string
  briefingComplete?: boolean
  isRunning?: boolean
  lastRunState?: LastRunState
  lastRunMessage?: string
  lastEditAt?: number
  onOpenChange?: (open: boolean) => void
}) {
  const persona = resolveAssistantPersona(settings.assistantPersona)
  const { lang } = useLanguage()
  const tr = useTr()
  const [memory, setMemory] = useState<AssistantMemorySnapshot>(EMPTY_ASSISTANT_MEMORY)
  const [isOpen, setIsOpen] = useState(settings.autoOpenMentor)
  const [ambientHint, setAmbientHint] = useState<string | null>(null)
  const [interactionHint, setInteractionHint] = useState<string | null>(null)
  const [snoozedUntil, setSnoozedUntil] = useState(0)
  const [, scheduleEditPulseRefresh] = useState(0)
  const [gaze, setGaze] = useState({ x: 0, y: 0 })
  const [pointerZone, setPointerZone] = useState('还没捕捉到鼠标')
  const [interactionStep, setInteractionStep] = useState(0)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: assistantWelcome({
        codename,
        personaId: persona.id,
        liveliness: settings.assistantLiveliness,
        memoryEnabled: settings.assistantMemory,
        memory,
        lang,
      }),
    },
  ])
  const [input, setInput] = useState('')
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>('idle')
  const [mediaAccess, setMediaAccess] = useState<Record<MediaKind, MediaPermissionStatus>>({
    microphone: 'idle',
    camera: 'idle',
  })
  const [permissionMessage, setPermissionMessage] = useState('语音和摄像头只在本机浏览器授权，不会上传音视频。')
  const [isStreaming, setIsStreaming] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const consumedHintRef = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null)
  const voiceBaseInputRef = useRef('')
  const companionRef = useRef<HTMLButtonElement>(null)
  const autoOpenAppliedRef = useRef(false)
  const pointerFrameRef = useRef<number | null>(null)
  const lastPointerMoveRef = useRef(0)
  const pointerSnapshotRef = useRef({
    zone: '还没捕捉到鼠标',
    gaze: { x: 0, y: 0 },
  })

  // Mobile: keyboard pushes the floating trigger up by visualViewport delta
  // so it stops being eaten by the soft keyboard.
  const [keyboardLift, setKeyboardLift] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const vv = window.visualViewport
    if (!vv) return
    const onResize = () => {
      const lift = Math.max(0, window.innerHeight - vv.height - vv.offsetTop)
      setKeyboardLift(lift)
    }
    vv.addEventListener('resize', onResize)
    vv.addEventListener('scroll', onResize)
    return () => {
      vv.removeEventListener('resize', onResize)
      vv.removeEventListener('scroll', onResize)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, messages])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      const storedMemory = readAssistantMemory()
      setMemory(storedMemory)
      setMessages((prev) => prev.map((message) =>
        message.id === 'welcome'
          ? {
              ...message,
              content: assistantWelcome({
                codename,
                personaId: persona.id,
                liveliness: settings.assistantLiveliness,
                memoryEnabled: settings.assistantMemory,
                memory: storedMemory,
                lang,
              }),
            }
          : message
      ))
    })
    return () => { cancelled = true }
  }, [codename, persona.id, settings.assistantLiveliness, settings.assistantMemory, lang])

  // Drop the cached ambient hint when the UI language changes, so it regenerates
  // in the new language instead of showing stale mount-time text.
  useEffect(() => { setAmbientHint(null) }, [lang])

  // Abort any in-flight request when the component unmounts.
  useEffect(() => () => abortRef.current?.abort(), [])

  useEffect(() => () => {
    recognitionRef.current?.abort()
    recognitionRef.current = null
  }, [])

  useEffect(() => {
    onOpenChange?.(isOpen)
  }, [isOpen, onOpenChange])

  useEffect(() => {
    if (!settings.autoOpenMentor || autoOpenAppliedRef.current) return
    autoOpenAppliedRef.current = true
    void Promise.resolve().then(() => setIsOpen(true))
  }, [settings.autoOpenMentor])

  const isRightDocked = settings.chatDock === 'right'
  const panelSideClass = isRightDocked ? 'xl:right-0 xl:left-auto xl:border-l' : 'xl:left-0 xl:right-auto xl:border-r'
  const panelEnter = isRightDocked ? { opacity: 0, x: 40, y: 24 } : { opacity: 0, x: -40, y: 24 }
  const panelExit = isRightDocked ? { opacity: 0, x: 30, y: 18 } : { opacity: 0, x: -30, y: 18 }
  const assistantPanelStyle = {
    '--cn-assistant-panel-width': `${settings.chatPanelWidth}px`,
  } as CSSProperties
  const isSnoozed = snoozedUntil > Date.now()
  const activeHint = isSnoozed ? null : interactionHint ?? proactiveHint ?? ambientHint
  const hasCode = currentCode.trim().length > 0
  const recentlyEdited = lastEditAt ? Date.now() - lastEditAt < 1800 : false
  const instantInsight = useMemo(() => buildInstantInsight({
    code: currentCode,
    languageName,
    objective: levelObjective,
    briefingComplete,
    isRunning,
    lastRunState,
    lastRunMessage,
    recentlyEdited,
    lang,
  }), [briefingComplete, currentCode, isRunning, languageName, lastRunMessage, lastRunState, levelObjective, recentlyEdited, lang])

  useEffect(() => {
    if (!lastEditAt) return
    const id = setTimeout(() => scheduleEditPulseRefresh((value) => value + 1), 1850)
    return () => clearTimeout(id)
  }, [lastEditAt])

  useEffect(() => {
    if (isOpen || isSnoozed || settings.assistantLiveliness < 35) return
    const delay = settings.assistantLiveliness > 75 ? 5000 : 9000
    const id = setTimeout(() => {
      setAmbientHint((current) => current ?? (lang === 'en' ? `${tr(instantInsight.status)}. ${tr(instantInsight.detail)}` : `${tr(instantInsight.status)}。${tr(instantInsight.detail)}`))
    }, delay)
    return () => clearTimeout(id)
  }, [instantInsight.detail, instantInsight.status, isOpen, isSnoozed, settings.assistantLiveliness])

  useEffect(() => {
    if (isOpen || isSnoozed || settings.assistantLiveliness < 50) return
    if (instantInsight.autoHint) {
      const id = setTimeout(() => {
        setAmbientHint((current) => current ?? instantInsight.autoHint)
      }, settings.assistantLiveliness > 75 ? 1800 : 3200)
      return () => clearTimeout(id)
    }
    const trimmed = currentCode.trim()
    if (!trimmed) return
    const id = setTimeout(() => {
      const firstLine = trimmed.split('\n').map((line) => line.trim()).find(Boolean)
      setAmbientHint((current) => current ?? (lang === 'en'
        ? `I see you've started: \`${firstLine?.slice(0, 48) ?? 'code'}\`.\n\n${tr(instantInsight.detail)}`
        : `我看到你开始写了：\`${firstLine?.slice(0, 48) ?? '代码'}\`。\n\n${instantInsight.detail}`))
    }, settings.assistantLiveliness > 75 ? 6500 : 11000)
    return () => clearTimeout(id)
  }, [currentCode, instantInsight.autoHint, instantInsight.detail, isOpen, isSnoozed, settings.assistantLiveliness])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updatePointer = (clientX: number, clientY: number, reason: 'move' | 'click' | 'focus') => {
      const now = Date.now()
      if (reason === 'move') {
        const throttle = settings.assistantLiveliness > 75 ? 120 : 240
        if (now - lastPointerMoveRef.current < throttle) return
        lastPointerMoveRef.current = now
      }

      const zone = describePointerZone(clientX, clientY)
      if (pointerFrameRef.current) window.cancelAnimationFrame(pointerFrameRef.current)
      pointerFrameRef.current = window.requestAnimationFrame(() => {
        const rect = companionRef.current?.getBoundingClientRect()
        const centerX = rect ? rect.left + rect.width / 2 : window.innerWidth * (isRightDocked ? 0.92 : 0.08)
        const centerY = rect ? rect.top + rect.height * 0.28 : window.innerHeight * 0.82
        const nextGaze = {
          x: clampNumber((clientX - centerX) / 220, -1, 1),
          y: clampNumber((clientY - centerY) / 180, -1, 1),
        }
        const previous = pointerSnapshotRef.current
        const zoneChanged = previous.zone !== zone
        const gazeChanged =
          Math.abs(previous.gaze.x - nextGaze.x) > 0.08 ||
          Math.abs(previous.gaze.y - nextGaze.y) > 0.08

        if (!zoneChanged && !gazeChanged) return

        pointerSnapshotRef.current = { zone, gaze: nextGaze }
        if (zoneChanged) setPointerZone(zone)
        if (gazeChanged) setGaze(nextGaze)
      })
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      updatePointer(event.clientX, event.clientY, 'move')
    }
    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event.clientX, event.clientY, 'click')
    }
    const onFocusIn = (event: FocusEvent) => {
      if (!(event.target instanceof HTMLElement)) return
      const rect = event.target.getBoundingClientRect()
      updatePointer(rect.left + rect.width / 2, rect.top + rect.height / 2, 'focus')
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('focusin', onFocusIn)
    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('focusin', onFocusIn)
      if (pointerFrameRef.current) {
        window.cancelAnimationFrame(pointerFrameRef.current)
        pointerFrameRef.current = null
      }
    }
  }, [isRightDocked, settings.assistantLiveliness])

  function appendAssistantHint(hint: string) {
    if (consumedHintRef.current === hint) return
    consumedHintRef.current = hint
    setMessages((prev) => [
      ...prev,
      { id: `hint-${Date.now()}`, role: 'assistant', content: hint },
    ])
  }

  useEffect(() => {
    if (!proactiveHint || !isOpen) return
    appendAssistantHint(proactiveHint)
    onProactiveAccept()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proactiveHint, isOpen])

  function openWithHint() {
    if (activeHint) {
      appendAssistantHint(activeHint)
      if (interactionHint) {
        setInteractionHint(null)
      } else if (proactiveHint) {
        onProactiveAccept()
      } else {
        setAmbientHint(null)
      }
    }
    setIsOpen(true)
  }

  function dismissActiveHint() {
    if (interactionHint) {
      setInteractionHint(null)
    } else if (proactiveHint) {
      onProactiveDismiss()
    } else {
      setAmbientHint(null)
    }
  }

  function quietForFiveMinutes() {
    setAmbientHint(null)
    setInteractionHint(null)
    if (proactiveHint) onProactiveDismiss()
    setSnoozedUntil(Date.now() + 5 * 60_000)
  }

  function inspectCurrentCode() {
    if (hasCode) {
      void sendMessage('先观察我当前编辑器里的代码，别直接给完整答案。指出一个最关键的问题和下一步最小修改。')
    } else {
      setAmbientHint(tr('编辑器还是空的。我能观察空气，但空气不会通关。先写一行最小代码。'))
    }
    setIsOpen(true)
  }

  function stopStreaming() {
    abortRef.current?.abort()
    abortRef.current = null
    setIsStreaming(false)
  }

  async function handleCopy(id: string, text: string) {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1800)
    } catch {
      // ignore
    }
  }

  async function requestMediaAccess(kind: MediaKind) {
    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaAccess((current) => ({ ...current, [kind]: 'unsupported' }))
      setPermissionMessage('当前浏览器不支持媒体权限申请。换 Chrome / Edge，或者确认页面在 HTTPS / localhost 下打开。')
      return false
    }

    setMediaAccess((current) => ({ ...current, [kind]: 'requesting' }))
    try {
      const stream = await navigator.mediaDevices.getUserMedia(
        kind === 'microphone' ? { audio: true } : { video: true }
      )
      stream.getTracks().forEach((track) => track.stop())
      setMediaAccess((current) => ({ ...current, [kind]: 'granted' }))
      setPermissionMessage(
        kind === 'microphone'
          ? '麦克风已授权。语音识别会把文字填进输入框，你确认后再发送。'
          : '摄像头已授权并已释放。后续 CV / 图像识别课程可以用这个入口做权限预检。'
      )
      return true
    } catch (err) {
      setMediaAccess((current) => ({ ...current, [kind]: 'denied' }))
      setPermissionMessage(mediaErrorMessage(kind, err))
      return false
    }
  }

  function stopVoiceRecognition() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setVoiceStatus('idle')
    setPermissionMessage('语音识别已停止。检查文字没问题再发送，别让错字替你发言。')
  }

  async function startVoiceRecognition() {
    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      setVoiceStatus('unsupported')
      setMediaAccess((current) => ({ ...current, microphone: 'unsupported' }))
      setPermissionMessage('当前浏览器不支持 Web Speech 语音识别。Chrome / Edge 通常可以直接用。')
      return
    }

    const granted = mediaAccess.microphone === 'granted' || await requestMediaAccess('microphone')
    if (!granted) return

    recognitionRef.current?.abort()
    const recognition = new Recognition()
    recognition.lang = 'zh-CN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1
    recognitionRef.current = recognition
    voiceBaseInputRef.current = input.trim()

    recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''
      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result?.[0]?.transcript ?? ''
        if (!transcript) continue
        if (result?.isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }
      const spokenText = `${finalTranscript}${interimTranscript}`.trim()
      const base = voiceBaseInputRef.current
      setInput(base && spokenText ? `${base}\n${spokenText}` : spokenText || base)
    }

    recognition.onerror = (event) => {
      setVoiceStatus('error')
      setPermissionMessage(event.error === 'no-speech'
        ? '没听到有效语音。靠近麦克风，或者直接打字。'
        : `语音识别出错：${event.error ?? '未知错误'}。`)
    }

    recognition.onend = () => {
      recognitionRef.current = null
      setVoiceStatus((current) => current === 'listening' ? 'idle' : current)
    }

    try {
      recognition.start()
      setVoiceStatus('listening')
      setPermissionMessage('正在听你说话。识别结果会先填进输入框，不会自动发送。')
    } catch {
      setVoiceStatus('error')
      setPermissionMessage('语音识别没有启动成功。刷新页面或重开麦克风权限后再试。')
    }
  }

  async function streamReply(opts: {
    apiMessages: { role: 'user' | 'assistant'; content: string }[]
    assistantId: string
  }) {
    const { apiMessages, assistantId } = opts
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setIsStreaming(true)

    let interrupted = false
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-codenexus-ai-provider': settings.aiProvider,
          'x-codenexus-lang': lang,
          ...(settings.aiApiKey ? {
            'x-codenexus-ai-key': settings.aiApiKey,
            'x-codenexus-ai-base-url': settings.aiBaseUrl,
            'x-codenexus-ai-model': settings.aiModel,
          } : {}),
        },
        body: JSON.stringify({
          messages: apiMessages,
          code: currentCode,
          codename,
          tauntFrequency,
          languageName,
          assistantPersona: persona.id,
          assistantLiveliness: settings.assistantLiveliness,
          assistantMemorySummary: settings.assistantMemory ? summarizeAssistantMemory(memory, lang) : '',
        }),
        signal: ctrl.signal,
      })
      if (!res.body) throw new Error('no body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let acc = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        acc += decoder.decode(value, { stream: true })
        const snap = acc
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: snap } : m)),
        )
      }
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        interrupted = true
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: tr('⚠️ 小助手暂时离线。检查网络或稍后再试。') }
              : m,
          ),
        )
      }
    } finally {
      if (interrupted) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: `${m.content}\n\n${tr('_（用户中断）_')}` }
              : m,
          ),
        )
      }
      if (abortRef.current === ctrl) abortRef.current = null
      setIsStreaming(false)
    }
  }

  function buildApiMessagesUpTo(messageList: Message[]) {
    return messageList
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('hint-'))
      .map((m) => ({ role: m.role, content: m.content }))
  }

  async function sendMessage(overrideInput?: string) {
    const text = (overrideInput ?? input).trim()
    if (!text || isStreaming) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text }
    const assistantId = (Date.now() + 1).toString()

    // Trial/guest with no key of their own → local static hints only.
    // A guest who pasted their own API key in 命令中心 talks to the real model
    // (their spend); the server accepts guest requests that carry a BYO key.
    if (guestMode && !settings.aiApiKey.trim()) {
      if (settings.assistantMemory) {
        setMemory(rememberAssistantEvent({
          type: 'chat',
          languageName,
          note: `问了：${text.slice(0, 40)}`,
        }))
      }
      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: assistantId,
          role: 'assistant',
          content: guestMentorReply({ text, code: currentCode, languageName, assistantName: persona.name, lang }),
        },
      ])
      setInput('')
      return
    }

    const next: Message[] = [
      ...messages,
      userMsg,
      { id: assistantId, role: 'assistant' as const, content: '' },
    ]
    setMessages(next)
    setInput('')
    if (settings.assistantMemory) {
      setMemory(rememberAssistantEvent({
        type: 'chat',
        languageName,
        note: `问了：${text.slice(0, 40)}`,
      }))
    }

    startTransition(async () => {
      await streamReply({
        apiMessages: buildApiMessagesUpTo([...messages, userMsg]),
        assistantId,
      })
    })
  }

  // Re-stream the most recent assistant reply with the same prior context.
  function retryLastAssistant() {
    if (isStreaming) return
    const lastAssistantIdx = [...messages].map((m) => m.role).lastIndexOf('assistant')
    if (lastAssistantIdx < 0) return
    const before = messages.slice(0, lastAssistantIdx)
    const lastUserIdx = [...before].map((m) => m.role).lastIndexOf('user')
    if (lastUserIdx < 0) return
    const assistantId = `retry-${Date.now()}`
    const next: Message[] = [
      ...before,
      { id: assistantId, role: 'assistant' as const, content: '' },
    ]
    setMessages(next)
    startTransition(async () => {
      await streamReply({
        apiMessages: buildApiMessagesUpTo(before),
        assistantId,
      })
    })
  }

  function handleCompanionTap() {
    const nextStep = (interactionStep + 1) % 4
    setInteractionStep(nextStep)

    if (nextStep === 0) {
      openWithHint()
      return
    }

    const reactions = lang === 'en'
      ? [
          `${persona.nameEn} glances up at you.\n\nTap "Open" for a real conversation; tap me again for another reaction.`,
          hasCode
            ? `I'm reading your code. ${tr(instantInsight.status)}: ${tr(instantInsight.detail)}\n\nWant me to break the problem down? Tap "Inspect current code".`
            : `The editor is still empty. I can watch the screen with you, but blank space won't turn into an answer on its own.\n\nFinish the lesson, then write your first line.`,
          `Your cursor is over "${pointerZone}". I can see you wandering over there.\n\nTap me once more to open a real conversation.`,
        ]
      : [
          `${persona.name} 抬头看了你一眼。\n\n要正式对话就点“打开”；再点我会换个反应。`,
          hasCode
            ? `我在看你的代码。${instantInsight.status}：${instantInsight.detail}\n\n要我认真拆问题，点“观察当前代码”。`
            : `编辑器还是空的。我可以陪你盯屏幕，但空白不会自己变成答案。\n\n先看完教学，再写第一行。`,
          `鼠标现在在「${pointerZone}」。我知道你在那边晃悠。\n\n再点一下我就打开正式对话。`,
        ]

    setInteractionHint(reactions[nextStep - 1] ?? reactions[0])
  }

  return (
    <>
      <AnimatePresence>
        {activeHint && !isOpen && (
          <ProactiveBubble
            hint={activeHint}
            assistantName={persona.name}
            personaId={persona.id}
            dock={settings.chatDock}
            onAccept={openWithHint}
            onDismiss={dismissActiveHint}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={false}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              right: isRightDocked ? 'clamp(16px, 3vw, 28px)' : undefined,
              left: isRightDocked ? undefined : 'clamp(16px, 3vw, 28px)',
              bottom: `calc(${keyboardLift > 0 ? keyboardLift + 12 : 0}px + 18px + env(safe-area-inset-bottom, 0px))`,
            }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={appleSpring}
            className="group fixed z-50"
          >
            <button
              ref={companionRef}
              type="button"
              onClick={handleCompanionTap}
              onMouseEnter={() => {
                if (settings.assistantLiveliness > 70 && !activeHint) {
                  setAmbientHint(`${persona.name} 看着你的鼠标。点我一下，我会先弹互动；再点会换反应。`)
                }
              }}
              className="cn-focus-ring relative block"
              title={tr('和{name}互动').replace('{name}', tr(persona.name))}
            >
              <AssistantCompanionFigure
                personaId={persona.id}
                mood={activeHint ? 'explain' : instantInsight.mood}
                active={Boolean(activeHint)}
                walking={false}
                showPulse={settings.assistantLiveliness > 70 || Boolean(activeHint)}
                gaze={gaze}
                trackEyes
              />
            </button>
            <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 w-48 -translate-x-1/2 translate-y-1 rounded-lg border border-cyan-300/18 bg-black/94 p-3 text-left opacity-0 shadow-2xl shadow-cyan-950/40 backdrop-blur-xl transition-all duration-200 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100">
              <p className="text-xs font-semibold text-white/86">{tr(persona.name)}</p>
              <p className="mt-1 text-[11px] leading-relaxed text-white/42">
                {tr(instantInsight.status)}。{hasCode ? tr('已读当前代码。') : tr('正在等你写第一行。')}
              </p>
              <p className="mt-1 text-[10px] leading-relaxed text-cyan-100/36">{tr('鼠标在')}：{tr(pointerZone)}</p>
              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-cyan-100/42">{tr(instantInsight.detail)}</p>
              <div className="mt-3 grid gap-1.5">
                <button
                  type="button"
                  onClick={openWithHint}
                  className="cn-focus-ring rounded-md border border-cyan-300/18 bg-cyan-300/10 px-2 py-1.5 text-left text-[11px] font-medium text-cyan-50/78 transition-colors hover:bg-cyan-300/18"
                >
                  {tr('聊天')}
                </button>
                <button
                  type="button"
                  onClick={inspectCurrentCode}
                  className="cn-focus-ring rounded-md border border-white/8 bg-white/[0.035] px-2 py-1.5 text-left text-[11px] font-medium text-white/58 transition-colors hover:border-cyan-300/18 hover:text-white/80"
                >
                  {tr('观察当前代码')}
                </button>
                <button
                  type="button"
                  onClick={quietForFiveMinutes}
                  className="cn-focus-ring rounded-md px-2 py-1.5 text-left text-[11px] font-medium text-white/32 transition-colors hover:bg-white/[0.04] hover:text-white/58"
                >
                  {tr('安静 5 分钟')}
                </button>
              </div>
            </div>
            {activeHint && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-black bg-red-400"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={panelEnter}
            animate={{ opacity: 1, x: 0, y: 0 }}
            exit={panelExit}
            transition={appleSpring}
            className={`fixed inset-x-0 bottom-0 top-auto z-40 flex max-h-[42dvh] min-h-[280px] max-w-none flex-col border-t border-cyan-300/14 bg-black/96 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl xl:inset-x-auto xl:bottom-0 xl:top-0 xl:min-h-0 xl:w-[var(--cn-assistant-panel-width)] xl:max-h-none xl:border-t-0 ${panelSideClass}`}
            style={assistantPanelStyle}
          >
            <div className="flex flex-shrink-0 gap-3 border-b border-white/8 bg-[radial-gradient(circle_at_18%_0%,rgba(34,211,238,0.16),transparent_36%)] px-4 py-4">
              <AssistantAnimePortrait personaId={persona.id} active={isStreaming} />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold leading-none text-white">{tr(persona.name)}</p>
                    <p className="mt-1 text-[10px] text-cyan-100/45">
                      {isStreaming ? tr('正在看你的逻辑...') : guestMode ? `${codename} ${tr('的本地试玩助手')}` : `${codename} ${tr('的')} ${languageName} ${tr('实时小助手')}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    title={tr('关闭小助手')}
                    className="cn-focus-ring flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/65"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-white/42">
                  {tr(instantInsight.status)}：{tr(instantInsight.detail)}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100/70">
                    {tr('精致立绘')}
                  </span>
                  {levelTitle && (
                    <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100/70">
                      {tr(levelTitle)}
                    </span>
                  )}
                  {currentCode.trim() && (
                    <span className="rounded border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] text-cyan-100/70">
                      {tr('已读代码')}
                    </span>
                  )}
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/38">
                    {guestMode ? tr('本地试玩') : tr('实时上下文')}
                  </span>
                  <span className="rounded border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] text-white/38">
                    {tr('鼠标')}：{tr(pointerZone)}
                  </span>
                </div>
              </div>
            </div>

            <div className="cn-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
              {messages.map((msg) => {
                const isUser = msg.role === 'user'
                const isLastAssistant =
                  !isUser &&
                  msg.id !== 'welcome' &&
                  !msg.id.startsWith('hint-') &&
                  msg.id === [...messages].reverse().find((m) => m.role === 'assistant')?.id
                return (
                  <div key={msg.id} className={`group flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] rounded-lg px-3.5 py-2.5 text-sm leading-relaxed ${
                        isUser
                          ? 'bg-cyan-300 text-black'
                          : 'border border-white/8 bg-white/[0.06] text-white/85'
                      }`}
                    >
                      {msg.content ? (
                        isUser ? (
                          <span className="whitespace-pre-wrap">{msg.content}</span>
                        ) : (
                          <MarkdownMessage text={msg.content} />
                        )
                      ) : (
                        <span className="flex gap-1 py-0.5">
                          {[0, 1, 2].map((i) => (
                            <motion.span
                              key={i}
                              className="h-1.5 w-1.5 rounded-full bg-cyan-300/70"
                              animate={{ y: [0, -4, 0] }}
                              transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.15, ease: appleEase }}
                            />
                          ))}
                        </span>
                      )}
                      {!isUser && msg.content && msg.id !== 'welcome' && !msg.id.startsWith('hint-') && (
                        <AssistantToolbar
                          copied={copiedId === msg.id}
                          onCopy={() => handleCopy(msg.id, msg.content)}
                          onRetry={isLastAssistant && !isStreaming ? retryLastAssistant : undefined}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            <div className="flex-shrink-0 border-t border-white/8 bg-black/40 p-3">
              <div className="mb-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={voiceStatus === 'listening' ? stopVoiceRecognition : startVoiceRecognition}
                  disabled={isStreaming || mediaAccess.microphone === 'requesting'}
                  className={`cn-focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-2.5 text-xs font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-45 ${
                    voiceStatus === 'listening'
                      ? 'border-red-300/30 bg-red-400/14 text-red-100 hover:bg-red-400/20'
                      : 'border-cyan-300/20 bg-cyan-300/[0.07] text-cyan-50/72 hover:border-cyan-300/34 hover:bg-cyan-300/[0.11]'
                  }`}
                  title={tr('用浏览器语音识别填入问题')}
                >
                  {voiceStatus === 'listening' ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                  <span className="truncate">
                    {voiceStatus === 'listening' ? tr('停止语音') : tr(mediaPermissionCopy('microphone', mediaAccess.microphone))}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => requestMediaAccess('camera')}
                  disabled={isStreaming || mediaAccess.camera === 'requesting'}
                  className="cn-focus-ring inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-2.5 text-xs font-semibold text-white/54 transition-all duration-200 hover:border-cyan-300/24 hover:bg-cyan-300/[0.065] hover:text-cyan-50/72 disabled:pointer-events-none disabled:opacity-45"
                  title={tr('为后续图像识别课程预检摄像头权限')}
                >
                  <Camera className="h-3.5 w-3.5" />
                  <span className="truncate">{tr(mediaPermissionCopy('camera', mediaAccess.camera))}</span>
                </button>
              </div>
              <p className="mb-2 inline-flex items-start gap-1.5 text-[10px] leading-relaxed text-white/28">
                <ShieldCheck className="mt-0.5 h-3 w-3 flex-shrink-0 text-cyan-200/42" />
                <span>{tr(permissionMessage)}</span>
              </p>
              <div className="flex items-end gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 transition-colors focus-within:border-cyan-300/45">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder={`${tr('问')}${tr(persona.name)}${tr('，别憋着。')}`}
                  disabled={isStreaming}
                  rows={1}
                  className="max-h-24 flex-1 resize-none bg-transparent text-sm leading-relaxed text-white/85 outline-none placeholder:text-white/20 disabled:opacity-50"
                />
                {isStreaming ? (
                  <Button
                    size="sm"
                    onClick={stopStreaming}
                    title={tr('停止生成')}
                    className="cn-focus-ring h-8 w-8 flex-shrink-0 rounded-lg bg-red-400/90 p-0 text-white hover:bg-red-400"
                  >
                    <Square className="h-3.5 w-3.5" fill="currentColor" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => sendMessage()}
                    disabled={!input.trim()}
                    className="cn-focus-ring h-8 w-8 flex-shrink-0 rounded-lg bg-cyan-300 p-0 text-black hover:bg-cyan-200 disabled:opacity-30"
                  >
                    <Send className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
