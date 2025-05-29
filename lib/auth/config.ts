// Auth configuration for Supabase
export const authConfig = {
  // Auto refresh tokens before they expire
  autoRefreshToken: true,

  // Persist session in localStorage
  persistSession: true,

  // Detect session from URL on mount
  detectSessionInUrl: true,

  // Storage key for session
  storageKey: 'ourstories-auth-token',

  // Flow type for OAuth
  flowType: 'pkce' as const,

  // Debug mode (only in development)
  debug: process.env.NODE_ENV === 'development',
}

// OAuth provider configurations
export const oauthProviders = {
  google: {
    scopes: 'email profile',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  },
  github: {
    scopes: 'user:email',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
  },
} as const

// Auth redirect URLs
export const authUrls = {
  signIn: '/auth/signin',
  signUp: '/auth/signup',
  callback: '/auth/callback',
  dashboard: '/dashboard',
  profile: '/profile',
  resetPassword: '/auth/reset-password',
  updatePassword: '/auth/update-password',
} as const

// Email template configurations (for Supabase dashboard setup)
export const emailTemplates = {
  confirmation: {
    subject: 'Welcome to ourStories - Confirm your email',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=signup`,
  },
  recovery: {
    subject: 'Reset your ourStories password',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=recovery`,
  },
  emailChange: {
    subject: 'Confirm your new email address',
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback?type=email_change`,
  },
} as const

// COPPA compliance settings
export const coppaConfig = {
  minimumAge: 13,
  requireParentalConsent: true,
  dataRetentionDays: 365,
  allowedDataCollection: [
    'email',
    'name',
    'age_range',
    'reading_preferences',
    'story_progress',
  ] as const,
} as const

// Session configuration
export const sessionConfig = {
  // Session timeout in seconds (24 hours)
  maxAge: 24 * 60 * 60,

  // Refresh threshold (refresh when 1 hour left)
  refreshThreshold: 60 * 60,

  // Cookie settings
  cookie: {
    name: 'ourstories-session',
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
  },
} as const

// Validation rules
export const validationRules = {
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address',
  },
  password: {
    required: true,
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message:
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
  },
  name: {
    required: true,
    minLength: 2,
    maxLength: 50,
    pattern: /^[a-zA-Z\s'-]+$/,
    message: 'Name must contain only letters, spaces, hyphens, and apostrophes',
  },
  age: {
    required: true,
    min: 1,
    max: 120,
    message: 'Please enter a valid age',
  },
} as const

// Error messages
export const authErrors = {
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
} as const

export type AuthError = keyof typeof authErrors
export type OAuthProvider = keyof typeof oauthProviders
