/**
 * Retry Logic and Error Handling System
 *
 * This module provides comprehensive retry mechanisms, circuit breaker patterns,
 * advanced error classification, and monitoring capabilities for AI services.
 *
 * Features:
 * - Configurable retry strategies with jitter
 * - Circuit breaker patterns for service protection
 * - Advanced error classification and handling
 * - Comprehensive logging and monitoring
 * - Fallback mechanisms and graceful degradation
 * - Performance tracking and SLA monitoring
 */

import { z } from 'zod'
import { EventEmitter } from 'events'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type RetryStrategyType = 'exponential' | 'linear' | 'fixed' | 'custom'
export type CircuitState = 'closed' | 'open' | 'half-open'
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'rate-limit'
  | 'content-safety'
  | 'validation'
  | 'timeout'
  | 'service-unavailable'
  | 'unknown'

export interface RetryConfig {
  strategy: RetryStrategyType
  maxAttempts: number
  baseDelayMs: number
  maxDelayMs: number
  jitterMs: number
  backoffMultiplier: number
  retryableErrors: string[]
  nonRetryableErrors: string[]
  customDelayFunction?: (attempt: number, baseDelay: number) => number
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeoutMs: number
  monitoringWindowMs: number
  minimumThroughput: number
  errorThresholdPercentage: number
  halfOpenMaxCalls: number
}

export interface ErrorHandlingConfig {
  enableCircuitBreaker: boolean
  enableRetries: boolean
  enableFallbacks: boolean
  enableLogging: boolean
  enableMetrics: boolean
  correlationIdHeader: string
  logLevel: 'debug' | 'info' | 'warn' | 'error'
}

export interface RetryAttempt {
  attemptNumber: number
  delayMs: number
  error: Error
  timestamp: Date
  correlationId: string
}

export interface CircuitBreakerMetrics {
  state: CircuitState
  failureCount: number
  successCount: number
  totalRequests: number
  lastFailureTime?: Date
  lastSuccessTime?: Date
  errorRate: number
  averageResponseTime: number
}

export interface ErrorMetrics {
  errorCode: string
  category: ErrorCategory
  severity: ErrorSeverity
  count: number
  lastOccurrence: Date
  averageRetryCount: number
  successAfterRetryRate: number
}

export interface OperationResult<T> {
  success: boolean
  data?: T
  error?: EnhancedError
  metadata: {
    attemptCount: number
    totalDurationMs: number
    circuitBreakerState: CircuitState
    correlationId: string
    fallbackUsed: boolean
  }
}

// ============================================================================
// Enhanced Error Classes
// ============================================================================

export class EnhancedError extends Error {
  public readonly timestamp: Date
  public readonly correlationId: string
  public readonly context: Record<string, any>

  constructor(
    message: string,
    public readonly code: string,
    public readonly category: ErrorCategory,
    public readonly severity: ErrorSeverity,
    public readonly retryable: boolean,
    public readonly originalError?: Error,
    context: Record<string, any> = {},
    correlationId?: string
  ) {
    super(message)
    this.name = 'EnhancedError'
    this.timestamp = new Date()
    this.correlationId = correlationId || this.generateCorrelationId()
    this.context = context
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      retryable: this.retryable,
      timestamp: this.timestamp.toISOString(),
      correlationId: this.correlationId,
      context: this.context,
      stack: this.stack,
    }
  }
}

export class NetworkError extends EnhancedError {
  constructor(
    message: string,
    originalError?: Error,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      'NETWORK_ERROR',
      'network',
      'medium',
      true,
      originalError,
      context
    )
  }
}

export class AuthenticationError extends EnhancedError {
  constructor(
    message: string,
    originalError?: Error,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      'AUTHENTICATION_ERROR',
      'authentication',
      'high',
      false,
      originalError,
      context
    )
  }
}

export class RateLimitError extends EnhancedError {
  constructor(
    message: string,
    public readonly retryAfterMs?: number,
    originalError?: Error,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      'RATE_LIMIT_ERROR',
      'rate-limit',
      'medium',
      true,
      originalError,
      context
    )
  }
}

export class TimeoutError extends EnhancedError {
  constructor(
    message: string,
    originalError?: Error,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      'TIMEOUT_ERROR',
      'timeout',
      'medium',
      true,
      originalError,
      context
    )
  }
}

export class ServiceUnavailableError extends EnhancedError {
  constructor(
    message: string,
    originalError?: Error,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      'SERVICE_UNAVAILABLE',
      'service-unavailable',
      'high',
      true,
      originalError,
      context
    )
  }
}

export class ValidationError extends EnhancedError {
  constructor(
    message: string,
    originalError?: Error,
    context: Record<string, any> = {}
  ) {
    super(
      message,
      'VALIDATION_ERROR',
      'validation',
      'low',
      false,
      originalError,
      context
    )
  }
}

// ============================================================================
// Validation Schemas
// ============================================================================

const RetryConfigSchema = z.object({
  strategy: z.enum(['exponential', 'linear', 'fixed', 'custom']),
  maxAttempts: z.number().min(1).max(10),
  baseDelayMs: z.number().min(10).max(10000),
  maxDelayMs: z.number().min(100).max(60000),
  jitterMs: z.number().min(0).max(5000),
  backoffMultiplier: z.number().min(1).max(5),
  retryableErrors: z.array(z.string()),
  nonRetryableErrors: z.array(z.string()),
  customDelayFunction: z
    .function()
    .args(z.number(), z.number())
    .returns(z.number())
    .optional(),
})

const CircuitBreakerConfigSchema = z.object({
  failureThreshold: z.number().min(1).max(100),
  recoveryTimeoutMs: z.number().min(100).max(300000),
  monitoringWindowMs: z.number().min(1000).max(600000),
  minimumThroughput: z.number().min(1).max(1000),
  errorThresholdPercentage: z.number().min(1).max(100),
  halfOpenMaxCalls: z.number().min(1).max(10),
})

// ============================================================================
// Retry Strategy Implementation
// ============================================================================

export class RetryStrategyService {
  private config: RetryConfig

  constructor(config: RetryConfig) {
    this.config = RetryConfigSchema.parse(config)
  }

  calculateDelay(attempt: number): number {
    let delay: number

    switch (this.config.strategy) {
      case 'exponential':
        delay =
          this.config.baseDelayMs *
          Math.pow(this.config.backoffMultiplier, attempt - 1)
        break
      case 'linear':
        delay = this.config.baseDelayMs * attempt
        break
      case 'fixed':
        delay = this.config.baseDelayMs
        break
      case 'custom':
        if (this.config.customDelayFunction) {
          delay = this.config.customDelayFunction(
            attempt,
            this.config.baseDelayMs
          )
        } else {
          delay = this.config.baseDelayMs
        }
        break
      default:
        delay = this.config.baseDelayMs
    }

    // Apply jitter to prevent thundering herd
    const jitter = Math.random() * this.config.jitterMs
    delay += jitter

    // Ensure delay doesn't exceed maximum
    return Math.min(delay, this.config.maxDelayMs)
  }

  shouldRetry(error: Error, attempt: number): boolean {
    if (attempt >= this.config.maxAttempts) {
      return false
    }

    // Check if error is explicitly non-retryable
    if (error instanceof EnhancedError) {
      if (!error.retryable) {
        return false
      }
      if (this.config.nonRetryableErrors.includes(error.code)) {
        return false
      }
      if (
        this.config.retryableErrors.length > 0 &&
        !this.config.retryableErrors.includes(error.code)
      ) {
        return false
      }
    }

    return true
  }

  getConfig(): RetryConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<RetryConfig>): void {
    this.config = RetryConfigSchema.parse({ ...this.config, ...newConfig })
  }
}

// ============================================================================
// Circuit Breaker Implementation
// ============================================================================

export class CircuitBreakerService extends EventEmitter {
  private config: CircuitBreakerConfig
  private state: CircuitState = 'closed'
  private failureCount = 0
  private successCount = 0
  private totalRequests = 0
  private lastFailureTime?: Date
  private lastSuccessTime?: Date
  private nextAttemptTime?: Date
  private halfOpenCallCount = 0
  private responseTimeSum = 0

  constructor(config: CircuitBreakerConfig) {
    super()
    this.config = CircuitBreakerConfigSchema.parse(config)
  }

  async execute<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    if (!this.canExecute()) {
      throw new ServiceUnavailableError(
        `Circuit breaker is ${this.state} for operation: ${operationName}`,
        undefined,
        { operationName, circuitState: this.state }
      )
    }

    const startTime = Date.now()
    this.totalRequests++

    try {
      const result = await operation()
      this.onSuccess(Date.now() - startTime)
      return result
    } catch (error) {
      this.onFailure(error as Error)
      throw error
    }
  }

  private canExecute(): boolean {
    switch (this.state) {
      case 'closed':
        return true
      case 'open':
        if (
          this.nextAttemptTime &&
          Date.now() >= this.nextAttemptTime.getTime()
        ) {
          this.state = 'half-open'
          this.halfOpenCallCount = 0
          this.emit('stateChange', { from: 'open', to: 'half-open' })
          return true
        }
        return false
      case 'half-open':
        return this.halfOpenCallCount < this.config.halfOpenMaxCalls
      default:
        return false
    }
  }

  private onSuccess(responseTimeMs: number): void {
    this.successCount++
    this.lastSuccessTime = new Date()
    this.responseTimeSum += responseTimeMs

    if (this.state === 'half-open') {
      this.halfOpenCallCount++
      if (this.halfOpenCallCount >= this.config.halfOpenMaxCalls) {
        this.reset()
      }
    }
  }

  private onFailure(error: Error): void {
    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.state === 'half-open') {
      this.open()
    } else if (this.state === 'closed' && this.shouldOpen()) {
      this.open()
    }
  }

  private shouldOpen(): boolean {
    if (this.totalRequests < this.config.minimumThroughput) {
      return false
    }

    const errorRate = (this.failureCount / this.totalRequests) * 100
    return errorRate >= this.config.errorThresholdPercentage
  }

  private open(): void {
    const previousState = this.state
    this.state = 'open'
    this.nextAttemptTime = new Date(Date.now() + this.config.recoveryTimeoutMs)
    this.emit('stateChange', { from: previousState, to: 'open' })
  }

  private reset(): void {
    this.state = 'closed'
    this.failureCount = 0
    this.successCount = 0
    this.totalRequests = 0
    this.halfOpenCallCount = 0
    this.nextAttemptTime = undefined
    this.emit('stateChange', { from: 'half-open', to: 'closed' })
  }

  getMetrics(): CircuitBreakerMetrics {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      totalRequests: this.totalRequests,
      lastFailureTime: this.lastFailureTime,
      lastSuccessTime: this.lastSuccessTime,
      errorRate:
        this.totalRequests > 0
          ? (this.failureCount / this.totalRequests) * 100
          : 0,
      averageResponseTime:
        this.successCount > 0 ? this.responseTimeSum / this.successCount : 0,
    }
  }

  getState(): CircuitState {
    return this.state
  }

  getConfig(): CircuitBreakerConfig {
    return { ...this.config }
  }

  updateConfig(newConfig: Partial<CircuitBreakerConfig>): void {
    this.config = CircuitBreakerConfigSchema.parse({
      ...this.config,
      ...newConfig,
    })
  }
}

// ============================================================================
// Error Classifier
// ============================================================================

export class ErrorClassifierService {
  private static readonly ERROR_PATTERNS: Array<{
    pattern: RegExp
    category: ErrorCategory
    severity: ErrorSeverity
    retryable: boolean
    code: string
  }> = [
    // Network errors
    {
      pattern: /ECONNREFUSED|ENOTFOUND|ECONNRESET|ETIMEDOUT/i,
      category: 'network',
      severity: 'medium',
      retryable: true,
      code: 'NETWORK_CONNECTION_ERROR',
    },
    {
      pattern: /fetch.*failed|network.*error/i,
      category: 'network',
      severity: 'medium',
      retryable: true,
      code: 'NETWORK_FETCH_ERROR',
    },

    // Authentication errors
    {
      pattern: /unauthorized|invalid.*key|authentication.*failed/i,
      category: 'authentication',
      severity: 'high',
      retryable: false,
      code: 'AUTHENTICATION_FAILED',
    },
    {
      pattern: /forbidden|access.*denied/i,
      category: 'authentication',
      severity: 'high',
      retryable: false,
      code: 'ACCESS_DENIED',
    },

    // Rate limiting
    {
      pattern: /rate.*limit|too.*many.*requests|quota.*exceeded/i,
      category: 'rate-limit',
      severity: 'medium',
      retryable: true,
      code: 'RATE_LIMIT_EXCEEDED',
    },

    // Timeouts
    {
      pattern: /timeout|timed.*out/i,
      category: 'timeout',
      severity: 'medium',
      retryable: true,
      code: 'REQUEST_TIMEOUT',
    },

    // Service unavailable
    {
      pattern: /service.*unavailable|server.*error|internal.*error/i,
      category: 'service-unavailable',
      severity: 'high',
      retryable: true,
      code: 'SERVICE_UNAVAILABLE',
    },
    {
      pattern: /502|503|504/i,
      category: 'service-unavailable',
      severity: 'high',
      retryable: true,
      code: 'HTTP_SERVER_ERROR',
    },

    // Validation errors
    {
      pattern: /validation.*error|invalid.*input|bad.*request/i,
      category: 'validation',
      severity: 'low',
      retryable: false,
      code: 'VALIDATION_ERROR',
    },
    {
      pattern: /400/i,
      category: 'validation',
      severity: 'low',
      retryable: false,
      code: 'HTTP_BAD_REQUEST',
    },
  ]

  static classify(error: Error): EnhancedError {
    if (error instanceof EnhancedError) {
      return error
    }

    const errorMessage = error.message.toLowerCase()

    for (const pattern of this.ERROR_PATTERNS) {
      if (pattern.pattern.test(errorMessage)) {
        return new EnhancedError(
          error.message,
          pattern.code,
          pattern.category,
          pattern.severity,
          pattern.retryable,
          error,
          { originalErrorName: error.name }
        )
      }
    }

    // Default classification for unknown errors
    return new EnhancedError(
      error.message,
      'UNKNOWN_ERROR',
      'unknown',
      'medium',
      true,
      error,
      { originalErrorName: error.name }
    )
  }

  static isRetryable(error: Error): boolean {
    const classified = this.classify(error)
    return classified.retryable
  }

  static getSeverity(error: Error): ErrorSeverity {
    const classified = this.classify(error)
    return classified.severity
  }

  static getCategory(error: Error): ErrorCategory {
    const classified = this.classify(error)
    return classified.category
  }
}

// ============================================================================
// Metrics Collector
// ============================================================================

export class MetricsCollectorService extends EventEmitter {
  private errorMetrics = new Map<string, ErrorMetrics>()
  private operationMetrics = new Map<
    string,
    {
      totalCalls: number
      successfulCalls: number
      failedCalls: number
      totalDurationMs: number
      averageDurationMs: number
    }
  >()

  recordError(error: EnhancedError, retryCount: number): void {
    const key = `${error.category}:${error.code}`
    const existing = this.errorMetrics.get(key)

    if (existing) {
      existing.count++
      existing.lastOccurrence = new Date()
      existing.averageRetryCount = (existing.averageRetryCount + retryCount) / 2
    } else {
      this.errorMetrics.set(key, {
        errorCode: error.code,
        category: error.category,
        severity: error.severity,
        count: 1,
        lastOccurrence: new Date(),
        averageRetryCount: retryCount,
        successAfterRetryRate: 0,
      })
    }

    this.emit('errorRecorded', { error, retryCount })
  }

  recordOperation(
    operationName: string,
    durationMs: number,
    success: boolean
  ): void {
    const existing = this.operationMetrics.get(operationName)

    if (existing) {
      existing.totalCalls++
      existing.totalDurationMs += durationMs
      existing.averageDurationMs =
        existing.totalDurationMs / existing.totalCalls

      if (success) {
        existing.successfulCalls++
      } else {
        existing.failedCalls++
      }
    } else {
      this.operationMetrics.set(operationName, {
        totalCalls: 1,
        successfulCalls: success ? 1 : 0,
        failedCalls: success ? 0 : 1,
        totalDurationMs: durationMs,
        averageDurationMs: durationMs,
      })
    }

    this.emit('operationRecorded', { operationName, durationMs, success })
  }

  getErrorMetrics(): Map<string, ErrorMetrics> {
    return new Map(this.errorMetrics)
  }

  getOperationMetrics(): Map<string, any> {
    return new Map(this.operationMetrics)
  }

  getTopErrors(limit = 10): ErrorMetrics[] {
    return Array.from(this.errorMetrics.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  reset(): void {
    this.errorMetrics.clear()
    this.operationMetrics.clear()
    this.emit('metricsReset')
  }
}

// ============================================================================
// Logger
// ============================================================================

export class StructuredLoggerService {
  private logLevel: 'debug' | 'info' | 'warn' | 'error'

  constructor(logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info') {
    this.logLevel = logLevel
  }

  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 }
    return levels[level] >= levels[this.logLevel]
  }

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    if (!this.shouldLog(level)) return

    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...data,
    }

    console[level](JSON.stringify(logEntry))
  }

  debug(message: string, data?: any): void {
    this.log('debug', message, data)
  }

  info(message: string, data?: any): void {
    this.log('info', message, data)
  }

  warn(message: string, data?: any): void {
    this.log('warn', message, data)
  }

  error(message: string, data?: any): void {
    this.log('error', message, data)
  }

  logRetryAttempt(attempt: RetryAttempt): void {
    this.warn('Retry attempt', {
      correlationId: attempt.correlationId,
      attemptNumber: attempt.attemptNumber,
      delayMs: attempt.delayMs,
      error: attempt.error.message,
      errorCode:
        attempt.error instanceof EnhancedError ? attempt.error.code : 'UNKNOWN',
    })
  }

  logCircuitBreakerStateChange(
    from: CircuitState,
    to: CircuitState,
    operationName: string
  ): void {
    this.warn('Circuit breaker state change', {
      operationName,
      from,
      to,
      timestamp: new Date().toISOString(),
    })
  }

  logOperationResult<T>(
    operationName: string,
    result: OperationResult<T>
  ): void {
    const level = result.success ? 'info' : 'error'
    this.log(
      level,
      `Operation ${result.success ? 'succeeded' : 'failed'}: ${operationName}`,
      {
        correlationId: result.metadata.correlationId,
        attemptCount: result.metadata.attemptCount,
        totalDurationMs: result.metadata.totalDurationMs,
        circuitBreakerState: result.metadata.circuitBreakerState,
        fallbackUsed: result.metadata.fallbackUsed,
        error: result.error?.toJSON(),
      }
    )
  }
}

// ============================================================================
// Main Retry and Error Handling Service
// ============================================================================

export class RetryErrorHandlingService extends EventEmitter {
  private retryStrategy: RetryStrategyService
  private circuitBreaker: CircuitBreakerService
  private metricsCollector: MetricsCollectorService
  private logger: StructuredLoggerService
  private config: ErrorHandlingConfig

  constructor(
    retryConfig: RetryConfig,
    circuitBreakerConfig: CircuitBreakerConfig,
    errorHandlingConfig: ErrorHandlingConfig
  ) {
    super()

    this.retryStrategy = new RetryStrategyService(retryConfig)
    this.circuitBreaker = new CircuitBreakerService(circuitBreakerConfig)
    this.metricsCollector = new MetricsCollectorService()
    this.logger = new StructuredLoggerService(errorHandlingConfig.logLevel)
    this.config = errorHandlingConfig

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    this.circuitBreaker.on('stateChange', ({ from, to }) => {
      this.logger.logCircuitBreakerStateChange(from, to, 'ai-service')
      this.emit('circuitBreakerStateChange', { from, to })
    })

    this.metricsCollector.on('errorRecorded', data => {
      this.emit('errorRecorded', data)
    })

    this.metricsCollector.on('operationRecorded', data => {
      this.emit('operationRecorded', data)
    })
  }

  async executeWithRetryAndCircuitBreaker<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallbackOperation?: () => Promise<T>
  ): Promise<OperationResult<T>> {
    const correlationId = this.generateCorrelationId()
    const startTime = Date.now()
    const attemptCount = 0
    let lastError: EnhancedError | undefined
    let fallbackUsed = false

    this.logger.debug(`Starting operation: ${operationName}`, { correlationId })

    // Circuit breaker check
    if (this.config.enableCircuitBreaker) {
      try {
        const result = await this.circuitBreaker.execute(async () => {
          return await this.executeWithRetry(
            operation,
            operationName,
            correlationId
          )
        }, operationName)

        const totalDuration = Date.now() - startTime
        const operationResult: OperationResult<T> = {
          success: true,
          data: result.data,
          metadata: {
            attemptCount: result.attemptCount,
            totalDurationMs: totalDuration,
            circuitBreakerState: this.circuitBreaker.getState(),
            correlationId,
            fallbackUsed,
          },
        }

        this.metricsCollector.recordOperation(
          operationName,
          totalDuration,
          true
        )
        this.logger.logOperationResult(operationName, operationResult)

        return operationResult
      } catch (error) {
        lastError = ErrorClassifierService.classify(error as Error)

        // Try fallback if circuit breaker is open and fallback is available
        if (
          this.config.enableFallbacks &&
          fallbackOperation &&
          this.circuitBreaker.getState() === 'open'
        ) {
          try {
            this.logger.info(
              `Circuit breaker open, trying fallback for: ${operationName}`,
              { correlationId }
            )
            const fallbackResult = await fallbackOperation()
            fallbackUsed = true

            const totalDuration = Date.now() - startTime
            const operationResult: OperationResult<T> = {
              success: true,
              data: fallbackResult,
              metadata: {
                attemptCount: 1,
                totalDurationMs: totalDuration,
                circuitBreakerState: this.circuitBreaker.getState(),
                correlationId,
                fallbackUsed,
              },
            }

            this.metricsCollector.recordOperation(
              `${operationName}-fallback`,
              totalDuration,
              true
            )
            this.logger.logOperationResult(
              `${operationName}-fallback`,
              operationResult
            )

            return operationResult
          } catch (fallbackError) {
            this.logger.error(`Fallback also failed for: ${operationName}`, {
              correlationId,
              fallbackError:
                fallbackError instanceof Error
                  ? fallbackError.message
                  : String(fallbackError),
            })
          }
        }
      }
    } else {
      // Execute without circuit breaker
      try {
        const result = await this.executeWithRetry(
          operation,
          operationName,
          correlationId
        )

        const totalDuration = Date.now() - startTime
        const operationResult: OperationResult<T> = {
          success: true,
          data: result.data,
          metadata: {
            attemptCount: result.attemptCount,
            totalDurationMs: totalDuration,
            circuitBreakerState: 'closed',
            correlationId,
            fallbackUsed,
          },
        }

        this.metricsCollector.recordOperation(
          operationName,
          totalDuration,
          true
        )
        this.logger.logOperationResult(operationName, operationResult)

        return operationResult
      } catch (error) {
        lastError = ErrorClassifierService.classify(error as Error)
      }
    }

    // If we reach here, all attempts failed
    const totalDuration = Date.now() - startTime
    const operationResult: OperationResult<T> = {
      success: false,
      error: lastError,
      metadata: {
        attemptCount,
        totalDurationMs: totalDuration,
        circuitBreakerState: this.circuitBreaker.getState(),
        correlationId,
        fallbackUsed,
      },
    }

    this.metricsCollector.recordOperation(operationName, totalDuration, false)
    this.metricsCollector.recordError(lastError!, attemptCount)
    this.logger.logOperationResult(operationName, operationResult)

    return operationResult
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    correlationId: string
  ): Promise<{ data: T; attemptCount: number }> {
    let attemptCount = 0
    let lastError: Error

    while (true) {
      attemptCount++

      try {
        const result = await operation()
        return { data: result, attemptCount }
      } catch (error) {
        lastError = error as Error
        const classifiedError = ErrorClassifierService.classify(lastError)

        if (
          !this.config.enableRetries ||
          !this.retryStrategy.shouldRetry(classifiedError, attemptCount)
        ) {
          throw classifiedError
        }

        const delayMs = this.retryStrategy.calculateDelay(attemptCount)
        const retryAttempt: RetryAttempt = {
          attemptNumber: attemptCount,
          delayMs,
          error: classifiedError,
          timestamp: new Date(),
          correlationId,
        }

        this.logger.logRetryAttempt(retryAttempt)
        this.emit('retryAttempt', retryAttempt)

        await this.sleep(delayMs)
      }
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  getMetrics() {
    return {
      circuitBreaker: this.circuitBreaker.getMetrics(),
      errors: this.metricsCollector.getErrorMetrics(),
      operations: this.metricsCollector.getOperationMetrics(),
      topErrors: this.metricsCollector.getTopErrors(),
    }
  }

  getCircuitBreakerState(): CircuitState {
    return this.circuitBreaker.getState()
  }

  updateRetryConfig(config: Partial<RetryConfig>): void {
    this.retryStrategy.updateConfig(config)
  }

  updateCircuitBreakerConfig(config: Partial<CircuitBreakerConfig>): void {
    this.circuitBreaker.updateConfig(config)
  }

  resetMetrics(): void {
    this.metricsCollector.reset()
  }

  setLogLevel(level: 'debug' | 'info' | 'warn' | 'error'): void {
    this.logger = new StructuredLoggerService(level)
  }
}

// ============================================================================
// Factory Functions and Default Configurations
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  strategy: 'exponential',
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 30000,
  jitterMs: 500,
  backoffMultiplier: 2,
  retryableErrors: [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'RATE_LIMIT_ERROR',
    'SERVICE_UNAVAILABLE',
    'HTTP_SERVER_ERROR',
  ],
  nonRetryableErrors: [
    'AUTHENTICATION_ERROR',
    'ACCESS_DENIED',
    'VALIDATION_ERROR',
    'HTTP_BAD_REQUEST',
  ],
}

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  recoveryTimeoutMs: 60000,
  monitoringWindowMs: 120000,
  minimumThroughput: 10,
  errorThresholdPercentage: 50,
  halfOpenMaxCalls: 3,
}

export const DEFAULT_ERROR_HANDLING_CONFIG: ErrorHandlingConfig = {
  enableCircuitBreaker: true,
  enableRetries: true,
  enableFallbacks: true,
  enableLogging: true,
  enableMetrics: true,
  correlationIdHeader: 'x-correlation-id',
  logLevel: 'info',
}

export function createRetryErrorHandlingService(
  retryConfig: Partial<RetryConfig> = {},
  circuitBreakerConfig: Partial<CircuitBreakerConfig> = {},
  errorHandlingConfig: Partial<ErrorHandlingConfig> = {}
): RetryErrorHandlingService {
  return new RetryErrorHandlingService(
    { ...DEFAULT_RETRY_CONFIG, ...retryConfig },
    { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...circuitBreakerConfig },
    { ...DEFAULT_ERROR_HANDLING_CONFIG, ...errorHandlingConfig }
  )
}

// Export all types and utilities for backward compatibility
export {
  RetryStrategyService as RetryStrategy,
  CircuitBreakerService as CircuitBreaker,
  ErrorClassifierService as ErrorClassifier,
  MetricsCollectorService as MetricsCollector,
  StructuredLoggerService as StructuredLogger,
}
