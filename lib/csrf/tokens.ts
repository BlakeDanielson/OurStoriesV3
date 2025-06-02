import { NextRequest, NextResponse } from 'next/server'

// CSRF configuration
export const CSRF_CONFIG = {
  cookieName: '__Host-csrf-token',
  headerName: 'x-csrf-token',
  secretLength: 32,
  tokenLength: 32,
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  },
}

// Generate a cryptographically secure random string
function generateRandomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  return Array.from(array, byte => chars[byte % chars.length]).join('')
}

// Simple HMAC-based token generation (Edge Runtime compatible)
async function hmacSign(secret: string, data: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Verify HMAC signature
async function hmacVerify(
  secret: string,
  data: string,
  signature: string
): Promise<boolean> {
  try {
    const expectedSignature = await hmacSign(secret, data)
    return expectedSignature === signature
  } catch {
    return false
  }
}

// Generate a new CSRF secret
export function generateSecret(): string {
  return generateRandomString(CSRF_CONFIG.secretLength)
}

// Generate a CSRF token from a secret
export async function generateToken(secret: string): Promise<string> {
  const timestamp = Date.now().toString()
  const randomPart = generateRandomString(16)
  const data = `${timestamp}:${randomPart}`
  const signature = await hmacSign(secret, data)

  // Combine data and signature
  return `${data}:${signature}`
}

// Verify a CSRF token against a secret
export async function verifyToken(
  secret: string,
  token: string
): Promise<boolean> {
  try {
    const parts = token.split(':')
    if (parts.length !== 3) return false

    const [timestamp, randomPart, signature] = parts
    const data = `${timestamp}:${randomPart}`

    // Check if token is expired (24 hours)
    const tokenTime = parseInt(timestamp)
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    if (now - tokenTime > maxAge) {
      return false
    }

    return await hmacVerify(secret, data, signature)
  } catch {
    return false
  }
}

// Extract CSRF token from request headers
export async function getTokenFromRequest(
  request: NextRequest
): Promise<string | null> {
  // Check custom header first
  const headerToken = request.headers.get(CSRF_CONFIG.headerName)
  if (headerToken) {
    return headerToken
  }

  // Check form data for POST requests
  if (request.method === 'POST') {
    try {
      const formData = await request.formData()
      return (formData.get('_csrf') as string) || null
    } catch {
      // If not form data, try JSON body
      try {
        const body = await request.json()
        return body._csrf || null
      } catch {
        return null
      }
    }
  }

  return null
}

// Extract CSRF secret from request cookies
export function getSecretFromRequest(request: NextRequest): string | null {
  return request.cookies.get(CSRF_CONFIG.cookieName)?.value || null
}

// Set CSRF cookie in response
export function setCSRFCookie(response: NextResponse, secret: string): void {
  response.cookies.set(
    CSRF_CONFIG.cookieName,
    secret,
    CSRF_CONFIG.cookieOptions
  )
}

// Generate and set new CSRF token pair
export async function generateCSRFTokenPair(
  response: NextResponse
): Promise<{ secret: string; token: string }> {
  const secret = generateSecret()
  const token = await generateToken(secret)

  setCSRFCookie(response, secret)

  return { secret, token }
}

// Validate CSRF token from request
export async function validateCSRFToken(
  request: NextRequest
): Promise<boolean> {
  const secret = getSecretFromRequest(request)

  if (!secret) {
    return false
  }

  let token: string | null = null

  // Get token from header
  token = request.headers.get(CSRF_CONFIG.headerName)

  // If not in header, try to get from body (but don't consume the original request)
  if (
    !token &&
    (request.method === 'POST' ||
      request.method === 'PUT' ||
      request.method === 'PATCH')
  ) {
    try {
      const contentType = request.headers.get('content-type') || ''

      if (contentType.includes('application/json')) {
        // Clone the request to avoid consuming the original body
        const clonedRequest = request.clone()
        const body = await clonedRequest.json()
        token = body._csrf
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // Clone the request to avoid consuming the original body
        const clonedRequest = request.clone()
        const formData = await clonedRequest.formData()
        token = formData.get('_csrf') as string
      }
    } catch (error) {
      console.warn('Failed to parse request body for CSRF token:', error)
      return false
    }
  }

  if (!token) {
    return false
  }

  return await verifyToken(secret, token)
}

// Check if request needs CSRF protection
export function requiresCSRFProtection(request: NextRequest): boolean {
  const { pathname } = request.nextUrl
  const method = request.method

  // Only protect state-changing methods
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return false
  }

  // Skip CSRF for certain API endpoints that use other authentication
  const skipPaths = [
    '/api/auth/', // Authentication endpoints
    '/api/webhooks/', // Webhook endpoints
    '/api/health', // Health check
    '/api/csrf-token', // CSRF token endpoint
  ]

  return !skipPaths.some(path => pathname.startsWith(path))
}

// Create CSRF error response
export function createCSRFErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'CSRF token validation failed',
      message:
        'Invalid or missing CSRF token. Please refresh the page and try again.',
      code: 'CSRF_TOKEN_INVALID',
    },
    { status: 403 }
  )
}
