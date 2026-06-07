import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import {
  DEFAULT_AI_BASE_URL,
  normalizeAiModel,
  parseAiBaseUrl,
  resolveAiBaseUrl,
} from '@/lib/ai-config'

// Shared DeepSeek/OpenAI-compatible client resolver. Used by every server route
// that talks to the model (chat, custom-route) so the BYO-key path, allow-list
// and billing fallback stay identical in one place.
export type ResolvedAiClient =
  | { client: OpenAI; model: string }
  | { error: string }

function allowedBaseUrls() {
  return new Set([
    parseAiBaseUrl(DEFAULT_AI_BASE_URL),
    parseAiBaseUrl(process.env.DEEPSEEK_BASE_URL),
    ...((process.env.AI_ALLOWED_BASE_URLS ?? '')
      .split(',')
      .map((item) => parseAiBaseUrl(item))
      .filter((item): item is string => Boolean(item))),
  ].filter(Boolean))
}

/**
 * Resolve the model client for a request. Prefers a user-supplied key from the
 * `x-codenexus-ai-*` headers (their spend, their base URL — validated against the
 * allow-list), and falls back to the platform `DEEPSEEK_API_KEY` env. Returns
 * `null` when no key is available anywhere, or `{ error }` for a disallowed base URL.
 */
export function resolveAiClient(req: NextRequest): ResolvedAiClient | null {
  const headerKey = req.headers.get('x-codenexus-ai-key')?.trim()
  const apiKey = headerKey || process.env.DEEPSEEK_API_KEY?.trim()
  if (!apiKey) return null

  const baseURL = headerKey
    ? resolveAiBaseUrl(req.headers.get('x-codenexus-ai-base-url'), DEFAULT_AI_BASE_URL)
    : resolveAiBaseUrl(process.env.DEEPSEEK_BASE_URL, DEFAULT_AI_BASE_URL)
  if (!baseURL || !allowedBaseUrls().has(baseURL)) {
    return {
      error: `⚠️ AI Base URL 未被允许。把它加到 AI_ALLOWED_BASE_URLS，或者使用默认 ${DEFAULT_AI_BASE_URL}。`,
    }
  }

  return {
    client: new OpenAI({ baseURL, apiKey }),
    model: normalizeAiModel(headerKey ? req.headers.get('x-codenexus-ai-model') : null),
  }
}
