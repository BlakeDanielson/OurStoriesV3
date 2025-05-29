# TypeScript Integration and Type Safety

This document outlines the comprehensive TypeScript integration for the authentication system, ensuring type safety across all authentication flows.

## Overview

The authentication system is fully typed with TypeScript, providing:

- **Type-safe auth operations** with proper error handling
- **Database schema integration** with generated types
- **Comprehensive type guards** and utilities
- **Enhanced developer experience** with IntelliSense support
- **Runtime type validation** for critical operations

## Type Structure

### Core Types

#### Auth State Types

```typescript
import type { AuthState, AuthContextType } from '@/lib/types/auth'

// Auth state with user and session information
interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

// Combined context type with actions
type AuthContextType = AuthState & AuthActions
```

#### Auth Result Types

```typescript
import type { AuthResult } from '@/lib/types/auth'

// Standardized result type for all auth operations
interface AuthResult {
  success: boolean
  error?: string
  user?: User
  session?: Session
}
```

#### Database Integration Types

```typescript
import type { DatabaseUser, AuthenticatedUser } from '@/lib/types/auth'

// Database user type from schema
type DatabaseUser = Database['public']['Tables']['users']['Row']

// Enhanced user type with profile
interface AuthenticatedUser extends User {
  profile?: DatabaseUser
}
```

### OAuth and Provider Types

```typescript
import type { OAuthProvider } from '@/lib/types/auth'

// Supported OAuth providers
type OAuthProvider = 'google' | 'github' | 'facebook'

// Provider configuration
interface OAuthConfig {
  scopes: string
  redirectTo: string
}
```

### Form and Validation Types

```typescript
import type {
  SignInFormData,
  SignUpFormData,
  ValidationRule,
} from '@/lib/types/auth'

// Sign-in form data
interface SignInFormData {
  email: string
  password: string
  rememberMe?: boolean
}

// Sign-up form data with COPPA compliance
interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  age: number
  agreeToTerms: boolean
  coppaConsent?: boolean
  parentalEmail?: string
}
```

## Type Guards and Utilities

### Authentication Type Guards

```typescript
import {
  isAuthenticatedState,
  isSuccessfulAuthResult,
  hasAuthError,
} from '@/lib/auth/types'

// Check if user is authenticated
if (isAuthenticatedState(authState)) {
  // authState.user is guaranteed to be User (not null)
  console.log(authState.user.email)
}

// Check auth operation result
if (isSuccessfulAuthResult(result)) {
  // result.success is true, user and session may be available
  console.log('Auth successful')
}

// Check for auth errors
if (hasAuthError(authState)) {
  // authState.error is guaranteed to be string (not null)
  console.error(authState.error)
}
```

### User Role Utilities

```typescript
import { getUserRole, isAdmin, isParent, hasAnyRole } from '@/lib/auth/types'

// Get user role with type safety
const role: UserRole = getUserRole(user)

// Role checking utilities
if (isAdmin(user)) {
  // User has admin role
}

if (hasAnyRole(user, ['admin', 'parent'])) {
  // User has admin or parent role
}
```

### Session Utilities

```typescript
import {
  isSessionExpired,
  getSessionTimeRemaining,
  isSessionExpiringSoon,
} from '@/lib/auth/types'

// Check session validity
if (!isSessionExpired(session)) {
  // Session is still valid
}

// Get time remaining in seconds
const timeLeft = getSessionTimeRemaining(session)

// Check if session expires soon (default: 5 minutes)
if (isSessionExpiringSoon(session)) {
  // Show renewal warning
}
```

## Usage Examples

### Type-Safe Auth Context

```typescript
import { useAuth } from '@/lib/auth/context'
import { isAuthenticatedState } from '@/lib/auth/types'

function ProfileComponent() {
  const auth = useAuth()

  // Type guard ensures user is not null
  if (!isAuthenticatedState(auth)) {
    return <div>Please sign in</div>
  }

  // TypeScript knows auth.user is User (not null)
  return (
    <div>
      <h1>Welcome, {auth.user.email}</h1>
      <p>Role: {getUserRole(auth.user)}</p>
    </div>
  )
}
```

### Type-Safe Auth Operations

```typescript
import { useAuth } from '@/lib/auth/context'
import { isSuccessfulAuthResult } from '@/lib/auth/types'

async function handleSignIn(email: string, password: string) {
  const { signIn } = useAuth()

  const result = await signIn(email, password)

  if (isSuccessfulAuthResult(result)) {
    // TypeScript knows result.success is true
    console.log('Signed in successfully')
    if (result.user) {
      console.log(`Welcome ${result.user.email}`)
    }
  } else {
    // TypeScript knows result.error exists
    console.error(`Sign in failed: ${result.error}`)
  }
}
```

### Type-Safe Form Handling

```typescript
import type { SignUpFormData } from '@/lib/types/auth'
import { validateEmail, validatePassword } from '@/lib/auth/types'

function SignUpForm() {
  const [formData, setFormData] = useState<SignUpFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: 0,
    agreeToTerms: false,
  })

  const handleSubmit = (data: SignUpFormData) => {
    // Type-safe validation
    if (!validateEmail(data.email)) {
      setError('Invalid email format')
      return
    }

    const passwordValidation = validatePassword(data.password)
    if (!passwordValidation.isValid) {
      setError(passwordValidation.errors.join(', '))
      return
    }

    // Proceed with sign up
  }
}
```

### Type-Safe Middleware

```typescript
import type { RouteConfig } from '@/lib/types/auth'
import { protectApiRoute } from '@/lib/auth/middleware'

export async function GET(request: NextRequest) {
  const config: RouteConfig = {
    requireAuth: true,
    allowedRoles: ['admin', 'parent'],
  }

  const { user, response } = await protectApiRoute(request, config)

  if (response) {
    // Authentication failed, return error response
    return response
  }

  // TypeScript knows user is authenticated User
  return NextResponse.json({
    message: `Hello ${user.email}`,
    role: getUserRole(user),
  })
}
```

## Database Type Integration

### Generated Types Usage

```typescript
import type { User, ChildProfile, Book, UserRole } from '@/lib/types/database'

// Type-safe database operations
async function createChildProfile(
  parentId: string,
  data: Omit<ChildProfile, 'id' | 'created_at' | 'updated_at'>
) {
  const { data: profile, error } = await supabase
    .from('child_profiles')
    .insert({
      ...data,
      parent_id: parentId,
    })
    .select()
    .single()

  if (error) throw error
  return profile as ChildProfile
}
```

### Type-Safe RLS Helpers

```typescript
import { getCurrentUserProfile } from '@/lib/auth/rls-helpers'
import type { DatabaseUser } from '@/lib/types/auth'

async function getUserProfile(): Promise<DatabaseUser | null> {
  try {
    const profile = await getCurrentUserProfile()
    // TypeScript knows the return type
    return profile
  } catch (error) {
    console.error('Failed to get user profile:', error)
    return null
  }
}
```

## Error Handling

### Type-Safe Error Handling

```typescript
import { AuthError, getAuthErrorMessage } from '@/lib/types/auth'
import type { AuthErrorType } from '@/lib/types/auth'

function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    // Type-safe error handling
    const message = getAuthErrorMessage(error.code as AuthErrorType)
    console.error(`Auth error [${error.code}]: ${message}`)

    if (isRetryableError(error.code as AuthErrorType)) {
      // Show retry option
    }
  } else {
    console.error('Unknown error:', error)
  }
}
```

## Type Generation and Maintenance

### Generating Database Types

```bash
# Generate types from Supabase schema
npm run generate-types

# Type check the entire project
npm run type-check
```

### Type Generation Script

The project includes an automated type generation script:

```javascript
// scripts/generate-types.js
// Automatically generates TypeScript types from Supabase schema
// Includes convenience exports and type safety enhancements
```

### Keeping Types Updated

1. **After database migrations**: Run `npm run generate-types`
2. **Before deployment**: Run `npm run type-check`
3. **During development**: Use TypeScript strict mode for maximum safety

## Best Practices

### 1. Always Use Type Guards

```typescript
// ❌ Don't assume types
if (auth.user) {
  // user might still be null in some edge cases
}

// ✅ Use type guards
if (isAuthenticatedState(auth)) {
  // TypeScript guarantees user is not null
}
```

### 2. Leverage Return Types

```typescript
// ❌ Don't ignore return types
const result = await signIn(email, password)
// Assuming success without checking

// ✅ Check return types
const result = await signIn(email, password)
if (isSuccessfulAuthResult(result)) {
  // Handle success
} else {
  // Handle error with result.error
}
```

### 3. Use Assertion Functions Carefully

```typescript
import { assertUser, assertAuthenticated } from '@/lib/auth/types'

// Use assertions only when you're certain
function requireAuthenticatedUser(auth: AuthState) {
  assertAuthenticated(auth)
  // auth.user is now guaranteed to be User
  return auth.user
}
```

### 4. Type Form Data Properly

```typescript
// ❌ Untyped form data
const handleSubmit = (data: any) => { ... }

// ✅ Typed form data
const handleSubmit = (data: SignInFormData) => { ... }
```

## Integration with Components

### React Component Types

```typescript
import type { AuthContextType } from '@/lib/types/auth'

interface AuthenticatedComponentProps {
  auth: AuthContextType & { isAuthenticated: true; user: User }
}

function AuthenticatedComponent({ auth }: AuthenticatedComponentProps) {
  // auth.user is guaranteed to be User
  return <div>Welcome {auth.user.email}</div>
}
```

### Hook Return Types

```typescript
import { useAuth } from '@/lib/auth/context'

// Hook returns properly typed context
const auth: AuthContextType = useAuth()

// All methods are properly typed
const result: Promise<AuthResult> = auth.signIn(email, password)
```

## Testing with Types

### Type-Safe Test Utilities

```typescript
import { createMockUser, createMockSession } from '@/lib/test-utils'
import type { User, Session } from '@/lib/types/auth'

describe('Auth functionality', () => {
  it('should handle authenticated user', () => {
    const mockUser: User = createMockUser({ role: 'parent' })
    const mockSession: Session = createMockSession(mockUser)

    // Type-safe testing
    expect(getUserRole(mockUser)).toBe('parent')
  })
})
```

This comprehensive TypeScript integration ensures type safety across all authentication flows while providing excellent developer experience and runtime reliability.
