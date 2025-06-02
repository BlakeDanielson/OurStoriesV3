/**
 * Security utilities and configurations for the application
 */

// Security headers configuration
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const

// Secure cookie options
export const getSecureCookieOptions = (overrides?: Record<string, any>) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
  ...overrides,
})

// Browser-specific cookie options (httpOnly: false for client access)
export const getBrowserCookieOptions = (overrides?: Record<string, any>) => ({
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
  ...overrides,
})

// HTTPS enforcement check
export const shouldEnforceHTTPS = (request: Request): boolean => {
  if (process.env.NODE_ENV !== 'production') return false

  const proto = request.headers.get('x-forwarded-proto')
  const host = request.headers.get('host')

  return proto === 'http' && !host?.includes('localhost')
}

// Content Security Policy
export const getContentSecurityPolicy = () => {
  const isDev = process.env.NODE_ENV === 'development'

  return [
    "default-src 'self'",
    `script-src 'self' ${isDev ? "'unsafe-eval'" : ''} 'unsafe-inline' https://vercel.live`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "media-src 'self' https:",
    "connect-src 'self' https: wss:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
} as const

// CORS configuration
export const CORS_CONFIG = {
  origin:
    process.env.NODE_ENV === 'production'
      ? ['https://ourstories.vercel.app', 'https://www.ourstories.app']
      : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
  ],
} as const

// CSRF protection configuration
export const CSRF_CONFIG = {
  cookieName: '__Host-csrf-token',
  headerName: 'x-csrf-token',
  formFieldName: '_csrf',
  secretLength: 32,
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  },
  // Paths that don't require CSRF protection
  skipPaths: [
    '/api/auth/',
    '/api/webhooks/',
    '/api/health',
    '/api/csrf-token', // Endpoint to get CSRF token
  ],
  // Methods that require CSRF protection
  protectedMethods: ['POST', 'PUT', 'PATCH', 'DELETE'],
} as const

// Security validation helpers
export const isValidOrigin = (origin: string | null): boolean => {
  if (!origin) return false

  const allowedOrigins = CORS_CONFIG.origin
  return Array.isArray(allowedOrigins)
    ? allowedOrigins.includes(origin)
    : allowedOrigins === origin
}

// Enhanced origin validation for CSRF protection
export const validateRequestOrigin = (request: Request): boolean => {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    return true // Allow same-origin requests
  }

  // Get allowed origins
  const allowedOrigins = [...CORS_CONFIG.origin]
  if (host) {
    allowedOrigins.push(`https://${host}`)
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(`http://${host}`)
    }
  }

  // Check origin
  if (origin && allowedOrigins.includes(origin)) {
    return true
  }

  // Check referer as fallback
  if (referer) {
    try {
      const refererUrl = new URL(referer)
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`
      return allowedOrigins.includes(refererOrigin)
    } catch {
      return false
    }
  }

  return false
}

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/[<>]/g, '') // Remove potential XSS characters
    .trim()
    .slice(0, 1000) // Limit length
}

// Environment-specific security settings
export const getSecurityConfig = () => ({
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  enforceHTTPS: process.env.NODE_ENV === 'production',
  enableCSP: true,
  enableRateLimit: true,
  enableCSRF: true,
  cookieSecure: process.env.NODE_ENV === 'production',
  sessionTimeout: 60 * 60 * 24 * 7, // 7 days in seconds
})
