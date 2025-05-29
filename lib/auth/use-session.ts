import { useState, useEffect, useCallback } from 'react'
import { sessionManager, SessionState } from './session-manager'

/**
 * Enhanced session hook with automatic state management
 */
export function useSession() {
  const [sessionState, setSessionState] = useState<SessionState>(() =>
    sessionManager.getState()
  )
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = sessionManager.subscribe(newState => {
      setSessionState(newState)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // Refresh session manually
  const refreshSession = useCallback(async () => {
    setIsLoading(true)
    const success = await sessionManager.refreshSession()
    setIsLoading(false)
    return success
  }, [])

  // Validate session
  const validateSession = useCallback(async () => {
    return await sessionManager.validateSession()
  }, [])

  // Clear session
  const clearSession = useCallback(() => {
    sessionManager.clearSession()
  }, [])

  // Get expiry information
  const getExpiryInfo = useCallback(() => {
    return sessionManager.getExpiryInfo()
  }, [])

  return {
    // Session state
    session: sessionState.session,
    user: sessionState.user,
    isAuthenticated: sessionState.isAuthenticated,
    lastRefresh: sessionState.lastRefresh,
    expiresAt: sessionState.expiresAt,

    // Loading state
    isLoading,

    // Actions
    refreshSession,
    validateSession,
    clearSession,
    getExpiryInfo,

    // Full state for advanced usage
    sessionState,
  }
}

/**
 * Hook for components that require authentication
 */
export function useRequireSession() {
  const session = useSession()

  useEffect(() => {
    if (!session.isLoading && !session.isAuthenticated) {
      // Redirect to sign in
      window.location.href = '/auth/signin'
    }
  }, [session.isLoading, session.isAuthenticated])

  return session
}

/**
 * Hook to monitor session expiry and show warnings
 */
export function useSessionExpiry(warningThreshold = 10 * 60 * 1000) {
  // 10 minutes default
  const session = useSession()
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)
  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(null)

  useEffect(() => {
    if (!session.isAuthenticated || !session.expiresAt) {
      setIsExpiringSoon(false)
      setTimeUntilExpiry(null)
      return
    }

    const checkExpiry = () => {
      const now = Date.now()
      const timeLeft = session.expiresAt! - now

      setTimeUntilExpiry(timeLeft)
      setIsExpiringSoon(timeLeft < warningThreshold && timeLeft > 0)
    }

    // Check immediately
    checkExpiry()

    // Check every minute
    const interval = setInterval(checkExpiry, 60 * 1000)

    return () => clearInterval(interval)
  }, [session.isAuthenticated, session.expiresAt, warningThreshold])

  return {
    isExpiringSoon,
    timeUntilExpiry,
    refreshSession: session.refreshSession,
  }
}
