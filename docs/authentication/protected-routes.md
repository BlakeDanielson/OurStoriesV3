# Protected Route Middleware with Supabase Auth

This guide covers the implementation and usage of protected route middleware in the ourStories application, providing authentication for both page routes and API endpoints.

## Overview

The protected route system includes:

- Middleware for page route protection
- API route authentication utilities
- Role-based access control
- Automatic redirects for unauthorized access
- Session management and refresh

## Architecture

### Core Components

1. **Middleware (`middleware.ts`)**: Protects page routes at the edge
2. **Auth Utilities (`lib/auth/middleware.ts`)**: Reusable authentication functions
3. **Supabase Clients (`lib/supabase.ts`)**: Different clients for different contexts

### Authentication Flow

```
Request → Middleware → Auth Check → Route/Redirect
                   ↓
              API Route → Auth Utility → Response
```

## Middleware Implementation

### Page Route Protection

The main middleware (`middleware.ts`) handles:

```typescript
import {
  isPublicRoute,
  isAuthRoute,
  authenticateMiddlewareRequest,
} from '@/lib/auth/middleware'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // Check route type
  const isPublic = isPublicRoute(pathname)
  const isAuth = isAuthRoute(pathname)

  // Get authentication status
  const authResult = await authenticateMiddlewareRequest(request, response)
  const isAuthenticated = authResult.isAuthenticated

  // Redirect logic
  if (!isAuthenticated && !isPublic) {
    // Redirect to sign-in with return URL
    const redirectUrl = new URL('/auth/signin', request.url)
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthenticated && isAuth) {
    // Redirect authenticated users away from auth pages
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}
```

### Public Routes Configuration

Public routes that don't require authentication:

```typescript
export function getPublicRoutes(): string[] {
  return [
    '/', // Landing page
    '/auth/signin', // Sign in page
    '/auth/signup', // Sign up page
    '/auth/callback', // OAuth callback
    '/auth/error', // Auth error page
    '/auth/reset-password', // Password reset
    '/auth/update-password', // Password update (for reset flow)
    '/api/auth', // Auth-related API endpoints
  ]
}
```

### Matcher Configuration

The middleware runs on all routes except static assets:

```typescript
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

## API Route Protection

### Basic Authentication

Use `protectApiRoute` for simple authentication:

```typescript
import { protectApiRoute } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  // Authenticate user
  const { user, response: authResponse } = await protectApiRoute(request)

  if (authResponse) {
    return authResponse // Returns 401 if not authenticated
  }

  // User is authenticated, proceed with logic
  console.log('Authenticated user:', user.id)

  // Your API logic here...
}
```

### Role-Based Access Control

Protect routes with specific roles:

```typescript
export async function DELETE(request: NextRequest) {
  // Only allow admins to delete
  const { user, response: authResponse } = await protectApiRoute(request, {
    allowedRoles: ['admin', 'moderator'],
  })

  if (authResponse) {
    return authResponse // Returns 401/403 based on issue
  }

  // User has required role, proceed
}
```

### Custom Configuration

Full configuration options:

```typescript
const { user, response } = await protectApiRoute(request, {
  requireAuth: true, // Default: true
  allowedRoles: ['admin'], // Optional: role checking
  redirectTo: '/auth/signin', // Custom redirect (not used in API)
})
```

## Authentication Utilities

### Core Functions

#### `authenticateApiRequest(request: NextRequest)`

Authenticates API requests and returns user data:

```typescript
const authResult = await authenticateApiRequest(request)

if (authResult.isAuthenticated) {
  console.log('User:', authResult.user)
} else {
  console.log('Error:', authResult.error)
}
```

#### `authenticateMiddlewareRequest(request, response)`

Authenticates middleware requests with session data:

```typescript
const authResult = await authenticateMiddlewareRequest(request, response)

if (authResult.isAuthenticated) {
  console.log('User:', authResult.user)
  console.log('Session:', authResult.session)
}
```

### Response Helpers

#### Unauthorized Response (401)

```typescript
import { createUnauthorizedResponse } from '@/lib/auth/middleware'

return createUnauthorizedResponse('Custom message')
```

#### Forbidden Response (403)

```typescript
import { createForbiddenResponse } from '@/lib/auth/middleware'

return createForbiddenResponse('Insufficient permissions')
```

### Role Checking

```typescript
import { hasRequiredRole } from '@/lib/auth/middleware'

const canAccess = hasRequiredRole(user, ['admin', 'editor'])
```

## User Roles

### Role Sources

User roles are checked in this order:

1. `user.app_metadata.role` (set by admin)
2. `user.user_metadata.role` (set by user)
3. Default: `'user'`

### Setting Roles

Roles are typically set in Supabase:

```sql
-- Update user role in app_metadata (admin only)
UPDATE auth.users
SET app_metadata = app_metadata || '{"role": "admin"}'::jsonb
WHERE id = 'user-id';
```

### Common Roles

- `user`: Default role for regular users
- `admin`: Full system access
- `moderator`: Content moderation access
- `editor`: Content editing access

## Error Handling

### Authentication Errors

The system handles various authentication scenarios:

```typescript
// No session/token
{ error: 'No active session', isAuthenticated: false }

// Invalid token
{ error: 'Unauthorized', isAuthenticated: false }

// Insufficient permissions
{ error: 'Insufficient permissions', isAuthenticated: false }
```

### Automatic Redirects

- **Unauthenticated users**: Redirected to `/auth/signin?redirectTo=<original-path>`
- **Authenticated users on auth pages**: Redirected to `/dashboard`
- **API routes**: Return JSON error responses (no redirects)

## Testing

### Manual Testing

1. **Test protected routes:**

   ```bash
   # Should redirect to sign-in
   curl http://localhost:3000/dashboard

   # Should allow access
   curl http://localhost:3000/
   ```

2. **Test API authentication:**

   ```bash
   # Should return 401
   curl -X POST http://localhost:3000/api/images/upload

   # With valid session cookie
   curl -X POST http://localhost:3000/api/images/upload \
     -H "Cookie: sb-access-token=..."
   ```

### Automated Testing

Example test for protected API route:

```typescript
import { createMocks } from 'node-mocks-http'
import { POST } from '@/app/api/protected/route'

describe('/api/protected', () => {
  it('should return 401 for unauthenticated requests', async () => {
    const { req } = createMocks({ method: 'POST' })
    const response = await POST(req)

    expect(response.status).toBe(401)
  })
})
```

## Security Considerations

### Session Security

1. **Automatic refresh**: Sessions are refreshed in middleware
2. **Secure cookies**: Supabase handles secure cookie settings
3. **CSRF protection**: Built into Supabase auth

### Best Practices

1. **Validate ownership**: Always check if user owns resources
2. **Use least privilege**: Grant minimum required permissions
3. **Log security events**: Monitor authentication failures
4. **Rate limiting**: Implement rate limiting for sensitive endpoints

### Example Ownership Check

```typescript
// Verify user owns the resource
const { data: book, error } = await supabase
  .from('books')
  .select('id, child_profiles!inner(parent_id)')
  .eq('id', bookId)
  .single()

if (error || !book || book.child_profiles.parent_id !== user.id) {
  return createForbiddenResponse('Access denied')
}
```

## Debugging

### Debug Headers

The middleware adds debug headers in development:

```typescript
// Added to response headers
response.headers.set('x-user-id', user.id)
response.headers.set('x-user-email', user.email || '')
```

### Logging

Enable debug logging:

```typescript
console.log('Auth result:', authResult)
console.log('User roles:', user.app_metadata?.role)
console.log('Session expires:', session.expires_at)
```

### Common Issues

1. **Middleware not running**: Check matcher configuration
2. **Session not found**: Verify cookie settings
3. **Role check failing**: Check role metadata structure
4. **Redirect loops**: Verify public route configuration

## Migration Guide

### From Manual Auth Checks

**Before:**

```typescript
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // API logic...
}
```

**After:**

```typescript
export async function POST(request: NextRequest) {
  const { user, response: authResponse } = await protectApiRoute(request)

  if (authResponse) {
    return authResponse
  }

  // API logic...
}
```

### Benefits of New System

- **Consistency**: Same auth logic across all routes
- **Maintainability**: Centralized auth utilities
- **Features**: Built-in role checking and error handling
- **Type Safety**: Full TypeScript support
- **Testing**: Easier to mock and test

## Performance

### Middleware Performance

- **Edge execution**: Runs at CDN edge for fast response
- **Session caching**: Supabase handles session caching
- **Minimal overhead**: Only runs auth check when needed

### API Route Performance

- **Reusable clients**: Supabase clients are efficiently created
- **Early returns**: Authentication failures return immediately
- **Connection pooling**: Database connections are pooled

## Production Deployment

### Environment Variables

Required environment variables:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Monitoring

Monitor authentication metrics:

- Authentication success/failure rates
- Protected route access patterns
- Session refresh frequency
- Role-based access usage

---

_Last updated: [Current Date]_
_Version: 1.0_
