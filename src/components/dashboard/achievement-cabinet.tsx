'use client'

import { motion } from 'framer-motion'
import { LockKeyhole, Trophy } from 'lucide-react'
import { ACHIEVEMENTS, RARITY_STYLES } from '@/lib/achievements'

const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说',
}

export function AchievementCabinet({ earnedIds }: { earnedIds: string[] }) {
  const earned = new Set(earnedIds)
  const earnedCount = earnedIds.length

  return (
    <section className="cn-panel p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-300/36">Signal Cabinet</p>
          <h2 className="mt-1 inline-flex items-center gap-2 text-lg font-semibold tracking-tight text-foreground">
            <Trophy className="h-4 w-4 text-primary/70" />
            成就矩阵
          </h2>
        </div>
        <span className="rounded border border-primary/16 bg-primary/5 px-2.5 py-1 font-mono text-xs tabular-nums text-primary">
          {earnedCount} / {ACHIEVEMENTS.length}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((achievement, i) => {
          const isEarned = earned.has(achievement.id)
          const styles = RARITY_STYLES[achievement.rarity]

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.035, duration: 0.28 }}
              className={`relative min-h-[132px] overflow-hidden rounded-lg border p-4 text-center transition-all duration-300 ${
                isEarned
                  ? `${styles.border} ${styles.bg} ${styles.glow}`
                  : 'border-white/8 bg-black/34 opacity-55'
              }`}
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/10" />
              <div
                className={`absolute top-2 right-2 text-[9px] font-bold uppercase tracking-wider ${
                  isEarned ? styles.badge : 'text-white/22'
                }`}
              >
                {RARITY_LABELS[achievement.rarity]}
              </div>

              <div className="mb-3 mt-3 flex justify-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg border border-white/8 bg-black/36 text-2xl leading-none transition-all duration-300 ${
                    !isEarned ? 'grayscale opacity-30' : ''
                  }`}
                >
                  {achievement.secret && !isEarned ? <LockKeyhole className="h-4 w-4 text-white/32" /> : achievement.icon}
                </div>
              </div>

              <p className={`text-xs font-semibold leading-snug ${
                isEarned ? 'text-white/82' : 'text-white/28'
              }`}>
                {achievement.secret && !isEarned ? '隐藏成就' : achievement.name}
              </p>

              <p className={`text-[10px] leading-relaxed mt-1 ${
                isEarned ? 'text-white/38' : 'text-transparent'
              }`}>
                {achievement.description}
              </p>

              {isEarned && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute left-2 top-2 h-2 w-2 rounded-full bg-[var(--code-green)] shadow-[0_0_12px_color-mix(in_oklab,var(--code-green)_60%,transparent)]"
                />
              )}
            </motion.div>
          )
        })}
      </div>

      {earnedCount === 0 && (
        <p className="py-4 text-center text-sm text-ink-mute">
          跑通第一段代码，第一枚成就就会在这里亮起来。
        </p>
      )}
    </section>
  )
}
