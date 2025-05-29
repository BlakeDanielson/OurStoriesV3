'use client'

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import {
  User,
  Session,
  AuthError as SupabaseAuthError,
} from '@supabase/supabase-js'
import { getAuthClient } from './supabase'
import { authErrors, type AuthError } from './config'
import { createBrowserSupabaseClient } from '../supabase'
import { sessionManager } from './session-manager'
import type {
  AuthState,
  AuthActions,
  AuthContextType,
  AuthResult,
  OAuthProvider,
  AuthErrorType,
  SessionExpiryInfo,
} from '../types/auth'

// Helper function to map Supabase errors to user-friendly messages
const mapAuthError = (error: SupabaseAuthError | Error | null): string => {
  if (!error) return ''

  const message = error.message.toLowerCase()

  if (message.includes('invalid login credentials')) {
    return authErrors.invalid_credentials
  }
  if (message.includes('email not confirmed')) {
    return authErrors.email_not_confirmed
  }
  if (message.includes('signup is disabled')) {
    return authErrors.signup_disabled
  }
  if (message.includes('user already registered')) {
    return authErrors.email_already_exists
  }
  if (message.includes('password is too weak')) {
    return authErrors.weak_password
  }
  if (message.includes('rate limit')) {
    return authErrors.rate_limit_exceeded
  }
  if (message.includes('invalid email')) {
    return authErrors.invalid_email
  }
  if (message.includes('user not found')) {
    return authErrors.user_not_found
  }
  if (message.includes('session expired')) {
    return authErrors.session_expired
  }
  if (message.includes('network')) {
    return authErrors.network_error
  }

  return authErrors.unknown_error
}

// Auth provider props
interface AuthProviderProps {
  children: React.ReactNode
  initialSession?: Session | null
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({
  children,
  initialSession = null,
}: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: initialSession?.user || null,
    session: initialSession,
    loading: !initialSession,
    error: null,
    isAuthenticated: !!initialSession?.user,
  })

  const supabase = getAuthClient()

  // Clear error function
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }))
  }, [])

  // Update auth state helper
  const updateAuthState = useCallback(
    (session: Session | null, loading = true) => {
      const user = session?.user || null
      const isAuthenticated = !!user

      setState({
        user,
        session,
        loading,
        error: null,
        isAuthenticated,
      })

      // Integrate with session manager
      if (session) {
        sessionManager.setSession(session)
      } else {
        sessionManager.clearSession()
      }
    },
    []
  )

  // Set error state
  const setError = useCallback((error: string) => {
    setState(prev => ({ ...prev, error, loading: false }))
  }, [])

  // Sign in with email and password
  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          const errorMessage = mapAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        updateAuthState(data.session)
        return {
          success: true,
          user: data.user || undefined,
          session: data.session || undefined,
        }
      } catch (error) {
        const errorMessage = mapAuthError(error as Error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, setError, updateAuthState]
  )

  // Sign up with email and password
  const signUp = useCallback(
    async (
      email: string,
      password: string,
      metadata?: Record<string, any>
    ): Promise<AuthResult> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: metadata,
          },
        })

        if (error) {
          const errorMessage = mapAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        // Note: User might need to confirm email before session is created
        updateAuthState(data.session)
        return {
          success: true,
          user: data.user || undefined,
          session: data.session || undefined,
        }
      } catch (error) {
        const errorMessage = mapAuthError(error as Error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, setError, updateAuthState]
  )

  // Sign out
  const signOut = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        const errorMessage = mapAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      updateAuthState(null)
      return { success: true }
    } catch (error) {
      const errorMessage = mapAuthError(error as Error)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [supabase, setError, updateAuthState])

  // Sign in with OAuth
  const signInWithOAuth = useCallback(
    async (provider: OAuthProvider): Promise<AuthResult> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        })

        if (error) {
          const errorMessage = mapAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        // OAuth redirect will handle the session
        return { success: true }
      } catch (error) {
        const errorMessage = mapAuthError(error as Error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, setError]
  )

  // Reset password
  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        })

        if (error) {
          const errorMessage = mapAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        setState(prev => ({ ...prev, loading: false }))
        return { success: true }
      } catch (error) {
        const errorMessage = mapAuthError(error as Error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, setError]
  )

  // Update password
  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const { data, error } = await supabase.auth.updateUser({
          password,
        })

        if (error) {
          const errorMessage = mapAuthError(error)
          setError(errorMessage)
          return { success: false, error: errorMessage }
        }

        // Get the current session after password update
        const { data: sessionData } = await supabase.auth.getSession()
        updateAuthState(sessionData.session)
        return {
          success: true,
          user: data.user || undefined,
          session: sessionData.session || undefined,
        }
      } catch (error) {
        const errorMessage = mapAuthError(error as Error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }
    },
    [supabase, setError, updateAuthState]
  )

  // Refresh session
  const refreshSession = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { data, error } = await supabase.auth.refreshSession()

      if (error) {
        const errorMessage = mapAuthError(error)
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      updateAuthState(data.session)
      return {
        success: true,
        user: data.user || undefined,
        session: data.session || undefined,
      }
    } catch (error) {
      const errorMessage = mapAuthError(error as Error)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [supabase, setError, updateAuthState])

  // Validate session
  const validateSession = useCallback(async (): Promise<AuthResult> => {
    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const isValid = await sessionManager.validateSession()

      if (!isValid) {
        const errorMessage = 'Session is no longer valid'
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      setState(prev => ({ ...prev, loading: false }))
      return { success: true }
    } catch (error) {
      const errorMessage = mapAuthError(error as Error)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [setError])

  // Get session expiry information
  const getSessionExpiry = useCallback((): SessionExpiryInfo => {
    return sessionManager.getExpiryInfo()
  }, [])

  // Listen for auth state changes
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)

      switch (event) {
        case 'SIGNED_IN':
        case 'TOKEN_REFRESHED':
          updateAuthState(session)
          break
        case 'SIGNED_OUT':
          updateAuthState(null)
          break
        case 'PASSWORD_RECOVERY':
          // Handle password recovery if needed
          break
        case 'USER_UPDATED':
          updateAuthState(session)
          break
        default:
          break
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, updateAuthState])

  // Initial session check
  useEffect(() => {
    if (!initialSession) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        updateAuthState(session, false)
      })
    }
  }, [supabase, initialSession, updateAuthState])

  const value: AuthContextType = {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithOAuth,
    resetPassword,
    updatePassword,
    refreshSession,
    validateSession,
    getSessionExpiry,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook to require authentication
export function useRequireAuth(): AuthContextType {
  const auth = useAuth()

  useEffect(() => {
    if (!auth.loading && !auth.isAuthenticated) {
      // Redirect to sign in page
      window.location.href = '/auth/signin'
    }
  }, [auth.loading, auth.isAuthenticated])

  return auth
}
