// ─── Achievement definitions ──────────────────────────────────────────────────

export type Achievement = {
  id: string
  name: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  secret?: boolean // description hidden until earned
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_success',
    name: '逻辑火花',
    description: '第一次成功运行代码并通过测试',
    icon: '🌱',
    rarity: 'common',
  },
  {
    id: 'all_complete',
    name: '基础清理者',
    description: '完成当前语言的全部基础节点',
    icon: '◆',
    rarity: 'rare',
  },
  {
    id: 'bug_slayer',
    name: 'Bug 克星',
    description: '在同一关卡失败 3 次后最终通关',
    icon: '🐛',
    rarity: 'rare',
  },
  {
    id: 'speed_runner',
    name: '闪电执行者',
    description: '代码在 50ms 内执行完毕',
    icon: '⚡',
    rarity: 'epic',
    secret: true,
  },
  {
    id: 'graphic_artist',
    name: '视觉艺术家',
    description: '用 Python 生成第一张图形输出',
    icon: '🎨',
    rarity: 'epic',
  },
  {
    id: 'night_owl',
    name: '夜枭程序员',
    description: '在午夜至凌晨 4 点之间运行代码',
    icon: '🌙',
    rarity: 'rare',
    secret: true,
  },
  {
    id: 'sharer',
    name: '代码传播者',
    description: '第一次分享你的代码作品',
    icon: '🔗',
    rarity: 'common',
  },
  {
    id: 'one_liner',
    name: '单行代码大师',
    description: '用列表推导式通过第 7 关',
    icon: '🎯',
    rarity: 'rare',
    secret: true,
  },
  {
    id: 'class_master',
    name: '造物主',
    description: '完成面向对象关卡（第 9 关）',
    icon: '⚙️',
    rarity: 'epic',
  },
  {
    id: 'completionist',
    name: '全节点清理',
    description: '完成全部关卡',
    icon: '💎',
    rarity: 'legendary',
  },
  {
    id: 'three_am',
    name: '凌晨三点的极客',
    description: '在凌晨 3 点运行了代码',
    icon: '👾',
    rarity: 'epic',
    secret: true,
  },
]

export const ACHIEVEMENT_MAP = new Map(ACHIEVEMENTS.map((a) => [a.id, a]))

export const RARITY_STYLES = {
  common: {
    border: 'border-white/15',
    bg: 'bg-white/[0.03]',
    glow: '',
    badge: 'text-white/40',
  },
  rare: {
    border: 'border-indigo-500/40',
    bg: 'bg-indigo-500/5',
    glow: 'shadow-indigo-500/15 shadow-md',
    badge: 'text-indigo-400',
  },
  epic: {
    border: 'border-violet-500/50',
    bg: 'bg-violet-500/8',
    glow: 'shadow-violet-500/20 shadow-md',
    badge: 'text-violet-400',
  },
  legendary: {
    border: 'border-amber-500/60',
    bg: 'bg-amber-500/8',
    glow: 'shadow-amber-500/25 shadow-lg',
    badge: 'text-amber-400',
  },
}

// Check which achievements should be awarded given the current run context
export type AchievementCheckContext = {
  earnedIds: string[]
  isFirstSuccess: boolean
  allBaseLevelsComplete: boolean  // foundation levels
  allLevelsComplete: boolean      // all foundation levels
  failsBeforeSuccess: number
  executionMs: number
  hasGraphicOutput: boolean
  isNightTime: boolean   // 0-4 AM
  isThreeAM: boolean     // 3-4 AM specifically
  didShare: boolean
  completedLevelId?: number
}

export function checkNewAchievements(ctx: AchievementCheckContext): string[] {
  const earned = new Set(ctx.earnedIds)
  const toAward: string[] = []

  function maybeAward(id: string, condition: boolean) {
    if (condition && !earned.has(id)) toAward.push(id)
  }

  maybeAward('first_success', ctx.isFirstSuccess)
  maybeAward('all_complete', ctx.allBaseLevelsComplete)
  maybeAward('bug_slayer', ctx.failsBeforeSuccess >= 3)
  maybeAward('speed_runner', ctx.executionMs < 50)
  maybeAward('graphic_artist', ctx.hasGraphicOutput)
  maybeAward('night_owl', ctx.isNightTime)
  maybeAward('three_am', ctx.isThreeAM)
  maybeAward('sharer', ctx.didShare)
  maybeAward('one_liner', ctx.completedLevelId === 7)
  maybeAward('class_master', ctx.completedLevelId === 9)
  maybeAward('completionist', ctx.allLevelsComplete)

  return toAward
}
