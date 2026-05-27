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

export type LearningProfile = {
  records: MistakeRecord[]
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
  return { records: [] }
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
  const next = { records: [...current.records, record].slice(-MAX_RECORDS) }
  writeLearningProfile(next)
  return next
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
