'use server'

import { createClient, getCurrentUser } from '@/lib/supabase/server'
import type { CourseViewMode, FontMode } from '@/app/actions/settings'
import {
  DEFAULT_ASSISTANT_LIVELINESS,
  DEFAULT_ASSISTANT_PERSONA,
  resolveAssistantPersona,
  type AssistantPersonaId,
} from '@/lib/assistant-persona'
import { hasFullUnlockAccess, mergeFullUnlockProgress } from '@/lib/server-entitlements'

export type ProgressRow = {
  level_id: number
  is_completed: boolean
  attempts: number
}

export type ProfileRow = {
  nickname: string | null
  mentor_taunt_frequency: number
  mentor_font_mode: FontMode
  noise_brightness: number
  chat_dock: 'left' | 'right'
  chat_panel_width: number
  auto_open_mentor: boolean
  idle_mentor_delay: number
  editor_font_size: number
  terminal_font_size: number
  map_animations: boolean
  course_view_mode: CourseViewMode
  assistant_persona: AssistantPersonaId
  assistant_liveliness: number
  assistant_memory: boolean
}

const DEFAULT_PROFILE: ProfileRow = {
  nickname: null,
  // Sarcasm locked to lowest product-wide.
  mentor_taunt_frequency: 0,
  mentor_font_mode: 'cyberpunk',
  noise_brightness: 45,
  chat_dock: 'right',
  chat_panel_width: 380,
  auto_open_mentor: false,
  idle_mentor_delay: 60,
  editor_font_size: 14,
  terminal_font_size: 14,
  map_animations: true,
  course_view_mode: 'picker',
  assistant_persona: DEFAULT_ASSISTANT_PERSONA,
  assistant_liveliness: DEFAULT_ASSISTANT_LIVELINESS,
  assistant_memory: true,
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function asFontMode(value: unknown): FontMode {
  return value === 'hacker' ? 'hacker' : 'cyberpunk'
}

function asDock(value: unknown): 'left' | 'right' {
  return value === 'left' ? 'left' : 'right'
}

function asBoolean(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback
}

function asCourseViewMode(value: unknown): CourseViewMode {
  return value === 'map' ? 'map' : 'picker'
}

function normalizeProfile(
  row: Record<string, unknown> | null | undefined,
  metadata: Record<string, unknown> | null | undefined
): ProfileRow {
  return {
    nickname: typeof row?.nickname === 'string'
      ? row.nickname
      : typeof metadata?.display_name === 'string'
      ? metadata.display_name
      : null,
    // Locked to lowest regardless of any previously-saved value.
    mentor_taunt_frequency: 0,
    mentor_font_mode: asFontMode(row?.mentor_font_mode ?? metadata?.mentor_font_mode),
    noise_brightness: asNumber(
      row?.noise_brightness ?? metadata?.noise_brightness,
      DEFAULT_PROFILE.noise_brightness
    ),
    chat_dock: asDock(metadata?.chat_dock),
    chat_panel_width: asNumber(metadata?.chat_panel_width, DEFAULT_PROFILE.chat_panel_width),
    auto_open_mentor: asBoolean(metadata?.auto_open_mentor, DEFAULT_PROFILE.auto_open_mentor),
    idle_mentor_delay: asNumber(metadata?.idle_mentor_delay, DEFAULT_PROFILE.idle_mentor_delay),
    editor_font_size: asNumber(metadata?.editor_font_size, DEFAULT_PROFILE.editor_font_size),
    terminal_font_size: asNumber(metadata?.terminal_font_size, DEFAULT_PROFILE.terminal_font_size),
    map_animations: asBoolean(metadata?.map_animations, DEFAULT_PROFILE.map_animations),
    course_view_mode: asCourseViewMode(metadata?.course_view_mode),
    assistant_persona: resolveAssistantPersona(metadata?.assistant_persona as string | undefined).id,
    assistant_liveliness: asNumber(metadata?.assistant_liveliness, DEFAULT_PROFILE.assistant_liveliness),
    assistant_memory: asBoolean(metadata?.assistant_memory, DEFAULT_PROFILE.assistant_memory),
  }
}

export async function fetchUserProgress(): Promise<{
  progress: ProgressRow[]
  profile: ProfileRow
}> {
  const user = await getCurrentUser()
  if (!user) return { progress: [], profile: DEFAULT_PROFILE }
  const supabase = await createClient()

  // Upsert profile to ensure it exists
  await supabase
    .from('user_profiles')
    .upsert({ id: user.id }, { onConflict: 'id', ignoreDuplicates: true })

  const [progressRes, profileRes] = await Promise.all([
    supabase
      .from('user_progress')
      .select('level_id, is_completed, attempts')
      .eq('user_id', user.id),
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  ])

  const progress = (progressRes.data ?? []) as ProgressRow[]

  return {
    progress: hasFullUnlockAccess(user.email) ? mergeFullUnlockProgress(progress) : progress,
    profile: normalizeProfile(profileRes.data as Record<string, unknown> | null, user.user_metadata),
  }
}

export async function recordAttempt(levelId: number) {
  const user = await getCurrentUser()
  if (!user) return
  if (hasFullUnlockAccess(user.email)) return
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('user_progress')
    .select('attempts')
    .eq('user_id', user.id)
    .eq('level_id', levelId)
    .maybeSingle()

  await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      level_id: levelId,
      attempts: (existing?.attempts ?? 0) + 1,
    },
    { onConflict: 'user_id,level_id' }
  )
}

export async function completeLevel(levelId: number): Promise<{
  alreadyCompleted: boolean
}> {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthenticated')
  if (hasFullUnlockAccess(user.email)) return { alreadyCompleted: true }
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('user_progress')
    .select('is_completed')
    .eq('user_id', user.id)
    .eq('level_id', levelId)
    .maybeSingle()

  const alreadyCompleted = existing?.is_completed ?? false

  // Upsert progress row
  await supabase.from('user_progress').upsert(
    {
      user_id: user.id,
      level_id: levelId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,level_id' }
  )

  await supabase.from('user_profiles').upsert(
    { id: user.id, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  )

  // DO NOT revalidatePath here — any revalidation triggers a router refresh that
  // races with overlay state updates and freezes all buttons. The dashboard fetches
  // fresh data directly from Supabase on each load, so no pre-invalidation is needed.

  return { alreadyCompleted }
}
