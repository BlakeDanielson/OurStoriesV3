import type {
  User,
  Session,
  AuthError as SupabaseAuthError,
} from '@supabase/supabase-js'
import type { Database } from './database'

// Re-export Supabase auth types for convenience
export type { User, Session } from '@supabase/supabase-js'

// Database-specific user type with our schema
export type DatabaseUser = Database['public']['Tables']['users']['Row']
export type DatabaseUserInsert = Database['public']['Tables']['users']['Insert']
export type DatabaseUserUpdate = Database['public']['Tables']['users']['Update']

// Enhanced user type combining Supabase auth user with database profile
export interface AuthenticatedUser extends User {
  profile?: DatabaseUser
}

// Auth state interface
export interface AuthState {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

// Auth error types
export type AuthErrorType =
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'signup_disabled'
  | 'email_already_exists'
  | 'weak_password'
  | 'rate_limit_exceeded'
  | 'invalid_email'
  | 'user_not_found'
  | 'session_expired'
  | 'unauthorized'
  | 'coppa_violation'
  | 'network_error'
  | 'unknown_error'

// Auth operation result
export interface AuthResult {
  success: boolean
  error?: string
  user?: User
  session?: Session
}

// OAuth provider types
export type OAuthProvider = 'google' | 'github' | 'facebook'

// Auth actions interface
export interface AuthActions {
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (
    email: string,
    password: string,
    metadata?: Record<string, any>
  ) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  signInWithOAuth: (provider: OAuthProvider) => Promise<AuthResult>
  resetPassword: (email: string) => Promise<AuthResult>
  updatePassword: (password: string) => Promise<AuthResult>
  refreshSession: () => Promise<AuthResult>
  validateSession: () => Promise<AuthResult>
  getSessionExpiry: () => SessionExpiryInfo
  clearError: () => void
}

// Session management types
export interface SessionExpiryInfo {
  expiresAt: number | null
  expiresIn: number | null
  isExpiringSoon: boolean
}

export interface SessionManagerConfig {
  refreshThreshold: number // seconds before expiry to refresh
  warningThreshold: number // seconds before expiry to show warning
  checkInterval: number // interval to check session status
}

// User metadata types
export interface UserMetadata {
  full_name?: string
  avatar_url?: string
  age?: number
  coppa_consent?: boolean
  parental_email?: string
  preferences?: Record<string, any>
}

// COPPA compliance types
export interface COPPAData {
  age: number
  requiresParentalConsent: boolean
  parentalEmail?: string
  consentGiven?: boolean
  consentDate?: string
}

// Auth context type combining state and actions
export type AuthContextType = AuthState & AuthActions

// Route protection types
export interface RouteConfig {
  requireAuth?: boolean
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export interface AuthMiddlewareResult {
  user: User | null
  error: string | null
  isAuthenticated: boolean
  session?: Session
}

// User roles from database enum
export type UserRole = Database['public']['Enums']['user_role']

// Auth form types
export interface SignInFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
  fullName: string
  age: number
  agreeToTerms: boolean
  coppaConsent?: boolean
  parentalEmail?: string
}

export interface ResetPasswordFormData {
  email: string
}

export interface UpdatePasswordFormData {
  password: string
  confirmPassword: string
}

// Validation types
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: RegExp
  message: string
}

export interface ValidationRules {
  email: ValidationRule
  password: ValidationRule
  name: ValidationRule
  age: ValidationRule
}

// Auth configuration types
export interface AuthConfig {
  autoRefreshToken: boolean
  persistSession: boolean
  detectSessionInUrl: boolean
  storageKey: string
  flowType: 'pkce' | 'implicit'
  debug: boolean
}

export interface OAuthConfig {
  scopes: string
  redirectTo: string
}

export interface EmailTemplateConfig {
  subject: string
  redirectTo: string
}

// Session storage types
export interface StoredSession {
  access_token: string
  refresh_token: string
  expires_at: number
  user: User
}

// Auth event types
export type AuthEventType =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'

export interface AuthEvent {
  type: AuthEventType
  session: Session | null
  user: User | null
}

// Type guards
export function isAuthenticatedUser(user: User | null): user is User {
  return user !== null && user !== undefined
}

export function hasValidSession(session: Session | null): session is Session {
  if (!session) return false

  const now = Math.floor(Date.now() / 1000)
  return session.expires_at ? session.expires_at > now : false
}

export function isOAuthProvider(provider: string): provider is OAuthProvider {
  return ['google', 'github', 'facebook'].includes(provider)
}

export function isValidUserRole(role: string): role is UserRole {
  return ['parent', 'child', 'admin'].includes(role)
}

// Utility types for auth operations
export type AuthOperation = keyof AuthActions
export type AuthOperationResult<T extends AuthOperation> = ReturnType<
  AuthActions[T]
>

// Enhanced error handling
export interface AuthErrorDetails {
  code: string
  message: string
  details?: Record<string, any>
  timestamp: number
}

export class AuthError extends Error {
  public readonly code: string
  public readonly details?: Record<string, any>
  public readonly timestamp: number

  constructor(
    code: AuthErrorType,
    message: string,
    details?: Record<string, any>
  ) {
    super(message)
    this.name = 'AuthError'
    this.code = code
    this.details = details
    this.timestamp = Date.now()
  }
}

// Type for auth provider configurations
export interface AuthProviderConfig {
  providers: {
    [K in OAuthProvider]: OAuthConfig
  }
  emailTemplates: {
    confirmation: EmailTemplateConfig
    recovery: EmailTemplateConfig
    emailChange: EmailTemplateConfig
  }
  coppa: {
    minimumAge: number
    requireParentalConsent: boolean
    dataRetentionDays: number
    allowedDataCollection: readonly string[]
  }
  session: {
    maxAge: number
    refreshThreshold: number
    cookie: {
      name: string
      secure: boolean
      httpOnly: boolean
      sameSite: 'lax' | 'strict' | 'none'
    }
  }
  validation: ValidationRules
}
