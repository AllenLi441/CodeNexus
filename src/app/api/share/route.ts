import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function generateId(len = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789' // no ambiguous chars
  const bytes = new Uint8Array(len)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => chars[b % chars.length]).join('')
}

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' && value.trim()
    ? value.trim().slice(0, max)
    : null
}

function isMissingShareWallColumn(error: { message?: string; code?: string } | null) {
  if (!error) return false
  return error.code === 'PGRST204' || /schema cache|column|mentor_quote|is_wall_public|share_kind/i.test(error.message ?? '')
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 })

  const body = await req.json()
  const {
    code,
    levelId,
    language = 'Python',
    title,
    outputText,
    outputImage,
    hasGraphic,
    mentorQuote,
    codename,
  } = body

  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 })
  }

  const cleanMentorQuote = cleanText(mentorQuote, 280)
  const cleanCodename = cleanText(codename, 40)
  const cleanTitle = cleanText(title, 200)
  const cleanLanguage = cleanText(language, 40) ?? 'Python'
  const cleanOutputText = cleanText(outputText, 10_000)
  // Public wall removed — shares are now private links only (/s/[id]).
  const wallPublic = false

  // Generate unique ID (retry on collision, very unlikely)
  let id = generateId()
  for (let i = 0; i < 3; i++) {
    const { data: existing } = await supabase
      .from('shared_snippets')
      .select('id')
      .eq('id', id)
      .single()
    if (!existing) break
    id = generateId()
  }

  const insertPayload = {
    id,
    user_id: user.id,
    code: code.slice(0, 50_000), // cap at 50KB
    language: cleanLanguage,
    level_id: levelId ?? null,
    title: cleanTitle,
    output_text: cleanOutputText,
    output_image: outputImage ?? null,
    has_graphic: hasGraphic ?? false,
    mentor_quote: cleanMentorQuote,
    codename: cleanCodename,
    is_wall_public: wallPublic,
    wall_reaction: wallPublic ? '被导师精准扎心' : null,
    share_kind: cleanMentorQuote ? 'mentor_roast' : 'snippet',
  }

  const { error } = await supabase.from('shared_snippets').insert(insertPayload)

  if (error) {
    if (isMissingShareWallColumn(error)) {
      const { error: fallbackError } = await supabase.from('shared_snippets').insert({
        id,
        user_id: user.id,
        code: insertPayload.code,
        language: insertPayload.language,
        level_id: insertPayload.level_id,
        title: insertPayload.title,
        output_text: insertPayload.output_text,
        output_image: insertPayload.output_image,
        has_graphic: insertPayload.has_graphic,
      })
      if (!fallbackError) {
        const origin = req.headers.get('origin') ?? `https://${req.headers.get('host')}`
        return NextResponse.json({
          shareId: id,
          url: `${origin}/s/${id}`,
          wallUrl: null,
          wallPublic: false,
          warning: 'mentor_wall_migration_missing',
        })
      }
    }
    console.error('share insert error:', error)
    return NextResponse.json({ error: 'Failed to save snippet' }, { status: 500 })
  }

  const origin = req.headers.get('origin') ?? `https://${req.headers.get('host')}`
  return NextResponse.json({
    shareId: id,
    url: `${origin}/s/${id}`,
    wallUrl: wallPublic ? `${origin}/wall` : null,
    wallPublic,
  })
}
