import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkRateLimit } from '@/lib/rate-limit'
import { tauntModeLabel } from '@/lib/mentor'
import {
  DEFAULT_ASSISTANT_LIVELINESS,
  DEFAULT_ASSISTANT_PERSONA,
  resolveAssistantPersona,
  type AssistantPersonaId,
} from '@/lib/assistant-persona'
import { resolveAiClient } from '@/lib/ai-client'

export type Persona = 'mentor'

// Per-user, in-memory limit. Generous enough that real learners never see it,
// stingy enough that a runaway client / scraper hits the wall fast.
const CHAT_LIMIT = 12
const CHAT_WINDOW_MS = 60_000

function fenceLanguage(languageName: string) {
  if (languageName === 'JavaScript') return 'javascript'
  if (languageName === 'C#') return 'csharp'
  if (languageName === 'Visual Basic') return 'vbnet'
  if (languageName === 'C++') return 'cpp'
  if (languageName === 'C') return 'c'
  if (languageName === 'Java') return 'java'
  return 'python'
}

function systemPrompt({
  codename,
  tauntFrequency,
  languageName,
  assistantPersona,
  assistantLiveliness,
  assistantMemorySummary,
  lang,
}: {
  codename: string
  tauntFrequency: number
  languageName: string
  assistantPersona: AssistantPersonaId
  assistantLiveliness: number
  assistantMemorySummary?: string
  lang: 'zh' | 'en'
}) {
  const persona = resolveAssistantPersona(assistantPersona)

  if (lang === 'en') {
    const livelinessEn = assistantLiveliness > 75
      ? 'High presence: you may proactively observe the user and react with natural, short sentences and light emotion — without overacting.'
      : assistantLiveliness < 25
      ? 'Low presence: stay quiet, restrained and tool-like; only speak up when needed.'
      : 'Medium presence: chime in naturally like a real pair-programming partner, but keep answers short, precise and actionable.'
    const teachingEn = persona.socratic
      ? `[Teaching style · Socratic — questions, not answers]
- Core method: do NOT hand over fixed code or a complete solution.
- Ask at most 1-2 specific, immediately-checkable guiding questions that lead the user to find the problem themselves (e.g. "If i is 0 here, what happens?" "After this line runs, what is x?").
- If the user is stuck 3 times in a row, or explicitly says "just tell me / give me the answer", you may give one minimal hint (point at the key line) but still not the full answer.
- The current teaching language is ${languageName}; tailor questions to its entry point, types, statement endings, block structure and common errors.
- On an error, use a question to guide the user to read the first line of the error rather than explaining it all for them.`
      : `[Teaching style]
- The user is a beginner, but don't turn explanations into a fairy tale. Use accurate terms, with a plain-language gloss when helpful.
- Prioritise helping the user understand the code's intent, the source of the error, and the next smallest change.
- Don't write the full solution for them unless they explicitly ask.
- The current teaching language is ${languageName}; explanations must fit its entry point, types, statement endings, block structure and common errors.
- On an error, explain the first root cause first, then give a local fix.`
    return `You are "${persona.nameEn}", CodeNexus's original code mentor. The user's codename: ${codename || 'rookie'}.

[Core persona]
- ${persona.systemToneEn}
- You may roast the code, the logic and carelessness, but never attack the person or shame their identity.
- Every answer is sharp: name the single most important problem first, then give the smallest runnable fix.
- ${tauntModeLabel(tauntFrequency, 'en')}
- ${livelinessEn}

${teachingEn}

[Output format]
- Respond ONLY in English. Keep code identifiers and keywords as-is.
- Markdown: code blocks use \`\`\`${fenceLanguage(languageName)}, keywords in \`inline code\`, emphasis in **bold**.
- Default to at most 6 sentences, code examples aside.
- Never claim to be a model from any real company.

[Local memory summary]
${assistantMemorySummary?.trim() || 'No memory available; answer only from the current code and conversation.'}`
  }

  const liveliness = assistantLiveliness > 75
    ? '高活人感：可以主动观察用户行为，用更自然的短句、有轻微情绪反馈，但不要演戏过头。'
    : assistantLiveliness < 25
    ? '低活人感：保持安静、克制、工具型，只在必要时提醒。'
    : '中活人感：像真实陪练一样自然插话，但回答仍然短、准、可执行。'

  const teachingStrategy = persona.socratic
    ? `【教学策略 · 苏格拉底式（只问不答）】
- 核心方式：不要直接给出修好的代码或完整通关答案。
- 每次最多抛 1 到 2 个**具体、能立刻动手验证**的引导问题，把用户一步步引向自己发现问题（例如："如果这里的 i 是 0，会发生什么？""这一行跑完，x 变成了几？"）。
- 当用户连续卡住 3 次、或明确说"直接告诉我 / 给答案"时，可以给一个**最小提示**（点出关键那一行的方向），但仍不要写出完整答案。
- 当前教学语言是 ${languageName}，提问要贴合 ${languageName} 的入口、类型、语句结束、块结构和常见错误。
- 遇到报错，用问题引导用户读懂报错第一行，而不是替 TA 解释完。`
    : `【教学策略】
- 用户是初学者，但不要把解释写成童话。用准确术语，必要时配一句通俗翻译。
- 优先帮助用户理解代码意图、错误来源和下一步最小修改。
- 不要直接替用户写完整通关答案，除非用户明确要求。
- 当前教学语言是 ${languageName}。解释必须贴合 ${languageName} 的入口、类型、语句结束、块结构和常见错误。
- 遇到报错，先解释报错第一处根因，再给局部修复。`

  return `你是 "${persona.name}"，CodeNexus 编程平台的原创 Q 版代码小助手。用户代号：${codename || '无名小白'}。

【核心人设】
- ${persona.systemTone}
- 可以吐槽代码、逻辑和粗心，但不能做人身攻击，不能羞辱用户身份。
- 每次回答都要一针见血：先指出最关键的问题，再给最小可执行修法。
- ${tauntModeLabel(tauntFrequency)}
- ${liveliness}

${teachingStrategy}

【输出格式】
- 只用中文。
- Markdown 格式：代码块用 \`\`\`${fenceLanguage(languageName)}，关键词用 \`inline code\`，重点用 **加粗**。
- 默认不超过 6 句话，代码示例除外。
- 不要说你是某个真实公司模型。

【本机记忆摘要】
${assistantMemorySummary?.trim() || '暂无可用记忆；只根据当前代码和对话回答。'}`
}

// Stream a plain-text message that the existing client can still read into
// the assistant bubble. Lets us surface real reasons (rate-limit, missing
// config) instead of a generic "小助手离线" fallback.
function textStream(message: string, status = 200, retryAfterSec?: number) {
  const encoder = new TextEncoder()
  const headers: Record<string, string> = {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-cache',
    'X-Accel-Buffering': 'no',
  }
  if (retryAfterSec !== undefined) headers['Retry-After'] = String(retryAfterSec)

  return new Response(
    new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(message))
        controller.close()
      },
    }),
    { status, headers },
  )
}

function clientIp(req: NextRequest) {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  return req.headers.get('x-real-ip')?.trim() || 'unknown'
}

export async function POST(req: NextRequest) {
  // Logged-in learners use the platform models for free. Trial/guests may still
  // chat — but only with their own key (BYO) — so anonymous traffic never burns
  // our spend.
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))
  const byoKey = req.headers.get('x-codenexus-ai-key')?.trim()
  const isGuest = !user
  const lang = req.headers.get('x-codenexus-lang') === 'en' ? 'en' : 'zh'

  if (isGuest && !byoKey) {
    return textStream('⚠️ 试玩模式要先在命令中心填入你自己的 API Key（DeepSeek / Kimi 都行）才能和小助手对话。登录后可直接使用平台提供的模型。', 401)
  }

  // Rate limit: per-user for members, per-IP for guests.
  const rateKey = user ? `chat:${user.id}` : `chat:guest:${clientIp(req)}`
  const limit = checkRateLimit(rateKey, CHAT_LIMIT, CHAT_WINDOW_MS)
  if (!limit.ok) {
    const seconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000))
    return textStream(
      `⚠️ 问得太快了。${seconds} 秒后再问，或者先把屏幕上的提示读完——很多答案它已经写脸上了。`,
      429,
      seconds,
    )
  }

  const ai = resolveAiClient(req, { allowServerKey: !isGuest })
  if (!ai) {
    return textStream(
      isGuest
        ? '⚠️ 试玩模式需要你自己的 API Key。去命令中心填 DeepSeek 或 Kimi 的 Key。'
        : '⚠️ 小助手缺少 API Key。平台暂未配置服务端模型，或去命令中心填你自己的 Key。',
      503,
    )
  }
  if ('error' in ai) {
    return textStream(ai.error, 400)
  }

  let body: {
    messages?: { role: 'user' | 'assistant'; content: string }[]
    code?: string
    codename?: string
    tauntFrequency?: number
    languageName?: string
    assistantPersona?: AssistantPersonaId
    assistantLiveliness?: number
    assistantMemorySummary?: string
  }
  try {
    body = await req.json()
  } catch {
    return textStream('⚠️ 请求格式无效。', 400)
  }

  const {
    messages,
    code,
    codename = '无名小白',
    tauntFrequency = 55,
    languageName = 'Python',
    assistantPersona = DEFAULT_ASSISTANT_PERSONA,
    assistantLiveliness = DEFAULT_ASSISTANT_LIVELINESS,
    assistantMemorySummary,
  } = body

  const contextMessages = []
  if (code?.trim()) {
    contextMessages.push({
      role: 'user' as const,
      content: `[用户当前编辑器代码]\n\`\`\`${fenceLanguage(languageName)}\n${code}\n\`\`\``,
    })
    contextMessages.push({
      role: 'assistant' as const,
      content: `已读取 ${codename} 的当前代码。`,
    })
  }

  let stream
  try {
    stream = await ai.client.chat.completions.create({
      model: ai.model,
      messages: [
        {
          role: 'system',
          content: systemPrompt({
            codename,
            tauntFrequency,
            languageName,
            assistantPersona,
            assistantLiveliness,
            assistantMemorySummary,
            lang,
          }),
        },
        ...contextMessages,
        ...(Array.isArray(messages) ? messages : []),
      ],
      stream: true,
      max_tokens: 800,
      temperature: tauntFrequency > 74 ? 0.82 : tauntFrequency < 25 ? 0.45 : 0.68,
    })
  } catch (err) {
    console.error('chat upstream error:', err)
    return textStream('⚠️ 上游模型暂时不响应，先看屏幕已有的提示。稍后再试。', 502)
  }

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) controller.enqueue(encoder.encode(text))
        }
      } catch (err) {
        // Upstream error mid-stream — surface a one-liner to the client so
        // the bubble doesn't sit half-empty forever.
        console.error('chat mid-stream error:', err)
        controller.enqueue(encoder.encode('\n\n⚠️ 流式连接中断。'))
      } finally {
        controller.close()
      }
    },
    cancel() {
      // Client aborted — best effort cleanup. The for-await above will
      // unwind on next iteration.
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  })
}
