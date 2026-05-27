'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getLanguageModule } from '@/lib/language-modules'
import {
  DEFAULT_ASSISTANT_LIVELINESS,
  DEFAULT_ASSISTANT_PERSONA,
  resolveAssistantPersona,
  type AssistantPersonaId,
} from '@/lib/assistant-persona'

function isMissingProfileColumnError(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST204' || /schema cache|column/i.test(error.message ?? '')
}

export async function saveNickname(
  nickname: string,
  preferredLanguage?: string,
  assistantPersona?: AssistantPersonaId
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: '登录状态已失效。' }

  const cleanName = nickname.trim().slice(0, 24)
  const language = getLanguageModule(preferredLanguage)
  const persona = resolveAssistantPersona(assistantPersona ?? DEFAULT_ASSISTANT_PERSONA)
  if (cleanName.length < 2) {
    return { ok: false, error: '昵称至少 2 个字符。' }
  }

  const { error: profileError } = await supabase.from('user_profiles').upsert(
    {
      id: user.id,
      nickname: cleanName,
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
      display_name: cleanName,
      preferred_language: language.id,
      onboarding_completed: true,
      assistant_persona: persona.id,
      assistant_liveliness: DEFAULT_ASSISTANT_LIVELINESS,
      assistant_memory: true,
    },
  })

  if (authError) return { ok: false, error: authError.message }

  revalidatePath('/', 'layout')
  return { ok: true }
}
