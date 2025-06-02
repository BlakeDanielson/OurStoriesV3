import { createMiddlewareSupabaseClient } from '@/lib/supabase-server'
import { NextRequest, NextResponse } from 'next/server'
import {
  isPublicRoute,
  isAuthRoute,
  authenticateMiddlewareRequest,
} from '@/lib/auth/middleware'
import { SECURITY_HEADERS, shouldEnforceHTTPS } from '@/lib/utils/security'
import { rateLimitMiddleware } from '@/lib/rate-limiting/middleware'
import { enhancedCSRFMiddleware } from '@/lib/csrf/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // HTTPS Enforcement - redirect HTTP to HTTPS in production
  if (shouldEnforceHTTPS(request)) {
    const httpsUrl = new URL(request.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 301)
  }

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Check if the current path is public
  const isPublic = isPublicRoute(pathname)
  const isAuth = isAuthRoute(pathname)

  // Get authentication status
  const authResult = await authenticateMiddlewareRequest(request, response)
  const isAuthenticated = authResult.isAuthenticated
  const user = authResult.user

  // Apply rate limiting for API routes
  const rateLimitResponse = await rateLimitMiddleware(request, user?.id)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Apply CSRF protection for API routes
  const csrfResponse = await enhancedCSRFMiddleware(request)
  if (csrfResponse) {
    return csrfResponse
  }

  // If user is not authenticated and trying to access protected route
  if (!isAuthenticated && !isPublic) {
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // If user is authenticated and trying to access auth pages (except callback), redirect to dashboard
  if (isAuthenticated && isAuth) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Add user info to response headers for debugging (optional)
  if (isAuthenticated && user) {
    response.headers.set('x-user-id', user.id)
    response.headers.set('x-user-email', user.email || '')
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
