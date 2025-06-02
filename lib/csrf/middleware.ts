import { NextRequest, NextResponse } from 'next/server'
import {
  validateCSRFToken,
  requiresCSRFProtection,
  createCSRFErrorResponse,
  generateCSRFTokenPair,
  getSecretFromRequest,
  generateToken,
  CSRF_CONFIG,
} from './tokens'

// CSRF middleware for protecting API routes
export async function csrfMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Check if this request needs CSRF protection
  if (!requiresCSRFProtection(request)) {
    return null // Continue to next middleware
  }

  // Validate CSRF token
  const isValid = await validateCSRFToken(request)

  if (!isValid) {
    console.warn('CSRF token validation failed:', {
      path: request.nextUrl.pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      timestamp: new Date().toISOString(),
    })

    return createCSRFErrorResponse()
  }

  // CSRF token is valid, continue
  return null
}

// Generate CSRF token for client-side use
export async function generateCSRFTokenForClient(
  request: NextRequest
): Promise<{ token: string | null; response: NextResponse }> {
  const response = NextResponse.next()

  // Check if we already have a secret
  const existingSecret = getSecretFromRequest(request)

  if (existingSecret) {
    // Generate token from existing secret
    const token = await generateToken(existingSecret)
    return { token, response }
  } else {
    // Generate new secret and token pair
    const { token } = await generateCSRFTokenPair(response)
    return { token, response }
  }
}

// Origin validation middleware
export function validateOrigin(request: NextRequest): boolean {
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  const host = request.headers.get('host')

  // For same-origin requests, origin might be null
  if (!origin && !referer) {
    // Allow requests without origin/referer for same-origin requests
    return true
  }

  // Get allowed origins from environment or default to current host
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || []
  if (host) {
    allowedOrigins.push(`https://${host}`)
    allowedOrigins.push(`http://${host}`) // For development
  }

  // Check origin
  if (origin) {
    return allowedOrigins.includes(origin)
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

// Enhanced CSRF middleware with origin validation
export async function enhancedCSRFMiddleware(
  request: NextRequest
): Promise<NextResponse | null> {
  // Skip CSRF protection for safe methods and excluded paths
  if (!requiresCSRFProtection(request)) {
    return null
  }

  // Validate origin for state-changing requests
  if (!validateOrigin(request)) {
    console.warn('Origin validation failed:', {
      path: request.nextUrl.pathname,
      method: request.method,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      host: request.headers.get('host'),
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json(
      {
        error: 'Origin validation failed',
        message: 'Request origin is not allowed',
        code: 'INVALID_ORIGIN',
      },
      { status: 403 }
    )
  }

  // Validate CSRF token
  return await csrfMiddleware(request)
}

// API Route wrapper for CSRF protection
export function withCSRFProtection(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async function protectedHandler(
    request: NextRequest
  ): Promise<NextResponse> {
    // Check if this request needs CSRF protection
    if (!requiresCSRFProtection(request)) {
      return handler(request)
    }

    // Validate CSRF token
    const isValid = await validateCSRFToken(request)

    if (!isValid) {
      console.warn('CSRF token validation failed in API route:', {
        path: request.nextUrl?.pathname || request.url,
        method: request.method,
        timestamp: new Date().toISOString(),
      })

      return createCSRFErrorResponse()
    }

    // CSRF token is valid, proceed with the original handler
    return handler(request)
  }
}

// Utility to add CSRF token to API responses
export async function addCSRFTokenToResponse(
  response: NextResponse,
  request: NextRequest
): Promise<NextResponse> {
  const { token } = await generateCSRFTokenForClient(request)

  if (token) {
    response.headers.set('X-CSRF-Token', token)
  }

  return response
}

// Check if request has valid CSRF setup (for debugging)
export function debugCSRFSetup(request: NextRequest): {
  hasSecret: boolean
  hasToken: boolean
  tokenLocation: string | null
  requiresProtection: boolean
} {
  const hasSecret = !!getSecretFromRequest(request)
  const headerToken = request.headers.get(CSRF_CONFIG.headerName)

  return {
    hasSecret,
    hasToken: !!headerToken,
    tokenLocation: headerToken ? 'header' : null,
    requiresProtection: requiresCSRFProtection(request),
  }
}
