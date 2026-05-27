// In-memory token bucket. Keyed per user (or any stable string).
//
// Trade-offs:
// - Single-process Next.js node: works, no external deps.
// - Multi-region / multi-instance: each instance has its own bucket, so the
//   effective limit is N×limit. Acceptable as a soft floor; swap to Upstash
//   Redis when we go multi-region.
// - Process restart resets buckets. Fine for the abuse profile we worry about
//   (burst spam, not slow-drip).

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

// Periodic GC so a bot hammering with rotating keys can't blow up memory.
let lastSweep = 0
function sweep(now: number) {
  if (now - lastSweep < 60_000) return
  lastSweep = now
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

export type RateLimitResult = {
  ok: boolean
  remaining: number
  retryAfterMs: number
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, remaining: limit - 1, retryAfterMs: 0 }
  }

  if (bucket.count >= limit) {
    return { ok: false, remaining: 0, retryAfterMs: bucket.resetAt - now }
  }

  bucket.count += 1
  return { ok: true, remaining: limit - bucket.count, retryAfterMs: 0 }
}
