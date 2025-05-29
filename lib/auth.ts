import { createBrowserSupabaseClient } from './supabase'
import { createServerSupabaseClient } from './supabase-server'
import { User } from './types/database'

// Client-side auth utilities
export const auth = {
  // Sign up with email and password
  signUp: async (
    email: string,
    password: string,
    userData?: { full_name?: string }
  ) => {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData || {},
      },
    })

    return { data, error }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    return { data, error }
  },

  // Sign in with OAuth provider
  signInWithProvider: async (provider: 'google' | 'github') => {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const supabase = createBrowserSupabaseClient()

    const { error } = await supabase.auth.signOut()

    return { error }
  },

  // Get current user
  getUser: async () => {
    const supabase = createBrowserSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return { user, error }
  },

  // Get current session
  getSession: async () => {
    const supabase = createBrowserSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    return { session, error }
  },

  // Reset password
  resetPassword: async (email: string) => {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    })

    return { data, error }
  },

  // Update password
  updatePassword: async (password: string) => {
    const supabase = createBrowserSupabaseClient()

    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    return { data, error }
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    const supabase = createBrowserSupabaseClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(callback)

    return subscription
  },
}

// Server-side auth utilities
export const serverAuth = {
  // Get user from server
  getUser: async () => {
    const supabase = createServerSupabaseClient()

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return { user, error }
  },

  // Get session from server
  getSession: async () => {
    const supabase = createServerSupabaseClient()

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    return { session, error }
  },

  // Get user profile from database
  getUserProfile: async (): Promise<{ user: User | null; error: any }> => {
    const supabase = createServerSupabaseClient()

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return { user: null, error: authError }
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return { user, error }
  },

  // Require authentication (throws if not authenticated)
  requireAuth: async () => {
    const { user, error } = await serverAuth.getUser()

    if (error || !user) {
      throw new Error('Authentication required')
    }

    return user
  },

  // Require user profile (throws if not found)
  requireUserProfile: async (): Promise<User> => {
    const { user, error } = await serverAuth.getUserProfile()

    if (error || !user) {
      throw new Error('User profile not found')
    }

    return user
  },
}

// Auth state types
export type AuthUser = {
  id: string
  email: string
  user_metadata: Record<string, any>
  app_metadata: Record<string, any>
}

export type AuthSession = {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  user: AuthUser
}

// Auth event types
export type AuthEvent =
  | 'SIGNED_IN'
  | 'SIGNED_OUT'
  | 'TOKEN_REFRESHED'
  | 'USER_UPDATED'
  | 'PASSWORD_RECOVERY'
