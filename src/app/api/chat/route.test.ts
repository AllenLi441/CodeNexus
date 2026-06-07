import { describe, expect, it } from 'vitest'
import { parseAiBaseUrl } from '../../../lib/ai-config'

describe('parseAiBaseUrl', () => {
  it('normalizes allowed HTTPS model provider URLs', () => {
    expect(parseAiBaseUrl('https://api.deepseek.com/')).toBe('https://api.deepseek.com')
    expect(parseAiBaseUrl('https://api.deepseek.com/v1?token=leak#frag')).toBe('https://api.deepseek.com/v1')
  })

  it('rejects empty, invalid, or non-HTTPS URLs', () => {
    expect(parseAiBaseUrl('')).toBeNull()
    expect(parseAiBaseUrl('not a url')).toBeNull()
    expect(parseAiBaseUrl('http://api.deepseek.com')).toBeNull()
  })
})
