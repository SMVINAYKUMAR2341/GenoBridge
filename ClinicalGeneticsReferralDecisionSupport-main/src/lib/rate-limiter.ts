interface RateLimitRecord {
  count: number
  firstAttempt: number
  lockedUntil?: number
}

const rateLimitStore = new Map<string, RateLimitRecord>()

// Clean up expired records periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.lockedUntil && record.lockedUntil < now) {
      rateLimitStore.delete(key)
    } else if (now - record.firstAttempt > 3600000) {
      rateLimitStore.delete(key)
    }
  }
}, 300000)

export interface RateLimitOptions {
  windowMs?: number // e.g. 15 minutes
  maxAttempts?: number // e.g. 5 attempts
  lockoutDurationMs?: number // e.g. 15 minutes
}

export function checkRateLimit(
  key: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; retryAfterSeconds?: number } {
  const windowMs = options.windowMs || 900000 // 15 mins default
  const maxAttempts = options.maxAttempts || 5
  const lockoutDurationMs = options.lockoutDurationMs || 900000 // 15 mins
  const now = Date.now()

  let record = rateLimitStore.get(key)

  if (!record) {
    record = { count: 1, firstAttempt: now }
    rateLimitStore.set(key, record)
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  // Check if locked
  if (record.lockedUntil && record.lockedUntil > now) {
    const retryAfterSeconds = Math.ceil((record.lockedUntil - now) / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  // Window reset
  if (now - record.firstAttempt > windowMs) {
    record.count = 1
    record.firstAttempt = now
    delete record.lockedUntil
    return { allowed: true, remaining: maxAttempts - 1 }
  }

  record.count += 1

  if (record.count > maxAttempts) {
    record.lockedUntil = now + lockoutDurationMs
    const retryAfterSeconds = Math.ceil(lockoutDurationMs / 1000)
    return { allowed: false, remaining: 0, retryAfterSeconds }
  }

  return { allowed: true, remaining: maxAttempts - record.count }
}

export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key)
}

