import type { Level } from '@/lib/levels'
import {
  getLevelMission,
  getLevelTeachingBlueprint,
  type FailureDiagnosis,
} from '@/lib/course-engagement'

const STORAGE_KEY = 'codenexus.learning-profile.v1'
const MAX_RECORDS = 80

export type MistakeTrigger = 'error' | 'failed-test' | 'preflight'

export type MistakeRecord = {
  id: string
  languageId: string
  languageName: string
  levelId: number
  levelTitle: string
  area: string
  reason: string
  nextStep: string
  trigger: MistakeTrigger
  createdAt: string
}

export type ReviewState = {
  /** Leitner box 1-5: higher = recalled better, longer until next review. */
  box: number
  reviewedAt: string
}

/** One milestone in a user's 「我想做个 X」 custom learning route. */
export type CustomRouteStep = {
  id: string
  title: string
  why: string
  concept: string
  task: string
  /** Optional deep-link to a real playable level (validated against LEVEL_MAP). */
  levelId?: number
  done: boolean
}

export type CustomRoute = {
  goal: string
  steps: CustomRouteStep[]
  createdAt: string
}

export type LearningProfile = {
  records: MistakeRecord[]
  /** Per-area spaced-repetition state powering the 错题本 review schedule. */
  reviews?: Record<string, ReviewState>
  /** The learner's active goal-driven route from 「我想做个 X」·定制路线. */
  customRoute?: CustomRoute
}

// One active route at a time, capped so a malformed payload can't bloat storage.
const MAX_ROUTE_STEPS = 6

// Leitner intervals (days) indexed by box. Box 1 = review tomorrow.
const REVIEW_BOX_DAYS = [0, 1, 3, 7, 14, 30]
const DAY_MS = 24 * 60 * 60 * 1000

export type ReviewItem = {
  area: string
  count: number
  latest: MistakeRecord
  box: number
  isDue: boolean
  dueInDays: number
}

export type WeakSpot = {
  area: string
  count: number
  latest: MistakeRecord
}

export type ProjectCheckpoint = {
  stage: number
  title: string
  brief: string
  deliverable: string
  skills: string[]
}

export type CompletionReview = {
  learned: string
  mistake: string
  realUse: string
  nextFocus: string
  project: ProjectCheckpoint | null
}

function emptyProfile(): LearningProfile {
  return { records: [], reviews: {} }
}

// Validate-on-read: a persisted route is only trusted if its shape holds, mirroring
// the discipline used for `records`. A bad blob is silently dropped, never thrown.
function parseCustomRoute(value: unknown): CustomRoute | undefined {
  if (!value || typeof value !== 'object') return undefined
  const route = value as Partial<CustomRoute>
  if (typeof route.goal !== 'string' || !Array.isArray(route.steps)) return undefined
  const steps = route.steps
    .filter((step): step is CustomRouteStep =>
      Boolean(step) &&
      typeof (step as CustomRouteStep).id === 'string' &&
      typeof (step as CustomRouteStep).title === 'string' &&
      typeof (step as CustomRouteStep).task === 'string' &&
      typeof (step as CustomRouteStep).done === 'boolean')
    .slice(0, MAX_ROUTE_STEPS)
  if (steps.length === 0) return undefined
  return {
    goal: route.goal.slice(0, 200),
    steps,
    createdAt: typeof route.createdAt === 'string' ? route.createdAt : new Date().toISOString(),
  }
}

export function readLearningProfile(): LearningProfile {
  if (typeof window === 'undefined') return emptyProfile()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyProfile()
    const parsed = JSON.parse(raw) as Partial<LearningProfile>
    if (!Array.isArray(parsed.records)) return emptyProfile()
    return {
      records: parsed.records.filter((item): item is MistakeRecord =>
        typeof item?.id === 'string' &&
        typeof item.languageId === 'string' &&
        typeof item.languageName === 'string' &&
        typeof item.levelId === 'number' &&
        typeof item.area === 'string' &&
        typeof item.reason === 'string' &&
        typeof item.nextStep === 'string'
      ).slice(-MAX_RECORDS),
      reviews:
        parsed.reviews && typeof parsed.reviews === 'object'
          ? (parsed.reviews as Record<string, ReviewState>)
          : {},
      customRoute: parseCustomRoute(parsed.customRoute),
    }
  } catch {
    return emptyProfile()
  }
}

function writeLearningProfile(profile: LearningProfile) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
      records: profile.records.slice(-MAX_RECORDS),
      reviews: profile.reviews ?? {},
      customRoute: profile.customRoute,
    }))
  } catch {
    // Local learning memory is a convenience layer; never block the lesson UI.
  }
}

export function recordLearningMistake(input: {
  languageId: string
  languageName: string
  level: Level
  diagnosis: FailureDiagnosis | Pick<MistakeRecord, 'area' | 'reason' | 'nextStep'>
  trigger: MistakeTrigger
}) {
  const current = readLearningProfile()
  const record: MistakeRecord = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    languageId: input.languageId,
    languageName: input.languageName,
    levelId: input.level.id,
    levelTitle: input.level.title,
    area: input.diagnosis.area,
    reason: input.diagnosis.reason,
    nextStep: input.diagnosis.nextStep,
    trigger: input.trigger,
    createdAt: new Date().toISOString(),
  }
  const reviews = { ...(current.reviews ?? {}) }
  // A fresh mistake in this area resets it to box 1 (resurface again soon).
  reviews[record.area] = { box: 1, reviewedAt: record.createdAt }
  const next: LearningProfile = {
    records: [...current.records, record].slice(-MAX_RECORDS),
    reviews,
  }
  writeLearningProfile(next)
  return next
}

/**
 * Re-passing a level you previously struggled with promotes its concepts up the
 * Leitner ladder, pushing the next review further out. Returns the new profile.
 */
export function promoteLevelReviews(languageId: string, levelId: number): LearningProfile {
  const current = readLearningProfile()
  const areas = new Set(
    current.records
      .filter((record) => record.languageId === languageId && record.levelId === levelId)
      .map((record) => record.area)
  )
  if (areas.size === 0) return current

  const reviews = { ...(current.reviews ?? {}) }
  const now = new Date().toISOString()
  areas.forEach((area) => {
    const box = reviews[area]?.box ?? 1
    reviews[area] = { box: Math.min(box + 1, REVIEW_BOX_DAYS.length - 1), reviewedAt: now }
  })
  const next: LearningProfile = { records: current.records, reviews }
  writeLearningProfile(next)
  return next
}

/**
 * Persist a freshly generated 「我想做个 X」 route, replacing any previous one
 * (one active route at a time). Steps arrive without ids/done from the API; we
 * stamp those here. Returns the new profile so the caller can lift it into state.
 */
export function saveCustomRoute(input: {
  goal: string
  steps: Array<{ title: string; why?: string; concept?: string; task: string; levelId?: number | null }>
}): LearningProfile {
  const current = readLearningProfile()
  const createdAt = new Date().toISOString()
  const steps: CustomRouteStep[] = input.steps.slice(0, MAX_ROUTE_STEPS).map((step, index) => ({
    id: `${Date.now()}-${index}`,
    title: step.title,
    why: step.why ?? '',
    concept: step.concept ?? '',
    task: step.task,
    levelId: typeof step.levelId === 'number' ? step.levelId : undefined,
    done: false,
  }))
  const next: LearningProfile = { ...current, customRoute: { goal: input.goal.slice(0, 200), steps, createdAt } }
  writeLearningProfile(next)
  return next
}

/** Toggle a milestone's done state. No-op (returns current) if no route exists. */
export function toggleRouteStep(stepId: string): LearningProfile {
  const current = readLearningProfile()
  if (!current.customRoute) return current
  const steps = current.customRoute.steps.map((step) =>
    step.id === stepId ? { ...step, done: !step.done } : step
  )
  const next: LearningProfile = { ...current, customRoute: { ...current.customRoute, steps } }
  writeLearningProfile(next)
  return next
}

/** Drop the active route so the user can define a new goal. */
export function clearCustomRoute(): LearningProfile {
  const current = readLearningProfile()
  const next: LearningProfile = { ...current, customRoute: undefined }
  writeLearningProfile(next)
  return next
}

/**
 * The 错题本 review queue: weak-spot areas annotated with their Leitner box and
 * whether they are due for review, sorted most-overdue first.
 */
export function getReviewItems(profile: LearningProfile, now: number = Date.now()): ReviewItem[] {
  const reviews = profile.reviews ?? {}
  return summarizeWeakSpots(profile)
    .map((spot): ReviewItem => {
      const box = Math.min(Math.max(reviews[spot.area]?.box ?? 1, 1), REVIEW_BOX_DAYS.length - 1)
      const reviewedAt = reviews[spot.area]?.reviewedAt ?? spot.latest.createdAt
      const dueAt = new Date(reviewedAt).getTime() + REVIEW_BOX_DAYS[box] * DAY_MS
      return {
        area: spot.area,
        count: spot.count,
        latest: spot.latest,
        box,
        isDue: dueAt <= now,
        dueInDays: Math.max(0, Math.ceil((dueAt - now) / DAY_MS)),
      }
    })
    .sort((a, b) => {
      if (a.isDue !== b.isDue) return a.isDue ? -1 : 1
      return a.dueInDays - b.dueInDays
    })
}

export function summarizeWeakSpots(profile: LearningProfile, languageId?: string): WeakSpot[] {
  const map = new Map<string, WeakSpot>()
  const records = languageId
    ? profile.records.filter((record) => record.languageId === languageId)
    : profile.records

  records.forEach((record) => {
    const current = map.get(record.area)
    if (!current) {
      map.set(record.area, { area: record.area, count: 1, latest: record })
      return
    }
    current.count += 1
    if (record.createdAt > current.latest.createdAt) current.latest = record
  })

  return [...map.values()].sort((a, b) =>
    b.count - a.count || b.latest.createdAt.localeCompare(a.latest.createdAt)
  )
}

export function recentMistakesForLevel(
  profile: LearningProfile,
  languageId: string,
  levelId: number,
  limit = 3
) {
  return profile.records
    .filter((record) => record.languageId === languageId && record.levelId === levelId)
    .slice(-limit)
    .reverse()
}

export function getProjectCheckpoint(languageName: string, levelId: number): ProjectCheckpoint | null {
  if (levelId % 5 !== 0) return null
  const stage = levelId / 5

  if (stage === 1) {
    return {
      stage,
      title: `${languageName} 微型控制台工具`,
      brief: '把输出、变量、条件、循环和函数串起来，做一个能接收固定数据并给出结果的小工具。',
      deliverable: '一个可运行脚本：有清楚输入、有处理逻辑、有最终输出。',
      skills: ['入口输出', '变量命名', '条件判断', '循环处理', '函数封装'],
    }
  }

  if (stage === 2) {
    return {
      stage,
      title: `${languageName} 数据整理器`,
      brief: '把容器、字符串、字典/对象和函数组合起来，整理一组模拟数据并输出统计结论。',
      deliverable: '一个能清洗、分类、统计并打印报告的小程序。',
      skills: ['容器建模', '字符串处理', '结构化输出', '函数拆分'],
    }
  }

  if (stage === 3) {
    return {
      stage,
      title: `${languageName} 稳定运行模块`,
      brief: '加入错误处理、模块拆分或对象建模，让代码不只会跑，还能被别人维护。',
      deliverable: '一个有异常处理、有模块边界、有测试点的可维护模块。',
      skills: ['异常处理', '模块边界', '对象/函数协作', '可读性'],
    }
  }

  return {
    stage,
    title: `${languageName} 基础毕业作品`,
    brief: '把前面所有基础能力接成一个完整交付。重点不是炫，而是别人能运行、能读懂、能看到结果。',
    deliverable: '一个小型作品页/脚本/控制台应用，包含说明、代码、输出和复盘。',
    skills: ['综合设计', '调试', '边界处理', '交付表达'],
  }
}

export function createCompletionReview({
  languageName,
  languageId,
  level,
  profile,
}: {
  languageName: string
  languageId: string
  level: Level
  profile: LearningProfile
}): CompletionReview {
  const teaching = getLevelTeachingBlueprint(languageName, level)
  const mission = getLevelMission(languageName, level)
  const recent = recentMistakesForLevel(profile, languageId, level.id, 1)[0]
  const nextProject = getProjectCheckpoint(languageName, level.id)
  const nextLevel = level.id + 1

  return {
    learned: `你刚把「${teaching.concept}」从概念推进到了可运行代码。能通过测试，说明至少入口、目标和输出链路已经接上。`,
    mistake: recent
      ? `本关你卡过「${recent.area}」：${recent.nextStep}`
      : '本关没有记录到明显错因。别飘，只代表这次没被抓到，不代表你已经能教别人。',
    realUse: mission.payoff.replace(/^交付：/, ''),
    nextFocus: nextProject
      ? `现在该做阶段作品，不要继续只刷小题。`
      : `下一关 Lv.${nextLevel} 会继续复用这块能力，把它接到更大的结构里。`,
    project: nextProject,
  }
}
