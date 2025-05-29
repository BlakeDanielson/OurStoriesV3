# Supabase Authentication Setup

## Overview

OurStories uses Supabase Auth as the complete authentication solution, replacing NextAuth.js for a more integrated approach with our Supabase backend.

## Authentication Architecture

### Core Components

1. **Supabase Auth Service** (`lib/auth.ts`)

   - Client-side and server-side authentication utilities
   - Email/password and OAuth provider support
   - Session management and user profile integration

2. **React Hook** (`lib/hooks/useAuth.ts`)

   - React hook for managing authentication state
   - Automatic user profile fetching
   - Real-time auth state updates

3. **Middleware** (`middleware.ts`)

   - Route protection and authentication checks
   - Automatic redirects for authenticated/unauthenticated users
   - Session refresh handling

4. **Auth Pages**
   - Sign-in page with email/password and OAuth options
   - Sign-up page with user profile creation
   - Password reset and callback handling

## Authentication Flow

### Sign Up Process

1. User submits email/password or uses OAuth provider
2. Supabase Auth creates user in `auth.users` table
3. `handle_new_user()` trigger automatically creates profile in `users` table
4. User is redirected to dashboard

### Sign In Process

1. User authenticates via email/password or OAuth
2. Supabase Auth validates credentials and creates session
3. Client receives session with access/refresh tokens
4. User profile is fetched from `users` table
5. User is redirected to intended destination

### Session Management

- Automatic token refresh handled by Supabase client
- Session state synchronized across browser tabs
- Server-side session validation in middleware
- Secure cookie-based session storage

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://dpwkarpiiprdjwsxkodv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### OAuth Providers Setup

#### Google OAuth

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials:
   - Client ID from Google Cloud Console
   - Client Secret from Google Cloud Console
4. Configure redirect URLs:
   - Development: `http://localhost:3000/auth/callback`
   - Production: `https://yourdomain.com/auth/callback`

#### GitHub OAuth

1. Enable GitHub provider in Supabase Dashboard
2. Add GitHub OAuth App credentials:
   - Client ID from GitHub Developer Settings
   - Client Secret from GitHub Developer Settings
3. Configure redirect URLs in GitHub OAuth App

### Email Templates

Customize email templates in Supabase Dashboard → Authentication → Email Templates:

- Confirmation email
- Password reset email
- Magic link email

## API Reference

### Client-side Auth (`lib/auth.ts`)

```typescript
import { auth } from '@/lib/auth'

// Sign up with email/password
const { data, error } = await auth.signUp(email, password, {
  full_name: 'John Doe',
})

// Sign in with email/password
const { data, error } = await auth.signIn(email, password)

// Sign in with OAuth
const { data, error } = await auth.signInWithProvider('google')

// Sign out
const { error } = await auth.signOut()

// Get current user
const { user, error } = await auth.getUser()

// Reset password
const { data, error } = await auth.resetPassword(email)

// Listen to auth changes
const subscription = auth.onAuthStateChange((event, session) => {
  console.log('Auth event:', event, session)
})
```

### Server-side Auth (`lib/auth.ts`)

```typescript
import { serverAuth } from '@/lib/auth'

// Get authenticated user (server-side)
const { user, error } = await serverAuth.getUser()

// Get user profile from database
const { user, error } = await serverAuth.getUserProfile()

// Require authentication (throws if not authenticated)
const user = await serverAuth.requireAuth()

// Require user profile (throws if not found)
const userProfile = await serverAuth.requireUserProfile()
```

### React Hook (`lib/hooks/useAuth.ts`)

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

function MyComponent() {
  const {
    user,           // Supabase auth user
    userProfile,    // Database user profile
    session,        // Current session
    loading,        // Loading state
    error,          // Error state
    isAuthenticated,// Boolean auth status
    signOut,        // Sign out function
    refreshUserProfile // Refresh profile function
  } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!isAuthenticated) return <div>Please sign in</div>

  return <div>Welcome, {userProfile?.full_name}!</div>
}
```

## Route Protection

### Middleware Configuration

The middleware automatically protects routes and handles redirects:

```typescript
// Public routes (no authentication required)
const publicRoutes = [
  '/',
  '/auth/signin',
  '/auth/signup',
  '/auth/callback',
  '/auth/error',
  '/auth/reset-password',
]

// All other routes require authentication
```

### Manual Route Protection

For additional protection in pages or API routes:

```typescript
// In a page component
import { serverAuth } from '@/lib/auth'

export default async function ProtectedPage() {
  const userProfile = await serverAuth.requireUserProfile()

  return <div>Welcome, {userProfile.full_name}!</div>
}

// In an API route
import { serverAuth } from '@/lib/auth'

export async function GET() {
  try {
    const user = await serverAuth.requireAuth()
    // Handle authenticated request
  } catch (error) {
    return new Response('Unauthorized', { status: 401 })
  }
}
```

## Database Integration

### User Profile Creation

The `handle_new_user()` database function automatically creates a user profile when a new user signs up:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Row Level Security Integration

RLS policies use `auth.uid()` to ensure users can only access their own data:

```sql
-- Example RLS policy
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);
```

## Security Features

### Session Security

- Secure HTTP-only cookies for session storage
- Automatic token refresh
- Session expiration handling
- CSRF protection via SameSite cookies

### Password Security

- Minimum password requirements enforced by Supabase
- Secure password hashing (bcrypt)
- Password reset via secure email links
- Rate limiting on authentication attempts

### OAuth Security

- State parameter validation
- Secure redirect URL validation
- Token exchange via secure backend
- Provider-specific security measures

## Error Handling

### Common Error Scenarios

```typescript
// Invalid credentials
if (error?.message === 'Invalid login credentials') {
  // Handle invalid login
}

// Email not confirmed
if (error?.message === 'Email not confirmed') {
  // Prompt user to check email
}

// Rate limiting
if (error?.message?.includes('rate limit')) {
  // Handle rate limiting
}

// Network errors
if (error?.message?.includes('network')) {
  // Handle network issues
}
```

### Error Boundaries

Implement error boundaries for authentication errors:

```typescript
import { useAuth } from '@/lib/hooks/useAuth'

function AuthErrorBoundary({ children }) {
  const { error } = useAuth()

  if (error) {
    return <div>Authentication error: {error}</div>
  }

  return children
}
```

## Testing

### Authentication Testing

```typescript
// Mock authentication for testing
jest.mock('@/lib/auth', () => ({
  auth: {
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  serverAuth: {
    getUser: jest.fn(),
    getUserProfile: jest.fn(),
  },
}))
```

### Integration Testing

Test authentication flows with Playwright:

```typescript
// Test sign-in flow
test('user can sign in', async ({ page }) => {
  await page.goto('/auth/signin')
  await page.fill('[data-testid=email]', 'test@example.com')
  await page.fill('[data-testid=password]', 'password123')
  await page.click('[data-testid=signin-button]')
  await expect(page).toHaveURL('/dashboard')
})
```

## Migration from NextAuth.js

### Key Differences

1. **Session Management**: Supabase handles sessions natively
2. **Database Integration**: Direct integration with Supabase database
3. **OAuth Providers**: Configured in Supabase Dashboard
4. **Middleware**: Simplified with Supabase client
5. **Type Safety**: Full TypeScript support with generated types

### Migration Steps

1. ✅ Remove NextAuth.js dependencies
2. ✅ Implement Supabase Auth utilities
3. ✅ Create authentication pages
4. ✅ Set up middleware for route protection
5. ✅ Update database schema for user profiles
6. ✅ Configure OAuth providers in Supabase
7. 🔄 Test authentication flows
8. 🔄 Update existing components to use new auth system

## Best Practices

### Security

- Always validate user sessions on the server side
- Use RLS policies for database access control
- Implement proper error handling for auth failures
- Regular security audits of authentication flow

### Performance

- Cache user profiles appropriately
- Use server-side rendering for authenticated pages
- Implement proper loading states
- Optimize auth state management

### User Experience

- Provide clear error messages
- Implement proper loading indicators
- Handle offline scenarios gracefully
- Maintain auth state across page refreshes

## Troubleshooting

### Common Issues

1. **Session not persisting**: Check cookie configuration
2. **OAuth redirect errors**: Verify redirect URLs in provider settings
3. **RLS policy errors**: Ensure policies are correctly configured
4. **Token refresh failures**: Check network connectivity and Supabase status

### Debug Tools

- Supabase Dashboard logs
- Browser developer tools (Network, Application tabs)
- Server-side logging for auth errors
- Supabase Auth debug mode in development
