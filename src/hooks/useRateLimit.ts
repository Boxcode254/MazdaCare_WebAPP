interface RateLimitConfig {
  key: string
  maxAttempts: number
  windowMs: number
}

interface RateLimitRecord {
  count: number
  windowStart: number
}

function readRecord(storageKey: string, now: number): RateLimitRecord {
  if (typeof window === 'undefined') {
    return { count: 0, windowStart: now }
  }

  try {
    const raw = window.sessionStorage.getItem(storageKey)
    return raw ? (JSON.parse(raw) as RateLimitRecord) : { count: 0, windowStart: now }
  } catch {
    return { count: 0, windowStart: now }
  }
}

function writeRecord(storageKey: string, record: RateLimitRecord) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(record))
  } catch {
    // Ignore storage write failures and fail open on the client.
  }
}

function removeRecord(storageKey: string) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.sessionStorage.removeItem(storageKey)
  } catch {
    // Ignore storage removal failures.
  }
}

export function useRateLimit({ key, maxAttempts, windowMs }: RateLimitConfig) {
  function check(): { allowed: boolean; remainingMs: number } {
    const storageKey = `rl_${key}`
    const now = Date.now()
    const record = readRecord(storageKey, now)

    if (now - record.windowStart > windowMs) {
      writeRecord(storageKey, { count: 1, windowStart: now })
      return { allowed: true, remainingMs: 0 }
    }

    if (record.count >= maxAttempts) {
      return { allowed: false, remainingMs: windowMs - (now - record.windowStart) }
    }

    record.count += 1
    writeRecord(storageKey, record)
    return { allowed: true, remainingMs: 0 }
  }

  function reset() {
    removeRecord(`rl_${key}`)
  }

  return { check, reset }
}