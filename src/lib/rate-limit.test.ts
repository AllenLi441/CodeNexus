import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { checkRateLimit } from './rate-limit'

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('allows requests inside the window and blocks over the limit', () => {
    const key = 'rate-limit:window'

    expect(checkRateLimit(key, 2, 1000)).toMatchObject({
      ok: true,
      remaining: 1,
      retryAfterMs: 0,
    })
    expect(checkRateLimit(key, 2, 1000)).toMatchObject({
      ok: true,
      remaining: 0,
      retryAfterMs: 0,
    })

    const blocked = checkRateLimit(key, 2, 1000)
    expect(blocked.ok).toBe(false)
    expect(blocked.remaining).toBe(0)
    expect(blocked.retryAfterMs).toBe(1000)
  })

  it('resets the bucket after the window expires', () => {
    const key = 'rate-limit:reset'

    expect(checkRateLimit(key, 1, 1000).ok).toBe(true)
    expect(checkRateLimit(key, 1, 1000).ok).toBe(false)

    vi.advanceTimersByTime(1001)

    expect(checkRateLimit(key, 1, 1000)).toMatchObject({
      ok: true,
      remaining: 0,
      retryAfterMs: 0,
    })
  })
})
