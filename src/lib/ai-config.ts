export const DEFAULT_AI_BASE_URL = 'https://api.deepseek.com'
export const DEFAULT_AI_MODEL = 'deepseek-chat'

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
