'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, BrainCircuit, ChevronDown, Copy, Crosshair, ListChecks, RadioTower, RotateCcw, ScanSearch } from 'lucide-react'
import type { Level } from '@/lib/levels'
import { getLevelMission, getLevelTeachingBlueprint } from '@/lib/course-engagement'
import { getReviewItems, type LearningProfile } from '@/lib/learning-profile'
import { CustomRoutePanel } from '@/components/workshop/custom-route-panel'
import { useTr } from '@/contexts/language-context'

// ── Inline text renderer (bold, code, newlines) ──────────────────────────────
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/)
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**'))
          return <strong key={i} className="text-white/80 font-semibold">{p.slice(2, -2)}</strong>
        if (p.startsWith('`') && p.endsWith('`'))
          return (
            <code key={i} className="rounded bg-cyan-300/10 px-1 py-0.5 font-mono text-xs text-cyan-100">
              {p.slice(1, -1)}
            </code>
          )
        if (p === '\n') return <br key={i} />
        return <span key={i}>{p}</span>
      })}
    </>
  )
}

// ── Code block with copy only ────────────────────────────────────────────────
function CodeBlockCard({
  code,
  caption,
}: {
  code: string
  caption?: string
}) {
  const tr = useTr()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/8 bg-black/48">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.025] px-3 py-1.5">
        {caption && <span className="text-[10px] text-white/30 font-mono">{caption}</span>}
        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={handleCopy}
            className="cn-focus-ring inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/60"
          >
            <Copy className="h-3 w-3" />
            {copied ? tr('已复制') : tr('复制')}
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto whitespace-pre p-3 font-mono text-xs leading-relaxed text-cyan-50/72">
        {code}
      </pre>
    </div>
  )
}

// ── Level selector pill row ──────────────────────────────────────────────────
function LevelPills({
  currentId,
  onSelect,
  completedIds,
  levels,
}: {
  currentId: number
  onSelect: (id: number) => void
  completedIds: number[]
  levels: Level[]
}) {
  return (
    <div className="cn-scrollbar flex gap-1 overflow-x-auto border-b border-white/5 px-4 py-2">
      {levels.map((l) => {
        const done = completedIds.includes(l.id)
        const active = l.id === currentId
        return (
          <button
            key={l.id}
            onClick={() => onSelect(l.id)}
            className={`cn-focus-ring flex flex-shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] transition-all ${
              active
                ? 'bg-cyan-300/15 border-cyan-300/50 text-cyan-200 font-semibold'
                : done
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400/70'
                : 'border-white/8 text-white/25 hover:text-white/50 hover:border-white/20'
            }`}
          >
            <span>{l.icon}</span>
            <span>Lv.{l.id}</span>
            {done && <span className="text-emerald-400">✓</span>}
          </button>
        )
      })}
    </div>
  )
}

// ── Main GuidePanel ──────────────────────────────────────────────────────────
type GuidePanelProps = {
  levelId: number
  levels: Level[]
  languageName: string
  onFillCode: (code: string) => void
  onChangeLevel: (id: number) => void
  completedLevelIds: number[]
  learningProfile?: LearningProfile
  guestMode?: boolean
  onProfileChange?: (profile: LearningProfile) => void
}

export function GuidePanel({ levelId, levels, languageName, onFillCode, onChangeLevel, completedLevelIds, learningProfile, guestMode, onProfileChange }: GuidePanelProps) {
  const tr = useTr()
  const level: Level = levels.find((l) => l.id === levelId) ?? levels[0]
  const mission = getLevelMission(languageName, level, tr)
  const teaching = getLevelTeachingBlueprint(languageName, level, tr)
  const reviewItems = learningProfile ? getReviewItems(learningProfile) : []
  const dueCount = reviewItems.filter((item) => item.isDue).length
  const [openSection, setOpenSection] = useState<number | null>(null)

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[var(--code-bg)]">
      <div className="flex-shrink-0 border-b border-white/5 px-4 py-3">
        <div className="mb-0.5 font-mono text-[10px] font-medium uppercase tracking-widest text-cyan-300/45">
          Assistant Protocol · {languageName} {tr('小助手引导')}
        </div>
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm leading-snug">
            <span className="text-white/40 mr-1">Lv.{level.id}</span>
            {tr(level.title)}
          </h2>
          <span className="rounded-lg border border-cyan-300/25 bg-cyan-300/12 px-2 py-0.5 text-[10px] text-cyan-200">
            {tr(level.badge)}
          </span>
        </div>

        <p className="mt-1.5 flex items-start gap-1.5 text-xs text-cyan-200/60">
          <Crosshair className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span>{tr(level.objective)}</span>
        </p>
      </div>

      <LevelPills currentId={levelId} onSelect={onChangeLevel} completedIds={completedLevelIds} levels={levels} />

      <div className="cn-scrollbar flex-1 overflow-y-auto py-2">
        <CustomRoutePanel
          route={learningProfile?.customRoute}
          levels={levels}
          languageName={languageName}
          guestMode={guestMode}
          onChangeLevel={onChangeLevel}
          onProfileChange={onProfileChange}
        />

        <div className="border-b border-white/5 px-4 pb-3 pt-2">
          <div className="rounded-lg border border-cyan-300/14 bg-cyan-300/[0.035] p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-200/55">
                <RadioTower className="h-3.5 w-3.5" />
                {mission.kicker}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-white/58">{mission.brief}</p>
            <div className="mt-2 grid gap-1.5 text-[11px] leading-relaxed text-white/34">
              <p><span className="text-cyan-100/62">{tr('限制：')}</span>{mission.constraint.replace(/^限制：/, '').replace(/^Constraint: /, '')}</p>
              <p><span className="text-cyan-100/62">{tr('交付：')}</span>{mission.payoff.replace(/^交付：/, '').replace(/^Deliverable: /, '')}</p>
            </div>
          </div>
        </div>

        <div className="border-b border-white/5 px-4 pb-3">
          <div className="space-y-3 rounded-lg border border-white/8 bg-white/[0.022] p-3">
            <div className="flex items-center gap-2">
              <BrainCircuit className="h-3.5 w-3.5 text-cyan-200/70" />
              <p className="text-xs font-semibold text-white/72">{tr('这关真正要学')}</p>
            </div>
            <p className="text-xs leading-relaxed text-white/45">{teaching.mentalModel}</p>
            <div className="grid gap-1.5">
              {teaching.learnFirst.map((item) => (
                <p key={item} className="flex items-start gap-2 text-[11px] leading-relaxed text-white/36">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-cyan-200/60" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b border-white/5 px-4 pb-3">
          <div className="space-y-2 rounded-lg border border-amber-300/12 bg-amber-300/[0.035] p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ScanSearch className="h-3.5 w-3.5 text-amber-100/70" />
                <p className="text-xs font-semibold text-white/72">{tr('错题本 · 间隔复盘')}</p>
              </div>
              {dueCount > 0 ? (
                <span className="rounded-full border border-amber-300/30 bg-amber-300/12 px-1.5 py-0.5 font-mono text-[9px] text-amber-200">
                  {dueCount} {tr('个该复习')}
                </span>
              ) : null}
            </div>
            {reviewItems.length > 0 ? (
              <div className="grid gap-1.5">
                {reviewItems.slice(0, 6).map((spot) => (
                  <div
                    key={spot.area}
                    className={`rounded-lg border px-2.5 py-2 ${spot.isDue ? 'border-amber-300/25 bg-amber-300/[0.06]' : 'border-white/8 bg-black/24'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[11px] font-semibold text-amber-100/70">{tr(spot.area)}</p>
                      {spot.isDue ? (
                        <span className="rounded border border-amber-300/30 bg-amber-300/12 px-1.5 py-0.5 font-mono text-[9px] text-amber-200">{tr('该复习')}</span>
                      ) : (
                        <span className="font-mono text-[9px] text-white/28">{spot.dueInDays} {tr('天后')}</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="font-mono text-[9px] tracking-tight text-cyan-200/50">
                        {tr('掌握度')} {'●'.repeat(spot.box)}{'○'.repeat(Math.max(0, 5 - spot.box))}
                      </span>
                      <span className="font-mono text-[9px] text-white/24">{tr('错')} {spot.count} {tr('次')}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-white/34">{tr(spot.latest.nextStep)}</p>
                    <button
                      type="button"
                      onClick={() => onChangeLevel(spot.latest.levelId)}
                      className="mt-1 font-mono text-[10px] text-cyan-300/70 transition-colors hover:text-cyan-200"
                    >
                      → {tr('去')} Lv.{spot.latest.levelId} {tr('再练一次')}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] leading-relaxed text-white/34">
                {tr('还没有踩坑记录。以后卡住时，这里会把你常错的概念收进错题本，并按「间隔复盘」在合适的时候提醒你回来再练。')}
              </p>
            )}
          </div>
        </div>

        <div className="border-b border-white/5 px-4 pb-3">
          <div className="space-y-2 rounded-lg border border-cyan-300/12 bg-cyan-300/[0.028] p-3">
            <div className="flex items-center gap-2">
              <ListChecks className="h-3.5 w-3.5 text-cyan-200/70" />
              <p className="text-xs font-semibold text-white/72">{tr('实践路线')}</p>
            </div>
            {teaching.practiceSteps.slice(0, 3).map((step, index) => (
              <p key={step} className="flex gap-2 text-[11px] leading-relaxed text-white/38">
                <span className="font-mono text-cyan-200/58">{index + 1}</span>
                <span>{step}</span>
              </p>
            ))}
          </div>
        </div>

        {level.sections.map((section, i) => (
          <div key={i} className="border-b border-white/5 last:border-0">
            <button
              onClick={() => setOpenSection(openSection === i ? null : i)}
              className="cn-focus-ring flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-white/[0.025]"
            >
              <span className="flex items-center gap-2 text-xs font-semibold text-white/70">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-cyan-300/12 text-[10px] font-bold text-cyan-200">
                  {i + 1}
                </span>
                {tr(section.heading)}
              </span>
              <motion.span
                animate={{ rotate: openSection === i ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="text-white/20"
              >
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.span>
            </button>

            <AnimatePresence initial={false}>
              {openSection === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    <p className="text-xs text-white/50 leading-relaxed">
                      <RichText text={tr(section.body)} />
                    </p>
                    {section.codeBlock && (
                      <CodeBlockCard
                        code={section.codeBlock.code}
                        caption={section.codeBlock.caption}
                      />
                    )}
                    {section.tip && (
                      <div className="flex gap-2 bg-cyan-300/8 border border-cyan-300/20 rounded-lg px-3 py-2">
                        <Crosshair className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-cyan-200" />
                        <p className="text-cyan-100/65 text-xs leading-relaxed">{tr(section.tip)}</p>
                      </div>
                    )}
                    {section.warning && (
                      <div className="flex gap-2 bg-red-500/8 border border-red-500/20 rounded-lg px-3 py-2">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-300" />
                        <p className="text-red-200/65 text-xs leading-relaxed">{tr(section.warning)}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}

        {/* Starter code shortcut */}
        <div className="px-4 pt-3 pb-4">
          <button
            onClick={() => onFillCode('')}
            className="cn-focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-white/12 py-2.5 text-xs text-white/25 transition-colors hover:border-cyan-300/25 hover:text-cyan-100/65"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {tr('清空编辑器')}
          </button>
        </div>
      </div>
    </div>
  )
}
