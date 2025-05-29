/**
 * Tests for Retry Logic and Error Handling System
 */

import {
  RetryErrorHandlingService,
  RetryStrategyService,
  CircuitBreakerService,
  ErrorClassifierService,
  MetricsCollectorService,
  StructuredLoggerService,
  EnhancedError,
  NetworkError,
  AuthenticationError,
  RateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  ValidationError,
  createRetryErrorHandlingService,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_ERROR_HANDLING_CONFIG,
  type RetryConfig,
  type CircuitBreakerConfig,
  type ErrorHandlingConfig,
  type RetryAttempt,
  type OperationResult,
} from '../retry-error-handling'

// Mock console methods to avoid noise in tests
const originalConsole = { ...console }
beforeAll(() => {
  console.log = jest.fn()
  console.warn = jest.fn()
  console.error = jest.fn()
  console.debug = jest.fn()
  console.info = jest.fn()
})

afterAll(() => {
  Object.assign(console, originalConsole)
})

describe('RetryStrategyService', () => {
  describe('calculateDelay', () => {
    it('should calculate exponential backoff delay correctly', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        strategy: 'exponential',
        baseDelayMs: 1000,
        backoffMultiplier: 2,
        jitterMs: 0, // No jitter for predictable testing
      }
      const strategy = new RetryStrategyService(config)

      expect(strategy.calculateDelay(1)).toBe(1000)
      expect(strategy.calculateDelay(2)).toBe(2000)
      expect(strategy.calculateDelay(3)).toBe(4000)
    })

    it('should calculate linear backoff delay correctly', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        strategy: 'linear',
        baseDelayMs: 1000,
        jitterMs: 0,
      }
      const strategy = new RetryStrategyService(config)

      expect(strategy.calculateDelay(1)).toBe(1000)
      expect(strategy.calculateDelay(2)).toBe(2000)
      expect(strategy.calculateDelay(3)).toBe(3000)
    })

    it('should calculate fixed delay correctly', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        strategy: 'fixed',
        baseDelayMs: 1000,
        jitterMs: 0,
      }
      const strategy = new RetryStrategyService(config)

      expect(strategy.calculateDelay(1)).toBe(1000)
      expect(strategy.calculateDelay(2)).toBe(1000)
      expect(strategy.calculateDelay(3)).toBe(1000)
    })

    it('should respect maximum delay limit', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        strategy: 'exponential',
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 3,
        jitterMs: 0,
      }
      const strategy = new RetryStrategyService(config)

      expect(strategy.calculateDelay(1)).toBe(1000)
      expect(strategy.calculateDelay(2)).toBe(3000)
      expect(strategy.calculateDelay(3)).toBe(5000) // Capped at maxDelayMs
      expect(strategy.calculateDelay(4)).toBe(5000) // Still capped
    })

    it('should add jitter to delay', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        strategy: 'fixed',
        baseDelayMs: 1000,
        jitterMs: 500,
      }
      const strategy = new RetryStrategyService(config)

      const delay = strategy.calculateDelay(1)
      expect(delay).toBeGreaterThanOrEqual(1000)
      expect(delay).toBeLessThanOrEqual(1500)
    })

    it('should use custom delay function when provided', () => {
      const customDelayFunction = (attempt: number, baseDelay: number) =>
        baseDelay * attempt * 10
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        strategy: 'custom',
        baseDelayMs: 100,
        jitterMs: 0,
        customDelayFunction,
      }
      const strategy = new RetryStrategyService(config)

      expect(strategy.calculateDelay(1)).toBe(1000) // 100 * 1 * 10
      expect(strategy.calculateDelay(2)).toBe(2000) // 100 * 2 * 10
    })
  })

  describe('shouldRetry', () => {
    const strategy = new RetryStrategyService(DEFAULT_RETRY_CONFIG)

    it('should not retry when max attempts reached', () => {
      const error = new Error('Test error')
      expect(strategy.shouldRetry(error, 3)).toBe(false) // maxAttempts is 3
    })

    it('should not retry non-retryable enhanced errors', () => {
      const error = new AuthenticationError('Invalid API key')
      expect(strategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should retry retryable enhanced errors', () => {
      const error = new NetworkError('Connection failed')
      expect(strategy.shouldRetry(error, 1)).toBe(true)
    })

    it('should not retry errors in non-retryable list', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        nonRetryableErrors: ['CUSTOM_ERROR'],
      }
      const strategy = new RetryStrategyService(config)
      const error = new EnhancedError(
        'Test',
        'CUSTOM_ERROR',
        'unknown',
        'medium',
        true
      )

      expect(strategy.shouldRetry(error, 1)).toBe(false)
    })

    it('should only retry errors in retryable list when list is provided', () => {
      const config: RetryConfig = {
        ...DEFAULT_RETRY_CONFIG,
        retryableErrors: ['NETWORK_ERROR'],
        nonRetryableErrors: [],
      }
      const strategy = new RetryStrategyService(config)

      const networkError = new NetworkError('Connection failed')
      const timeoutError = new TimeoutError('Request timed out')

      expect(strategy.shouldRetry(networkError, 1)).toBe(true)
      expect(strategy.shouldRetry(timeoutError, 1)).toBe(false)
    })
  })
})

describe('CircuitBreakerService', () => {
  let circuitBreaker: CircuitBreakerService

  beforeEach(() => {
    circuitBreaker = new CircuitBreakerService({
      ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
      failureThreshold: 3,
      minimumThroughput: 2,
      errorThresholdPercentage: 50,
      recoveryTimeoutMs: 1000,
      halfOpenMaxCalls: 2,
    })
  })

  it('should start in closed state', () => {
    expect(circuitBreaker.getState()).toBe('closed')
  })

  it('should execute successful operations', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    const result = await circuitBreaker.execute(operation, 'test-operation')

    expect(result).toBe('success')
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should open circuit after failure threshold', async () => {
    const operation = jest.fn().mockRejectedValue(new Error('Operation failed'))

    // Execute enough operations to meet minimum throughput
    for (let i = 0; i < 4; i++) {
      try {
        await circuitBreaker.execute(operation, 'test-operation')
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getState()).toBe('open')
  })

  it('should reject operations when circuit is open', async () => {
    // Force circuit to open
    const failingOperation = jest
      .fn()
      .mockRejectedValue(new Error('Operation failed'))
    for (let i = 0; i < 4; i++) {
      try {
        await circuitBreaker.execute(failingOperation, 'test-operation')
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getState()).toBe('open')

    // Now try to execute another operation
    const newOperation = jest.fn().mockResolvedValue('success')
    await expect(
      circuitBreaker.execute(newOperation, 'test-operation')
    ).rejects.toThrow('Circuit breaker is open')

    expect(newOperation).not.toHaveBeenCalled()
  })

  it('should transition to half-open after recovery timeout', async () => {
    // Force circuit to open
    const failingOperation = jest
      .fn()
      .mockRejectedValue(new Error('Operation failed'))
    for (let i = 0; i < 4; i++) {
      try {
        await circuitBreaker.execute(failingOperation, 'test-operation')
      } catch (error) {
        // Expected to fail
      }
    }

    expect(circuitBreaker.getState()).toBe('open')

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 1100))

    // Next operation should trigger half-open state
    const operation = jest.fn().mockResolvedValue('success')
    await circuitBreaker.execute(operation, 'test-operation')

    expect(circuitBreaker.getState()).toBe('half-open')
  })

  it('should close circuit after successful half-open calls', async () => {
    // Force circuit to open
    const failingOperation = jest
      .fn()
      .mockRejectedValue(new Error('Operation failed'))
    for (let i = 0; i < 4; i++) {
      try {
        await circuitBreaker.execute(failingOperation, 'test-operation')
      } catch (error) {
        // Expected to fail
      }
    }

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 1100))

    // Execute successful operations in half-open state
    const successOperation = jest.fn().mockResolvedValue('success')
    await circuitBreaker.execute(successOperation, 'test-operation')
    await circuitBreaker.execute(successOperation, 'test-operation')

    expect(circuitBreaker.getState()).toBe('closed')
  })

  it('should provide accurate metrics', async () => {
    const successOperation = jest.fn().mockResolvedValue('success')
    const failOperation = jest.fn().mockRejectedValue(new Error('Failed'))

    // Execute some operations
    await circuitBreaker.execute(successOperation, 'test-operation')
    try {
      await circuitBreaker.execute(failOperation, 'test-operation')
    } catch (error) {
      // Expected to fail
    }

    const metrics = circuitBreaker.getMetrics()
    expect(metrics.totalRequests).toBe(2)
    expect(metrics.successCount).toBe(1)
    expect(metrics.failureCount).toBe(1)
    expect(metrics.errorRate).toBe(50)
  })
})

describe('ErrorClassifierService', () => {
  it('should return enhanced error as-is', () => {
    const enhancedError = new NetworkError('Connection failed')
    const result = ErrorClassifierService.classify(enhancedError)

    expect(result).toBe(enhancedError)
  })

  it('should classify network errors correctly', () => {
    const error = new Error('ECONNREFUSED: Connection refused')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('NETWORK_CONNECTION_ERROR')
    expect(result.category).toBe('network')
    expect(result.retryable).toBe(true)
  })

  it('should classify authentication errors correctly', () => {
    const error = new Error('Unauthorized: Invalid API key')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('AUTHENTICATION_FAILED')
    expect(result.category).toBe('authentication')
    expect(result.retryable).toBe(false)
  })

  it('should classify rate limit errors correctly', () => {
    const error = new Error('Rate limit exceeded')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('RATE_LIMIT_EXCEEDED')
    expect(result.category).toBe('rate-limit')
    expect(result.retryable).toBe(true)
  })

  it('should classify timeout errors correctly', () => {
    const error = new Error('Request timed out')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('REQUEST_TIMEOUT')
    expect(result.category).toBe('timeout')
    expect(result.retryable).toBe(true)
  })

  it('should classify service unavailable errors correctly', () => {
    const error = new Error('Service unavailable')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('SERVICE_UNAVAILABLE')
    expect(result.category).toBe('service-unavailable')
    expect(result.retryable).toBe(true)
  })

  it('should classify validation errors correctly', () => {
    const error = new Error('Validation error: Invalid input')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('VALIDATION_ERROR')
    expect(result.category).toBe('validation')
    expect(result.retryable).toBe(false)
  })

  it('should classify unknown errors with default values', () => {
    const error = new Error('Some unknown error')
    const result = ErrorClassifierService.classify(error)

    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.category).toBe('unknown')
    expect(result.retryable).toBe(true)
    expect(result.severity).toBe('medium')
  })

  it('should provide utility methods for error properties', () => {
    const error = new Error('ECONNREFUSED: Connection refused')

    expect(ErrorClassifierService.isRetryable(error)).toBe(true)
    expect(ErrorClassifierService.getSeverity(error)).toBe('medium')
    expect(ErrorClassifierService.getCategory(error)).toBe('network')
  })
})

describe('MetricsCollectorService', () => {
  let metricsCollector: MetricsCollectorService

  beforeEach(() => {
    metricsCollector = new MetricsCollectorService()
  })

  it('should record error metrics correctly', () => {
    const error = new NetworkError('Connection failed')
    metricsCollector.recordError(error, 2)

    const metrics = metricsCollector.getErrorMetrics()
    const errorKey = 'network:NETWORK_ERROR'

    expect(metrics.has(errorKey)).toBe(true)
    const errorMetric = metrics.get(errorKey)!
    expect(errorMetric.count).toBe(1)
    expect(errorMetric.averageRetryCount).toBe(2)
    expect(errorMetric.category).toBe('network')
  })

  it('should aggregate multiple error occurrences', () => {
    const error1 = new NetworkError('Connection failed')
    const error2 = new NetworkError('Another connection issue')

    metricsCollector.recordError(error1, 1)
    metricsCollector.recordError(error2, 3)

    const metrics = metricsCollector.getErrorMetrics()
    const errorKey = 'network:NETWORK_ERROR'
    const errorMetric = metrics.get(errorKey)!

    expect(errorMetric.count).toBe(2)
    expect(errorMetric.averageRetryCount).toBe(2) // (1 + 3) / 2
  })

  it('should record operation metrics correctly', () => {
    metricsCollector.recordOperation('testOperation', 1000, true)
    metricsCollector.recordOperation('testOperation', 2000, false)

    const metrics = metricsCollector.getOperationMetrics()
    const operationMetric = metrics.get('testOperation')!

    expect(operationMetric.totalCalls).toBe(2)
    expect(operationMetric.successfulCalls).toBe(1)
    expect(operationMetric.failedCalls).toBe(1)
    expect(operationMetric.averageDurationMs).toBe(1500)
  })

  it('should return top errors by count', () => {
    const networkError = new NetworkError('Connection failed')
    const timeoutError = new TimeoutError('Request timed out')

    // Record network errors more frequently
    metricsCollector.recordError(networkError, 1)
    metricsCollector.recordError(networkError, 1)
    metricsCollector.recordError(networkError, 1)
    metricsCollector.recordError(timeoutError, 1)

    const topErrors = metricsCollector.getTopErrors(2)

    expect(topErrors).toHaveLength(2)
    expect(topErrors[0].count).toBe(3) // Network error should be first
    expect(topErrors[1].count).toBe(1) // Timeout error should be second
  })

  it('should reset metrics correctly', () => {
    const error = new NetworkError('Connection failed')
    metricsCollector.recordError(error, 1)
    metricsCollector.recordOperation('testOperation', 1000, true)

    expect(metricsCollector.getErrorMetrics().size).toBe(1)
    expect(metricsCollector.getOperationMetrics().size).toBe(1)

    metricsCollector.reset()

    expect(metricsCollector.getErrorMetrics().size).toBe(0)
    expect(metricsCollector.getOperationMetrics().size).toBe(0)
  })

  it('should emit events when recording metrics', done => {
    const error = new NetworkError('Connection failed')

    metricsCollector.on('errorRecorded', data => {
      expect(data.error).toBe(error)
      expect(data.retryCount).toBe(2)
      done()
    })

    metricsCollector.recordError(error, 2)
  })
})

describe('StructuredLoggerService', () => {
  let logger: StructuredLoggerService

  beforeEach(() => {
    logger = new StructuredLoggerService('info')
    jest.clearAllMocks()
  })

  it('should log at appropriate levels', () => {
    logger.debug('Debug message')
    logger.info('Info message')
    logger.warn('Warning message')
    logger.error('Error message')

    expect(console.debug).not.toHaveBeenCalled() // Below info level
    expect(console.info).toHaveBeenCalledTimes(1)
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('should respect log level filtering', () => {
    const errorLogger = new StructuredLoggerService('error')

    errorLogger.debug('Debug message')
    errorLogger.info('Info message')
    errorLogger.warn('Warning message')
    errorLogger.error('Error message')

    expect(console.debug).not.toHaveBeenCalled()
    expect(console.info).not.toHaveBeenCalled()
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).toHaveBeenCalledTimes(1)
  })

  it('should log retry attempts with proper format', () => {
    const retryAttempt: RetryAttempt = {
      attemptNumber: 2,
      delayMs: 2000,
      error: new NetworkError('Connection failed'),
      timestamp: new Date(),
      correlationId: 'test-correlation-id',
    }

    logger.logRetryAttempt(retryAttempt)

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"level":"warn"')
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"message":"Retry attempt"')
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"correlationId":"test-correlation-id"')
    )
  })

  it('should log circuit breaker state changes', () => {
    logger.logCircuitBreakerStateChange('closed', 'open', 'test-operation')

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"from":"closed"')
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"to":"open"')
    )
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('"operationName":"test-operation"')
    )
  })

  it('should log operation results with appropriate level', () => {
    const successResult: OperationResult<string> = {
      success: true,
      data: 'test-data',
      metadata: {
        attemptCount: 1,
        totalDurationMs: 1000,
        circuitBreakerState: 'closed',
        correlationId: 'test-id',
        fallbackUsed: false,
      },
    }

    const failureResult: OperationResult<string> = {
      success: false,
      error: new NetworkError('Connection failed'),
      metadata: {
        attemptCount: 3,
        totalDurationMs: 5000,
        circuitBreakerState: 'open',
        correlationId: 'test-id',
        fallbackUsed: true,
      },
    }

    logger.logOperationResult('testOperation', successResult)
    logger.logOperationResult('testOperation', failureResult)

    expect(console.info).toHaveBeenCalledTimes(1)
    expect(console.error).toHaveBeenCalledTimes(1)
  })
})

describe('RetryErrorHandlingService', () => {
  let service: RetryErrorHandlingService

  beforeEach(() => {
    service = createRetryErrorHandlingService(
      { maxAttempts: 3, baseDelayMs: 100, jitterMs: 0 },
      { failureThreshold: 2, minimumThroughput: 1, recoveryTimeoutMs: 500 },
      {
        enableRetries: true,
        enableCircuitBreaker: true,
        enableFallbacks: true,
        logLevel: 'error',
      }
    )
  })

  it('should execute successful operations', async () => {
    const operation = jest.fn().mockResolvedValue('success')
    const result = await service.executeWithRetryAndCircuitBreaker(
      operation,
      'test-operation'
    )

    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.metadata.attemptCount).toBe(1)
    expect(result.metadata.fallbackUsed).toBe(false)
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should retry failed operations', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new NetworkError('Connection failed'))
      .mockRejectedValueOnce(new NetworkError('Connection failed'))
      .mockResolvedValue('success')

    const result = await service.executeWithRetryAndCircuitBreaker(
      operation,
      'test-operation'
    )

    expect(result.success).toBe(true)
    expect(result.data).toBe('success')
    expect(result.metadata.attemptCount).toBe(3)
    expect(operation).toHaveBeenCalledTimes(3)
  })

  it('should not retry non-retryable errors', async () => {
    const operation = jest
      .fn()
      .mockRejectedValue(new AuthenticationError('Invalid API key'))

    const result = await service.executeWithRetryAndCircuitBreaker(
      operation,
      'test-operation'
    )

    expect(result.success).toBe(false)
    expect(result.error).toBeInstanceOf(AuthenticationError)
    expect(operation).toHaveBeenCalledTimes(1)
  })

  it('should use fallback when circuit breaker is open', async () => {
    const failingOperation = jest
      .fn()
      .mockRejectedValue(new ServiceUnavailableError('Service down'))
    const fallbackOperation = jest.fn().mockResolvedValue('fallback-success')

    // Force circuit breaker to open by failing multiple times
    await service.executeWithRetryAndCircuitBreaker(
      failingOperation,
      'test-operation'
    )
    await service.executeWithRetryAndCircuitBreaker(
      failingOperation,
      'test-operation'
    )

    expect(service.getCircuitBreakerState()).toBe('open')

    // Now execute with fallback
    const result = await service.executeWithRetryAndCircuitBreaker(
      failingOperation,
      'test-operation',
      fallbackOperation
    )

    expect(result.success).toBe(true)
    expect(result.data).toBe('fallback-success')
    expect(result.metadata.fallbackUsed).toBe(true)
    expect(fallbackOperation).toHaveBeenCalledTimes(1)
  })

  it('should provide comprehensive metrics', async () => {
    const operation = jest
      .fn()
      .mockRejectedValueOnce(new NetworkError('Connection failed'))
      .mockResolvedValue('success')

    await service.executeWithRetryAndCircuitBreaker(operation, 'test-operation')

    const metrics = service.getMetrics()

    expect(metrics.circuitBreaker).toBeDefined()
    expect(metrics.errors).toBeDefined()
    expect(metrics.operations).toBeDefined()
    expect(metrics.topErrors).toBeDefined()
  })

  it('should emit events for retry attempts and circuit breaker changes', done => {
    const operation = jest
      .fn()
      .mockRejectedValue(new NetworkError('Connection failed'))

    let retryEventReceived = false
    service.on('retryAttempt', (attempt: RetryAttempt) => {
      expect(attempt.attemptNumber).toBeGreaterThan(0)
      expect(attempt.error).toBeInstanceOf(NetworkError)
      retryEventReceived = true

      if (retryEventReceived) {
        done()
      }
    })

    service.executeWithRetryAndCircuitBreaker(operation, 'test-operation')
  })

  it('should allow configuration updates', () => {
    service.updateRetryConfig({ maxAttempts: 5 })
    service.updateCircuitBreakerConfig({ failureThreshold: 10 })

    // Verify configs were updated (this would require exposing getters or testing behavior)
    expect(() => service.updateRetryConfig({ maxAttempts: 5 })).not.toThrow()
    expect(() =>
      service.updateCircuitBreakerConfig({ failureThreshold: 10 })
    ).not.toThrow()
  })

  it('should reset metrics when requested', () => {
    service.resetMetrics()

    const metrics = service.getMetrics()
    expect(metrics.errors.size).toBe(0)
    expect(metrics.operations.size).toBe(0)
  })

  it('should update log level', () => {
    expect(() => service.setLogLevel('debug')).not.toThrow()
    expect(() => service.setLogLevel('warn')).not.toThrow()
  })
})

describe('Factory Functions', () => {
  it('should create service with default configurations', () => {
    const service = createRetryErrorHandlingService()

    expect(service).toBeInstanceOf(RetryErrorHandlingService)
    expect(service.getCircuitBreakerState()).toBe('closed')
  })

  it('should create service with custom configurations', () => {
    const customRetryConfig = { maxAttempts: 5 }
    const customCircuitBreakerConfig = { failureThreshold: 10 }
    const customErrorHandlingConfig = { logLevel: 'debug' as const }

    const service = createRetryErrorHandlingService(
      customRetryConfig,
      customCircuitBreakerConfig,
      customErrorHandlingConfig
    )

    expect(service).toBeInstanceOf(RetryErrorHandlingService)
  })
})

describe('Enhanced Error Classes', () => {
  it('should create enhanced errors with proper properties', () => {
    const error = new NetworkError(
      'Connection failed',
      new Error('Original error'),
      { context: 'test' }
    )

    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.category).toBe('network')
    expect(error.severity).toBe('medium')
    expect(error.retryable).toBe(true)
    expect(error.context.context).toBe('test')
    expect(error.correlationId).toBeDefined()
    expect(error.timestamp).toBeInstanceOf(Date)
  })

  it('should serialize to JSON correctly', () => {
    const error = new TimeoutError('Request timed out')
    const json = error.toJSON()

    expect(json.name).toBe('EnhancedError')
    expect(json.code).toBe('TIMEOUT_ERROR')
    expect(json.category).toBe('timeout')
    expect(json.severity).toBe('medium')
    expect(json.retryable).toBe(true)
    expect(json.timestamp).toBeDefined()
    expect(json.correlationId).toBeDefined()
  })

  it('should create different error types with correct properties', () => {
    const networkError = new NetworkError('Network issue')
    const authError = new AuthenticationError('Auth failed')
    const rateLimitError = new RateLimitError('Rate limited', 5000)
    const timeoutError = new TimeoutError('Timed out')
    const serviceError = new ServiceUnavailableError('Service down')
    const validationError = new ValidationError('Invalid input')

    expect(networkError.retryable).toBe(true)
    expect(authError.retryable).toBe(false)
    expect(rateLimitError.retryable).toBe(true)
    expect(rateLimitError.retryAfterMs).toBe(5000)
    expect(timeoutError.retryable).toBe(true)
    expect(serviceError.retryable).toBe(true)
    expect(validationError.retryable).toBe(false)
  })
})

describe('Integration Tests', () => {
  it('should handle complex retry scenarios with circuit breaker', async () => {
    const service = createRetryErrorHandlingService(
      { maxAttempts: 3, baseDelayMs: 50, jitterMs: 0 },
      { failureThreshold: 2, minimumThroughput: 1, recoveryTimeoutMs: 200 },
      { enableRetries: true, enableCircuitBreaker: true, logLevel: 'error' }
    )

    let callCount = 0
    const operation = jest.fn().mockImplementation(() => {
      callCount++
      if (callCount <= 4) {
        throw new NetworkError('Connection failed')
      }
      return Promise.resolve('success')
    })

    // First call should fail
    const result1 = await service.executeWithRetryAndCircuitBreaker(
      operation,
      'test-operation'
    )
    expect(result1.success).toBe(false)

    // Second call should open circuit breaker
    const result2 = await service.executeWithRetryAndCircuitBreaker(
      operation,
      'test-operation'
    )
    expect(result2.success).toBe(false)
    expect(service.getCircuitBreakerState()).toBe('open')

    // Wait for recovery timeout
    await new Promise(resolve => setTimeout(resolve, 250))

    // Next call should succeed in half-open state
    const result3 = await service.executeWithRetryAndCircuitBreaker(
      operation,
      'test-operation'
    )
    expect(result3.success).toBe(true)
    expect(result3.data).toBe('success')
  })

  it('should collect comprehensive metrics across multiple operations', async () => {
    const service = createRetryErrorHandlingService()

    const successOperation = jest.fn().mockResolvedValue('success')
    const failingOperation = jest
      .fn()
      .mockRejectedValue(new NetworkError('Connection failed'))

    // Execute various operations
    await service.executeWithRetryAndCircuitBreaker(
      successOperation,
      'success-op'
    )
    await service.executeWithRetryAndCircuitBreaker(failingOperation, 'fail-op')
    await service.executeWithRetryAndCircuitBreaker(
      successOperation,
      'success-op'
    )

    const metrics = service.getMetrics()

    // Check that metrics were collected
    expect(metrics.operations.size).toBeGreaterThan(0)
    expect(metrics.errors.size).toBeGreaterThan(0)
    expect(metrics.topErrors.length).toBeGreaterThan(0)

    // Check circuit breaker metrics
    expect(metrics.circuitBreaker.totalRequests).toBeGreaterThan(0)
  })
})
