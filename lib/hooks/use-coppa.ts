'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { COPPAComplianceStatus } from '@/lib/services/coppa'

interface UseCOPPAReturn {
  complianceStatus: COPPAComplianceStatus | null
  loading: boolean
  error: string | null
  refreshStatus: () => Promise<void>
  updateDateOfBirth: (dateOfBirth: string) => Promise<boolean>
  requestParentalConsent: (parentEmail: string) => Promise<boolean>
  isMinor: boolean
  isCompliant: boolean
  requiredActions: string[]
}

export function useCOPPA(): UseCOPPAReturn {
  const { user } = useAuth()
  const [complianceStatus, setComplianceStatus] =
    useState<COPPAComplianceStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshStatus = async () => {
    if (!user) {
      setComplianceStatus(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coppa/compliance-status', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Failed to fetch compliance status')
      }

      const result = await response.json()

      if (result.success) {
        setComplianceStatus(result.data)
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error fetching COPPA compliance status:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateDateOfBirth = async (dateOfBirth: string): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coppa/update-age', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ dateOfBirth }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update date of birth')
      }

      const result = await response.json()

      if (result.success) {
        setComplianceStatus(result.complianceStatus)
        return true
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error updating date of birth:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const requestParentalConsent = async (
    parentEmail: string
  ): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated')
      return false
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coppa/consent-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ parentEmail }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to request parental consent')
      }

      const result = await response.json()

      if (result.success) {
        // Refresh status to get updated information
        await refreshStatus()
        return true
      } else {
        throw new Error(result.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      console.error('Error requesting parental consent:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Load compliance status when user changes
  useEffect(() => {
    if (user) {
      refreshStatus()
    } else {
      setComplianceStatus(null)
    }
  }, [user])

  return {
    complianceStatus,
    loading,
    error,
    refreshStatus,
    updateDateOfBirth,
    requestParentalConsent,
    isMinor: complianceStatus?.isMinor || false,
    isCompliant: complianceStatus?.isCompliant || false,
    requiredActions: complianceStatus?.requiredActions || [],
  }
}
