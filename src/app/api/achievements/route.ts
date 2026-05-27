import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const { ids } = await req.json()
  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const achievementIds = ids
    .filter((id): id is string => typeof id === 'string')
    .map((id) => id.slice(0, 50))

  if (achievementIds.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const { error } = await supabase.from('user_achievements').upsert(
    achievementIds.map((achievement_id) => ({
      user_id: user.id,
      achievement_id,
      earned_at: new Date().toISOString(),
    })),
    { onConflict: 'user_id,achievement_id', ignoreDuplicates: true }
  )

  if (error) {
    console.error('achievement upsert error:', error)
    return NextResponse.json({ error: 'Failed to save achievements' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
