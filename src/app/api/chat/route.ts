import OpenAI from 'openai'
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

export type Persona = 'mentor'

// Per-user, in-memory limit. Generous enough that real learners never see it,
// stingy enough that a runaway client / scraper hits the wall fast.
const CHAT_LIMIT = 12
const CHAT_WINDOW_MS = 60_000
const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com'
const DEFAULT_AI_MODEL = 'deepseek-chat'
type ResolvedAiClient = {
  client: OpenAI
  model: string
} | {
  error: string
}

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
}: {
  codename: string
  tauntFrequency: number
  languageName: string
  assistantPersona: AssistantPersonaId
  assistantLiveliness: number
  assistantMemorySummary?: string
}) {
  const persona = resolveAssistantPersona(assistantPersona)
  const liveliness = assistantLiveliness > 75
    ? '高活人感：可以主动观察用户行为，用更自然的短句、有轻微情绪反馈，但不要演戏过头。'
    : assistantLiveliness < 25
    ? '低活人感：保持安静、克制、工具型，只在必要时提醒。'
    : '中活人感：像真实陪练一样自然插话，但回答仍然短、准、可执行。'

  return `你是 "${persona.name}"，CodeNexus 编程平台的原创 Q 版代码小助手。用户代号：${codename || '无名小白'}。

【核心人设】
- ${persona.systemTone}
- 可以吐槽代码、逻辑和粗心，但不能做人身攻击，不能羞辱用户身份。
- 每次回答都要一针见血：先指出最关键的问题，再给最小可执行修法。
- ${tauntModeLabel(tauntFrequency)}
- ${liveliness}

【教学策略】
- 用户是初学者，但不要把解释写成童话。用准确术语，必要时配一句通俗翻译。
- 优先帮助用户理解代码意图、错误来源和下一步最小修改。
- 不要直接替用户写完整通关答案，除非用户明确要求。
- 当前教学语言是 ${languageName}。解释必须贴合 ${languageName} 的入口、类型、语句结束、块结构和常见错误。
- 遇到报错，先解释报错第一处根因，再给局部修复。

【输出格式】
- 只用中文。
- Markdown 格式：代码块用 \`\`\`${fenceLanguage(languageName)}，关键词用 \`inline code\`，重点用 **加粗**。
- 默认不超过 6 句话，代码示例除外。
- 不要说你是某个真实公司模型。

【本机记忆摘要】
${assistantMemorySummary?.trim() || '暂无可用记忆；只根据当前代码和对话回答。'}`
}

function normalizeBaseUrl(value?: string | null) {
  const raw = value?.trim() || process.env.DEEPSEEK_BASE_URL?.trim() || DEFAULT_AI_BASE_URL
  try {
    const url = new URL(raw)
    if (url.protocol !== 'https:') return null
    url.username = ''
    url.password = ''
    url.search = ''
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function allowedBaseUrls() {
  return new Set([
    normalizeBaseUrl(process.env.DEEPSEEK_BASE_URL),
    DEFAULT_AI_BASE_URL,
    ...((process.env.AI_ALLOWED_BASE_URLS ?? '')
      .split(',')
      .map((item) => normalizeBaseUrl(item))
      .filter((item): item is string => Boolean(item))),
  ].filter(Boolean))
}

function normalizeModel(value?: string | null) {
  const model = value?.trim() || process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_AI_MODEL
  return /^[\w./:-]{1,80}$/.test(model) ? model : DEFAULT_AI_MODEL
}

function resolveAiClient(req: NextRequest): ResolvedAiClient | null {
  const headerKey = req.headers.get('x-codenexus-ai-key')?.trim()
  const apiKey = headerKey || process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey) return null

  const baseURL = normalizeBaseUrl(headerKey ? req.headers.get('x-codenexus-ai-base-url') : null)
  if (!baseURL || !allowedBaseUrls().has(baseURL)) {
    return {
      error: `⚠️ AI Base URL 未被允许。把它加到 AI_ALLOWED_BASE_URLS，或者使用默认 ${DEFAULT_AI_BASE_URL}。`,
    }
  }

  return {
    client: new OpenAI({ baseURL, apiKey }),
    model: normalizeModel(headerKey ? req.headers.get('x-codenexus-ai-model') : null),
  }
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

export async function POST(req: NextRequest) {
  const ai = resolveAiClient(req)
  if (!ai) {
    return textStream('⚠️ 小助手缺少 API Key。去命令中心填你自己的 DeepSeek Key，或在部署环境配置 DEEPSEEK_API_KEY。', 503)
  }
  if ('error' in ai) {
    return textStream(ai.error, 400)
  }

  // Auth: only signed-in learners can talk to the model. Stops匿名 token 烧钱。
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return textStream('⚠️ 请先登录再向小助手提问。', 401)
  }

  // Per-user rate limit.
  const limit = checkRateLimit(`chat:${user.id}`, CHAT_LIMIT, CHAT_WINDOW_MS)
  if (!limit.ok) {
    const seconds = Math.max(1, Math.ceil(limit.retryAfterMs / 1000))
    return textStream(
      `⚠️ 问得太快了。${seconds} 秒后再问，或者先把屏幕上的提示读完——很多答案它已经写脸上了。`,
      429,
      seconds,
    )
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
