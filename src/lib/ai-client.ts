import OpenAI from 'openai'
import { NextRequest } from 'next/server'
import {
  AI_PROVIDER_PRESETS,
  DEFAULT_AI_BASE_URL,
  normalizeAiModel,
  normalizeAiProvider,
  parseAiBaseUrl,
  providerServerConfig,
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
    parseAiBaseUrl(AI_PROVIDER_PRESETS.kimi.baseUrl),
    parseAiBaseUrl(process.env.DEEPSEEK_BASE_URL),
    parseAiBaseUrl(process.env.KIMI_BASE_URL),
    ...((process.env.AI_ALLOWED_BASE_URLS ?? '')
      .split(',')
      .map((item) => parseAiBaseUrl(item))
      .filter((item): item is string => Boolean(item))),
  ].filter(Boolean))
}

/**
 * Resolve the model client for a request.
 *
 * 1. A user-supplied key (`x-codenexus-ai-key`) always wins — their spend, their
 *    base URL (validated against the allow-list), their model. This is the only
 *    path available to trial/guest users.
 * 2. Otherwise, only when `allowServerKey` is true (i.e. a logged-in user), fall
 *    back to the platform key for the chosen provider (`x-codenexus-ai-provider`:
 *    deepseek | kimi). Guests never reach the platform keys.
 *
 * Returns `null` when no key is available, or `{ error }` for a disallowed base URL.
 */
export function resolveAiClient(
  req: NextRequest,
  opts: { allowServerKey?: boolean } = {},
): ResolvedAiClient | null {
  const allowServerKey = opts.allowServerKey ?? true
  const headerKey = req.headers.get('x-codenexus-ai-key')?.trim()

  if (headerKey) {
    const baseURL = resolveAiBaseUrl(req.headers.get('x-codenexus-ai-base-url'), DEFAULT_AI_BASE_URL)
    if (!baseURL || !allowedBaseUrls().has(baseURL)) {
      return {
        error: `⚠️ AI Base URL 未被允许。把它加到 AI_ALLOWED_BASE_URLS，或者使用默认 ${DEFAULT_AI_BASE_URL}。`,
      }
    }
    return {
      client: new OpenAI({ baseURL, apiKey: headerKey }),
      model: normalizeAiModel(req.headers.get('x-codenexus-ai-model')),
    }
  }

  // No BYO key → platform keys are for logged-in users only.
  if (!allowServerKey) return null

  const provider = normalizeAiProvider(req.headers.get('x-codenexus-ai-provider'))
  const cfg = providerServerConfig(provider)
  if (!cfg.apiKey) return null

  const baseURL = resolveAiBaseUrl(cfg.baseUrl, DEFAULT_AI_BASE_URL)
  if (!baseURL || !allowedBaseUrls().has(baseURL)) {
    return { error: `⚠️ 服务端 ${provider} Base URL 未被允许。检查 ${provider === 'kimi' ? 'KIMI_BASE_URL' : 'DEEPSEEK_BASE_URL'} 配置。` }
  }

  return {
    client: new OpenAI({ baseURL, apiKey: cfg.apiKey }),
    model: cfg.model,
  }
}
