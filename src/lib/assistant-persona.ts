export type AssistantPersonaId = 'mika' | 'reno' | 'aoi' | 'sera'

export type AssistantPersona = {
  id: AssistantPersonaId
  name: string
  pronoun: '她' | '他' | 'TA'
  role: string
  accentClass: string
  glowClass: string
  description: string
  systemTone: string
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
    pronoun: '她',
    role: '好奇型代码小助手',
    accentClass: 'from-cyan-200 via-sky-300 to-cyan-400',
    glowClass: 'shadow-cyan-300/30',
    description: '反应快，会主动提醒你哪里不对，但语气更像一起盯屏幕的队友。',
    systemTone: '像一个反应快、聪明、有点调皮的 Q 版代码小助手。语气轻快但不幼稚，先帮用户发现最关键的问题。',
  },
  {
    id: 'reno',
    name: '洛恩',
    pronoun: '他',
    role: '工程型代码小助手',
    accentClass: 'from-emerald-200 via-cyan-300 to-blue-400',
    glowClass: 'shadow-emerald-300/25',
    description: '更冷静，喜欢把问题拆成步骤，适合想少废话、快定位的人。',
    systemTone: '像一个冷静的工程搭档。少讲情绪，多讲边界、错误来源和下一步最小修改。',
  },
  {
    id: 'aoi',
    name: '青栈',
    pronoun: 'TA',
    role: '系统型代码小助手',
    accentClass: 'from-violet-200 via-cyan-300 to-slate-200',
    glowClass: 'shadow-violet-300/25',
    description: '偏安静，会记录你的习惯，适合需要稳定陪练和复盘的人。',
    systemTone: '像一个安静、可靠的系统助手。回答克制、清楚，重点放在复盘、模式识别和稳定推进。',
  },
  {
    id: 'sera',
    name: '赛拉',
    pronoun: '她',
    role: '创作型代码小助手',
    accentClass: 'from-fuchsia-200 via-cyan-200 to-rose-300',
    glowClass: 'shadow-fuchsia-300/25',
    description: '更有表现力，适合做游戏、视觉、网页交互时给灵感和反馈。',
    systemTone: '像一个有审美、会看作品效果的创作型代码搭档。回答可以更有画面感，但必须落到具体代码和下一步动作。',
  },
]

export const DEFAULT_ASSISTANT_PERSONA: AssistantPersonaId = 'mika'
export const DEFAULT_ASSISTANT_LIVELINESS = 58
const MEMORY_KEY = 'codenexus.assistant-memory.v1'

export function resolveAssistantPersona(id?: string | null): AssistantPersona {
  return ASSISTANT_PERSONAS.find((persona) => persona.id === id) ?? ASSISTANT_PERSONAS[0]
}

export function livelinessLabel(value: number) {
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

export function summarizeAssistantMemory(memory: AssistantMemorySnapshot) {
  if (memory.recentEvents.length === 0) {
    return '还没有长期记忆。先写几次代码，小助手才知道你常在哪些地方踩坑。'
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
}: {
  codename: string
  personaId: AssistantPersonaId
  liveliness: number
  memoryEnabled: boolean
  memory: AssistantMemorySnapshot
}) {
  const persona = resolveAssistantPersona(personaId)
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
