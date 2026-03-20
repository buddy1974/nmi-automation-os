// In-memory rate limiter — Map-based, resets per cold start on serverless
// Effective for development and long-running Node.js processes.
// For multi-instance production: swap store for Redis KV.

type Bucket = { count: number; resetAt: number }

const store = new Map<string, Bucket>()

const WINDOW_MS = 60_000 // 1 minute

const LIMITS: Record<string, number> = {
  auth:    10,  // login attempts per minute
  default: 60,  // general API calls per minute
}

/**
 * Returns true if the request is allowed, false if rate limit exceeded.
 * @param ip    Client IP address
 * @param route "auth" for login routes, anything else uses default limit
 */
export function checkRateLimit(ip: string, route: string): boolean {
  const limit = LIMITS[route] ?? LIMITS.default
  const key   = `${ip}:${route}`
  const now   = Date.now()

  const bucket = store.get(key)

  if (!bucket || bucket.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (bucket.count >= limit) return false

  bucket.count++
  return true
}
