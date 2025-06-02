import { useState, useEffect, useCallback } from 'react'
import React from 'react'

interface CSRFState {
  token: string | null
  loading: boolean
  error: string | null
}

interface CSRFTokenResponse {
  csrfToken: string
  message: string
}

export function useCSRF() {
  const [state, setState] = useState<CSRFState>({
    token: null,
    loading: true,
    error: null,
  })

  // Fetch CSRF token from the server
  const fetchToken = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))

      const response = await fetch('/api/csrf-token', {
        method: 'GET',
        credentials: 'include', // Include cookies
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch CSRF token: ${response.status}`)
      }

      const data: CSRFTokenResponse = await response.json()

      setState({
        token: data.csrfToken,
        loading: false,
        error: null,
      })

      return data.csrfToken
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error'
      setState({
        token: null,
        loading: false,
        error: errorMessage,
      })
      throw error
    }
  }, [])

  // Refresh token (useful when token expires or becomes invalid)
  const refreshToken = useCallback(async () => {
    return await fetchToken()
  }, [fetchToken])

  // Get headers with CSRF token for API requests
  const getCSRFHeaders = useCallback((): Record<string, string> => {
    if (!state.token) {
      return {
        'Content-Type': 'application/json',
      }
    }

    return {
      'X-CSRF-Token': state.token,
      'Content-Type': 'application/json',
    }
  }, [state.token])

  // Make a CSRF-protected API request
  const makeCSRFRequest = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!state.token) {
        throw new Error('CSRF token not available')
      }

      const headers = {
        ...getCSRFHeaders(),
        ...options.headers,
      }

      return fetch(url, {
        ...options,
        credentials: 'include',
        headers,
      })
    },
    [state.token, getCSRFHeaders]
  )

  // Add CSRF token to form data
  const addCSRFToFormData = useCallback(
    (formData: FormData) => {
      if (state.token) {
        formData.append('_csrf', state.token)
      }
      return formData
    },
    [state.token]
  )

  // Add CSRF token to JSON body
  const addCSRFToBody = useCallback(
    (body: any) => {
      if (state.token) {
        return {
          ...body,
          _csrf: state.token,
        }
      }
      return body
    },
    [state.token]
  )

  // Initialize token on mount
  useEffect(() => {
    fetchToken().catch(console.error)
  }, [fetchToken])

  return {
    token: state.token,
    loading: state.loading,
    error: state.error,
    refreshToken,
    getCSRFHeaders,
    makeCSRFRequest,
    addCSRFToFormData,
    addCSRFToBody,
    isReady: !state.loading && !!state.token && !state.error,
  }
}
