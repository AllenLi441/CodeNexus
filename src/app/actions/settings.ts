'use server'

import { revalidatePath } from 'next/cache'
import { createClient, getCurrentUser } from '@/lib/supabase/server'
import {
  DEFAULT_ASSISTANT_LIVELINESS,
  DEFAULT_ASSISTANT_PERSONA,
  resolveAssistantPersona,
  type AssistantPersonaId,
} from '@/lib/assistant-persona'

export type FontMode = 'hacker' | 'cyberpunk'
export type CourseViewMode = 'picker' | 'map'

export type CommandSettingsPayload = {
  codename: string
  tauntFrequency: number
  fontMode: FontMode
  noiseBrightness: number
  chatDock?: 'left' | 'right'
  chatPanelWidth?: number
  autoOpenMentor?: boolean
  idleMentorDelay?: number
  editorFontSize?: number
  terminalFontSize?: number
  mapAnimations?: boolean
  courseViewMode?: CourseViewMode
  assistantPersona?: AssistantPersonaId
  assistantLiveliness?: number
  assistantMemory?: boolean
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 50
  return Math.min(100, Math.max(0, Math.round(value)))
}

function clampNumber(value: number | undefined, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(max, Math.max(min, Math.round(value)))
}

function isMissingProfileColumnError(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST204' || /schema cache|column/i.test(error.message ?? '')
}

export async function updateCommandSettings(payload: CommandSettingsPayload): Promise<{
  ok: boolean
  error?: string
}> {
  const user = await getCurrentUser()
  if (!user) return { ok: false, error: '登录状态已失效。' }

  const codename = payload.codename.trim().slice(0, 24)
  if (codename.length < 2) {
    return { ok: false, error: '代号至少 2 个字符。' }
  }

  const fontMode: FontMode = payload.fontMode === 'cyberpunk' ? 'cyberpunk' : 'hacker'
  const tauntFrequency = clampPercent(payload.tauntFrequency)
  const noiseBrightness = clampPercent(payload.noiseBrightness)
  const chatDock = payload.chatDock === 'left' ? 'left' : 'right'
  const chatPanelWidth = clampNumber(payload.chatPanelWidth, 320, 520, 380)
  const idleMentorDelay = clampNumber(payload.idleMentorDelay, 15, 180, 60)
  const editorFontSize = clampNumber(payload.editorFontSize, 12, 20, 14)
  const terminalFontSize = clampNumber(payload.terminalFontSize, 12, 20, 14)
  const autoOpenMentor = Boolean(payload.autoOpenMentor)
  const mapAnimations = payload.mapAnimations ?? true
  const courseViewMode: CourseViewMode = payload.courseViewMode === 'map' ? 'map' : 'picker'
  const assistantPersona = resolveAssistantPersona(payload.assistantPersona ?? DEFAULT_ASSISTANT_PERSONA).id
  const assistantLiveliness = clampNumber(payload.assistantLiveliness, 0, 100, DEFAULT_ASSISTANT_LIVELINESS)
  const assistantMemory = payload.assistantMemory ?? true
  const supabase = await createClient()

  const { error: profileError } = await supabase.from('user_profiles').upsert(
    {
      id: user.id,
      nickname: codename,
      mentor_taunt_frequency: tauntFrequency,
      mentor_font_mode: fontMode,
      noise_brightness: noiseBrightness,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  )

  if (profileError) {
    if (!isMissingProfileColumnError(profileError)) {
      return { ok: false, error: profileError.message }
    }

    await supabase
      .from('user_profiles')
      .upsert({ id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'id' })
  }

  const { error: authError } = await supabase.auth.updateUser({
    data: {
      display_name: codename,
      onboarding_completed: true,
      mentor_taunt_frequency: tauntFrequency,
      mentor_font_mode: fontMode,
      noise_brightness: noiseBrightness,
      chat_dock: chatDock,
      chat_panel_width: chatPanelWidth,
      auto_open_mentor: autoOpenMentor,
      idle_mentor_delay: idleMentorDelay,
      editor_font_size: editorFontSize,
      terminal_font_size: terminalFontSize,
      map_animations: mapAnimations,
      course_view_mode: courseViewMode,
      assistant_persona: assistantPersona,
      assistant_liveliness: assistantLiveliness,
      assistant_memory: assistantMemory,
    },
  })

  if (authError) return { ok: false, error: authError.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}
