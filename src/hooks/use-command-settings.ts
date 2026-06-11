'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CourseViewMode, FontMode } from '@/app/actions/settings'
import {
  DEFAULT_ASSISTANT_LIVELINESS,
  DEFAULT_ASSISTANT_PERSONA,
  resolveAssistantPersona,
  type AssistantPersonaId,
} from '@/lib/assistant-persona'
import { normalizeAiProvider, type AiProvider } from '@/lib/ai-config'

export type CommandSettings = {
  tauntFrequency: number
  fontMode: FontMode
  noiseBrightness: number
  chatDock: 'left' | 'right'
  chatPanelWidth: number
  autoOpenMentor: boolean
  idleMentorDelay: number
  editorFontSize: number
  terminalFontSize: number
  mapAnimations: boolean
  courseViewMode: CourseViewMode
  assistantPersona: AssistantPersonaId
  assistantLiveliness: number
  assistantMemory: boolean
  aiProvider: AiProvider
  aiApiKey: string
  aiBaseUrl: string
  aiModel: string
}

export const DEFAULT_COMMAND_SETTINGS: CommandSettings = {
  tauntFrequency: 55,
  // 'cyberpunk' is the proportional sans stack (with CJK fallbacks) — the
  // professional default. 'hacker' (global monospace) stays as an opt-in.
  fontMode: 'cyberpunk',
  noiseBrightness: 45,
  chatDock: 'right',
  chatPanelWidth: 380,
  autoOpenMentor: false,
  idleMentorDelay: 60,
  editorFontSize: 14,
  terminalFontSize: 14,
  mapAnimations: true,
  courseViewMode: 'picker',
  assistantPersona: DEFAULT_ASSISTANT_PERSONA,
  assistantLiveliness: DEFAULT_ASSISTANT_LIVELINESS,
  assistantMemory: true,
  aiProvider: 'deepseek',
  aiApiKey: '',
  aiBaseUrl: 'https://api.deepseek.com',
  aiModel: 'deepseek-chat',
}

const STORAGE_KEY = 'codenexus.command-settings'
const EVENT_NAME = 'codenexus-command-settings-change'

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, Math.round(value)))
}

function clampNumber(value: number, min: number, max: number, fallback: number) {
  if (!Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

export function normalizeCommandSettings(settings?: Partial<CommandSettings> | null): CommandSettings {
  return {
    tauntFrequency: clampPercent(settings?.tauntFrequency ?? DEFAULT_COMMAND_SETTINGS.tauntFrequency),
    fontMode: settings?.fontMode === 'hacker' ? 'hacker' : 'cyberpunk',
    noiseBrightness: clampPercent(settings?.noiseBrightness ?? DEFAULT_COMMAND_SETTINGS.noiseBrightness),
    chatDock: settings?.chatDock === 'left' ? 'left' : 'right',
    chatPanelWidth: clampNumber(settings?.chatPanelWidth ?? DEFAULT_COMMAND_SETTINGS.chatPanelWidth, 320, 520, DEFAULT_COMMAND_SETTINGS.chatPanelWidth),
    autoOpenMentor: Boolean(settings?.autoOpenMentor ?? DEFAULT_COMMAND_SETTINGS.autoOpenMentor),
    idleMentorDelay: clampNumber(settings?.idleMentorDelay ?? DEFAULT_COMMAND_SETTINGS.idleMentorDelay, 15, 180, DEFAULT_COMMAND_SETTINGS.idleMentorDelay),
    editorFontSize: clampNumber(settings?.editorFontSize ?? DEFAULT_COMMAND_SETTINGS.editorFontSize, 12, 20, DEFAULT_COMMAND_SETTINGS.editorFontSize),
    terminalFontSize: clampNumber(settings?.terminalFontSize ?? DEFAULT_COMMAND_SETTINGS.terminalFontSize, 12, 20, DEFAULT_COMMAND_SETTINGS.terminalFontSize),
    mapAnimations: settings?.mapAnimations ?? DEFAULT_COMMAND_SETTINGS.mapAnimations,
    courseViewMode: settings?.courseViewMode === 'map' ? 'map' : 'picker',
    assistantPersona: resolveAssistantPersona(settings?.assistantPersona).id,
    assistantLiveliness: clampPercent(settings?.assistantLiveliness ?? DEFAULT_COMMAND_SETTINGS.assistantLiveliness),
    assistantMemory: settings?.assistantMemory ?? DEFAULT_COMMAND_SETTINGS.assistantMemory,
    aiProvider: normalizeAiProvider(settings?.aiProvider),
    aiApiKey: typeof settings?.aiApiKey === 'string' ? settings.aiApiKey.trim() : DEFAULT_COMMAND_SETTINGS.aiApiKey,
    aiBaseUrl: typeof settings?.aiBaseUrl === 'string' && settings.aiBaseUrl.trim()
      ? settings.aiBaseUrl.trim()
      : DEFAULT_COMMAND_SETTINGS.aiBaseUrl,
    aiModel: typeof settings?.aiModel === 'string' && settings.aiModel.trim()
      ? settings.aiModel.trim().slice(0, 80)
      : DEFAULT_COMMAND_SETTINGS.aiModel,
  }
}

function readStoredSettings(): Partial<CommandSettings> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) as Partial<CommandSettings> : null
  } catch {
    return null
  }
}

function applySettings(settings: CommandSettings) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const mapAnimations = settings.mapAnimations ? 'on' : 'off'
  const noiseOpacity = `${settings.noiseBrightness / 100}`
  const editorFontSize = `${settings.editorFontSize}px`
  const terminalFontSize = `${settings.terminalFontSize}px`

  if (root.dataset.cnFont !== settings.fontMode) root.dataset.cnFont = settings.fontMode
  if (root.dataset.cnMapAnimations !== mapAnimations) root.dataset.cnMapAnimations = mapAnimations
  if (root.style.getPropertyValue('--cn-noise-opacity') !== noiseOpacity) {
    root.style.setProperty('--cn-noise-opacity', noiseOpacity)
  }
  if (root.style.getPropertyValue('--cn-editor-font-size') !== editorFontSize) {
    root.style.setProperty('--cn-editor-font-size', editorFontSize)
  }
  if (root.style.getPropertyValue('--cn-terminal-font-size') !== terminalFontSize) {
    root.style.setProperty('--cn-terminal-font-size', terminalFontSize)
  }
}

function settingsSignature(settings: CommandSettings) {
  return JSON.stringify(settings)
}

function sameSettings(a: CommandSettings, b: CommandSettings) {
  return settingsSignature(a) === settingsSignature(b)
}

function broadcast(settings: CommandSettings) {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: settings }))
}

export function useCommandSettings(initialSettings?: Partial<CommandSettings> | null) {
  const normalizedInitial = useMemo(() => normalizeCommandSettings(initialSettings), [initialSettings])
  const [settings, setSettings] = useState<CommandSettings>(() => normalizedInitial)

  useEffect(() => {
    applySettings(settings)
  }, [settings])

  useEffect(() => {
    let cancelled = false
    void Promise.resolve().then(() => {
      if (cancelled) return
      const stored = readStoredSettings()
      if (!stored) return
      const next = normalizeCommandSettings({ ...normalizedInitial, ...stored })
      setSettings((current) => sameSettings(current, next) ? current : next)
    })
    return () => { cancelled = true }
  }, [normalizedInitial])

  useEffect(() => {
    const onSettings = (event: Event) => {
      const detail = (event as CustomEvent<CommandSettings>).detail
      if (!detail) return
      const next = normalizeCommandSettings(detail)
      setSettings((current) => sameSettings(current, next) ? current : next)
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return
      const next = normalizeCommandSettings(readStoredSettings() ?? normalizedInitial)
      setSettings((current) => sameSettings(current, next) ? current : next)
    }

    window.addEventListener(EVENT_NAME, onSettings)
    window.addEventListener('storage', onStorage)
    return () => {
      window.removeEventListener(EVENT_NAME, onSettings)
      window.removeEventListener('storage', onStorage)
    }
  }, [normalizedInitial])

  const updateSettings = useCallback((patch: Partial<CommandSettings>) => {
    setSettings((current) => {
      const next = normalizeCommandSettings({ ...current, ...patch })
      if (sameSettings(current, next)) return current
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      applySettings(next)
      broadcast(next)
      return next
    })
  }, [])

  return { settings, updateSettings }
}
