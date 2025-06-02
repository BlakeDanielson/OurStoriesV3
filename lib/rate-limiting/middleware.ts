import { NextRequest, NextResponse } from 'next/server'
import { Ratelimit } from '@upstash/ratelimit'
import { redis, isRedisConfigured, memoryStore } from './redis'
import {
  getRateLimitConfig,
  generateRateLimitKey,
  createRateLimitHeaders,
  RateLimitConfig,
} from './config'

// Create Upstash rate limiter instances for different configurations
const rateLimiters = new Map<string, Ratelimit>()

function getRateLimiter(config: RateLimitConfig): Ratelimit {
  const key = `${config.windowMs}-${config.max}`

  if (!rateLimiters.has(key)) {
    const limiter = new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(config.max, `${config.windowMs} ms`),
      analytics: true,
      prefix: 'ourstories',
    })
    rateLimiters.set(key, limiter)
  }

  return rateLimiters.get(key)!
}

// Memory-based rate limiting fallback
async function checkRateLimitMemory(
  key: string,
  config: RateLimitConfig
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
}> {
  const current = await memoryStore.incr(key, config.windowMs)
  const remaining = Math.max(0, config.max - current)
  const reset = Date.now() + config.windowMs

  return {
    success: current <= config.max,
    limit: config.max,
    remaining,
    reset,
  }
}

// Main rate limiting function
export async function checkRateLimit(
  request: NextRequest,
  userId?: string
): Promise<{
  success: boolean
  limit: number
  remaining: number
  reset: number
  config: RateLimitConfig
}> {
  const { pathname } = new URL(request.url)
  const config = getRateLimitConfig(pathname)
  const key = generateRateLimitKey(request, config, userId)

  try {
    if (isRedisConfigured()) {
      // Use Upstash Redis rate limiting
      const limiter = getRateLimiter(config)
      const result = await limiter.limit(key)

      return {
        success: result.success,
        limit: result.limit,
        remaining: result.remaining,
        reset: result.reset,
        config,
      }
    } else {
      // Fallback to memory-based rate limiting
      console.warn('Redis not configured, using memory-based rate limiting')
      const result = await checkRateLimitMemory(key, config)

      return {
        ...result,
        config,
      }
    }
  } catch (error) {
    console.error('Rate limiting error:', error)

    // On error, allow the request but log the issue
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      reset: Date.now() + config.windowMs,
      config,
    }
  }
}

// Create rate limit exceeded response
export function createRateLimitResponse(
  config: RateLimitConfig,
  limit: number,
  remaining: number,
  reset: number
): NextResponse {
  const headers = createRateLimitHeaders(
    limit,
    remaining,
    reset,
    config.windowMs
  )

  const response = NextResponse.json(
    {
      error: 'Rate limit exceeded',
      message: config.message,
      retryAfter: Math.ceil((reset - Date.now()) / 1000),
    },
    { status: 429 }
  )

  // Add rate limit headers
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Add rate limit headers to successful responses
export function addRateLimitHeaders(
  response: NextResponse,
  limit: number,
  remaining: number,
  reset: number,
  windowMs: number
): NextResponse {
  const headers = createRateLimitHeaders(limit, remaining, reset, windowMs)

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  return response
}

// Rate limiting middleware for API routes
export async function withRateLimit<T>(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<T>,
  userId?: string
): Promise<T | NextResponse> {
  const rateLimitResult = await checkRateLimit(request, userId)

  if (!rateLimitResult.success) {
    // Log rate limit violation for monitoring
    console.warn('Rate limit exceeded:', {
      path: new URL(request.url).pathname,
      userId: userId || 'anonymous',
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      limit: rateLimitResult.limit,
      remaining: rateLimitResult.remaining,
      timestamp: new Date().toISOString(),
    })

    return createRateLimitResponse(
      rateLimitResult.config,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
  }

  // Execute the handler
  const result = await handler(request)

  // Add rate limit headers to successful responses
  if (result instanceof NextResponse) {
    return addRateLimitHeaders(
      result,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset,
      rateLimitResult.config.windowMs
    )
  }

  return result
}

// Utility function to check if a request should be rate limited
export function shouldRateLimit(pathname: string): boolean {
  // Skip rate limiting for static assets and Next.js internals
  const skipPatterns = [
    '/_next/',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
    '/manifest.json',
    '/.well-known/',
  ]

  return !skipPatterns.some(pattern => pathname.startsWith(pattern))
}

// Rate limiting middleware for Next.js middleware
export async function rateLimitMiddleware(
  request: NextRequest,
  userId?: string
): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl

  // Skip rate limiting for certain paths
  if (!shouldRateLimit(pathname)) {
    return null
  }

  // Only rate limit API routes
  if (!pathname.startsWith('/api/')) {
    return null
  }

  const rateLimitResult = await checkRateLimit(request, userId)

  if (!rateLimitResult.success) {
    // Log rate limit violation
    console.warn('Rate limit exceeded in middleware:', {
      path: pathname,
      userId: userId || 'anonymous',
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
      timestamp: new Date().toISOString(),
    })

    return createRateLimitResponse(
      rateLimitResult.config,
      rateLimitResult.limit,
      rateLimitResult.remaining,
      rateLimitResult.reset
    )
  }

  // Create response with rate limit headers
  const response = NextResponse.next()
  return addRateLimitHeaders(
    response,
    rateLimitResult.limit,
    rateLimitResult.remaining,
    rateLimitResult.reset,
    rateLimitResult.config.windowMs
  )
}
