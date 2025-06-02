export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message: string // Error message when limit exceeded
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (request: Request) => string
}

// Rate limiting configurations for different endpoint types
export const RATE_LIMIT_CONFIGS = {
  // Authentication endpoints (login, signup, password reset)
  auth: {
    windowMs: 60 * 1000, // 1 minute
    max: 5, // 5 attempts per minute
    message: 'Too many authentication attempts. Please try again in 1 minute.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // AI generation endpoints (story/image generation)
  aiGeneration: {
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 generations per minute
    message:
      'Too many AI generation requests. Please wait before generating more content.',
    skipSuccessfulRequests: false,
    skipFailedRequests: true, // Don't count failed requests against limit
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20, // 20 uploads per hour
    message: 'Upload limit exceeded. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },

  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests. Please try again later.',
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },

  // Admin endpoints (more restrictive)
  admin: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 requests per minute
    message: 'Admin rate limit exceeded. Please slow down.',
    skipSuccessfulRequests: false,
    skipFailedRequests: false,
  },

  // Feedback endpoints
  feedback: {
    windowMs: 60 * 1000, // 1 minute
    max: 20, // 20 feedback submissions per minute
    message:
      'Too many feedback submissions. Please wait before submitting more.',
    skipSuccessfulRequests: false,
    skipFailedRequests: true,
  },
} as const

// Endpoint patterns and their corresponding rate limit configs
export const ENDPOINT_RATE_LIMITS: Record<
  string,
  keyof typeof RATE_LIMIT_CONFIGS
> = {
  '/api/auth': 'auth',
  '/api/books/generate': 'aiGeneration',
  '/api/images': 'aiGeneration',
  '/api/uploadthing': 'upload',
  '/api/admin': 'admin',
  '/api/feedback': 'feedback',
}

// Default rate limit for unmatched endpoints
export const DEFAULT_RATE_LIMIT: keyof typeof RATE_LIMIT_CONFIGS = 'api'

// Get rate limit config for a given path
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Find the most specific matching pattern
  const matchingPattern = Object.keys(ENDPOINT_RATE_LIMITS)
    .filter(pattern => pathname.startsWith(pattern))
    .sort((a, b) => b.length - a.length)[0] // Longest match first

  const configKey = matchingPattern
    ? ENDPOINT_RATE_LIMITS[matchingPattern]
    : DEFAULT_RATE_LIMIT

  return RATE_LIMIT_CONFIGS[configKey]
}

// Generate rate limit key based on IP and user ID
export function generateRateLimitKey(
  request: Request,
  config: RateLimitConfig,
  userId?: string
): string {
  // Use custom key generator if provided
  if (config.keyGenerator) {
    return config.keyGenerator(request)
  }

  // Get IP address from various headers
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'

  // Create key based on IP and optionally user ID
  const baseKey = userId ? `user:${userId}` : `ip:${ip}`
  const url = new URL(request.url)
  const endpoint = url.pathname

  return `ratelimit:${baseKey}:${endpoint}`
}

// Rate limit response headers
export interface RateLimitHeaders {
  'X-RateLimit-Limit': string
  'X-RateLimit-Remaining': string
  'X-RateLimit-Reset': string
  'X-RateLimit-Window': string
}

export function createRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: number,
  windowMs: number
): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': limit.toString(),
    'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
    'X-RateLimit-Reset': Math.ceil(resetTime / 1000).toString(), // Unix timestamp
    'X-RateLimit-Window': Math.ceil(windowMs / 1000).toString(), // Window in seconds
  }
}
