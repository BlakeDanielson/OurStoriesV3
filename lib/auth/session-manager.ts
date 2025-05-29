import { Session, User } from '@supabase/supabase-js'
import { createBrowserSupabaseClient } from '../supabase'

/**
 * Session Manager
 *
 * Handles session persistence, automatic refresh, and state synchronization
 * across tabs and browser sessions.
 */

export interface SessionState {
  session: Session | null
  user: User | null
  isAuthenticated: boolean
  lastRefresh: number
  expiresAt: number | null
}

export class SessionManager {
  private static instance: SessionManager
  private supabase = createBrowserSupabaseClient()
  private storageKey = 'ourStories_session_state'
  private refreshTimer: NodeJS.Timeout | null = null
  private listeners: Set<(state: SessionState) => void> = new Set()
  private currentState: SessionState = {
    session: null,
    user: null,
    isAuthenticated: false,
    lastRefresh: 0,
    expiresAt: null,
  }

  private constructor() {
    this.initializeSession()
    this.setupStorageListener()
    this.setupVisibilityListener()
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager()
    }
    return SessionManager.instance
  }

  /**
   * Initialize session from storage and Supabase
   */
  private async initializeSession() {
    try {
      // Try to restore from localStorage first
      const stored = this.getStoredSession()
      if (stored && this.isSessionValid(stored)) {
        this.updateState(stored)
      }

      // Get current session from Supabase
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession()

      if (error) {
        console.error('Error getting session:', error)
        this.clearSession()
        return
      }

      if (session) {
        const newState = this.createSessionState(session)
        this.updateState(newState)
        this.scheduleRefresh(session)
      } else {
        this.clearSession()
      }
    } catch (error) {
      console.error('Error initializing session:', error)
      this.clearSession()
    }
  }

  /**
   * Create session state from Supabase session
   */
  private createSessionState(session: Session): SessionState {
    return {
      session,
      user: session.user,
      isAuthenticated: true,
      lastRefresh: Date.now(),
      expiresAt: session.expires_at ? session.expires_at * 1000 : null,
    }
  }

  /**
   * Update current state and notify listeners
   */
  private updateState(newState: SessionState) {
    this.currentState = newState
    this.storeSession(newState)
    this.notifyListeners(newState)
  }

  /**
   * Store session in localStorage
   */
  private storeSession(state: SessionState) {
    if (typeof window === 'undefined') return

    try {
      const toStore = {
        ...state,
        // Don't store the full session object for security
        session: state.session
          ? {
              access_token: state.session.access_token,
              refresh_token: state.session.refresh_token,
              expires_at: state.session.expires_at,
              expires_in: state.session.expires_in,
              token_type: state.session.token_type,
            }
          : null,
      }
      localStorage.setItem(this.storageKey, JSON.stringify(toStore))
    } catch (error) {
      console.error('Error storing session:', error)
    }
  }

  /**
   * Get stored session from localStorage
   */
  private getStoredSession(): SessionState | null {
    if (typeof window === 'undefined') return null

    try {
      const stored = localStorage.getItem(this.storageKey)
      if (!stored) return null

      const parsed = JSON.parse(stored)
      return parsed
    } catch (error) {
      console.error('Error getting stored session:', error)
      return null
    }
  }

  /**
   * Check if stored session is still valid
   */
  private isSessionValid(state: SessionState): boolean {
    if (!state.session || !state.expiresAt) return false

    // Check if session is expired (with 5 minute buffer)
    const now = Date.now()
    const expiresAt = state.expiresAt
    const buffer = 5 * 60 * 1000 // 5 minutes

    return now < expiresAt - buffer
  }

  /**
   * Schedule automatic session refresh
   */
  private scheduleRefresh(session: Session) {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
    }

    if (!session.expires_at) return

    // Refresh 5 minutes before expiry
    const expiresAt = session.expires_at * 1000
    const now = Date.now()
    const refreshIn = expiresAt - now - 5 * 60 * 1000

    if (refreshIn > 0) {
      this.refreshTimer = setTimeout(() => {
        this.refreshSession()
      }, refreshIn)
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<boolean> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession()

      if (error) {
        console.error('Error refreshing session:', error)
        this.clearSession()
        return false
      }

      if (data.session) {
        const newState = this.createSessionState(data.session)
        this.updateState(newState)
        this.scheduleRefresh(data.session)
        return true
      } else {
        this.clearSession()
        return false
      }
    } catch (error) {
      console.error('Error refreshing session:', error)
      this.clearSession()
      return false
    }
  }

  /**
   * Clear session and cleanup
   */
  clearSession() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer)
      this.refreshTimer = null
    }

    const clearedState: SessionState = {
      session: null,
      user: null,
      isAuthenticated: false,
      lastRefresh: 0,
      expiresAt: null,
    }

    this.updateState(clearedState)

    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(this.storageKey)
      } catch (error) {
        console.error('Error clearing stored session:', error)
      }
    }
  }

  /**
   * Set new session (called after successful auth)
   */
  setSession(session: Session) {
    const newState = this.createSessionState(session)
    this.updateState(newState)
    this.scheduleRefresh(session)
  }

  /**
   * Get current session state
   */
  getState(): SessionState {
    return { ...this.currentState }
  }

  /**
   * Subscribe to session state changes
   */
  subscribe(listener: (state: SessionState) => void): () => void {
    this.listeners.add(listener)

    // Immediately call with current state
    listener(this.getState())

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Notify all listeners of state changes
   */
  private notifyListeners(state: SessionState) {
    this.listeners.forEach(listener => {
      try {
        listener(state)
      } catch (error) {
        console.error('Error in session listener:', error)
      }
    })
  }

  /**
   * Setup storage event listener for cross-tab synchronization
   */
  private setupStorageListener() {
    if (typeof window === 'undefined') return

    window.addEventListener('storage', event => {
      if (event.key === this.storageKey) {
        try {
          const newState = event.newValue ? JSON.parse(event.newValue) : null
          if (newState && this.isSessionValid(newState)) {
            this.currentState = newState
            this.notifyListeners(newState)
          } else {
            this.clearSession()
          }
        } catch (error) {
          console.error('Error handling storage event:', error)
        }
      }
    })
  }

  /**
   * Setup visibility change listener to refresh session when tab becomes visible
   */
  private setupVisibilityListener() {
    if (typeof document === 'undefined') return

    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentState.isAuthenticated) {
        // Check if session needs refresh when tab becomes visible
        const now = Date.now()
        const lastRefresh = this.currentState.lastRefresh
        const timeSinceRefresh = now - lastRefresh

        // Refresh if it's been more than 10 minutes since last refresh
        if (timeSinceRefresh > 10 * 60 * 1000) {
          this.refreshSession()
        }
      }
    })
  }

  /**
   * Force session validation (useful for critical operations)
   */
  async validateSession(): Promise<boolean> {
    if (!this.currentState.isAuthenticated) return false

    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser()

      if (error || !user) {
        this.clearSession()
        return false
      }

      return true
    } catch (error) {
      console.error('Error validating session:', error)
      this.clearSession()
      return false
    }
  }

  /**
   * Get session expiry information
   */
  getExpiryInfo(): {
    expiresAt: number | null
    expiresIn: number | null
    isExpiringSoon: boolean
  } {
    const { expiresAt } = this.currentState

    if (!expiresAt) {
      return { expiresAt: null, expiresIn: null, isExpiringSoon: false }
    }

    const now = Date.now()
    const expiresIn = expiresAt - now
    const isExpiringSoon = expiresIn < 10 * 60 * 1000 // Less than 10 minutes

    return { expiresAt, expiresIn, isExpiringSoon }
  }
}

// Export singleton instance
export const sessionManager = SessionManager.getInstance()

// React hook for using session manager
export function useSessionManager() {
  return sessionManager
}
