import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { resolveAiClient } from '@/lib/ai-client'
import { LEVELS } from '@/lib/levels'

// Generating a route is a few model tokens; keep it stingier than chat so a
// runaway client can't spin the model in a loop.
const ROUTE_LIMIT = 6
const ROUTE_WINDOW_MS = 60_000

const VALID_LEVEL_IDS = new Set(LEVELS.map((level) => level.id))

function json(data: unknown, status = 200) {
  return Response.json(data, { status })
}

// Compact menu so the model can attach each milestone to a real, playable level.
function levelMenu() {
  return LEVELS.map((level) => `${level.id}. ${level.title}`).join('\n')
}

function routeSystemPrompt(languageName: string, lang: 'zh' | 'en') {
  if (lang === 'en') {
    return `You are CodeNexus's learning-route planner. The user will tell you what they want to build.
Your task: break that goal into 4-6 learning milestones, from easy to hard, so a ${languageName} beginner can follow them step by step and gradually build it.

Existing levels you may link to (link by numeric id so the user can jump in and practice; only pick from the list below, choose the closest match, use null if nothing fits):
${levelMenu()}

Output ONLY JSON, no extra text or explanation, strictly in this structure:
{
  "steps": [
    {
      "title": "milestone title (max 8 words)",
      "why": "why this step matters for the user's goal (one conversational sentence)",
      "concept": "the core concept of this step (2-5 words)",
      "task": "one small task they can do right now (one specific sentence)",
      "levelId": numeric level id, or null
    }
  ]
}

Requirements: 4 to 6 steps; ordered easy to hard; title / why / task in English, specific, never vague; don't just restate the user's goal.`
  }
  return `你是 CodeNexus 的学习路线规划师。用户会告诉你 TA "想做一个什么东西"。
你的任务：把这个目标拆成 4-6 个由浅入深的学习里程碑，让一个 ${languageName} 初学者照着一步步走，就能逐渐做出来。

可关联的现有关卡（用数字 id 关联，方便用户跳去练习；只能从下面这份清单里挑，挑和该里程碑最贴近的一关，实在没有合适的就用 null）：
${levelMenu()}

只输出 JSON，不要任何额外文字或解释，严格遵守这个结构：
{
  "steps": [
    {
      "title": "里程碑标题（不超过 14 字）",
      "why": "为什么这一步和用户的目标有关（一句口语，扣住 TA 的目标）",
      "concept": "这一步要掌握的核心概念（3-10 字）",
      "task": "一个能立刻动手的小任务（一句话，具体）",
      "levelId": 关联关卡的数字 id，或 null
    }
  ]
}

要求：steps 4 到 6 个；顺序由易到难；title / why / task 用中文、具体、不空洞；不要把用户的目标原样复述一遍。`
}

export async function POST(req: NextRequest) {
  const lang = req.headers.get('x-codenexus-lang') === 'en' ? 'en' : 'zh'
  const isEn = lang === 'en'

  // Only signed-in learners spend model tokens.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  if (!user) {
    return json({ error: isEn ? 'Sign in first and I’ll build your custom route.' : '请先登录，再让我帮你定制路线。' }, 401)
  }

  const limit = checkRateLimit(`route:${user.id}`, ROUTE_LIMIT, ROUTE_WINDOW_MS)
  if (!limit.ok) {
    const seconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000))
    return json({ error: isEn ? `Too fast — try again in ${seconds}s.` : `定制得太快了，${seconds} 秒后再来一次。` }, 429)
  }

  const ai = resolveAiClient(req)
  if (!ai) {
    return json({
      error: isEn
        ? 'The assistant is missing an API key. Add your own DeepSeek key in the Command Center.'
        : '小助手缺少 API Key。去命令中心填你自己的 DeepSeek Key。',
    }, 503)
  }
  if ('error' in ai) return json({ error: ai.error }, 400)

  let body: { goal?: string; languageName?: string }
  try {
    body = await req.json()
  } catch {
    return json({ error: isEn ? 'Invalid request format.' : '请求格式无效。' }, 400)
  }

  const goal = typeof body.goal === 'string' ? body.goal.trim().slice(0, 200) : ''
  const languageName = typeof body.languageName === 'string' && body.languageName.trim()
    ? body.languageName.trim().slice(0, 40)
    : 'Python'
  if (!goal) return json({ error: isEn ? 'Tell me what you want to build first.' : '先说说你想做个什么吧。' }, 400)

  let completion
  try {
    completion = await ai.client.chat.completions.create({
      model: ai.model,
      messages: [
        { role: 'system', content: routeSystemPrompt(languageName, lang) },
        { role: 'user', content: isEn ? `What I want to build: ${goal}` : `我想做的是：${goal}` },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 900,
      temperature: 0.6,
    })
  } catch (err) {
    console.error('custom-route upstream error:', err)
    return json({ error: isEn ? 'The upstream model isn’t responding. Try again shortly.' : '上游模型暂时不响应，稍后再试。' }, 502)
  }

  const raw = completion.choices[0]?.message?.content ?? ''
  let parsed: unknown = null
  try {
    parsed = JSON.parse(raw)
  } catch {
    // Defensive: if the model wraps JSON in prose, grab the first object.
    const match = raw.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch { parsed = null }
    }
  }

  const rawSteps = Array.isArray((parsed as { steps?: unknown })?.steps)
    ? (parsed as { steps: unknown[] }).steps
    : []

  const steps = rawSteps
    .filter((s): s is Record<string, unknown> =>
      Boolean(s) && typeof s === 'object' &&
      typeof (s as Record<string, unknown>).title === 'string' &&
      typeof (s as Record<string, unknown>).task === 'string')
    .slice(0, 6)
    .map((s) => {
      const levelId = s.levelId
      return {
        title: String(s.title).trim().slice(0, 40),
        why: typeof s.why === 'string' ? s.why.trim().slice(0, 160) : '',
        concept: typeof s.concept === 'string' ? s.concept.trim().slice(0, 40) : '',
        task: String(s.task).trim().slice(0, 160),
        levelId: typeof levelId === 'number' && VALID_LEVEL_IDS.has(levelId) ? levelId : null,
      }
    })

  if (steps.length < 2) {
    return json({ error: isEn ? 'Couldn’t generate a clear route this time — try rephrasing.' : '这次没能生成清晰的路线，换个说法再试试。' }, 422)
  }

  return json({ steps })
}
