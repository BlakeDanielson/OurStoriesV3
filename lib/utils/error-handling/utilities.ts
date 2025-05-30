import type {
  UploadError,
  ErrorCategory,
  ErrorSeverity,
  RetryStrategy,
} from './types'
import { ERROR_CODES, ERROR_MESSAGES } from './constants'

/**
 * Generate a unique error ID
 */
export function generateErrorId(): string {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Create an UploadError from a generic error
 */
export function createUploadError(
  error: Error | string,
  category: ErrorCategory = 'unknown',
  fileId?: string,
  fileName?: string
): UploadError {
  const errorMessage = typeof error === 'string' ? error : error.message
  const errorCode = detectErrorCode(errorMessage, category)
  const errorInfo =
    ERROR_MESSAGES[errorCode] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR]

  return {
    id: generateErrorId(),
    category: errorInfo.category,
    severity: errorInfo.severity,
    code: errorCode,
    message: errorMessage,
    userMessage: errorInfo.userMessage,
    technicalDetails: typeof error === 'object' ? error.stack : undefined,
    retryStrategy: errorInfo.retryStrategy,
    retryCount: 0,
    maxRetries: getMaxRetries(errorInfo.retryStrategy),
    timestamp: Date.now(),
    fileId,
    fileName,
    suggestions: errorInfo.suggestions,
    canRecover: errorInfo.isTemporary,
    isTemporary: errorInfo.isTemporary,
  }
}

/**
 * Detect error code from error message and category
 */
function detectErrorCode(message: string, category: ErrorCategory): string {
  const lowerMessage = message.toLowerCase()

  // Network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
    return ERROR_CODES.NETWORK_ERROR
  }
  if (
    lowerMessage.includes('offline') ||
    lowerMessage.includes('no internet')
  ) {
    return ERROR_CODES.NETWORK_OFFLINE
  }
  if (lowerMessage.includes('timeout')) {
    if (category === 'upload') return ERROR_CODES.UPLOAD_TIMEOUT
    if (category === 'compression') return ERROR_CODES.COMPRESSION_TIMEOUT
    return ERROR_CODES.NETWORK_TIMEOUT
  }

  // Authentication errors
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
    return ERROR_CODES.AUTH_REQUIRED
  }
  if (lowerMessage.includes('expired') || lowerMessage.includes('session')) {
    return ERROR_CODES.AUTH_EXPIRED
  }

  // Validation errors
  if (
    lowerMessage.includes('file type') ||
    lowerMessage.includes('invalid type')
  ) {
    return ERROR_CODES.INVALID_FILE_TYPE
  }
  if (
    lowerMessage.includes('too large') ||
    lowerMessage.includes('file size')
  ) {
    return ERROR_CODES.FILE_TOO_LARGE
  }
  if (
    lowerMessage.includes('dimensions') ||
    lowerMessage.includes('resolution')
  ) {
    return ERROR_CODES.INVALID_DIMENSIONS
  }

  // Compression errors
  if (category === 'compression') {
    if (lowerMessage.includes('memory'))
      return ERROR_CODES.COMPRESSION_MEMORY_ERROR
    if (lowerMessage.includes('unsupported'))
      return ERROR_CODES.COMPRESSION_UNSUPPORTED_FORMAT
    return ERROR_CODES.COMPRESSION_FAILED
  }

  // Upload errors
  if (category === 'upload') {
    if (lowerMessage.includes('cancelled')) return ERROR_CODES.UPLOAD_CANCELLED
    if (lowerMessage.includes('quota')) return ERROR_CODES.UPLOAD_QUOTA_EXCEEDED
    if (lowerMessage.includes('server')) return ERROR_CODES.UPLOAD_SERVER_ERROR
    return ERROR_CODES.UPLOAD_FAILED
  }

  // System errors
  if (
    lowerMessage.includes('memory') ||
    lowerMessage.includes('out of memory')
  ) {
    return ERROR_CODES.MEMORY_LIMIT_EXCEEDED
  }
  if (
    lowerMessage.includes('browser') ||
    lowerMessage.includes('unsupported')
  ) {
    return ERROR_CODES.BROWSER_UNSUPPORTED
  }

  return ERROR_CODES.UNKNOWN_ERROR
}

/**
 * Get maximum retries for a retry strategy
 */
function getMaxRetries(strategy: RetryStrategy): number {
  switch (strategy) {
    case 'none':
      return 0
    case 'immediate':
      return 1
    case 'exponential':
      return 3
    case 'manual':
      return 0
    default:
      return 0
  }
}

/**
 * Calculate retry delay with exponential backoff
 */
export function calculateRetryDelay(
  retryCount: number,
  baseDelay: number = 1000
): number {
  return Math.min(baseDelay * Math.pow(2, retryCount), 30000) // Max 30 seconds
}

/**
 * Check if an error is retryable
 */
export function isRetryable(error: UploadError): boolean {
  return (
    error.retryStrategy !== 'none' &&
    error.retryCount < error.maxRetries &&
    error.isTemporary
  )
}

/**
 * Check if the browser is online
 */
export function isOnline(): boolean {
  return navigator.onLine
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(error: UploadError): string {
  return JSON.stringify(
    {
      id: error.id,
      category: error.category,
      severity: error.severity,
      code: error.code,
      message: error.message,
      fileId: error.fileId,
      fileName: error.fileName,
      retryCount: error.retryCount,
      timestamp: new Date(error.timestamp).toISOString(),
    },
    null,
    2
  )
}

/**
 * Get error severity color for UI
 */
export function getErrorSeverityColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'low':
      return 'text-yellow-600 border-yellow-200 bg-yellow-50'
    case 'medium':
      return 'text-orange-600 border-orange-200 bg-orange-50'
    case 'high':
      return 'text-red-600 border-red-200 bg-red-50'
    case 'critical':
      return 'text-red-800 border-red-300 bg-red-100'
    default:
      return 'text-gray-600 border-gray-200 bg-gray-50'
  }
}

/**
 * Get error category icon
 */
export function getErrorCategoryIcon(category: ErrorCategory): string {
  switch (category) {
    case 'validation':
      return '⚠️'
    case 'compression':
      return '🗜️'
    case 'upload':
      return '⬆️'
    case 'network':
      return '🌐'
    case 'authentication':
      return '🔐'
    case 'system':
      return '⚙️'
    default:
      return '❓'
  }
}
