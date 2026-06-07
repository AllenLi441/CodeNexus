'use client'

import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { ArrowRight, Check, GraduationCap, Map, PackageCheck, ScanSearch, Wrench } from 'lucide-react'
import type { Level } from '@/lib/levels'
import { createCompletionReview, type LearningProfile } from '@/lib/learning-profile'
import { appleEase, appleSpring, quickFade, softSpring } from '@/lib/motion'

type LevelCompleteProps = {
  levelId: number
  levels: Level[]
  languageName: string
  languageId: string
  alreadyCompleted: boolean
  learningProfile: LearningProfile
  demoMode?: boolean
  onNext: () => void
  onDashboard: () => void
  onRegister?: () => void
}

// Spark particle component
function Spark({ delay, angle }: { delay: number; angle: number }) {
  const rad = (angle * Math.PI) / 180
  const tx = Math.cos(rad) * 120
  const ty = Math.sin(rad) * 120

  return (
    <motion.div
      className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300"
      style={{ top: '50%', left: '50%' }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
      transition={{ delay, duration: 0.4, ease: appleEase }}
    />
  )
}

export function LevelCompleteOverlay({
  levelId,
  levels,
  languageName,
  languageId,
  alreadyCompleted,
  learningProfile,
  demoMode = false,
  onNext,
  onDashboard,
  onRegister,
}: LevelCompleteProps) {
  const level = levels.find((l) => l.id === levelId)
  const nextLevel = levels.find((l) => l.id === levelId + 1)
  const sparkAngles = Array.from({ length: 16 }, (_, i) => i * 22.5)
  const review = level
    ? createCompletionReview({ languageName, languageId, level, profile: learningProfile })
    : null

  useEffect(() => {
    return () => {
      document.documentElement.style.removeProperty('filter')
      document.body.style.removeProperty('filter')
      document.body.style.removeProperty('backdrop-filter')
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={quickFade}
      className="fixed inset-0 z-[320] flex items-center justify-center bg-black/58 p-4"
    >
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 22 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: -10 }}
        transition={appleSpring}
        className="cn-scrollbar relative max-h-[calc(100dvh-32px)] w-full max-w-2xl overflow-y-auto rounded-lg border border-cyan-300/24 bg-black/94 p-5 text-center shadow-[0_28px_110px_rgba(0,0,0,0.72),0_0_70px_rgba(34,211,238,0.13)] sm:p-7"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cyan-200/40" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-cyan-300/[0.045] to-transparent" />

        <div className="relative mb-6 flex items-center justify-center">
          {sparkAngles.map((angle, i) => (
            <Spark key={angle} delay={i * 0.03} angle={angle} />
          ))}

          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ ...softSpring, delay: 0.16 }}
            className="flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/50 bg-cyan-300/[0.08] shadow-[0_0_45px_rgba(34,211,238,0.18)]"
          >
            <span className="text-5xl">{level?.icon ?? '⚡'}</span>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...quickFade, delay: 0.24 }}
          className="mb-6 space-y-2"
        >
          <p className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-cyan-300/42">
            {languageName} · {level?.badge} 完成
          </p>
          <h2 className="text-2xl font-bold text-white">{level?.title}</h2>
          {demoMode ? (
            <p className="text-sm font-semibold text-cyan-200">试玩通过，进度还没保存。注册后接着学，不用重打。</p>
          ) : alreadyCompleted ? (
            <p className="text-sm text-white/40">这个节点你已经通关过，重练一遍同样算数。</p>
          ) : (
            <p className="text-sm font-semibold text-[var(--code-green)]">测试全部通过，节点已写入进度。</p>
          )}
        </motion.div>

        {review && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...quickFade, delay: 0.3 }}
            className="mb-6 grid gap-2 text-left sm:grid-cols-2"
          >
            <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.04] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-cyan-100/76">
                <GraduationCap className="h-3.5 w-3.5" />
                刚学会
              </p>
              <p className="text-[11px] leading-relaxed text-white/42">{review.learned}</p>
            </div>
            <div className="rounded-lg border border-amber-300/14 bg-amber-300/[0.035] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-amber-100/76">
                <ScanSearch className="h-3.5 w-3.5" />
                错因复盘
              </p>
              <p className="text-[11px] leading-relaxed text-white/42">{review.mistake}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-white/68">
                <Wrench className="h-3.5 w-3.5 text-cyan-200/70" />
                真实用途
              </p>
              <p className="text-[11px] leading-relaxed text-white/38">{review.realUse}</p>
            </div>
            <div className="rounded-lg border border-white/8 bg-white/[0.025] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-white/68">
                <ArrowRight className="h-3.5 w-3.5 text-cyan-200/70" />
                下一步
              </p>
              <p className="text-[11px] leading-relaxed text-white/38">{review.nextFocus}</p>
            </div>
            {review.project && (
              <div className="rounded-lg border border-emerald-300/16 bg-emerald-300/[0.045] p-3 sm:col-span-2">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-100/78">
                  <PackageCheck className="h-3.5 w-3.5" />
                  阶段作品解锁 · {review.project.title}
                </p>
                <p className="text-[11px] leading-relaxed text-white/42">{review.project.brief}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-emerald-100/52">交付：{review.project.deliverable}</p>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...quickFade, delay: 0.34 }}
          className="mb-6 flex flex-wrap justify-center gap-2"
        >
          {levels.find((l) => l.id === levelId)?.tests.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-1.5 rounded-lg border border-[color-mix(in_oklab,var(--code-green)_30%,transparent)] bg-[color-mix(in_oklab,var(--code-green)_10%,transparent)] px-2.5 py-1 text-xs text-[color-mix(in_oklab,var(--code-green)_88%,white)]"
            >
              <Check className="h-3 w-3" />
              <span>{t.description}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...quickFade, delay: 0.42 }}
          className="flex gap-3"
        >
          <button
            type="button"
            onClick={demoMode && nextLevel ? onNext : onDashboard}
            className="cn-focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg border border-hairline bg-transparent px-4 py-2 text-sm font-semibold text-ink-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:text-cyan-100 active:scale-[0.98]"
          >
            {demoMode && nextLevel ? <ArrowRight className="h-4 w-4" /> : <Map className="h-4 w-4" />}
            {demoMode ? (nextLevel ? '下一关' : '回到入口') : '返回地图'}
          </button>
          {demoMode ? (
            <button
              type="button"
              onClick={onRegister ?? onDashboard}
              className="cn-focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              2 秒注册保存
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : nextLevel ? (
            <button
              type="button"
              onClick={onNext}
              className="cn-focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              下一关
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onDashboard}
              className="cn-focus-ring flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all duration-200 hover:-translate-y-0.5 hover:bg-primary/90 active:scale-[0.98]"
            >
              <Map className="h-4 w-4" />
              返回地图
            </button>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
