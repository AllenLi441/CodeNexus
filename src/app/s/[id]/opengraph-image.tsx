import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'
import { LEVEL_MAP } from '@/lib/levels'
import { SITE_HOST } from '@/lib/site'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export const runtime = 'nodejs'

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: snippet } = await supabase
    .from('shared_snippets')
    .select('code, title, level_id, has_graphic, language, mentor_quote, codename')
    .eq('id', id)
    .single()

  const code = snippet?.code ?? '# No code found'
  const language = snippet?.language ?? 'Python'
  const title = snippet?.title ?? `${language} 代码片段`
  const level = snippet?.level_id ? LEVEL_MAP.get(snippet.level_id) : null
  const mentorQuote = typeof snippet?.mentor_quote === 'string' ? snippet.mentor_quote : null
  const codename = typeof snippet?.codename === 'string' ? snippet.codename : 'CodeNexus 玩家'

  // Show first 16 lines of code
  const previewLines = code.split('\n').slice(0, 16).join('\n')

  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        background: '#0a0a12',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {/* Left: Code panel */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '48px',
          position: 'relative',
        }}
      >
        {/* Brand row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'rgba(99,102,241,0.25)',
              border: '1.5px solid rgba(99,102,241,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            ⚡
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ color: '#818cf8', fontWeight: 700, fontSize: 18, lineHeight: 1 }}>
              CodeNexus
            </span>
            <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 2 }}>AI 编程中枢</span>
          </div>
          {level && (
            <div
              style={{
                marginLeft: 12,
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: 20,
                padding: '4px 12px',
                color: '#818cf8',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {level.icon} Lv.{level.id} · {level.badge}
            </div>
          )}
        </div>

        {/* Title */}
        <div style={{ color: 'white', fontSize: 28, fontWeight: 700, marginBottom: 20, lineHeight: 1.3 }}>
          {title}
        </div>

        {/* Code block */}
        <div
          style={{
            flex: 1,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 12,
            padding: '20px 24px',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <pre
            style={{
              fontFamily: '"Courier New", monospace',
              fontSize: 13,
              lineHeight: 1.7,
              color: '#a5b4fc',
              margin: 0,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {previewLines}
            {code.split('\n').length > 16 ? '\n...' : ''}
          </pre>
          {/* Fade overlay */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 80,
              background: 'linear-gradient(transparent, rgba(10,10,18,0.9))',
            }}
          />
        </div>
      </div>

      {/* Right: Mentor share panel */}
      <div
        style={{
          width: 360,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          justifyContent: 'center',
          padding: '48px 32px',
          borderLeft: '1px solid rgba(255,255,255,0.06)',
          gap: 18,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: 'radial-gradient(circle, rgba(103,232,249,0.22), rgba(103,232,249,0.06))',
            border: '2px solid rgba(103,232,249,0.38)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 32,
            color: '#cffafe',
          }}
        >
          N
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ color: '#67e8f9', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase' }}>
            Nexus 老炮
          </div>
          <div style={{ color: 'rgba(255,255,255,0.42)', fontSize: 13 }}>
            {codename} 的导师吐槽卡
          </div>
        </div>

        <div
          style={{
            border: '1px solid rgba(103,232,249,0.18)',
            background: 'rgba(103,232,249,0.06)',
            borderRadius: 14,
            padding: '22px 20px',
            color: 'rgba(255,255,255,0.88)',
            fontSize: 24,
            lineHeight: 1.35,
            fontWeight: 700,
          }}
        >
          {mentorQuote ? `“${mentorQuote.slice(0, 118)}${mentorQuote.length > 118 ? '…' : ''}”` : `点击查看这段 ${language} 代码`}
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #67e8f9, #22d3ee)',
            borderRadius: 12,
            padding: '12px 28px',
            color: '#020617',
            fontWeight: 700,
            fontSize: 15,
            textAlign: 'center',
          }}
        >
          免费试玩 →
        </div>
        <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11 }}>
          {SITE_HOST}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
