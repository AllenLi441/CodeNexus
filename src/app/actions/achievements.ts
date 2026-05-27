'use server'

import { createClient, getCurrentUser } from '@/lib/supabase/server'

export async function saveAchievements(ids: string[]): Promise<void> {
  if (ids.length === 0) return
  const user = await getCurrentUser()
  if (!user) return
  const supabase = await createClient()

  await supabase.from('user_achievements').upsert(
    ids.map((achievement_id) => ({
      user_id: user.id,
      achievement_id,
      earned_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
  )
}

export async function fetchAchievements(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const supabase = await createClient()

  const { data } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', user.id)

  return (data ?? []).map((r) => r.achievement_id)
}
