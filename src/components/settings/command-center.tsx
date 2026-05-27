'use client'

import { useMemo, useState, useTransition } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Check, Code2, Cpu, MessageSquare, Monitor, PanelRightOpen, Save, Settings2, SlidersHorizontal, Sparkles, Terminal, UserRound, X } from 'lucide-react'
import { updateCommandSettings } from '@/app/actions/settings'
import {
  type CommandSettings,
  DEFAULT_COMMAND_SETTINGS,
  useCommandSettings,
} from '@/hooks/use-command-settings'
import { appleSpring, quickFade } from '@/lib/motion'
import { AssistantAvatar } from '@/components/assistant/assistant-avatar'
import { ASSISTANT_PERSONAS, clearAssistantMemory, livelinessLabel } from '@/lib/assistant-persona'

type CommandCenterProps = {
  initialCodename: string
  initialSettings?: Partial<CommandSettings> | null
  compact?: boolean
}

const FREQUENCY_LABELS = [
  { at: 20, label: '克制' },
  { at: 65, label: '带刺' },
  { at: 101, label: '火力全开' },
]

function frequencyLabel(value: number) {
  return FREQUENCY_LABELS.find((item) => value < item.at)?.label ?? '带刺'
}

function SliderControl({
  label,
  value,
  min,
  max,
  suffix = '',
  icon,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  icon?: ReactNode
  onChange: (value: number) => void
}) {
  return (
    <section className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
          {icon}
          {label}
        </div>
        <span className="font-mono text-xs text-cyan-200">{value}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-cyan-300"
      />
    </section>
  )
}

function ToggleControl({
  label,
  checked,
  onChange,
  description,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  description: string
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="cn-focus-ring flex w-full items-center justify-between gap-3 rounded-lg border border-white/8 bg-white/[0.025] p-3 text-left transition-colors hover:border-cyan-300/24"
    >
      <span>
        <span className="block text-xs font-medium text-white/72">{label}</span>
        <span className="mt-1 block text-[11px] leading-relaxed text-white/32">{description}</span>
      </span>
      <span className={`relative h-6 w-11 flex-shrink-0 rounded-full border transition-colors ${
        checked ? 'border-cyan-300/60 bg-cyan-300/24' : 'border-white/12 bg-white/5'
      }`}>
        <span className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-1'
        }`} />
      </span>
    </button>
  )
}

export function CommandCenter({
  initialCodename,
  initialSettings = DEFAULT_COMMAND_SETTINGS,
  compact = false,
}: CommandCenterProps) {
  const router = useRouter()
  const { settings, updateSettings } = useCommandSettings(initialSettings)
  const [isOpen, setIsOpen] = useState(false)
  const [codename, setCodename] = useState(initialCodename)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  const trimmedCodename = codename.trim()
  const canSave = trimmedCodename.length >= 2 && !isPending
  const noisePercent = useMemo(() => `${settings.noiseBrightness}%`, [settings.noiseBrightness])

  function save() {
    if (!canSave) return
    setError(null)
    setSaved(false)
    startTransition(async () => {
      const res = await updateCommandSettings({
        codename: trimmedCodename,
        tauntFrequency: settings.tauntFrequency,
        fontMode: settings.fontMode,
        noiseBrightness: settings.noiseBrightness,
        chatDock: settings.chatDock,
        chatPanelWidth: settings.chatPanelWidth,
        autoOpenMentor: settings.autoOpenMentor,
        idleMentorDelay: settings.idleMentorDelay,
        editorFontSize: settings.editorFontSize,
        terminalFontSize: settings.terminalFontSize,
        mapAnimations: settings.mapAnimations,
        courseViewMode: settings.courseViewMode,
        assistantPersona: settings.assistantPersona,
        assistantLiveliness: settings.assistantLiveliness,
        assistantMemory: settings.assistantMemory,
      })

      if (!res.ok) {
        setError(res.error ?? '保存失败。')
        return
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 1600)
      router.refresh()
    })
  }

  const modal = (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.button
            type="button"
            aria-label="关闭命令中心"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={quickFade}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[240] bg-black/72"
          />
          <div className="pointer-events-none fixed inset-0 z-[250] flex items-end justify-center p-0 sm:items-center sm:p-4">
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-label="Command Center"
              initial={{ opacity: 0, y: 26, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.985 }}
              transition={appleSpring}
              className="pointer-events-auto flex h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg border border-cyan-300/20 bg-[#020407] text-white shadow-[0_32px_140px_rgba(0,0,0,0.72),0_0_80px_rgba(34,211,238,0.12)] sm:h-[min(900px,calc(100dvh-32px))] sm:w-[min(1080px,calc(100vw-32px))] sm:rounded-lg"
            >
              <div className="flex items-center gap-4 border-b border-white/8 bg-white/[0.025] px-5 py-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-300/10 text-cyan-200">
                  <Cpu className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-wide">Command Center</p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-[0.24em] text-cyan-300/45">Nexus Control</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  title="关闭"
                  className="cn-focus-ring flex h-8 w-8 items-center justify-center rounded-lg text-white/35 transition-colors hover:bg-white/[0.08] hover:text-white/70"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="cn-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-8 pt-5">
                <div className="grid gap-5 lg:grid-cols-[1.05fr_1fr]">
                  <section className="space-y-4">
                    <div className="rounded-lg border border-white/8 bg-white/[0.025] p-4">
                      <label htmlFor="codename" className="text-xs font-medium text-white/70">代号</label>
                      <input
                        id="codename"
                        value={codename}
                        onChange={(event) => {
                          setCodename(event.target.value)
                          setSaved(false)
                        }}
                        maxLength={24}
                        className="cn-focus-ring mt-2 h-11 w-full rounded-lg border border-white/10 bg-black/45 px-3 text-sm text-white outline-none transition-colors placeholder:text-white/20 focus:border-cyan-300/55"
                        placeholder="输入你的 Nexus 代号"
                      />
                      <p className="mt-2 text-[11px] leading-relaxed text-white/32">小助手会用这个代号称呼你。别起太长，代码已经够啰嗦了。</p>
                    </div>

                    <section className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                          <SlidersHorizontal className="h-3.5 w-3.5 text-cyan-300/70" />
                          嘲讽频率
                        </div>
                        <span className="text-xs text-cyan-200">{frequencyLabel(settings.tauntFrequency)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={settings.tauntFrequency}
                        onChange={(event) => updateSettings({ tauntFrequency: Number(event.target.value) })}
                        className="w-full accent-cyan-300"
                      />
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/25">
                        <span>冷静</span>
                        <span>{settings.tauntFrequency}</span>
                        <span>尖锐</span>
                      </div>
                    </section>

                    <section className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                        <MessageSquare className="h-3.5 w-3.5 text-cyan-300/70" />
                        聊天停靠
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'left', label: '左侧' },
                          { id: 'right', label: '右侧' },
                        ] as const).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateSettings({ chatDock: option.id })}
                            className={`cn-focus-ring h-10 rounded-lg border text-xs font-semibold transition-colors ${
                              settings.chatDock === option.id
                                ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                                : 'border-white/10 bg-black/35 text-white/40 hover:border-white/22 hover:text-white/70'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </section>

                    <SliderControl
                      label="聊天面板宽度"
                      value={settings.chatPanelWidth}
                      min={320}
                      max={520}
                      suffix="px"
                      icon={<Monitor className="h-3.5 w-3.5 text-cyan-300/70" />}
                      onChange={(value) => updateSettings({ chatPanelWidth: value })}
                    />

                    <SliderControl
                      label="停顿提醒时间"
                      value={settings.idleMentorDelay}
                      min={15}
                      max={180}
                      suffix="s"
                      icon={<Bot className="h-3.5 w-3.5 text-cyan-300/70" />}
                      onChange={(value) => updateSettings({ idleMentorDelay: value })}
                    />

                    <ToggleControl
                      label="打开关卡时自动展开小助手"
                      checked={settings.autoOpenMentor}
                      onChange={(checked) => updateSettings({ autoOpenMentor: checked })}
                      description="关闭后小助手缩成角标，只有卡住或点开时才出现。"
                    />

                    <section className="space-y-3 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.035] p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/72">
                        <UserRound className="h-3.5 w-3.5 text-cyan-300/70" />
                        小助手人格
                      </div>
                      <div className="grid gap-2">
                        {ASSISTANT_PERSONAS.map((persona) => {
                          const active = settings.assistantPersona === persona.id
                          return (
                            <button
                              key={persona.id}
                              type="button"
                              onClick={() => updateSettings({ assistantPersona: persona.id })}
                              className={`cn-focus-ring flex items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                                active
                                  ? 'border-cyan-300/55 bg-cyan-300/14 text-cyan-50'
                                  : 'border-white/10 bg-black/35 text-white/44 hover:border-cyan-300/24 hover:text-white/72'
                              }`}
                            >
                              <AssistantAvatar personaId={persona.id} size="sm" active={active} />
                              <span className="min-w-0 flex-1">
                                <span className="block text-xs font-semibold">{persona.name} · {persona.pronoun}</span>
                                <span className="mt-1 line-clamp-2 block text-[11px] leading-relaxed opacity-70">{persona.description}</span>
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </section>
                  </section>

                  <section className="space-y-4">
                    <section className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-4">
                      <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                        <PanelRightOpen className="h-3.5 w-3.5 text-cyan-300/70" />
                        课程入口显示
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {([
                          {
                            id: 'picker',
                            label: '选择入口',
                            description: '语言、分支、课程分三步选，适合新用户。',
                          },
                          {
                            id: 'map',
                            label: '领域星图',
                            description: '进入可缩放分支地图，适合熟悉路线后使用。',
                          },
                        ] as const).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateSettings({ courseViewMode: option.id })}
                            className={`cn-focus-ring min-h-20 rounded-lg border p-3 text-left transition-colors ${
                              settings.courseViewMode === option.id
                                ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                                : 'border-white/10 bg-black/35 text-white/42 hover:border-white/22 hover:text-white/70'
                            }`}
                          >
                            <span className="block text-xs font-semibold">{option.label}</span>
                            <span className="mt-1 block text-[11px] leading-relaxed opacity-65">{option.description}</span>
                          </button>
                        ))}
                      </div>
                    </section>

                    <section className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-4">
                      <p className="text-xs font-medium text-white/70">字体协议</p>
                      <div className="grid grid-cols-2 gap-2">
                        {([
                          { id: 'hacker', label: 'Hacker' },
                          { id: 'cyberpunk', label: 'Cyberpunk' },
                        ] as const).map((option) => (
                          <button
                            key={option.id}
                            type="button"
                            onClick={() => updateSettings({ fontMode: option.id })}
                            className={`cn-focus-ring h-10 rounded-lg border text-xs font-semibold transition-colors ${
                              settings.fontMode === option.id
                                ? 'border-cyan-300/60 bg-cyan-300/15 text-cyan-100'
                                : 'border-white/10 bg-black/35 text-white/40 hover:border-white/22 hover:text-white/70'
                            }`}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </section>

                    <SliderControl
                      label="编辑器字号"
                      value={settings.editorFontSize}
                      min={12}
                      max={20}
                      suffix="px"
                      icon={<Code2 className="h-3.5 w-3.5 text-cyan-300/70" />}
                      onChange={(value) => updateSettings({ editorFontSize: value })}
                    />

                    <SliderControl
                      label="终端字号"
                      value={settings.terminalFontSize}
                      min={12}
                      max={20}
                      suffix="px"
                      icon={<Terminal className="h-3.5 w-3.5 text-cyan-300/70" />}
                      onChange={(value) => updateSettings({ terminalFontSize: value })}
                    />

                    <section className="space-y-3 rounded-lg border border-white/8 bg-white/[0.025] p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-xs font-medium text-white/70">
                          <Bot className="h-3.5 w-3.5 text-cyan-300/70" />
                          小助手活人感
                        </div>
                        <span className="text-xs text-cyan-200">{livelinessLabel(settings.assistantLiveliness)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={settings.assistantLiveliness}
                        onChange={(event) => updateSettings({ assistantLiveliness: Number(event.target.value) })}
                        className="w-full accent-cyan-300"
                      />
                      <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/25">
                        <span>安静</span>
                        <span>{settings.assistantLiveliness}</span>
                        <span>主动</span>
                      </div>
                    </section>

                    <ToggleControl
                      label="小助手记忆"
                      checked={settings.assistantMemory}
                      onChange={(checked) => updateSettings({ assistantMemory: checked })}
                      description="开启后会在本机记录常见错误、最近关卡和聊天节奏，用来调整提醒。"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        clearAssistantMemory()
                        setSaved(false)
                      }}
                      className="cn-focus-ring h-10 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/42 transition-colors hover:border-red-300/24 hover:text-red-100"
                    >
                      清空本机小助手记忆
                    </button>

                    <SliderControl
                      label="背景噪声亮度"
                      value={settings.noiseBrightness}
                      min={0}
                      max={100}
                      suffix="%"
                      icon={<Sparkles className="h-3.5 w-3.5 text-cyan-300/70" />}
                      onChange={(value) => updateSettings({ noiseBrightness: value })}
                    />

                    <ToggleControl
                      label="课程地图动画"
                      checked={settings.mapAnimations}
                      onChange={(checked) => updateSettings({ mapAnimations: checked })}
                      description="低性能机器可以关掉连线流动和节点脉冲。"
                    />

                    <p className="rounded-lg border border-cyan-300/12 bg-cyan-300/[0.04] px-3 py-2 text-[11px] leading-relaxed text-white/35">
                      当前噪声：{noisePercent}。所有设置会即时预览，点击保存后同步到账号。
                    </p>
                  </section>
                </div>
              </div>

              <div className="flex flex-col gap-3 border-t border-white/8 bg-[#05080b] p-4 sm:flex-row sm:items-center">
                <div className="min-h-0 flex-1">
                  {error && <p className="rounded-lg border border-red-400/25 bg-red-400/8 px-3 py-2 text-xs text-red-200">{error}</p>}
                  {saved && (
                    <p className="inline-flex items-center gap-2 rounded-lg border border-emerald-400/25 bg-emerald-400/8 px-3 py-2 text-xs text-emerald-200">
                      <Check className="h-3.5 w-3.5" /> 已同步到 Supabase
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="cn-focus-ring h-11 rounded-lg border border-white/10 px-4 text-sm font-semibold text-white/55 transition-colors hover:border-white/20 hover:text-white"
                >
                  关闭
                </button>
                <button
                  type="button"
                  onClick={save}
                  disabled={!canSave}
                  className="cn-focus-ring flex h-11 items-center justify-center gap-2 rounded-lg bg-cyan-300 px-6 text-sm font-semibold text-black transition-colors hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isPending ? <PanelRightOpen className="h-4 w-4 animate-pulse" /> : <Save className="h-4 w-4" />}
                  保存设置
                </button>
              </div>
            </motion.section>
          </div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        title="打开命令中心"
        className={`cn-focus-ring inline-flex items-center justify-center border border-cyan-400/25 bg-cyan-400/8 text-cyan-200 transition-colors hover:border-cyan-300/60 hover:bg-cyan-300/15 ${
          compact ? 'h-9 w-9 rounded-lg' : 'h-9 gap-2 rounded-lg px-3 text-xs font-medium'
        }`}
      >
        {compact ? <Settings2 className="h-4 w-4" /> : <><Settings2 className="h-4 w-4" /> 命令中心</>}
      </button>
      {typeof document === 'undefined' ? modal : createPortal(modal, document.body)}
    </>
  )
}
