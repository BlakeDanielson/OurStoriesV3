'use client'

import { useEffect, useState } from 'react'
import { createBrowserSupabaseClient } from '@/lib/supabase'
import { User } from '@/lib/types/database'
import type { User as SupabaseUser, Session } from '@supabase/supabase-js'

interface AuthState {
  user: SupabaseUser | null
  userProfile: User | null
  session: Session | null
  loading: boolean
  error: string | null
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    userProfile: null,
    session: null,
    loading: true,
    error: null,
  })

  const supabase = createBrowserSupabaseClient()

  // Fetch user profile from database
  const fetchUserProfile = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  // Initialize auth state
  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          if (mounted) {
            setState(prev => ({
              ...prev,
              error: error.message,
              loading: false,
            }))
          }
          return
        }

        let userProfile: User | null = null
        if (session?.user) {
          userProfile = await fetchUserProfile(session.user.id)
        }

        if (mounted) {
          setState({
            user: session?.user || null,
            userProfile,
            session,
            loading: false,
            error: null,
          })
        }
      } catch (error) {
        if (mounted) {
          setState(prev => ({
            ...prev,
            error: error instanceof Error ? error.message : 'Unknown error',
            loading: false,
          }))
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      let userProfile: User | null = null
      if (session?.user) {
        userProfile = await fetchUserProfile(session.user.id)
      }

      setState({
        user: session?.user || null,
        userProfile,
        session,
        loading: false,
        error: null,
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  // Refresh user profile
  const refreshUserProfile = async () => {
    if (!state.user) return

    const userProfile = await fetchUserProfile(state.user.id)
    setState(prev => ({ ...prev, userProfile }))
  }

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      setState(prev => ({ ...prev, error: error.message }))
    }
  }

  return {
    ...state,
    refreshUserProfile,
    signOut,
    isAuthenticated: !!state.user,
    isLoading: state.loading,
  }
}

export type UseAuthReturn = ReturnType<typeof useAuth>
