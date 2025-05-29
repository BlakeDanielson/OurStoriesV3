import type { User, Session } from '@supabase/supabase-js'
import type {
  AuthState,
  AuthResult,
  AuthMiddlewareResult,
  OAuthProvider,
  UserRole,
  AuthErrorType,
  DatabaseUser,
  AuthenticatedUser,
} from '../types/auth'

/**
 * Type-safe auth utilities and helpers
 */

// Extended middleware result with session for internal use
export interface ExtendedAuthMiddlewareResult
  extends Omit<AuthMiddlewareResult, 'session'> {
  session: Session | null
}

// Type guards for auth operations
export function isSuccessfulAuthResult(
  result: AuthResult
): result is AuthResult & { success: true } {
  return result.success === true
}

export function isFailedAuthResult(
  result: AuthResult
): result is AuthResult & { success: false; error: string } {
  return result.success === false && typeof result.error === 'string'
}

export function isAuthenticatedState(
  state: AuthState
): state is AuthState & { isAuthenticated: true; user: User } {
  return state.isAuthenticated && state.user !== null
}

export function isLoadingState(state: AuthState): boolean {
  return state.loading
}

export function hasAuthError(
  state: AuthState
): state is AuthState & { error: string } {
  return state.error !== null && state.error !== ''
}

// User role utilities
export function getUserRole(user: User): UserRole {
  return (user.app_metadata?.role ||
    user.user_metadata?.role ||
    'parent') as UserRole
}

export function isUserRole(user: User, role: UserRole): boolean {
  return getUserRole(user) === role
}

export function hasAnyRole(user: User, roles: UserRole[]): boolean {
  const userRole = getUserRole(user)
  return roles.includes(userRole)
}

export function isAdmin(user: User): boolean {
  return isUserRole(user, 'admin')
}

export function isParent(user: User): boolean {
  return isUserRole(user, 'parent')
}

export function isChild(user: User): boolean {
  return isUserRole(user, 'child')
}

// Session utilities
export function isSessionExpired(session: Session | null): boolean {
  if (!session || !session.expires_at) return true

  const now = Math.floor(Date.now() / 1000)
  return session.expires_at <= now
}

export function getSessionTimeRemaining(session: Session | null): number {
  if (!session || !session.expires_at) return 0

  const now = Math.floor(Date.now() / 1000)
  return Math.max(0, session.expires_at - now)
}

export function isSessionExpiringSoon(
  session: Session | null,
  thresholdSeconds: number = 300
): boolean {
  const timeRemaining = getSessionTimeRemaining(session)
  return timeRemaining > 0 && timeRemaining <= thresholdSeconds
}

// OAuth provider utilities
export function getOAuthProviderDisplayName(provider: OAuthProvider): string {
  const names: Record<OAuthProvider, string> = {
    google: 'Google',
    github: 'GitHub',
    facebook: 'Facebook',
  }
  return names[provider]
}

export function getOAuthProviderIcon(provider: OAuthProvider): string {
  const icons: Record<OAuthProvider, string> = {
    google: '🔍',
    github: '🐙',
    facebook: '📘',
  }
  return icons[provider]
}

// Error handling utilities
export function getAuthErrorMessage(errorType: AuthErrorType): string {
  const messages: Record<AuthErrorType, string> = {
    invalid_credentials: 'Invalid email or password. Please try again.',
    email_not_confirmed:
      'Please check your email and click the confirmation link.',
    signup_disabled: 'New registrations are currently disabled.',
    email_already_exists: 'An account with this email already exists.',
    weak_password: 'Password is too weak. Please choose a stronger password.',
    rate_limit_exceeded: 'Too many attempts. Please wait before trying again.',
    invalid_email: 'Please enter a valid email address.',
    user_not_found: 'No account found with this email address.',
    session_expired: 'Your session has expired. Please sign in again.',
    unauthorized: 'You are not authorized to access this resource.',
    coppa_violation: 'Users under 13 require parental consent.',
    network_error: 'Network error. Please check your connection and try again.',
    unknown_error: 'An unexpected error occurred. Please try again.',
  }
  return messages[errorType]
}

export function isRetryableError(errorType: AuthErrorType): boolean {
  const retryableErrors: AuthErrorType[] = [
    'network_error',
    'rate_limit_exceeded',
    'session_expired',
    'unknown_error',
  ]
  return retryableErrors.includes(errorType)
}

// User metadata utilities
export function getUserDisplayName(user: User): string {
  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'User'
  )
}

export function getUserAvatarUrl(user: User): string | null {
  return user.user_metadata?.avatar_url || user.user_metadata?.picture || null
}

export function getUserEmail(user: User): string {
  return user.email || ''
}

export function isEmailVerified(user: User): boolean {
  return user.email_confirmed_at !== null
}

// Database user utilities
export function createDatabaseUserFromAuth(
  user: User
): Omit<DatabaseUser, 'created_at' | 'updated_at'> {
  return {
    id: user.id,
    email: user.email || '',
    full_name: getUserDisplayName(user),
    avatar_url: getUserAvatarUrl(user),
    role: getUserRole(user),
    preferences: user.user_metadata || null,
  }
}

export function mergeAuthUserWithProfile(
  user: User,
  profile?: DatabaseUser
): AuthenticatedUser {
  return {
    ...user,
    profile,
  }
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePassword(password: string): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (!/[@$!%*?&]/.test(password)) {
    errors.push(
      'Password must contain at least one special character (@$!%*?&)'
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

export function getPasswordStrength(password: string): {
  score: number // 0-4
  label: string
  color: string
} {
  let score = 0

  if (password.length >= 8) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[@$!%*?&]/.test(password)) score++

  const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ff4444', '#ff8800', '#ffaa00', '#88cc00', '#00cc44']

  return {
    score,
    label: labels[score] || 'Very Weak',
    color: colors[score] || '#ff4444',
  }
}

// COPPA compliance utilities
export function requiresParentalConsent(age: number): boolean {
  return age < 13
}

export function isValidAge(age: number): boolean {
  return age >= 1 && age <= 120
}

// Type assertion utilities
export function assertUser(user: User | null): asserts user is User {
  if (!user) {
    throw new Error('User is required but was null or undefined')
  }
}

export function assertSession(
  session: Session | null
): asserts session is Session {
  if (!session) {
    throw new Error('Session is required but was null or undefined')
  }
}

export function assertAuthenticated(
  state: AuthState
): asserts state is AuthState & { isAuthenticated: true; user: User } {
  if (!state.isAuthenticated || !state.user) {
    throw new Error('User must be authenticated')
  }
}
