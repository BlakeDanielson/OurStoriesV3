import { NextRequest, NextResponse } from 'next/server'
import {
  createServerSupabaseClient,
  createMiddlewareSupabaseClient,
} from '@/lib/supabase-server'
import { createAuthMiddlewareClient } from '@/lib/auth/supabase-server'
import type { User, Session } from '@supabase/supabase-js'
import type {
  AuthMiddlewareResult,
  RouteConfig,
  UserRole,
} from '@/lib/types/auth'

/**
 * Extended auth middleware result with session
 */
interface AuthMiddlewareWithSession extends AuthMiddlewareResult {
  session?: Session
}

/**
 * Authentication result interface
 */
export interface AuthResult {
  user: User | null
  error: string | null
  isAuthenticated: boolean
}

/**
 * Authenticate user in API routes
 * Returns user data or null if not authenticated
 */
export async function authenticateApiRequest(
  request: NextRequest
): Promise<AuthMiddlewareResult> {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      return {
        user: null,
        error: error?.message || 'Unauthorized',
        isAuthenticated: false,
      }
    }

    return {
      user,
      error: null,
      isAuthenticated: true,
    }
  } catch (error) {
    return {
      user: null,
      error: 'Authentication failed',
      isAuthenticated: false,
    }
  }
}

/**
 * Authenticate user in middleware
 * Returns user data and session information
 */
export async function authenticateMiddlewareRequest(
  request: NextRequest,
  response: NextResponse
): Promise<AuthMiddlewareWithSession> {
  try {
    const supabase = createMiddlewareSupabaseClient(request, response)
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error || !session) {
      return {
        user: null,
        session: undefined,
        error: error?.message || 'No active session',
        isAuthenticated: false,
      }
    }

    // Get user from session
    const user = session.user

    if (!user) {
      return {
        user: null,
        session: undefined,
        error: 'No user in session',
        isAuthenticated: false,
      }
    }

    return {
      user,
      session,
      error: null,
      isAuthenticated: true,
    }
  } catch (error) {
    return {
      user: null,
      session: undefined,
      error: 'Authentication failed',
      isAuthenticated: false,
    }
  }
}

/**
 * Create unauthorized response for API routes
 */
export function createUnauthorizedResponse(
  message: string = 'Unauthorized'
): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

/**
 * Create forbidden response for API routes
 */
export function createForbiddenResponse(
  message: string = 'Forbidden'
): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(user: User, allowedRoles: UserRole[]): boolean {
  if (!allowedRoles || allowedRoles.length === 0) {
    return true
  }

  // Get user role from metadata or app_metadata
  const userRole =
    user.app_metadata?.role || user.user_metadata?.role || 'parent'

  return allowedRoles.includes(userRole as UserRole)
}

/**
 * Protect API route with authentication and optional role checking
 */
export async function protectApiRoute(
  request: NextRequest,
  config: RouteConfig = {}
): Promise<{ user: User; response?: NextResponse }> {
  const { requireAuth = true, allowedRoles, redirectTo } = config

  if (!requireAuth) {
    return { user: null as any }
  }

  const authResult = await authenticateApiRequest(request)

  if (!authResult.isAuthenticated || !authResult.user) {
    return {
      user: null as any,
      response: createUnauthorizedResponse(
        authResult.error || 'Authentication required'
      ),
    }
  }

  // Check role-based access if roles are specified
  if (allowedRoles && !hasRequiredRole(authResult.user, allowedRoles)) {
    return {
      user: authResult.user,
      response: createForbiddenResponse('Insufficient permissions'),
    }
  }

  return { user: authResult.user }
}

/**
 * Enhanced route protection for middleware
 */
export async function protectRoute(
  request: NextRequest,
  response: NextResponse,
  config: RouteConfig = {}
): Promise<{ user: User | null; redirect?: NextResponse }> {
  const { requireAuth = true, redirectTo = '/auth/signin' } = config

  if (!requireAuth) {
    return { user: null }
  }

  const authResult = await authenticateMiddlewareRequest(request, response)

  if (!authResult.isAuthenticated || !authResult.user) {
    const redirectUrl = new URL(redirectTo, request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)

    return {
      user: null,
      redirect: NextResponse.redirect(redirectUrl),
    }
  }

  return { user: authResult.user }
}

/**
 * Get public routes configuration
 */
export function getPublicRoutes(): string[] {
  return [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/callback',
    '/auth/error',
    '/auth/reset-password',
    '/auth/update-password', // Allow access for password reset flow
    '/auth/verify-email', // Allow access for email verification
    '/api/auth', // Auth-related API endpoints
  ]
}

/**
 * Check if route is public
 */
export function isPublicRoute(pathname: string): boolean {
  const publicRoutes = getPublicRoutes()
  return publicRoutes.some(route => pathname.startsWith(route))
}

/**
 * Check if route is auth-related
 */
export function isAuthRoute(pathname: string): boolean {
  return pathname.startsWith('/auth/') && pathname !== '/auth/callback'
}
