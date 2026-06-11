'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import { MessageCircle, Sparkles } from 'lucide-react'
import { resolveAssistantPersona, type AssistantPersonaId } from '@/lib/assistant-persona'
import { appleEase } from '@/lib/motion'
import { useTr } from '@/contexts/language-context'

type AssistantCharacterAssets = {
  avatar: string
  chibiIdle: string
  chibiWave: string
  chibiExplain: string
  chibiThink: string
  portrait: string
}

// 'nexus' renders as a geometric mark (no character art), so it has no assets here.
type CharacterPersonaId = Exclude<AssistantPersonaId, 'nexus'>

const ASSISTANT_CHARACTER_ASSETS: Record<CharacterPersonaId, AssistantCharacterAssets> = {
  mika: {
    avatar: '/assistant-assets/nexus-default-chibi-avatar.png',
    chibiIdle: '/assistant-assets/nexus-default-chibi-idle.png',
    chibiWave: '/assistant-assets/nexus-default-chibi-wave.png',
    chibiExplain: '/assistant-assets/nexus-default-chibi-explain.png',
    chibiThink: '/assistant-assets/nexus-default-chibi-think.png',
    portrait: '/assistant-assets/nexus-default-portrait.png',
  },
  reno: {
    avatar: '/assistant-assets/nexus-reno-avatar.png',
    chibiIdle: '/assistant-assets/nexus-reno-idle.png',
    chibiWave: '/assistant-assets/nexus-reno-wave.png',
    chibiExplain: '/assistant-assets/nexus-reno-explain.png',
    chibiThink: '/assistant-assets/nexus-reno-think.png',
    portrait: '/assistant-assets/nexus-reno-portrait.png',
  },
  aoi: {
    avatar: '/assistant-assets/nexus-aoi-avatar.png',
    chibiIdle: '/assistant-assets/nexus-aoi-idle.png',
    chibiWave: '/assistant-assets/nexus-aoi-wave.png',
    chibiExplain: '/assistant-assets/nexus-aoi-explain.png',
    chibiThink: '/assistant-assets/nexus-aoi-think.png',
    portrait: '/assistant-assets/nexus-aoi-portrait.png',
  },
  sera: {
    avatar: '/assistant-assets/nexus-sera-avatar.png',
    chibiIdle: '/assistant-assets/nexus-sera-idle.png',
    chibiWave: '/assistant-assets/nexus-sera-wave.png',
    chibiExplain: '/assistant-assets/nexus-sera-explain.png',
    chibiThink: '/assistant-assets/nexus-sera-think.png',
    portrait: '/assistant-assets/nexus-sera-portrait.png',
  },
  // 苏予 (Socratic guide) borrows 青栈(aoi)'s calm, reflective character art for now.
  // TODO: commission dedicated art so it reads as its own character.
  socrates: {
    avatar: '/assistant-assets/nexus-aoi-avatar.png',
    chibiIdle: '/assistant-assets/nexus-aoi-idle.png',
    chibiWave: '/assistant-assets/nexus-aoi-wave.png',
    chibiExplain: '/assistant-assets/nexus-aoi-explain.png',
    chibiThink: '/assistant-assets/nexus-aoi-think.png',
    portrait: '/assistant-assets/nexus-aoi-portrait.png',
  },
}

function characterAssets(personaId?: AssistantPersonaId): AssistantCharacterAssets {
  const persona = resolveAssistantPersona(personaId)
  return persona.id === 'nexus'
    ? ASSISTANT_CHARACTER_ASSETS.mika
    : ASSISTANT_CHARACTER_ASSETS[persona.id]
}

/* The restrained default identity: a clean code mark instead of character art. */
function NexusMark({ className = '', glyphClass = 'text-base' }: { className?: string; glyphClass?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center justify-center rounded-[inherit] bg-[linear-gradient(165deg,rgba(255,255,255,0.07),rgba(255,255,255,0.015))] ${className}`}
    >
      <span className={`font-mono font-semibold leading-none text-cyan-100/85 ${glyphClass}`}>{'</>'}</span>
    </span>
  )
}

export type AssistantCompanionMood =
  | 'idle'
  | 'wave'
  | 'think'
  | 'explain'
  | 'alert'
  | 'celebrate'
  | 'running'

type AssistantAvatarProps = {
  personaId?: AssistantPersonaId
  size?: 'sm' | 'md' | 'lg'
  active?: boolean
  showPulse?: boolean
  label?: string
  onClick?: () => void
}

const SIZE = {
  sm: {
    shell: 'h-9 w-9',
    image: 'scale-[1.38]',
  },
  md: {
    shell: 'h-14 w-14',
    image: 'scale-[1.36]',
  },
  lg: {
    shell: 'h-20 w-20',
    image: 'scale-[1.34]',
  },
}

export function AssistantAvatar({
  personaId,
  size = 'md',
  active = false,
  showPulse = false,
  label,
  onClick,
}: AssistantAvatarProps) {
  const tr = useTr()
  const persona = resolveAssistantPersona(personaId)
  const assets = characterAssets(persona.id)
  const s = SIZE[size]
  const Wrapper = onClick ? motion.button : motion.div
  const assistantLabel = label ?? `${tr(persona.name)}${tr(' 小助手')}`

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-label={assistantLabel}
      title={assistantLabel}
      whileHover={onClick ? { scale: 1.05, y: -1 } : undefined}
      whileTap={onClick ? { scale: 0.96 } : undefined}
      className={`cn-focus-ring group relative inline-flex ${s.shell} items-center justify-center rounded-full border border-cyan-300/22 bg-[radial-gradient(circle_at_50%_35%,rgba(103,232,249,0.2),rgba(0,0,0,0.78)_68%)] shadow-2xl ${persona.glowClass} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {showPulse && (
        <motion.span
          className={`absolute inset-0 rounded-full bg-gradient-to-br ${persona.accentClass} opacity-20 blur-md`}
          animate={{ scale: [0.9, 1.18, 0.9], opacity: [0.16, 0.34, 0.16] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: appleEase }}
        />
      )}
      <span className="absolute inset-0 overflow-hidden rounded-full">
        {persona.id === 'nexus' ? (
          <NexusMark className="h-full w-full" glyphClass={size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-[11px]'} />
        ) : (
          <Image
            src={assets.avatar}
            alt={`${tr(persona.name)}${tr(' Q版头像')}`}
            fill
            sizes={size === 'lg' ? '80px' : size === 'md' ? '56px' : '36px'}
            className={`object-cover object-[50%_20%] ${s.image}`}
            priority={active}
          />
        )}
      </span>
      <span className="pointer-events-none absolute inset-0 rounded-full ring-1 ring-inset ring-white/16" />
      {active && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-2 border-black bg-cyan-200 text-black">
          <Sparkles className="h-2.5 w-2.5" />
        </span>
      )}
    </Wrapper>
  )
}

export function AssistantHoverCard({
  personaId,
  memoryCount,
}: {
  personaId?: AssistantPersonaId
  memoryCount: number
}) {
  const tr = useTr()
  const persona = resolveAssistantPersona(personaId)
  return (
    <div className="pointer-events-none absolute bottom-full mb-3 w-44 translate-y-1 rounded-lg border border-cyan-300/18 bg-black/92 p-3 text-left opacity-0 shadow-2xl shadow-cyan-950/35 backdrop-blur-xl transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
      <p className="text-xs font-semibold text-white/85">{tr(persona.name)}</p>
      <p className="mt-1 text-[11px] leading-relaxed text-white/42">{tr(persona.role)}</p>
      <div className="mt-2 flex items-center gap-1.5 rounded-md border border-cyan-300/14 bg-cyan-300/[0.06] px-2 py-1 text-[10px] text-cyan-100/68">
        <MessageCircle className="h-3 w-3" />
        {tr('悬停可唤出对话')}
      </div>
      <p className="mt-2 text-[10px] text-white/24">{tr('记忆片段：')}{memoryCount}</p>
    </div>
  )
}

export function AssistantCompanionFigure({
  personaId,
  mood,
  active = false,
  walking = false,
  showPulse = false,
  gaze = { x: 0, y: 0 },
  trackEyes = false,
}: {
  personaId?: AssistantPersonaId
  mood?: AssistantCompanionMood
  active?: boolean
  walking?: boolean
  showPulse?: boolean
  gaze?: { x: number; y: number }
  trackEyes?: boolean
}) {
  const tr = useTr()
  const persona = resolveAssistantPersona(personaId)
  const assets = characterAssets(persona.id)
  const resolvedMood: AssistantCompanionMood = mood ?? (active ? 'explain' : walking ? 'wave' : 'idle')
  const pose = {
    idle: assets.chibiIdle,
    wave: assets.chibiWave,
    think: assets.chibiThink,
    explain: assets.chibiExplain,
    alert: assets.chibiThink,
    celebrate: assets.chibiWave,
    running: assets.chibiExplain,
  }[resolvedMood]
  const movement = {
    idle: { y: 0, rotate: 0, scale: 1 },
    wave: { y: 0, rotate: 0, scale: 1 },
    think: { y: 0, rotate: 0, scale: 1 },
    explain: { y: 0, rotate: 0, scale: 1 },
    alert: { x: [0, -2, 2, -1, 0], y: [0, -2, 0] },
    celebrate: { y: [0, -8, 0], scale: [1, 1.04, 1], rotate: [-2, 2, -2] },
    running: { y: 0, rotate: 0, scale: 1 },
  }[resolvedMood]
  const duration = resolvedMood === 'alert'
    ? 0.55
    : resolvedMood === 'celebrate'
    ? 0.82
    : 1.8
  const loop = resolvedMood === 'alert' || resolvedMood === 'celebrate'
  const gazeStrength = Math.abs(gaze.x) + Math.abs(gaze.y)

  // Restrained default identity: a calm mark with a small status dot instead
  // of an animated character. Same outer footprint so docking stays put.
  if (persona.id === 'nexus') {
    const dotClass = resolvedMood === 'alert'
      ? 'bg-red-400'
      : resolvedMood === 'celebrate'
      ? 'bg-emerald-400'
      : resolvedMood === 'running'
      ? 'bg-cyan-300'
      : 'bg-white/30'
    return (
      <div className="relative flex h-36 w-28 items-end justify-center">
        <motion.div
          className="relative mb-2 h-16 w-16 rounded-2xl border border-white/12 bg-black/85 shadow-xl shadow-black/40 backdrop-blur"
          animate={active || showPulse ? { opacity: [0.92, 1, 0.92] } : { opacity: 1 }}
          transition={{ repeat: active || showPulse ? Infinity : 0, duration: 2.2, ease: appleEase }}
        >
          <NexusMark className="h-full w-full" glyphClass="text-xl" />
          <motion.span
            className={`absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-black ${dotClass}`}
            animate={resolvedMood === 'alert' || resolvedMood === 'running' ? { opacity: [0.5, 1, 0.5] } : { opacity: 1 }}
            transition={{ repeat: resolvedMood === 'alert' || resolvedMood === 'running' ? Infinity : 0, duration: 1, ease: appleEase }}
          />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="relative flex h-36 w-28 items-end justify-center">
      {showPulse && (
        <span className="absolute left-1/2 top-8 h-24 w-24 -translate-x-1/2">
          <motion.span
            className={`block h-full w-full rounded-full bg-gradient-to-br ${persona.accentClass} opacity-20 blur-lg`}
            animate={{ scale: [0.9, 1.2, 0.9], opacity: [0.14, 0.32, 0.14] }}
            transition={{ repeat: Infinity, duration: 2.4, ease: appleEase }}
          />
        </span>
      )}
      <div
        className="absolute bottom-1 left-1/2 z-20 h-36 w-28 -translate-x-1/2"
      >
        <motion.div
          className="relative h-full w-full"
          animate={{
            ...movement,
            x: trackEyes ? gaze.x * 2.2 : 0,
          }}
          transition={{ repeat: loop ? Infinity : 0, duration, ease: appleEase }}
        >
          <Image
            src={pose}
            alt={`${tr(persona.name)}${tr(' Q版二次元助手')}`}
            fill
            sizes="112px"
            className="object-contain drop-shadow-[0_16px_26px_rgba(34,211,238,0.22)]"
            priority
          />
        </motion.div>
      </div>
      {trackEyes && (
        <span
          className="pointer-events-none absolute right-5 top-8 z-30 h-1.5 w-1.5 rounded-full bg-cyan-100/75 shadow-[0_0_10px_rgba(103,232,249,0.62)]"
          style={{ opacity: 0.35 + Math.min(gazeStrength, 1) * 0.35 }}
        />
      )}
      {resolvedMood === 'alert' && (
        <motion.span
          className="absolute right-4 top-3 z-30 h-3 w-3 rounded-full bg-red-400 shadow-[0_0_16px_rgba(248,113,113,0.7)]"
          animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.55, 1, 0.55] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: appleEase }}
        />
      )}
      {resolvedMood === 'celebrate' && (
        <motion.span
          className="absolute left-4 top-2 z-30 text-cyan-100"
          animate={{ y: [0, -5, 0], opacity: [0.45, 1, 0.45] }}
          transition={{ repeat: Infinity, duration: 1.1, ease: appleEase }}
        >
          ✦
        </motion.span>
      )}
      <span className="absolute bottom-0 left-1/2 h-2.5 w-16 -translate-x-1/2 rounded-full bg-black/55 blur-[2px]" />
    </div>
  )
}

export function AssistantAnimePortrait({
  personaId,
  active = false,
}: {
  personaId?: AssistantPersonaId
  active?: boolean
}) {
  const tr = useTr()
  const persona = resolveAssistantPersona(personaId)
  const assets = characterAssets(persona.id)

  // Restrained default identity: clean mark panel instead of character art.
  if (persona.id === 'nexus') {
    return (
      <div className="relative flex h-12 w-12 flex-shrink-0 overflow-hidden rounded-xl border border-white/12 bg-black/70">
        <NexusMark className="h-full w-full" glyphClass="text-base" />
      </div>
    )
  }

  return (
    <div className="relative h-48 w-36 overflow-hidden rounded-lg border border-cyan-300/16 bg-[radial-gradient(circle_at_50%_20%,rgba(103,232,249,0.22),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.045),rgba(0,0,0,0.3))] shadow-2xl shadow-cyan-950/40">
      <motion.div
        className="absolute inset-x-0 bottom-0 h-full"
        animate={active ? { y: [0, -2, 0] } : { y: 0 }}
        transition={{ repeat: active ? Infinity : 0, duration: 1.8, ease: appleEase }}
      >
        <Image
          src={assets.portrait}
          alt={`${tr(persona.name)}${tr(' 精致版二次元助手')}`}
          fill
          sizes="144px"
          className="object-cover object-[50%_0%] drop-shadow-[0_16px_28px_rgba(34,211,238,0.2)]"
          priority
        />
      </motion.div>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/24 to-transparent px-3 pb-2 pt-10">
        <p className="text-xs font-semibold text-white">{tr(persona.name)}</p>
        <p className="mt-0.5 truncate text-[10px] text-cyan-100/55">{tr(persona.role)}</p>
      </div>
    </div>
  )
}
