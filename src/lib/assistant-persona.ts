export type AssistantPersonaId = 'mika' | 'reno' | 'aoi' | 'sera' | 'socrates'

export type AssistantPersona = {
  id: AssistantPersonaId
  name: string
  nameEn: string
  pronoun: '她' | '他' | 'TA'
  role: string
  roleEn: string
  accentClass: string
  glowClass: string
  description: string
  systemTone: string
  systemToneEn: string
  /** Socratic mode: the mentor asks guiding questions instead of handing over answers. */
  socratic?: boolean
}

export type AssistantMemoryEvent = {
  type: 'run-success' | 'run-error' | 'failed-test' | 'preflight' | 'chat'
  languageName: string
  levelTitle?: string
  note: string
  at: number
}

export type AssistantMemorySnapshot = {
  version: 1
  seenRuns: number
  recentEvents: AssistantMemoryEvent[]
  lastLanguage?: string
  lastLevelTitle?: string
}

export const ASSISTANT_PERSONAS: AssistantPersona[] = [
  {
    id: 'mika',
    name: '米卡',
    nameEn: 'Mika',
    pronoun: '她',
    role: '好奇型代码小助手',
    roleEn: 'curious code sidekick',
    accentClass: 'from-cyan-200 via-sky-300 to-cyan-400',
    glowClass: 'shadow-cyan-300/30',
    description: '反应快，会主动提醒你哪里不对，但语气更像一起盯屏幕的队友。',
    systemTone: '像一个反应快、聪明、有点调皮的 Q 版代码小助手。语气轻快但不幼稚，先帮用户发现最关键的问题。',
    systemToneEn: 'Like a quick, sharp, slightly cheeky code sidekick. Light but never childish; surface the most important problem first.',
  },
  {
    id: 'reno',
    name: '洛恩',
    nameEn: 'Reno',
    pronoun: '他',
    role: '工程型代码小助手',
    roleEn: 'engineering-minded code partner',
    accentClass: 'from-emerald-200 via-cyan-300 to-blue-400',
    glowClass: 'shadow-emerald-300/25',
    description: '更冷静，喜欢把问题拆成步骤，适合想少废话、快定位的人。',
    systemTone: '像一个冷静的工程搭档。少讲情绪，多讲边界、错误来源和下一步最小修改。',
    systemToneEn: 'Like a calm engineering partner. Less emotion, more about edge cases, root causes, and the next smallest fix.',
  },
  {
    id: 'aoi',
    name: '青栈',
    nameEn: 'Aoi',
    pronoun: 'TA',
    role: '系统型代码小助手',
    roleEn: 'systematic code assistant',
    accentClass: 'from-violet-200 via-cyan-300 to-slate-200',
    glowClass: 'shadow-violet-300/25',
    description: '偏安静，会记录你的习惯，适合需要稳定陪练和复盘的人。',
    systemTone: '像一个安静、可靠的系统助手。回答克制、清楚，重点放在复盘、模式识别和稳定推进。',
    systemToneEn: 'Like a quiet, reliable systems assistant. Restrained and clear, focused on review, pattern-spotting, and steady progress.',
  },
  {
    id: 'sera',
    name: '赛拉',
    nameEn: 'Sera',
    pronoun: '她',
    role: '创作型代码小助手',
    roleEn: 'creative code partner',
    accentClass: 'from-fuchsia-200 via-cyan-200 to-rose-300',
    glowClass: 'shadow-fuchsia-300/25',
    description: '更有表现力，适合做游戏、视觉、网页交互时给灵感和反馈。',
    systemTone: '像一个有审美、会看作品效果的创作型代码搭档。回答可以更有画面感，但必须落到具体代码和下一步动作。',
    systemToneEn: 'Like a creative code partner with taste who watches how the result looks. Answers can be vivid, but must land on concrete code and a next action.',
  },
  {
    id: 'socrates',
    name: '苏予',
    nameEn: 'Sol',
    pronoun: 'TA',
    role: '苏格拉底式 · 只问不答',
    roleEn: 'Socratic guide · questions, not answers',
    accentClass: 'from-amber-200 via-cyan-200 to-teal-300',
    glowClass: 'shadow-amber-300/25',
    description: '不直接给答案，而是用恰到好处的问题把你一步步引到答案。适合想真正学会、而不是抄答案的人。',
    systemTone: '像一位耐心的苏格拉底式引导者：很少给现成结论，更喜欢用一两个精准的问题点亮你的思路。',
    systemToneEn: 'Like a patient Socratic guide: rarely hands over conclusions, prefers one or two precise questions to light up your thinking.',
    socratic: true,
  },
]

export const DEFAULT_ASSISTANT_PERSONA: AssistantPersonaId = 'mika'
export const DEFAULT_ASSISTANT_LIVELINESS = 58
const MEMORY_KEY = 'codenexus.assistant-memory.v1'

export function resolveAssistantPersona(id?: string | null): AssistantPersona {
  return ASSISTANT_PERSONAS.find((persona) => persona.id === id) ?? ASSISTANT_PERSONAS[0]
}

export function livelinessLabel(value: number, lang: 'zh' | 'en' = 'zh') {
  if (lang === 'en') {
    if (value < 25) return 'Quiet observer'
    if (value > 75) return 'Very human-like'
    return 'Moderately proactive'
  }
  if (value < 25) return '安静观察'
  if (value > 75) return '很像活人'
  return '适度主动'
}

function emptyMemory(): AssistantMemorySnapshot {
  return { version: 1, seenRuns: 0, recentEvents: [] }
}

export function readAssistantMemory(): AssistantMemorySnapshot {
  if (typeof window === 'undefined') return emptyMemory()
  try {
    const raw = window.localStorage.getItem(MEMORY_KEY)
    if (!raw) return emptyMemory()
    const parsed = JSON.parse(raw) as Partial<AssistantMemorySnapshot>
    if (parsed.version !== 1 || !Array.isArray(parsed.recentEvents)) return emptyMemory()
    return {
      version: 1,
      seenRuns: typeof parsed.seenRuns === 'number' ? parsed.seenRuns : 0,
      recentEvents: parsed.recentEvents.slice(-12).filter(Boolean) as AssistantMemoryEvent[],
      lastLanguage: typeof parsed.lastLanguage === 'string' ? parsed.lastLanguage : undefined,
      lastLevelTitle: typeof parsed.lastLevelTitle === 'string' ? parsed.lastLevelTitle : undefined,
    }
  } catch {
    return emptyMemory()
  }
}

export function rememberAssistantEvent(event: Omit<AssistantMemoryEvent, 'at'>): AssistantMemorySnapshot {
  if (typeof window === 'undefined') return emptyMemory()
  const current = readAssistantMemory()
  const nextEvent: AssistantMemoryEvent = { ...event, at: Date.now() }
  const next: AssistantMemorySnapshot = {
    version: 1,
    seenRuns: current.seenRuns + (event.type === 'chat' ? 0 : 1),
    recentEvents: [...current.recentEvents, nextEvent].slice(-12),
    lastLanguage: event.languageName,
    lastLevelTitle: event.levelTitle ?? current.lastLevelTitle,
  }
  try {
    window.localStorage.setItem(MEMORY_KEY, JSON.stringify(next))
  } catch {
    // Local memory is a product enhancement, not a critical write.
  }
  return next
}

export function clearAssistantMemory(): AssistantMemorySnapshot {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(MEMORY_KEY)
    } catch {
      // ignore
    }
  }
  return emptyMemory()
}

export function summarizeAssistantMemory(memory: AssistantMemorySnapshot, lang: 'zh' | 'en' = 'zh') {
  if (memory.recentEvents.length === 0) {
    return lang === 'en'
      ? 'No long-term memory yet. Write a few times and the mentor will learn where you tend to trip up.'
      : '还没有长期记忆。先写几次代码，小助手才知道你常在哪些地方踩坑。'
  }
  const latest = memory.recentEvents.slice(-4)
  return latest
    .map((event) => `${event.languageName}${event.levelTitle ? `/${event.levelTitle}` : ''}: ${event.note}`)
    .join('\n')
}

export function assistantWelcome({
  codename,
  personaId,
  liveliness,
  memoryEnabled,
  memory,
  lang = 'zh',
}: {
  codename: string
  personaId: AssistantPersonaId
  liveliness: number
  memoryEnabled: boolean
  memory: AssistantMemorySnapshot
  lang?: 'zh' | 'en'
}) {
  const persona = resolveAssistantPersona(personaId)
  if (lang === 'en') {
    const activity = liveliness > 75
      ? "I'll jump in fairly often — especially when you idle too long or write risky logic."
      : liveliness < 25
      ? "I'll stay quiet unless you ping me or the code is clearly off."
      : "I'll chime in when you're stuck, hit an error, or pause too long — without grabbing your keyboard."
    const memoryLine = memoryEnabled && memory.recentEvents.length > 0
      ? `I remember you recently worked on ${memory.lastLanguage ?? 'a lesson'}: ${memory.recentEvents.at(-1)?.note ?? 'a few small issues'}.`
      : memoryEnabled
      ? "I'll remember your common mistakes and your pace, so my hints get closer to you over time."
      : "Memory is off, so I only look at what's on screen right now."
    return `Hi, **${codename}**. I'm **${persona.nameEn}**, your ${persona.roleEn}.\n\n${activity}\n\n${memoryLine}`
  }
  const activity = liveliness > 75
    ? '我会比较主动地冒出来提醒你，尤其是你停太久或者写出危险逻辑的时候。'
    : liveliness < 25
    ? '我会安静点，除非你点我或者代码明显不对。'
    : '我会在你卡住、报错、停顿太久时插一句，不抢你的键盘。'

  const memoryLine = memoryEnabled && memory.recentEvents.length > 0
    ? `我记得你最近在 ${memory.lastLanguage ?? '课程'} 里处理过：${memory.recentEvents.at(-1)?.note ?? '一些小问题'}。`
    : memoryEnabled
    ? '我会记住你的常见错误和通关节奏，后面提醒会更贴近你。'
    : '你关了记忆，我只看当前这一屏。'

  return `嗨，**${codename}**。我是 **${persona.name}**，${persona.role}。\n\n${activity}\n\n${memoryLine}`
}
