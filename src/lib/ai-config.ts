export const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_AI_MODEL = 'deepseek-chat'

// The two platform models a logged-in user can switch between. BYO keys can point
// anywhere on the allow-list; these presets only drive the server-key fallback and
// the Command Center toggle defaults.
export type AiProvider = 'deepseek' | 'kimi'

export const AI_PROVIDER_PRESETS = {
  deepseek: { label: 'DeepSeek', baseUrl: 'https://api.deepseek.com', model: 'deepseek-chat' },
  kimi: { label: 'Kimi · Moonshot', baseUrl: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-32k' },
} as const satisfies Record<AiProvider, { label: string; baseUrl: string; model: string }>

export function normalizeAiProvider(value?: string | null): AiProvider {
  return value === 'kimi' ? 'kimi' : 'deepseek'
}

function sanitizeModel(value: string | null | undefined, fallback: string) {
  const model = value?.trim()
  return model && /^[\w./:-]{1,80}$/.test(model) ? model : fallback
}

// Server-side key + base + model for the chosen platform provider. apiKey is
// undefined when that provider is not configured in the deployment env.
export function providerServerConfig(provider: AiProvider): {
  apiKey: string | undefined
  baseUrl: string
  model: string
} {
  if (provider === 'kimi') {
    return {
      apiKey: process.env.KIMI_API_KEY?.trim() || undefined,
      baseUrl: process.env.KIMI_BASE_URL?.trim() || AI_PROVIDER_PRESETS.kimi.baseUrl,
      model: sanitizeModel(process.env.KIMI_MODEL, AI_PROVIDER_PRESETS.kimi.model),
    }
  }
  return {
    apiKey: process.env.DEEPSEEK_API_KEY?.trim() || undefined,
    baseUrl: process.env.DEEPSEEK_BASE_URL?.trim() || AI_PROVIDER_PRESETS.deepseek.baseUrl,
    model: sanitizeModel(process.env.DEEPSEEK_MODEL, AI_PROVIDER_PRESETS.deepseek.model),
  }
}

export function parseAiBaseUrl(value?: string | null) {
  const raw = value?.trim()
  if (!raw) return null
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

export function resolveAiBaseUrl(value?: string | null, fallback = DEFAULT_AI_BASE_URL) {
  return parseAiBaseUrl(value) ?? parseAiBaseUrl(fallback)
}

export function normalizeAiModel(value?: string | null) {
  const model = value?.trim() || process.env.DEEPSEEK_MODEL?.trim() || DEFAULT_AI_MODEL
  return /^[\w./:-]{1,80}$/.test(model) ? model : DEFAULT_AI_MODEL
}
