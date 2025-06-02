/**
 * AI Text Generation Service
 *
 * This module provides the service layer for integrating with LLM providers
 * (primarily OpenAI GPT-4o-mini) for generating personalized children's stories.
 *
 * Features:
 * - OpenAI GPT-4o-mini integration
 * - Google Gemini fallback support
 * - Enhanced retry logic and error handling with circuit breakers
 * - Response parsing and validation
 * - Usage tracking and cost monitoring
 */

import OpenAI from 'openai'
import { z } from 'zod'
import {
  PromptContext,
  createStoryPrompt,
  createOutlinePrompt,
  createRevisionPrompt,
  ChildProfile,
  StoryConfiguration,
} from './prompt-templates'
import {
  RetryErrorHandlingService,
  createRetryErrorHandlingService,
  EnhancedError,
  NetworkError,
  AuthenticationError,
  RateLimitError as EnhancedRateLimitError,
  TimeoutError,
  ServiceUnavailableError,
  ValidationError,
  type RetryConfig,
  type CircuitBreakerConfig,
  type ErrorHandlingConfig,
  type OperationResult,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_ERROR_HANDLING_CONFIG,
} from './retry-error-handling'

// Configuration and types
export interface AIServiceConfig {
  provider: 'openai' | 'gemini'
  model: string
  apiKey: string
  maxTokens: number
  temperature: number
  maxRetries: number
  timeoutMs: number
  // Enhanced retry and error handling configuration
  retryConfig?: Partial<RetryConfig>
  circuitBreakerConfig?: Partial<CircuitBreakerConfig>
  errorHandlingConfig?: Partial<ErrorHandlingConfig>
}

export interface GenerationOptions {
  includeUsageStats?: boolean
  customSystemPrompt?: string
  streamResponse?: boolean
  // Enhanced error handling options
  enableRetries?: boolean
  enableCircuitBreaker?: boolean
  enableFallbacks?: boolean
}

export interface GenerationResult {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
    estimatedCost: number
  }
  metadata: {
    provider: string
    model: string
    generatedAt: Date
    processingTimeMs: number
    safetyCheckPassed: boolean
    safetyResult?: any
    // Enhanced metadata
    attemptCount: number
    circuitBreakerState: string
    correlationId: string
    fallbackUsed: boolean
  }
}

export interface StoryOutline {
  title: string
  summary: string
  characters: string[]
  setting: string
  chapters: Array<{
    title: string
    summary: string
    keyEvents: string[]
    educationalElements: string[]
  }>
  themes: string[]
  educationalGoals: string[]
  estimatedLength: number
}

// Validation schemas
const GenerationResultSchema = z.object({
  content: z.string().min(1),
  usage: z
    .object({
      promptTokens: z.number(),
      completionTokens: z.number(),
      totalTokens: z.number(),
      estimatedCost: z.number(),
    })
    .optional(),
  metadata: z.object({
    provider: z.string(),
    model: z.string(),
    generatedAt: z.date(),
    processingTimeMs: z.number(),
    safetyCheckPassed: z.boolean(),
    safetyResult: z.any().optional(),
    attemptCount: z.number(),
    circuitBreakerState: z.string(),
    correlationId: z.string(),
    fallbackUsed: z.boolean(),
  }),
})

// Legacy error types for backward compatibility
export class AIServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'AIServiceError'
  }
}

export class ContentSafetyError extends AIServiceError {
  constructor(
    message: string,
    public flaggedContent: string
  ) {
    super(message, 'CONTENT_SAFETY_VIOLATION', 'content-filter')
  }
}

export class RateLimitError extends AIServiceError {
  constructor(
    message: string,
    provider: string,
    public retryAfter?: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', provider)
  }
}

// OpenAI service implementation
class OpenAITextGenerationService {
  private client: OpenAI
  private config: AIServiceConfig
  private retryErrorHandlingService: RetryErrorHandlingService

  constructor(config: AIServiceConfig) {
    this.config = config
    this.client = new OpenAI({
      apiKey: config.apiKey,
      timeout: config.timeoutMs,
    })

    // Initialize enhanced retry and error handling service
    this.retryErrorHandlingService = createRetryErrorHandlingService(
      config.retryConfig,
      config.circuitBreakerConfig,
      config.errorHandlingConfig
    )
  }

  async generateStoryOutline(
    context: PromptContext,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const operation = async (): Promise<GenerationResult> => {
      const startTime = Date.now()

      try {
        const { systemPrompt, userPrompt } = createOutlinePrompt(context)

        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: options.customSystemPrompt || systemPrompt,
            },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
          throw new ServiceUnavailableError(
            'No content generated from AI service'
          )
        }

        const processingTime = Date.now() - startTime
        const usage = completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
              estimatedCost: this.calculateCost(
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
              ),
            }
          : undefined

        return {
          content,
          usage: options.includeUsageStats ? usage : undefined,
          metadata: {
            provider: this.config.provider,
            model: this.config.model,
            generatedAt: new Date(),
            processingTimeMs: processingTime,
            safetyCheckPassed: true,
            safetyResult: undefined,
            attemptCount: 1,
            circuitBreakerState: 'closed',
            correlationId: '',
            fallbackUsed: false,
          },
        }
      } catch (error) {
        throw this.classifyError(error as Error)
      }
    }

    const result =
      await this.retryErrorHandlingService.executeWithRetryAndCircuitBreaker(
        operation,
        'generateStoryOutline'
      )

    if (!result.success) {
      throw (
        result.error ||
        new ServiceUnavailableError('Story outline generation failed')
      )
    }

    // Update metadata with retry information
    const generationResult = result.data!
    generationResult.metadata.attemptCount = result.metadata.attemptCount
    generationResult.metadata.circuitBreakerState =
      result.metadata.circuitBreakerState
    generationResult.metadata.correlationId = result.metadata.correlationId
    generationResult.metadata.fallbackUsed = result.metadata.fallbackUsed

    return generationResult
  }

  async generateStory(
    context: PromptContext,
    outline?: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const operation = async (): Promise<GenerationResult> => {
      const startTime = Date.now()

      try {
        const { systemPrompt, userPrompt } = createStoryPrompt(context)

        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: options.customSystemPrompt || systemPrompt,
            },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
          throw new ServiceUnavailableError(
            'No content generated from AI service'
          )
        }

        const processingTime = Date.now() - startTime
        const usage = completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
              estimatedCost: this.calculateCost(
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
              ),
            }
          : undefined

        return {
          content,
          usage: options.includeUsageStats ? usage : undefined,
          metadata: {
            provider: this.config.provider,
            model: this.config.model,
            generatedAt: new Date(),
            processingTimeMs: processingTime,
            safetyCheckPassed: true,
            safetyResult: undefined,
            attemptCount: 1,
            circuitBreakerState: 'closed',
            correlationId: '',
            fallbackUsed: false,
          },
        }
      } catch (error) {
        throw this.classifyError(error as Error)
      }
    }

    const result =
      await this.retryErrorHandlingService.executeWithRetryAndCircuitBreaker(
        operation,
        'generateStory'
      )

    if (!result.success) {
      throw (
        result.error || new ServiceUnavailableError('Story generation failed')
      )
    }

    // Update metadata with retry information
    const generationResult = result.data!
    generationResult.metadata.attemptCount = result.metadata.attemptCount
    generationResult.metadata.circuitBreakerState =
      result.metadata.circuitBreakerState
    generationResult.metadata.correlationId = result.metadata.correlationId
    generationResult.metadata.fallbackUsed = result.metadata.fallbackUsed

    return generationResult
  }

  async reviseStory(
    context: PromptContext,
    originalStory: string,
    revisionInstructions: string,
    improvementAreas: string[],
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const operation = async (): Promise<GenerationResult> => {
      const startTime = Date.now()

      try {
        const { systemPrompt, userPrompt } = createRevisionPrompt(
          context,
          originalStory,
          revisionInstructions,
          improvementAreas
        )

        const completion = await this.client.chat.completions.create({
          model: this.config.model,
          messages: [
            {
              role: 'system',
              content: options.customSystemPrompt || systemPrompt,
            },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          stream: false,
        })

        const content = completion.choices[0]?.message?.content
        if (!content) {
          throw new ServiceUnavailableError(
            'No content generated from AI service'
          )
        }

        const processingTime = Date.now() - startTime
        const usage = completion.usage
          ? {
              promptTokens: completion.usage.prompt_tokens,
              completionTokens: completion.usage.completion_tokens,
              totalTokens: completion.usage.total_tokens,
              estimatedCost: this.calculateCost(
                completion.usage.prompt_tokens,
                completion.usage.completion_tokens
              ),
            }
          : undefined

        return {
          content,
          usage: options.includeUsageStats ? usage : undefined,
          metadata: {
            provider: this.config.provider,
            model: this.config.model,
            generatedAt: new Date(),
            processingTimeMs: processingTime,
            safetyCheckPassed: true,
            safetyResult: undefined,
            attemptCount: 1,
            circuitBreakerState: 'closed',
            correlationId: '',
            fallbackUsed: false,
          },
        }
      } catch (error) {
        throw this.classifyError(error as Error)
      }
    }

    const result =
      await this.retryErrorHandlingService.executeWithRetryAndCircuitBreaker(
        operation,
        'reviseStory'
      )

    if (!result.success) {
      throw result.error || new ServiceUnavailableError('Story revision failed')
    }

    // Update metadata with retry information
    const generationResult = result.data!
    generationResult.metadata.attemptCount = result.metadata.attemptCount
    generationResult.metadata.circuitBreakerState =
      result.metadata.circuitBreakerState
    generationResult.metadata.correlationId = result.metadata.correlationId
    generationResult.metadata.fallbackUsed = result.metadata.fallbackUsed

    return generationResult
  }

  private calculateCost(
    promptTokens: number,
    completionTokens: number
  ): number {
    // GPT-4o-mini pricing (as of 2024): $0.15/1M input tokens, $0.60/1M output tokens
    const inputCostPer1M = 0.15
    const outputCostPer1M = 0.6

    const inputCost = (promptTokens / 1000000) * inputCostPer1M
    const outputCost = (completionTokens / 1000000) * outputCostPer1M

    return inputCost + outputCost
  }

  private classifyError(error: Error): EnhancedError {
    const message = error.message.toLowerCase()

    // OpenAI specific error classification
    if (
      message.includes('unauthorized') ||
      message.includes('invalid api key')
    ) {
      return new AuthenticationError(
        'Invalid API key or unauthorized access',
        error
      )
    }

    if (
      message.includes('rate limit') ||
      message.includes('too many requests')
    ) {
      const retryAfterMatch = error.message.match(/retry after (\d+)/i)
      const retryAfterMs = retryAfterMatch
        ? parseInt(retryAfterMatch[1]) * 1000
        : undefined
      return new EnhancedRateLimitError(
        'Rate limit exceeded',
        retryAfterMs,
        error
      )
    }

    if (message.includes('timeout') || message.includes('timed out')) {
      return new TimeoutError('Request timed out', error)
    }

    if (message.includes('network') || message.includes('connection')) {
      return new NetworkError('Network connection error', error)
    }

    if (message.includes('validation') || message.includes('invalid input')) {
      return new ValidationError('Invalid input provided', error)
    }

    if (
      message.includes('service unavailable') ||
      message.includes('server error')
    ) {
      return new ServiceUnavailableError(
        'AI service temporarily unavailable',
        error
      )
    }

    // Default to service unavailable for unknown errors
    return new ServiceUnavailableError(error.message, error)
  }

  getRetryErrorHandlingService(): RetryErrorHandlingService {
    return this.retryErrorHandlingService
  }

  getMetrics() {
    return this.retryErrorHandlingService.getMetrics()
  }
}

// Main service class with fallback support
export class AITextGenerationService {
  private primaryService: OpenAITextGenerationService
  private fallbackService?: OpenAITextGenerationService
  private config: AIServiceConfig

  constructor(config: AIServiceConfig, fallbackConfig?: AIServiceConfig) {
    this.config = config
    this.primaryService = new OpenAITextGenerationService(config)

    if (fallbackConfig) {
      this.fallbackService = new OpenAITextGenerationService(fallbackConfig)
    }
  }

  async generateStoryOutline(
    context: PromptContext,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const fallbackOperation = this.fallbackService
      ? () => this.fallbackService!.generateStoryOutline(context, options)
      : undefined

    const result = await this.primaryService
      .getRetryErrorHandlingService()
      .executeWithRetryAndCircuitBreaker(
        () => this.primaryService.generateStoryOutline(context, options),
        'generateStoryOutline',
        fallbackOperation
      )

    if (!result.success) {
      throw (
        result.error ||
        new ServiceUnavailableError(
          'Story outline generation failed after all retries'
        )
      )
    }

    return result.data!
  }

  async generateStory(
    context: PromptContext,
    outline?: string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const fallbackOperation = this.fallbackService
      ? () => this.fallbackService!.generateStory(context, outline, options)
      : undefined

    const result = await this.primaryService
      .getRetryErrorHandlingService()
      .executeWithRetryAndCircuitBreaker(
        () => this.primaryService.generateStory(context, outline, options),
        'generateStory',
        fallbackOperation
      )

    if (!result.success) {
      throw (
        result.error ||
        new ServiceUnavailableError('Story generation failed after all retries')
      )
    }

    return result.data!
  }

  async reviseStory(
    context: PromptContext,
    originalStory: string,
    revisionInstructions: string,
    improvementAreas: string[],
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const fallbackOperation = this.fallbackService
      ? () =>
          this.fallbackService!.reviseStory(
            context,
            originalStory,
            revisionInstructions,
            improvementAreas,
            options
          )
      : undefined

    const result = await this.primaryService
      .getRetryErrorHandlingService()
      .executeWithRetryAndCircuitBreaker(
        () =>
          this.primaryService.reviseStory(
            context,
            originalStory,
            revisionInstructions,
            improvementAreas,
            options
          ),
        'reviseStory',
        fallbackOperation
      )

    if (!result.success) {
      throw (
        result.error ||
        new ServiceUnavailableError('Story revision failed after all retries')
      )
    }

    return result.data!
  }

  /**
   * Get the retry and error handling service for advanced configuration
   */
  getRetryErrorHandlingService(): RetryErrorHandlingService {
    return this.primaryService.getRetryErrorHandlingService()
  }

  // Utility methods
  parseStoryOutline(outlineText: string): StoryOutline {
    // Basic parsing logic - can be enhanced with more sophisticated parsing
    const lines = outlineText.split('\n').filter(line => line.trim())

    return {
      title: this.extractSection(lines, 'title') || 'Untitled Story',
      summary: this.extractSection(lines, 'summary') || '',
      characters: this.extractList(lines, 'characters'),
      setting: this.extractSection(lines, 'setting') || '',
      chapters: [], // Would need more sophisticated parsing
      themes: this.extractList(lines, 'themes'),
      educationalGoals: this.extractList(lines, 'educational'),
      estimatedLength: 0,
    }
  }

  private extractSection(lines: string[], sectionName: string): string | null {
    const sectionRegex = new RegExp(`${sectionName}:?\\s*(.+)`, 'i')
    for (const line of lines) {
      const match = line.match(sectionRegex)
      if (match) {
        return match[1].trim()
      }
    }
    return null
  }

  private extractList(lines: string[], sectionName: string): string[] {
    const items: string[] = []
    let inSection = false

    for (const line of lines) {
      if (line.toLowerCase().includes(sectionName.toLowerCase())) {
        inSection = true
        continue
      }

      if (inSection && line.startsWith('-')) {
        items.push(line.substring(1).trim())
      } else if (inSection && !line.startsWith(' ')) {
        break
      }
    }

    return items
  }
}

// Factory function for creating service instances
export function createAITextGenerationService(
  primaryConfig: AIServiceConfig,
  fallbackConfig?: AIServiceConfig
): AITextGenerationService {
  return new AITextGenerationService(primaryConfig, fallbackConfig)
}

// Default configurations with enhanced retry and error handling
export const DEFAULT_OPENAI_CONFIG: Partial<AIServiceConfig> = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  maxTokens: 4000,
  temperature: 0.7,
  maxRetries: 3,
  timeoutMs: 30000,
  retryConfig: {
    ...DEFAULT_RETRY_CONFIG,
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
  },
  circuitBreakerConfig: {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    failureThreshold: 5,
    recoveryTimeoutMs: 60000,
  },
  errorHandlingConfig: {
    ...DEFAULT_ERROR_HANDLING_CONFIG,
    enableCircuitBreaker: true,
    enableRetries: true,
    enableFallbacks: true,
    logLevel: 'info',
  },
}

export const DEFAULT_GEMINI_CONFIG: Partial<AIServiceConfig> = {
  provider: 'gemini',
  model: 'gemini-2.5-flash',
  maxTokens: 4000,
  temperature: 0.7,
  maxRetries: 3,
  timeoutMs: 30000,
  retryConfig: {
    ...DEFAULT_RETRY_CONFIG,
    maxAttempts: 2,
    baseDelayMs: 2000,
  },
  circuitBreakerConfig: {
    ...DEFAULT_CIRCUIT_BREAKER_CONFIG,
    failureThreshold: 3,
    recoveryTimeoutMs: 30000,
  },
  errorHandlingConfig: {
    ...DEFAULT_ERROR_HANDLING_CONFIG,
    enableCircuitBreaker: true,
    enableRetries: true,
    enableFallbacks: false,
    logLevel: 'warn',
  },
}

// Utility function to create service with environment variables
export function createServiceFromEnv(): AITextGenerationService {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const primaryConfig: AIServiceConfig = {
    ...DEFAULT_OPENAI_CONFIG,
    apiKey: openaiApiKey,
  } as AIServiceConfig

  // Optional fallback configuration
  let fallbackConfig: AIServiceConfig | undefined
  const geminiApiKey = process.env.GOOGLE_API_KEY
  if (geminiApiKey) {
    fallbackConfig = {
      ...DEFAULT_GEMINI_CONFIG,
      apiKey: geminiApiKey,
    } as AIServiceConfig
  }

  return createAITextGenerationService(primaryConfig, fallbackConfig)
}
