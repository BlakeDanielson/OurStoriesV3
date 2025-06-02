import { Redis } from '@upstash/redis'

// Redis client for rate limiting
// In production, this should use Upstash Redis
// In development, we'll use a memory-based fallback
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
})

// Check if Redis is properly configured
export const isRedisConfigured = () => {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  )
}

// Memory-based fallback for development
class MemoryStore {
  private store = new Map<string, { count: number; resetTime: number }>()

  async get(key: string): Promise<number | null> {
    const entry = this.store.get(key)
    if (!entry) return null

    if (Date.now() > entry.resetTime) {
      this.store.delete(key)
      return null
    }

    return entry.count
  }

  async set(key: string, count: number, windowMs: number): Promise<void> {
    this.store.set(key, {
      count,
      resetTime: Date.now() + windowMs,
    })
  }

  async incr(key: string, windowMs: number): Promise<number> {
    const current = await this.get(key)
    const newCount = (current || 0) + 1
    await this.set(key, newCount, windowMs)
    return newCount
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now()
    const entries = Array.from(this.store.entries())
    for (const [key, entry] of entries) {
      if (now > entry.resetTime) {
        this.store.delete(key)
      }
    }
  }
}

export const memoryStore = new MemoryStore()

// Cleanup memory store every 5 minutes
if (typeof window === 'undefined') {
  setInterval(
    () => {
      memoryStore.cleanup()
    },
    5 * 60 * 1000
  )
}
