import { ImageResponse } from 'next/og'
import { SITE_HOST } from '@/lib/site'

export const alt = 'CodeNexus — AI 编程学习平台 · Learn to code with AI'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Site-wide social card. Route-level opengraph-image files (e.g. /s/[id])
// override this one.
export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: '#0a0a12',
        position: 'relative',
        overflow: 'hidden',
        padding: '80px',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(103,232,249,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.05) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 44 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 14,
            background: 'rgba(103,232,249,0.14)',
            border: '2px solid rgba(103,232,249,0.42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 26,
            color: '#cffafe',
            fontWeight: 700,
          }}
        >
          {'</>'}
        </div>
        <span style={{ color: '#67e8f9', fontWeight: 700, fontSize: 34 }}>CodeNexus</span>
      </div>

      {/* zh-first to match the default (cookie-less) crawler metadata, with an
          English subline so the card reads in both locales. */}
      <div style={{ color: 'white', fontSize: 64, fontWeight: 700, lineHeight: 1.15, maxWidth: 900 }}>
        用 AI 学编程，从零到实战
      </div>
      <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 30, marginTop: 22, maxWidth: 880, lineHeight: 1.4 }}>
        Learn to code with AI — lessons, editor, and real code execution in one browser workspace.
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 56 }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #67e8f9, #22d3ee)',
            borderRadius: 12,
            padding: '14px 34px',
            color: '#020617',
            fontWeight: 700,
            fontSize: 22,
          }}
        >
          免费开始 · Try it free
        </div>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 20 }}>{SITE_HOST}</span>
      </div>
    </div>,
    { width: 1200, height: 630 }
  )
}
