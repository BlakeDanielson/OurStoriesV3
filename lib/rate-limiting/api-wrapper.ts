import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit } from './middleware'
import { protectApiRoute } from '@/lib/auth/middleware'
import { UserRole } from '@/lib/types/auth'

// API route handler type
type ApiHandler = (request: NextRequest) => Promise<NextResponse>

// Options for API route protection
interface ApiRouteOptions {
  requireAuth?: boolean
  allowedRoles?: UserRole[]
  skipRateLimit?: boolean
}

// Wrapper that combines authentication and rate limiting
export function createProtectedApiRoute(
  handler: ApiHandler,
  options: ApiRouteOptions = {}
): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    const { requireAuth = true, allowedRoles, skipRateLimit = false } = options

    // Apply authentication if required
    if (requireAuth) {
      const authResult = await protectApiRoute(request, {
        requireAuth,
        allowedRoles,
      })

      if (authResult.response) {
        return authResult.response
      }

      // Apply rate limiting with user context
      if (!skipRateLimit) {
        return withRateLimit(
          request,
          handler,
          authResult.user.id
        ) as Promise<NextResponse>
      }

      return handler(request)
    }

    // Apply rate limiting without user context
    if (!skipRateLimit) {
      return withRateLimit(request, handler) as Promise<NextResponse>
    }

    return handler(request)
  }
}

// Simple rate limiting wrapper (no auth)
export function createRateLimitedApiRoute(handler: ApiHandler): ApiHandler {
  return async (request: NextRequest): Promise<NextResponse> => {
    return withRateLimit(request, handler) as Promise<NextResponse>
  }
}

// Wrapper for public API routes with rate limiting
export function createPublicApiRoute(handler: ApiHandler): ApiHandler {
  return createProtectedApiRoute(handler, {
    requireAuth: false,
    skipRateLimit: false,
  })
}

// Wrapper for admin API routes with strict rate limiting
export function createAdminApiRoute(handler: ApiHandler): ApiHandler {
  return createProtectedApiRoute(handler, {
    requireAuth: true,
    allowedRoles: ['admin'],
    skipRateLimit: false,
  })
}
