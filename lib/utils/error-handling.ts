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

// Error code definitions
export const ERROR_CODES = {
  // Validation errors
  INVALID_FILE_TYPE: 'VALIDATION_INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'VALIDATION_FILE_TOO_LARGE',
  FILE_TOO_SMALL: 'VALIDATION_FILE_TOO_SMALL',
  INVALID_DIMENSIONS: 'VALIDATION_INVALID_DIMENSIONS',
  INVALID_ASPECT_RATIO: 'VALIDATION_INVALID_ASPECT_RATIO',
  TOO_MANY_FILES: 'VALIDATION_TOO_MANY_FILES',
  MALICIOUS_FILE: 'VALIDATION_MALICIOUS_FILE',

  // Compression errors
  COMPRESSION_FAILED: 'COMPRESSION_FAILED',
  COMPRESSION_MEMORY_ERROR: 'COMPRESSION_MEMORY_ERROR',
  COMPRESSION_UNSUPPORTED_FORMAT: 'COMPRESSION_UNSUPPORTED_FORMAT',
  COMPRESSION_TIMEOUT: 'COMPRESSION_TIMEOUT',

  // Upload errors
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  UPLOAD_TIMEOUT: 'UPLOAD_TIMEOUT',
  UPLOAD_CANCELLED: 'UPLOAD_CANCELLED',
  UPLOAD_QUOTA_EXCEEDED: 'UPLOAD_QUOTA_EXCEEDED',
  UPLOAD_SERVER_ERROR: 'UPLOAD_SERVER_ERROR',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  NETWORK_CONNECTION_LOST: 'NETWORK_CONNECTION_LOST',

  // Authentication errors
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_EXPIRED: 'AUTH_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS: 'AUTH_INSUFFICIENT_PERMISSIONS',

  // System errors
  BROWSER_UNSUPPORTED: 'SYSTEM_BROWSER_UNSUPPORTED',
  MEMORY_LIMIT_EXCEEDED: 'SYSTEM_MEMORY_LIMIT_EXCEEDED',
  STORAGE_QUOTA_EXCEEDED: 'SYSTEM_STORAGE_QUOTA_EXCEEDED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

// User-friendly error messages
export const ERROR_MESSAGES: Record<
  string,
  {
    userMessage: string
    suggestions: string[]
    category: ErrorCategory
    severity: ErrorSeverity
    retryStrategy: RetryStrategy
    isTemporary: boolean
  }
> = {
  [ERROR_CODES.INVALID_FILE_TYPE]: {
    userMessage:
      'This file type is not supported. Please select a valid image file.',
    suggestions: [
      'Use JPEG, PNG, or WebP format',
      'Check the file extension',
      'Convert the file to a supported format',
    ],
    category: 'validation',
    severity: 'medium',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.FILE_TOO_LARGE]: {
    userMessage:
      'This file is too large. Please select a smaller file or compress it.',
    suggestions: [
      'Compress the image before uploading',
      'Use a lower resolution image',
      'Try our automatic compression feature',
    ],
    category: 'validation',
    severity: 'medium',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.FILE_TOO_SMALL]: {
    userMessage:
      'This file is too small. Please select a higher quality image.',
    suggestions: [
      'Use a higher resolution image',
      'Check if the file is corrupted',
      'Select a different image',
    ],
    category: 'validation',
    severity: 'low',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.INVALID_DIMENSIONS]: {
    userMessage: 'Image dimensions are not within the allowed range.',
    suggestions: [
      'Resize the image to meet requirements',
      'Check the maximum allowed dimensions',
      'Use image editing software to adjust size',
    ],
    category: 'validation',
    severity: 'medium',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.TOO_MANY_FILES]: {
    userMessage: 'Too many files selected. Please reduce the number of files.',
    suggestions: [
      'Select fewer files',
      'Upload files in smaller batches',
      'Check the maximum file limit',
    ],
    category: 'validation',
    severity: 'medium',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.COMPRESSION_FAILED]: {
    userMessage:
      'Failed to compress the image. Uploading original file instead.',
    suggestions: [
      'Try uploading without compression',
      'Use a different image format',
      'Reduce image size manually',
    ],
    category: 'compression',
    severity: 'low',
    retryStrategy: 'immediate',
    isTemporary: true,
  },
  [ERROR_CODES.COMPRESSION_MEMORY_ERROR]: {
    userMessage: 'Not enough memory to compress this large image.',
    suggestions: [
      'Close other browser tabs',
      'Use a smaller image',
      'Try uploading without compression',
    ],
    category: 'compression',
    severity: 'medium',
    retryStrategy: 'manual',
    isTemporary: true,
  },
  [ERROR_CODES.UPLOAD_FAILED]: {
    userMessage: 'Upload failed. Please try again.',
    suggestions: [
      'Check your internet connection',
      'Try uploading again',
      'Refresh the page and retry',
    ],
    category: 'upload',
    severity: 'medium',
    retryStrategy: 'exponential',
    isTemporary: true,
  },
  [ERROR_CODES.UPLOAD_TIMEOUT]: {
    userMessage:
      'Upload timed out. Please check your connection and try again.',
    suggestions: [
      'Check your internet speed',
      'Try uploading smaller files',
      'Retry the upload',
    ],
    category: 'upload',
    severity: 'medium',
    retryStrategy: 'exponential',
    isTemporary: true,
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    userMessage: 'Network error occurred. Please check your connection.',
    suggestions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the problem persists',
    ],
    category: 'network',
    severity: 'high',
    retryStrategy: 'exponential',
    isTemporary: true,
  },
  [ERROR_CODES.NETWORK_OFFLINE]: {
    userMessage:
      'You appear to be offline. Please check your internet connection.',
    suggestions: [
      'Check your internet connection',
      'Try again when back online',
      'Files will be saved for retry when connected',
    ],
    category: 'network',
    severity: 'high',
    retryStrategy: 'manual',
    isTemporary: true,
  },
  [ERROR_CODES.AUTH_REQUIRED]: {
    userMessage: 'Please sign in to upload files.',
    suggestions: [
      'Sign in to your account',
      "Create an account if you don't have one",
      'Check if your session has expired',
    ],
    category: 'authentication',
    severity: 'high',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.AUTH_EXPIRED]: {
    userMessage: 'Your session has expired. Please sign in again.',
    suggestions: [
      'Sign in again',
      'Refresh the page',
      'Your files will be saved for retry after signing in',
    ],
    category: 'authentication',
    severity: 'medium',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.BROWSER_UNSUPPORTED]: {
    userMessage:
      "Your browser doesn't support this feature. Please update or use a different browser.",
    suggestions: [
      'Update your browser to the latest version',
      'Use Chrome, Firefox, Safari, or Edge',
      'Enable JavaScript if disabled',
    ],
    category: 'system',
    severity: 'critical',
    retryStrategy: 'none',
    isTemporary: false,
  },
  [ERROR_CODES.MEMORY_LIMIT_EXCEEDED]: {
    userMessage: 'Not enough memory to process this file.',
    suggestions: [
      'Close other browser tabs',
      'Use smaller files',
      'Restart your browser',
    ],
    category: 'system',
    severity: 'high',
    retryStrategy: 'manual',
    isTemporary: true,
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    userMessage: 'An unexpected error occurred. Please try again.',
    suggestions: [
      'Try again in a few moments',
      'Refresh the page',
      'Contact support if the problem persists',
    ],
    category: 'unknown',
    severity: 'medium',
    retryStrategy: 'exponential',
    isTemporary: true,
  },
}

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
