export type ErrorCategory =
  | 'validation'
  | 'compression'
  | 'upload'
  | 'network'
  | 'authentication'
  | 'system'
  | 'unknown'

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

export type RetryStrategy = 'none' | 'immediate' | 'exponential' | 'manual'

export interface UploadError {
  id: string
  category: ErrorCategory
  severity: ErrorSeverity
  code: string
  message: string
  userMessage: string
  technicalDetails?: string
  retryStrategy: RetryStrategy
  retryCount: number
  maxRetries: number
  timestamp: number
  fileId?: string
  fileName?: string
  suggestions: string[]
  canRecover: boolean
  isTemporary: boolean
}

export interface ErrorRecoveryAction {
  id: string
  label: string
  description: string
  action: () => void | Promise<void>
  isPrimary: boolean
  isDestructive: boolean
}

export interface ErrorHandlerOptions {
  enableAutoRetry?: boolean
  maxRetries?: number
  retryDelay?: number
  enableLogging?: boolean
  enableUserNotifications?: boolean
  onError?: (error: UploadError) => void
  onRecovery?: (error: UploadError) => void
}
