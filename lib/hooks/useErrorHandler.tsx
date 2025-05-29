import { useState, useCallback, useRef, useEffect } from 'react'
import {
  UploadError,
  ErrorRecoveryAction,
  ErrorHandlerOptions,
  createUploadError,
  calculateRetryDelay,
  isRetryable,
  isOnline,
  formatErrorForLogging,
  ErrorCategory,
} from '@/lib/utils/error-handling'

export interface UseErrorHandlerReturn {
  errors: UploadError[]
  hasErrors: boolean
  hasRetryableErrors: boolean
  addError: (
    error: Error | string,
    category?: ErrorCategory,
    fileId?: string,
    fileName?: string
  ) => UploadError
  removeError: (errorId: string) => void
  clearErrors: () => void
  retryError: (
    errorId: string,
    retryAction?: () => Promise<void>
  ) => Promise<void>
  retryAllErrors: (
    retryAction?: (error: UploadError) => Promise<void>
  ) => Promise<void>
  getErrorsForFile: (fileId: string) => UploadError[]
  getErrorsByCategory: (category: ErrorCategory) => UploadError[]
  getErrorsBySeverity: (severity: string) => UploadError[]
  isRetrying: boolean
  onlineStatus: boolean
}

export function useErrorHandler(
  options: ErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const [errors, setErrors] = useState<UploadError[]>([])
  const [isRetrying, setIsRetrying] = useState(false)
  const [onlineStatus, setOnlineStatus] = useState(isOnline())
  const retryTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map())

  const {
    enableAutoRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
    enableLogging = true,
    enableUserNotifications = true,
    onError,
    onRecovery,
  } = options

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setOnlineStatus(true)
      if (enableAutoRetry) {
        // Retry network-related errors when back online
        const networkErrors = errors.filter(
          error => error.category === 'network' && isRetryable(error)
        )
        networkErrors.forEach(error => {
          retryError(error.id)
        })
      }
    }

    const handleOffline = () => {
      setOnlineStatus(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [errors, enableAutoRetry])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeouts.current.forEach(timeout => clearTimeout(timeout))
      retryTimeouts.current.clear()
    }
  }, [])

  const addError = useCallback(
    (
      error: Error | string,
      category: ErrorCategory = 'unknown',
      fileId?: string,
      fileName?: string
    ): UploadError => {
      const uploadError = createUploadError(error, category, fileId, fileName)

      setErrors(prev => [...prev, uploadError])

      // Log error if enabled
      if (enableLogging) {
        console.error('Upload Error:', formatErrorForLogging(uploadError))
      }

      // Call error callback
      if (onError) {
        onError(uploadError)
      }

      // Auto-retry if enabled and error is retryable
      if (enableAutoRetry && isRetryable(uploadError)) {
        scheduleRetry(uploadError)
      }

      return uploadError
    },
    [enableLogging, enableAutoRetry, onError]
  )

  const removeError = useCallback((errorId: string) => {
    setErrors(prev => prev.filter(error => error.id !== errorId))

    // Clear any pending retry timeout
    const timeout = retryTimeouts.current.get(errorId)
    if (timeout) {
      clearTimeout(timeout)
      retryTimeouts.current.delete(errorId)
    }
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])

    // Clear all retry timeouts
    retryTimeouts.current.forEach(timeout => clearTimeout(timeout))
    retryTimeouts.current.clear()
  }, [])

  const scheduleRetry = useCallback(
    (error: UploadError) => {
      if (!isRetryable(error)) return

      const delay = calculateRetryDelay(error.retryCount, retryDelay)

      const timeout = setTimeout(() => {
        retryError(error.id)
      }, delay)

      retryTimeouts.current.set(error.id, timeout)
    },
    [retryDelay]
  )

  const retryError = useCallback(
    async (
      errorId: string,
      retryAction?: () => Promise<void>
    ): Promise<void> => {
      const error = errors.find(e => e.id === errorId)
      if (!error || !isRetryable(error)) return

      // Check if we're offline for network errors
      if (error.category === 'network' && !onlineStatus) {
        console.log('Cannot retry network error while offline')
        return
      }

      setIsRetrying(true)

      try {
        // Update retry count
        setErrors(prev =>
          prev.map(e =>
            e.id === errorId ? { ...e, retryCount: e.retryCount + 1 } : e
          )
        )

        // Execute retry action if provided
        if (retryAction) {
          await retryAction()
        }

        // Remove error on successful retry
        removeError(errorId)

        // Call recovery callback
        if (onRecovery) {
          onRecovery(error)
        }

        if (enableLogging) {
          console.log(`Successfully retried error: ${errorId}`)
        }
      } catch (retryError) {
        // Update error with new retry count and check if we should continue retrying
        setErrors(prev =>
          prev.map(e => {
            if (e.id === errorId) {
              const updatedError = { ...e, retryCount: e.retryCount + 1 }

              // Schedule another retry if still retryable
              if (enableAutoRetry && isRetryable(updatedError)) {
                scheduleRetry(updatedError)
              }

              return updatedError
            }
            return e
          })
        )

        if (enableLogging) {
          console.error(`Retry failed for error ${errorId}:`, retryError)
        }
      } finally {
        setIsRetrying(false)
      }
    },
    [
      errors,
      onlineStatus,
      enableAutoRetry,
      enableLogging,
      onRecovery,
      removeError,
      scheduleRetry,
    ]
  )

  const retryAllErrors = useCallback(
    async (
      retryAction?: (error: UploadError) => Promise<void>
    ): Promise<void> => {
      const retryableErrors = errors.filter(isRetryable)

      if (retryableErrors.length === 0) return

      setIsRetrying(true)

      try {
        // Retry errors sequentially to avoid overwhelming the system
        for (const error of retryableErrors) {
          if (retryAction) {
            await retryAction(error)
          }
          await retryError(error.id)

          // Small delay between retries
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      } finally {
        setIsRetrying(false)
      }
    },
    [errors, retryError]
  )

  const getErrorsForFile = useCallback(
    (fileId: string): UploadError[] => {
      return errors.filter(error => error.fileId === fileId)
    },
    [errors]
  )

  const getErrorsByCategory = useCallback(
    (category: ErrorCategory): UploadError[] => {
      return errors.filter(error => error.category === category)
    },
    [errors]
  )

  const getErrorsBySeverity = useCallback(
    (severity: string): UploadError[] => {
      return errors.filter(error => error.severity === severity)
    },
    [errors]
  )

  const hasErrors = errors.length > 0
  const hasRetryableErrors = errors.some(isRetryable)

  return {
    errors,
    hasErrors,
    hasRetryableErrors,
    addError,
    removeError,
    clearErrors,
    retryError,
    retryAllErrors,
    getErrorsForFile,
    getErrorsByCategory,
    getErrorsBySeverity,
    isRetrying,
    onlineStatus,
  }
}
