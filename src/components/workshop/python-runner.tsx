'use client'

import { useState, useEffect, useCallback, useMemo, useRef, startTransition } from 'react'
import type { CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import {
  ArrowLeft,
  AlertTriangle,
  BookOpen,
  Eraser,
  Info,
  Keyboard,
  Loader2,
  PackageOpen,
  Play,
  Terminal as TerminalIcon,
  Volume2,
  VolumeX,
  XCircle,
} from 'lucide-react'
import {
  initPyodide, loadGraphicsPackages, runCode,
  type PyodideStatus, type RunResult,
} from '@/lib/python/PyodideRunner'
import type { Level } from '@/lib/levels'
import { completeLevel } from '@/app/actions/progress'
import { fetchAchievements } from '@/app/actions/achievements'
import { checkNewAchievements, ACHIEVEMENT_MAP } from '@/lib/achievements'
import { sound } from '@/lib/sound'
import type { ProgressRow } from '@/app/actions/progress'
import { TerminalOutput } from './terminal-output'
import { GuidePanel } from './guide-panel'
import { AIChat } from './ai-chat'
import { LevelCompleteOverlay } from './level-complete'
import { LessonBriefing } from './lesson-briefing'
import { MobileToolbar } from './mobile-toolbar'
import { ShareButton } from './share-button'
import { SparkParticles } from './spark-particles'
import { BrandHeader, CodeNexusLogo } from '@/components/layout/logo'
import type { CodeEditorHandle } from './code-editor'
import { CommandCenter } from '@/components/settings/command-center'
import { useCommandSettings, type CommandSettings } from '@/hooks/use-command-settings'
import { composeMentorAnalysis, detectRunawayPython } from '@/lib/mentor'
import {
  completedModuleLevelIds,
  getLanguageModule,
  toStorageLevelId,
  type LearningLanguage,
} from '@/lib/language-modules'
import { getFailureDiagnosis, getRuntimeModeCopy } from '@/lib/course-engagement'
import {
  readLearningProfile,
  recordLearningMistake,
  promoteLevelReviews,
  type LearningProfile,
} from '@/lib/learning-profile'
import { rememberAssistantEvent } from '@/lib/assistant-persona'
import { useTr } from '@/contexts/language-context'
import { LanguageToggle } from '@/components/ui/language-toggle'
import Link from 'next/link'

const CodeEditor = dynamic(() => import('./code-editor').then((m) => m.CodeEditor), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-[var(--code-bg-elevated)]">
      <div className="text-white/20 text-sm font-mono animate-pulse">载入编辑器...</div>
    </div>
  ),
})

type TerminalEntry = { id: string; timestamp: string; result: RunResult }
type TestResult = { passed: boolean; results: { id: string; passed: boolean; hint: string }[] }
type MobileTab = 'briefing' | 'guide' | 'editor' | 'output'

export type LanguageRunnerProps = {
  languageId: string
  codename: string
  initialLevelId: number
  initialProgress: ProgressRow[]
  initialSettings: Partial<CommandSettings>
  mode?: 'authenticated' | 'guest-play'
}

function runTests(level: Level, output: string, code: string): TestResult {
  const results = level.tests.map((t) => ({
    id: t.id,
    passed: t.check(output, code),
    hint: t.failHint,
  }))
  return { passed: results.every((r) => r.passed), results }
}

function commandLabel(language: LearningLanguage) {
  if (language.id === 'c') return 'gcc'
  if (language.id === 'cpp') return 'g++'
  if (language.id === 'java') return 'javac'
  if (language.id === 'csharp') return 'dotnet'
  if (language.id === 'javascript') return 'node'
  if (language.id === 'visual-basic') return 'dotnet'
  return 'python'
}

function runStaticCode(language: LearningLanguage, level: Level, code: string): RunResult {
  const started = performance.now()
  const executionMs = Math.max(1, Math.round(performance.now() - started))
  const trimmed = code.trim()

  if (!trimmed) {
    return {
      output: '',
      error: `${language.name} 静态检查器：编辑器还是空的。先写代码，别让空气参加考试。`,
      imageBase64: null,
      executionMs,
      speedTier: { emoji: '✓', label: `${executionMs}ms`, percentile: '静态检查' },
    }
  }

  return {
    output: [
      `⚠️ ${language.name} · 结构检查模式（未真正运行代码）`,
      `目标：${level.objective}`,
      '说明：当前非 Python 语言只检查源代码里的结构和关键字，不会真正编译或运行 —— 所以"通过"不代表程序真的能跑通。',
      '想要真实编译运行（gcc / javac / dotnet 等）并按输出判题，请登录后使用「在线运行」。',
    ].join('\n'),
    error: '',
    imageBase64: null,
    executionMs,
    speedTier: { emoji: '✓', label: `${executionMs}ms`, percentile: '结构检查' },
  }
}

async function runServerCode(language: LearningLanguage, code: string): Promise<RunResult> {
  const res = await fetch('/api/run-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ languageId: language.id, code }),
  })
  const payload = await res.json()
  if (!res.ok) {
    return {
      output: '',
      error: payload?.error ?? `${language.name} 这次没跑起来。看一眼下面的报错，改一处再试。`,
      imageBase64: null,
      executionMs: 1,
      speedTier: { emoji: '✓', label: '1ms', percentile: 'runner error' },
    }
  }
  return payload as RunResult
}

export function PythonRunner({
  languageId,
  codename,
  initialLevelId,
  initialProgress,
  initialSettings,
  mode = 'authenticated',
}: LanguageRunnerProps) {
  const router = useRouter()
  const tr = useTr()
  const isGuestPlay = mode === 'guest-play'
  const { settings } = useCommandSettings(initialSettings)
  const language = useMemo(() => getLanguageModule(languageId), [languageId])
  const levels = language.levels
  const levelMap = useMemo(() => new Map(levels.map((item) => [item.id, item])), [levels])
  const runtimeCopy = useMemo(() => getRuntimeModeCopy(language.name, language.runtime), [language.name, language.runtime])
  const [assistantOpen, setAssistantOpen] = useState(() => settings.autoOpenMentor)

  // ── Level ────────────────────────────────────────────────────────────────────
  const [levelId, setLevelId] = useState(Math.min(Math.max(initialLevelId, 1), levels.length))
  const level = levelMap.get(levelId) ?? levels[0]

  // ── Editor ───────────────────────────────────────────────────────────────────
  // localStorage draft key: per-language + per-level. Survives reload (used by
  // the runaway-protection "force stop" path).
  const draftKey = `cn:draft:${languageId}:${levelId}`
  const [code, setCode] = useState('')
  const [lastEditAt, setLastEditAt] = useState(() => Date.now())
  const editorRef = useRef<CodeEditorHandle | null>(null)
  const [briefingComplete, setBriefingComplete] = useState(false)

  // ── Terminal ─────────────────────────────────────────────────────────────────
  const [entries, setEntries] = useState<TerminalEntry[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [lastTestResult, setLastTestResult] = useState<TestResult | null>(null)
  const [lastOutput, setLastOutput] = useState('')
  const [lastImage, setLastImage] = useState<string | null>(null)
  const [learningProfile, setLearningProfile] = useState<LearningProfile>({ records: [] })

  // ── Pyodide ──────────────────────────────────────────────────────────────────
  const [pyStatus, setPyStatus] = useState<PyodideStatus>(() => language.runtime === 'python-pyodide' ? 'idle' : 'ready')
  const [statusMsg, setStatusMsg] = useState(() => {
    if (language.runtime === 'python-pyodide') return tr('准备中')
    if (language.runtime === 'server-exec') return `${language.name} ${tr('真实运行器已就绪')}`
    return `${language.name} ${tr('检查器已就绪')}`
  })
  const [loadProgress, setLoadProgress] = useState(() => language.runtime === 'python-pyodide' ? 0 : 100)
  const [graphicsLoading, setGraphicsLoading] = useState(false)
  const initStarted = useRef(false)

  // ── Progress ─────────────────────────────────────────────────────────────────
  const [progress, setProgress] = useState<ProgressRow[]>(initialProgress)
  const completedLevelIds = completedModuleLevelIds(language, progress)

  // ── Achievements ─────────────────────────────────────────────────────────────
  const [earnedIds, setEarnedIds] = useState<string[]>([])
  const earnedIdsRef = useRef<string[]>([])
  const failsThisLevel = useRef(0)
  const [failCount, setFailCount] = useState(0)

  // ── Level complete ───────────────────────────────────────────────────────────
  const [completionData, setCompletionData] = useState<{
    alreadyCompleted: boolean
  } | null>(null)
  // Prevent re-opening overlay for the same run (e.g. if completeLevel fires twice)
  const completionShownRef = useRef(false)
  // Guard against concurrent completeLevel calls on rapid re-runs.
  const completionInProgressRef = useRef(false)

  // ── Proactive hints ──────────────────────────────────────────────────────────
  const [proactiveHint, setProactiveHint] = useState<string | null>(null)
  const lastEditTime = useRef(0)
  const hintShownThisSession = useRef<Set<string>>(new Set())

  // ── Sound toggle ─────────────────────────────────────────────────────────────
  const [soundOn, setSoundOn] = useState(false)

  // ── Mobile tab ───────────────────────────────────────────────────────────────
  const [mobileTab, setMobileTab] = useState<MobileTab>('briefing')

  // ── Runaway-execution detection ──────────────────────────────────────────────
  // Pyodide runs in the main thread, so `while True: pass` freezes the tab.
  // The `runawayDetected` flag is *set* from a timeout (external event — fine
  // inside useEffect) and *reset* by the run handler when execution starts/
  // finishes. Following React 19's "no setState directly in effect bodies"
  // rule, we never call setState in the synchronous effect path.
  const [runawayDetected, setRunawayDetected] = useState(false)
  useEffect(() => {
    if (!isRunning) return
    const id = setTimeout(() => setRunawayDetected(true), 8_000)
    return () => clearTimeout(id)
  }, [isRunning])

  // ── Init Pyodide ─────────────────────────────────────────────────────────────
  useEffect(() => {
    lastEditTime.current = Date.now()
    if (language.runtime !== 'python-pyodide') return
    if (initStarted.current) return
    initStarted.current = true
    setPyStatus('loading')
    setLoadProgress(10)
    initPyodide((msg) => {
      setStatusMsg(msg)
      setLoadProgress((p) => Math.min(p + 25, 90))
    })
      .then(() => { setPyStatus('ready'); setStatusMsg(`Python ${tr('已就绪')}`); setLoadProgress(100) })
      .catch(() => { setPyStatus('error'); setStatusMsg(tr('加载失败，请刷新页面')) })
  }, [language.name, language.runtime])

  // ── Fetch earned achievements on mount ───────────────────────────────────────
  useEffect(() => {
    if (isGuestPlay) return
    fetchAchievements().then(setEarnedIds)
  }, [isGuestPlay])

  useEffect(() => {
    earnedIdsRef.current = earnedIds
  }, [earnedIds])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (!cancelled) setLearningProfile(readLearningProfile())
    })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      try {
        const storedDraft = window.localStorage.getItem(draftKey) ?? ''
        if (storedDraft) setCode((current) => current || storedDraft)
      } catch {
        // Draft restore is best-effort.
      }
    })
    return () => { cancelled = true }
  }, [draftKey])

  function queueMentorAnalysis(
    trigger: 'idle' | 'error' | 'failed-test',
    details: { error?: string; failedHint?: string } = {}
  ) {
    const hint = composeMentorAnalysis({
      codename,
      code,
      objective: level.objective,
      trigger,
      error: details.error,
      failedHint: details.failedHint,
      tauntFrequency: settings.tauntFrequency,
      languageName: language.name,
    })
    const key = `${level.id}:${trigger}:${hint.slice(0, 160)}`
    if (hintShownThisSession.current.has(key)) return
    hintShownThisSession.current.add(key)
    setProactiveHint(hint)
  }

  function trackMistake(
    trigger: 'error' | 'failed-test' | 'preflight',
    diagnosis: { area: string; reason: string; nextStep: string }
  ) {
    setLearningProfile(recordLearningMistake({
      languageId: language.id,
      languageName: language.name,
      level,
      diagnosis,
      trigger,
    }))
    if (settings.assistantMemory) {
      rememberAssistantEvent({
        type: trigger === 'preflight' ? 'preflight' : trigger === 'error' ? 'run-error' : 'failed-test',
        languageName: language.name,
        levelTitle: level.title,
        note: `${diagnosis.area}：${diagnosis.nextStep}`,
      })
    }
  }

  // ── Proactive idle detection ─────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (proactiveHint || isRunning) return
      if (Date.now() - lastEditTime.current > settings.idleMentorDelay * 1000) {
        queueMentorAnalysis('idle')
        lastEditTime.current = Date.now()
      }
    }, 5000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proactiveHint, isRunning, code, settings.tauntFrequency, settings.idleMentorDelay, codename, level])

  // ── Graphics pre-load when entering Level 6 ──────────────────────────────────
  useEffect(() => {
    if (language.runtime !== 'python-pyodide' || !level.requiresGraphics || pyStatus !== 'ready') return
    let cancelled = false
    void Promise.resolve().then(async () => {
      if (cancelled) return
      setGraphicsLoading(true)
      try {
        await loadGraphicsPackages((msg) => setStatusMsg(msg))
      } finally {
        if (!cancelled) setGraphicsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [language.runtime, level.requiresGraphics, pyStatus])

  // ── Level switch ─────────────────────────────────────────────────────────────
  function syncLevelUrl(newLevelId: number) {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.delete('project')
    url.searchParams.set('level', String(newLevelId))
    if (isGuestPlay) {
      url.pathname = '/play'
      url.searchParams.set('language', language.route)
    } else {
      url.pathname = `/learn/${language.route}`
    }
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}`)
  }

  function handleChangeLevel(newLevelId: number) {
    if (newLevelId === levelId) return
    const newLevel = levelMap.get(newLevelId)
    if (!newLevel) return
    syncLevelUrl(newLevelId)
    setLevelId(newLevelId)
    // Restore draft for the new level if any (best-effort).
    let restored = ''
    try {
      restored = window.localStorage.getItem(`cn:draft:${languageId}:${newLevelId}`) ?? ''
    } catch {
      restored = ''
    }
    setCode(restored)
    setEntries([])
    setLastTestResult(null)
    setProactiveHint(null)
    setLastOutput('')
    setLastImage(null)
    lastEditTime.current = Date.now()
    setLastEditAt(Date.now())
    failsThisLevel.current = 0
    setFailCount(0)
    completionInProgressRef.current = false
    completionShownRef.current = false
    hintShownThisSession.current.clear()
    setBriefingComplete(false)
    setMobileTab('briefing')
  }

  // ── Code change ──────────────────────────────────────────────────────────────
  function handleCodeChange(newCode: string) {
    setCode(newCode)
    lastEditTime.current = Date.now()
    setLastEditAt(Date.now())
    if (proactiveHint) setProactiveHint(null)
    // Persist draft so a forced reload (runaway loop) doesn't lose code.
    try {
      window.localStorage.setItem(draftKey, newCode)
    } catch {
      // QuotaExceeded or private mode — ignore; draft is best-effort.
    }
  }

  // ── Fill code from guide ──────────────────────────────────────────────────────
  function handleFillCode(snippet: string) {
    setCode(snippet)
    lastEditTime.current = Date.now()
    setLastEditAt(Date.now())
    setMobileTab('editor')
  }

  // ── Award achievements ────────────────────────────────────────────────────────
  function awardAchievements(ids: string[]) {
    if (isGuestPlay) return
    if (ids.length === 0) return
    const uniqueIds = ids.filter((id) => !earnedIdsRef.current.includes(id))
    if (uniqueIds.length === 0) return

    const nextEarnedIds = [...earnedIdsRef.current, ...uniqueIds]
    earnedIdsRef.current = nextEarnedIds
    setEarnedIds(nextEarnedIds)

    void fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: uniqueIds }),
      keepalive: true,
    })

    uniqueIds.forEach((id) => {
      const a = ACHIEVEMENT_MAP.get(id)
      if (a) {
        toast.success(`${tr('解锁成就')}：${a.icon} ${tr(a.name)}`, {
          description: tr(a.description),
          duration: 5000,
        })
      }
    })
  }

  function toggleSound() {
    const enabled = sound.toggle()
    setSoundOn(enabled)
    if (enabled) sound.success()
  }

  // ── Share callback ────────────────────────────────────────────────────────────
  function handleShared() {
    if (isGuestPlay) return
    const newIds = checkNewAchievements({
      earnedIds: earnedIdsRef.current,
      isFirstSuccess: false,
      allBaseLevelsComplete: false,
      allLevelsComplete: false,
      failsBeforeSuccess: 0,
      executionMs: 0,
      hasGraphicOutput: false,
      isNightTime: false,
      isThreeAM: false,
      didShare: true,
    })
    awardAchievements(newIds)
  }

  // ── Run code ──────────────────────────────────────────────────────────────────
  const handleRun = useCallback(async () => {
    if (!briefingComplete || isRunning || pyStatus !== 'ready' || graphicsLoading) return
    if (language.runtime === 'python-pyodide') {
      const runawayReason = detectRunawayPython(code)
      if (runawayReason) {
        const result: RunResult = {
          output: '',
          error: `${tr('Nexus 预检拦截')}：${tr(runawayReason)}`,
          imageBase64: null,
          executionMs: 1,
          speedTier: { emoji: '⚠', label: '1ms', percentile: tr('运行前拦截') },
        }
        const entry: TerminalEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('zh-CN', {
            hour: '2-digit', minute: '2-digit', second: '2-digit',
          }),
          result,
        }
        setEntries((prev) => [...prev, entry])
        setLastOutput('')
        setLastImage(null)
        setLastTestResult(null)
        setRunawayDetected(false)
        setMobileTab('output')
        sound.error()
        trackMistake('preflight', {
          area: '死循环风险',
          reason: runawayReason,
          nextStep: '给循环加退出条件，或者先用计数器限制循环次数。',
        })
        if (!proactiveHint) queueMentorAnalysis('error', { error: runawayReason })
        return
      }
    }
    setIsRunning(true)
    setRunawayDetected(false)
    lastEditTime.current = Date.now()

    try {
      const result = language.runtime === 'python-pyodide'
        ? await runCode(code)
        : language.runtime === 'server-exec' && !isGuestPlay
        ? await runServerCode(language, code)
        : runStaticCode(language, level, code)
      const entry: TerminalEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString('zh-CN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
        }),
        result,
      }
      setEntries((prev) => [...prev, entry])
      setLastOutput(result.output)
      setLastImage(result.imageBase64)

      // Reconstruct output with image prefix so Level 6 tests can detect graphic output
      const testOutput = result.imageBase64
        ? `${result.output}\n__ZF_IMAGE__${result.imageBase64}`
        : result.output
      const testResult = runTests(level, testOutput, code)
      setLastTestResult(testResult)

      if (!testResult.passed) {
        const nextFailCount = failsThisLevel.current + 1
        failsThisLevel.current = nextFailCount
        setFailCount(nextFailCount)
      }

      if (result.error) {
        sound.error()
        const diagnosis = getFailureDiagnosis({
          languageName: language.name,
          code,
          failedHints: [result.error],
          failCount: failsThisLevel.current,
        })
        trackMistake('error', diagnosis)
        if (!proactiveHint) queueMentorAnalysis('error', { error: result.error })
      } else if (!testResult.passed && !proactiveHint) {
        const failedHint = testResult.results.find((r) => !r.passed)?.hint
        const diagnosis = getFailureDiagnosis({
          languageName: language.name,
          code,
          failedHints: testResult.results.filter((r) => !r.passed).map((r) => r.hint),
          failCount: failsThisLevel.current,
        })
        trackMistake('failed-test', diagnosis)
        queueMentorAnalysis('failed-test', { failedHint })
      } else if (!testResult.passed) {
        const diagnosis = getFailureDiagnosis({
          languageName: language.name,
          code,
          failedHints: testResult.results.filter((r) => !r.passed).map((r) => r.hint),
          failCount: failsThisLevel.current,
        })
        trackMistake('failed-test', diagnosis)
      }

      if (testResult.passed) {
        const ranForReal =
          language.runtime === 'python-pyodide' ||
          (language.runtime === 'server-exec' && !isGuestPlay)

        // Guest mode on non-Python languages only structure-checks the source —
        // it never compiles or runs. Be honest: never mark the level complete or
        // celebrate "通关" on a check that didn't actually run the code.
        if (!ranForReal) {
          setLastTestResult({ ...testResult, passed: false })
          setEntries((prev) => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              timestamp: new Date().toLocaleTimeString('zh-CN', {
                hour: '2-digit', minute: '2-digit', second: '2-digit',
              }),
              result: {
                output:
                  tr('结构检查通过 —— 但代码并没有真正编译运行，因此不计入通关。') + '\n' +
                  tr('登录后用「在线运行」真实编译运行、按程序输出判题，才能正式通过本关。'),
                error: '',
                imageBase64: null,
                executionMs: 1,
                speedTier: { emoji: 'ℹ️', label: tr('预览'), percentile: tr('结构检查') },
              },
            },
          ])
          setMobileTab('output')
          return
        }

        // Real pass: promote this level's previously-missed concepts up the
        // spaced-repetition ladder (powers the 错题本 · 间隔复盘 review queue).
        setLearningProfile(promoteLevelReviews(language.id, level.id))

        if (settings.assistantMemory) {
          rememberAssistantEvent({
            type: 'run-success',
            languageName: language.name,
            levelTitle: level.title,
            note: `通过了 ${level.title}`,
          })
        }
        sound.success()
        const storageLevelId = toStorageLevelId(language, level.id)
        const alreadyDone = completedLevelIds.includes(level.id)
        const newCompletedIds = alreadyDone
          ? completedLevelIds
          : [...completedLevelIds, level.id]
        const allBaseDone = levels.every((item) => newCompletedIds.includes(item.id))
        const allLevelsDone = levels.every((item) => newCompletedIds.includes(item.id))
        const hour = new Date().getHours()

        if (isGuestPlay) {
          setProgress((prev) => {
            const exists = prev.find((p) => p.level_id === storageLevelId)
            if (exists) return prev.map((p) =>
              p.level_id === storageLevelId ? { ...p, is_completed: true } : p
            )
            return [...prev, { level_id: storageLevelId, is_completed: true, attempts: 1 }]
          })
          failsThisLevel.current = 0
          setFailCount(0)
          setCompletionData({ alreadyCompleted: alreadyDone })
          setMobileTab('output')
          return
        }

        const newIds = checkNewAchievements({
          earnedIds: earnedIdsRef.current,
          isFirstSuccess: !earnedIdsRef.current.includes('first_success'),
          allBaseLevelsComplete: allBaseDone,
          allLevelsComplete: allLevelsDone,
          failsBeforeSuccess: failsThisLevel.current,
          executionMs: result.executionMs,
          hasGraphicOutput: result.imageBase64 !== null,
          isNightTime: hour >= 0 && hour < 4,
          isThreeAM: hour === 3,
          didShare: false,
          completedLevelId: alreadyDone ? undefined : level.id,
        })
        awardAchievements(newIds)
        failsThisLevel.current = 0
        setFailCount(0)

        // Guard: only one completeLevel call in-flight at a time.
        // Prevents race conditions where rapid re-runs open duplicate completion overlays.
        // startTransition: scopes the server action so React 19 never escalates its
        // errors into the parent Action, keeping all buttons responsive while pending.
        if (!completionInProgressRef.current) {
          completionInProgressRef.current = true
          completionShownRef.current = false
          startTransition(async () => {
            try {
              const res = await completeLevel(storageLevelId)
              completionInProgressRef.current = false
              if (completionShownRef.current) return  // overlay already dismissed
              completionShownRef.current = true
              setProgress((prev) => {
                const exists = prev.find((p) => p.level_id === storageLevelId)
                if (exists) return prev.map((p) =>
                  p.level_id === storageLevelId ? { ...p, is_completed: true } : p
                )
                return [...prev, { level_id: storageLevelId, is_completed: true, attempts: 1 }]
              })
              setCompletionData({ alreadyCompleted: res.alreadyCompleted })
            } catch {
              completionInProgressRef.current = false
            }
          })
        }

        setMobileTab('output')
      } else if (result.imageBase64) {
        setMobileTab('output')
      }
    } finally {
      setIsRunning(false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefingComplete, code, isRunning, pyStatus, graphicsLoading, level, completedLevelIds, proactiveHint, language, levels, isGuestPlay])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { sound.run(); handleRun() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleRun])

  const isRunDisabled = !briefingComplete || isRunning || pyStatus !== 'ready' || graphicsLoading
  const assistantLayoutStyle = {
    '--cn-assistant-panel-width': `${settings.chatPanelWidth}px`,
  } as CSSProperties
  const guidePanelWidth = assistantOpen ? 'w-56' : 'w-64'
  const resultPanelWidth = assistantOpen ? 'w-72' : 'w-80'

  function startPractice() {
    setBriefingComplete(true)
    setMobileTab('editor')
    lastEditTime.current = Date.now()
    setLastEditAt(Date.now())
  }

  // ── Shared UI fragments ───────────────────────────────────────────────────────
  const failedHints = lastTestResult?.results.filter((r) => !r.passed).map((r) => r.hint) ?? []
  const latestEntry = entries.at(-1)
  const assistantRunState = isRunning
    ? null
    : latestEntry?.result.error
    ? 'error' as const
    : lastTestResult?.passed
    ? 'success' as const
    : lastTestResult
    ? 'failed-test' as const
    : null
  const assistantRunMessage = latestEntry?.result.error
    || failedHints[0]
    || (lastTestResult?.passed ? `${tr('刚通过')} ${tr(level.title)}` : undefined)
  const failureDiagnosis = lastTestResult && !lastTestResult.passed
    ? getFailureDiagnosis({
        languageName: language.name,
        code,
        failedHints,
        failCount,
      })
    : null

  const runButton = (
    <button
      onClick={() => { sound.run(); handleRun() }}
      disabled={isRunDisabled}
      className="cn-focus-ring flex flex-shrink-0 items-center gap-1.5 rounded-lg bg-cyan-300 px-3 py-1.5 text-xs font-semibold text-black shadow-lg shadow-cyan-950/30 transition-all duration-200 hover:-translate-y-0.5 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40 sm:gap-2 sm:px-4 sm:text-sm"
    >
      {!briefingComplete ? (
        <><BookOpen className="h-3.5 w-3.5" /><span className="hidden min-[420px]:inline">{tr('先看教学')}</span><span className="min-[420px]:hidden">{tr('教学')}</span></>
      ) : isRunning ? (
        <><Loader2 className="h-3.5 w-3.5 animate-spin" /><span className="hidden min-[420px]:inline">{tr('运行中')}</span><span className="min-[420px]:hidden">{tr('运行')}</span></>
      ) : graphicsLoading ? (
        <><PackageOpen className="h-3.5 w-3.5" /><span className="hidden min-[420px]:inline">{tr('准备中')}</span><span className="min-[420px]:hidden">{tr('准备')}</span></>
      ) : (
        <><Play className="h-3.5 w-3.5 fill-black" />{tr('运行')}</>
      )}
    </button>
  )

  const runtimeModeBar = language.runtime !== 'python-pyodide' && (
    <div className="flex-shrink-0 border-b border-cyan-300/10 bg-cyan-300/[0.035] px-4 py-2">
      <p className="flex items-start gap-2 text-[11px] leading-relaxed text-cyan-50/54">
        <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-200/70" />
        <span><span className="font-semibold text-cyan-100/72">{tr(runtimeCopy.title)}：</span>{tr(runtimeCopy.body)}</span>
      </p>
    </div>
  )

  const testHintsBar = lastTestResult && !lastTestResult.passed && failureDiagnosis && (
    <div className="flex-shrink-0 space-y-2 border-t border-white/5 bg-amber-500/5 px-4 py-3">
      <div className="rounded-lg border border-amber-300/18 bg-amber-400/[0.055] px-3 py-2">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-100/85">
          <AlertTriangle className="h-3.5 w-3.5" />
          {tr('当前卡点')}：{tr(failureDiagnosis.area)}
          {failureDiagnosis.directMode && <span className="ml-auto rounded border border-amber-200/20 px-1.5 py-0.5 text-[10px] text-amber-100/60">{tr('直接提示')}</span>}
        </p>
        <p className="mt-1 text-[11px] leading-relaxed text-amber-100/62">{tr(failureDiagnosis.reason)}</p>
        <p className="mt-1 text-[11px] leading-relaxed text-white/52">
          {tr('下一步')}：{failureDiagnosis.directMode ? tr(failureDiagnosis.nextStep) : `${tr(failureDiagnosis.nextStep)} ${tr('先只改这一处。')}`}
          <span className="text-emerald-200/70">{tr('再试一次，你离通过很近。')}</span>
        </p>
      </div>
      {lastTestResult.results.filter((r) => !r.passed).map((r) => (
        <p key={r.id} className="flex items-start gap-1.5 text-xs text-amber-200/75">
          <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-300/80" />
          {tr(r.hint)}
        </p>
      ))}
    </div>
  )

  const outputControls = entries.length > 0 && (
    <div className="flex items-center gap-2">
      {!isGuestPlay && (
        <ShareButton
          code={code}
          levelId={levelId}
          languageName={language.name}
          levelTitle={level.title}
          codename={codename}
          lastOutput={lastOutput}
          lastImage={lastImage}
          onShared={handleShared}
        />
      )}
      <button
        onClick={() => { setEntries([]); setLastTestResult(null) }}
        aria-label={tr('清空终端输出')}
        className="cn-focus-ring inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/55"
      >
        <Eraser className="h-3 w-3" />
        {tr('清空')}
      </button>
    </div>
  )

  const pyStatusIndicator = (
    <>
      {graphicsLoading && (
        <span className="hidden flex-shrink-0 items-center gap-1.5 text-xs text-cyan-300/70 sm:inline-flex">
          <PackageOpen className="h-3.5 w-3.5 animate-pulse" />
          {tr('载入绘图库')}
        </span>
      )}
      {!graphicsLoading && pyStatus === 'loading' && (
        <div className="flex items-center gap-2 text-xs text-white/40 flex-shrink-0">
          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-300 rounded-full transition-all duration-500" style={{ width: `${loadProgress}%` }} />
          </div>
          <span className="hidden sm:inline">{statusMsg}</span>
        </div>
      )}
      {!graphicsLoading && pyStatus === 'ready' && (
        <span className="text-xs text-emerald-400/70 flex items-center gap-1 flex-shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
          <span className="hidden sm:inline">{tr('就绪')}</span>
        </span>
      )}
      {pyStatus === 'error' && (
        <span className="text-xs text-red-400/70 flex-shrink-0">{statusMsg}</span>
      )}
    </>
  )

  return (
    <div
      className="cn-assistant-layout relative flex h-[100dvh] w-full max-w-full flex-col overflow-hidden bg-black text-white cn-noise"
      data-assistant-open={assistantOpen ? 'true' : 'false'}
      data-assistant-dock={settings.chatDock}
      style={assistantLayoutStyle}
    >
      <SparkParticles intensity={Math.max(0.12, settings.noiseBrightness / 100)} />

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header className="relative z-10 flex min-h-12 max-w-full flex-shrink-0 flex-wrap items-center gap-2 overflow-hidden border-b border-cyan-300/12 bg-black/90 px-2 py-2 sm:gap-3 sm:px-4 md:h-12 md:flex-nowrap md:py-0">
        <Link href={isGuestPlay ? `/play?language=${language.route}` : '/dashboard'} className="cn-focus-ring flex flex-shrink-0 items-center gap-1.5 rounded px-1.5 py-1 text-sm text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/60">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span className="hidden min-[420px]:inline">{isGuestPlay ? tr('主界面') : tr('返回')}</span>
        </Link>
        <div className="w-px h-5 bg-white/10 flex-shrink-0" />
        <div className="hidden min-w-0 sm:block">
          <BrandHeader dark />
        </div>
        <div className="flex min-w-0 items-center gap-1.5 sm:hidden">
          <CodeNexusLogo className="flex-shrink-0 text-white" size={24} />
          <div className="min-w-0">
            <p className="truncate font-mono text-xs font-semibold text-white/78">{language.shortName} Lv.{level.id}</p>
            <p className="truncate text-[10px] text-white/32">{tr(level.title)}</p>
          </div>
        </div>

        {/* Level badge — desktop */}
        <div className="hidden md:flex w-px h-5 bg-white/10 flex-shrink-0" />
        <div className="hidden md:flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-md px-2.5 py-1 text-xs text-white/60 flex-shrink-0">
          <span>{level.icon}</span>
          <span className="font-mono">{language.shortName} · Lv.{level.id} · {tr(level.badge)}</span>
        </div>

        <div className="flex-1" />

        <LanguageToggle variant="badge" />
        {pyStatusIndicator}
        {isGuestPlay ? (
          <Link
            href="/register?from=play"
            className="cn-focus-ring inline-flex h-8 flex-shrink-0 items-center rounded-lg border border-cyan-300/24 bg-cyan-300/10 px-2 text-xs font-semibold text-cyan-100 transition-colors hover:bg-cyan-300/18 sm:px-3"
          >
            <span className="sm:hidden">{tr('注册')}</span>
            <span className="hidden sm:inline">{tr('保存进度')}</span>
          </Link>
        ) : (
          <CommandCenter
            initialCodename={codename}
            initialSettings={initialSettings}
            compact
          />
        )}
        {/* Sound toggle */}
        <button
          onClick={toggleSound}
          title={soundOn ? tr('关闭音效') : tr('开启音效')}
          aria-label={soundOn ? tr('关闭音效') : tr('开启音效')}
          aria-pressed={soundOn}
          className="cn-focus-ring flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/30 transition-colors hover:bg-white/[0.04] hover:text-white/70"
        >
          {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>
        <div className="ml-1">{runButton}</div>
      </header>

      {/* ── Desktop: three-panel layout ─────────────────────────────────────── */}
      <div className="relative z-10 hidden flex-1 overflow-hidden xl:flex">
        {/* Guide */}
        <aside className={`${guidePanelWidth} flex-shrink-0 overflow-hidden border-r border-white/8 transition-[width] duration-500`}>
          <GuidePanel
            levelId={levelId}
            levels={levels}
            languageName={language.name}
            onFillCode={handleFillCode}
            onChangeLevel={handleChangeLevel}
            completedLevelIds={completedLevelIds}
            learningProfile={learningProfile}
            guestMode={isGuestPlay}
            onProfileChange={setLearningProfile}
          />
        </aside>

        {/* Editor */}
        <main className="flex-1 flex flex-col overflow-hidden border-r border-white/8">
          <div className="h-8 flex-shrink-0 flex items-center px-4 border-b border-white/5 bg-[var(--code-bg-elevated)] gap-3">
            <span className="text-white/20 text-[10px] uppercase tracking-widest">
              {briefingComplete ? tr('The Lab · 代码节点') : tr('The Briefing · 教学引导')}
            </span>
            {lastTestResult && (
              <div className="flex gap-1.5">
                {lastTestResult.results.map((r) => (
                  <span key={r.id} title={r.passed ? tr('测试通过') : tr(r.hint)}
                    className={`w-2 h-2 rounded-full ${r.passed ? 'bg-emerald-400' : 'bg-red-400'}`} />
                ))}
              </div>
            )}
            <span className="ml-auto text-[10px] text-white/15">{tr('运行控制')}</span>
          </div>
          {runtimeModeBar}
          {briefingComplete ? (
            <>
              <div className="flex-1 overflow-hidden">
                <CodeEditor ref={editorRef} value={code} onChange={handleCodeChange} language={language.editorLanguage} />
              </div>
              {testHintsBar}
            </>
          ) : (
            <div className="min-h-0 flex-1 overflow-hidden">
              <LessonBriefing level={level} languageName={language.name} codename={codename} onStart={startPractice} />
            </div>
          )}
        </main>

        {/* Result */}
        <aside className={`${resultPanelWidth} flex flex-shrink-0 flex-col overflow-hidden transition-[width] duration-500`}>
          <div className="h-8 flex-shrink-0 flex items-center px-4 border-b border-white/5 bg-[var(--code-bg)] gap-2">
            <span className="text-white/20 text-[10px] uppercase tracking-widest">{tr('The Result · 输出')}</span>
            <div className="ml-auto">{outputControls}</div>
          </div>
          <div className="flex-1 overflow-hidden">
            <TerminalOutput
              entries={entries}
              isRunning={isRunning}
              pyStatus={statusMsg}
              languageName={language.name}
              commandLabel={commandLabel(language)}
            />
          </div>
        </aside>
      </div>

      {/* ── Mobile: tab-based layout ─────────────────────────────────────────── */}
      <div className="relative z-10 flex w-full min-w-0 flex-1 flex-col overflow-hidden xl:hidden">
        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {mobileTab === 'briefing' && (
            <LessonBriefing level={level} languageName={language.name} codename={codename} onStart={startPractice} />
          )}

          {mobileTab === 'guide' && (
            <GuidePanel
              levelId={levelId}
              levels={levels}
              languageName={language.name}
              onFillCode={handleFillCode}
              onChangeLevel={handleChangeLevel}
              completedLevelIds={completedLevelIds}
              learningProfile={learningProfile}
              guestMode={isGuestPlay}
              onProfileChange={setLearningProfile}
            />
          )}

          {mobileTab === 'editor' && (
            <div className="h-full flex flex-col overflow-hidden">
              {briefingComplete ? (
                <>
                  <MobileToolbar editorRef={editorRef} />
                  {runtimeModeBar}
                  <div className="flex-1 overflow-hidden">
                    <CodeEditor ref={editorRef} value={code} onChange={handleCodeChange} language={language.editorLanguage} />
                  </div>
                  {testHintsBar}
                </>
              ) : (
                <LessonBriefing level={level} languageName={language.name} codename={codename} onStart={startPractice} />
              )}
            </div>
          )}

          {mobileTab === 'output' && (
            <div className="h-full flex flex-col overflow-hidden">
              <div className="flex-shrink-0 flex items-center gap-2 px-3 py-1.5 border-b border-white/5 bg-[var(--code-bg)]">
                <span className="text-white/20 text-[10px] uppercase tracking-widest">{tr('结果')}</span>
                <div className="ml-auto">{outputControls}</div>
              </div>
              <div className="flex-1 overflow-hidden">
                <TerminalOutput
                  entries={entries}
                  isRunning={isRunning}
                  pyStatus={statusMsg}
                  languageName={language.name}
                  commandLabel={commandLabel(language)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile bottom tab bar */}
        <nav className="grid w-full min-w-0 flex-shrink-0 grid-cols-4 border-t border-white/10 bg-[var(--code-bg-elevated)] pb-[env(safe-area-inset-bottom)]">
          {([
            { id: 'briefing', label: '教学', icon: BookOpen },
            { id: 'guide', label: '攻略', icon: BookOpen },
            { id: 'editor', label: '编码台', icon: Keyboard },
            { id: 'output', label: '结果', icon: TerminalIcon },
          ] as const).map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setMobileTab(tab.id)}
                className={`cn-focus-ring flex min-w-0 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                  mobileTab === tab.id
                    ? 'bg-cyan-300/10 text-cyan-200'
                    : 'text-white/30 hover:text-white/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tr(tab.label)}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* ── Runaway-execution rescue ─────────────────────────────────────────
          Pyodide is on the main thread; an infinite loop freezes the tab.
          After 8s of running we reveal a force-stop button that reloads the
          page. The editor draft is auto-saved to localStorage so users don't
          lose code. */}
      <AnimatePresence>
        {runawayDetected && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            className="fixed inset-x-0 bottom-6 z-[60] mx-auto flex w-fit max-w-[calc(100vw-32px)] items-center gap-3 rounded-lg border border-red-300/35 bg-black/94 px-4 py-3 shadow-2xl shadow-red-950/45 backdrop-blur-xl"
          >
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-300" />
            <div className="text-xs leading-relaxed text-white/72">
              {tr('检测到代码运行超过 8 秒——可能死循环。')}
              <span className="text-white/35"> {tr('编辑器内容已保存。')}</span>
            </div>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="cn-focus-ring flex-shrink-0 rounded-lg bg-red-400/95 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-400"
            >
              {tr('强制停止')}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating AI ─────────────────────────────────────────────────────── */}
      <AIChat
        currentCode={code}
        codename={codename}
        languageName={language.name}
        tauntFrequency={settings.tauntFrequency}
        settings={settings}
        proactiveHint={proactiveHint}
        onProactiveAccept={() => setProactiveHint(null)}
        onProactiveDismiss={() => setProactiveHint(null)}
        guestMode={isGuestPlay}
        levelTitle={level.title}
        levelObjective={level.objective}
        briefingComplete={briefingComplete}
        isRunning={isRunning}
        lastRunState={assistantRunState}
        lastRunMessage={assistantRunMessage}
        lastEditAt={lastEditAt}
        onOpenChange={setAssistantOpen}
      />

      {/* ── Level complete overlay ───────────────────────────────────────────── */}
      <AnimatePresence>
        {completionData && (
          <LevelCompleteOverlay
            levelId={levelId}
            levels={levels}
            languageName={language.name}
            languageId={language.id}
            alreadyCompleted={completionData.alreadyCompleted}
            learningProfile={learningProfile}
            demoMode={isGuestPlay}
            onNext={() => {
              completionShownRef.current = false
              setCompletionData(null)
              if (levelId < levels.length) handleChangeLevel(levelId + 1)
            }}
            onDashboard={() => {
              completionShownRef.current = false
              setCompletionData(null)
              router.push(isGuestPlay ? `/play?language=${language.route}` : `/dashboard?language=${language.route}`)
            }}
            onRegister={() => router.push('/register?from=play')}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
