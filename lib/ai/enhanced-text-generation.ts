/**
 * Enhanced AI Text Generation Service with Quality Validation
 *
 * This service wraps the existing AITextGenerationService and integrates
 * the comprehensive quality validation system to ensure all generated
 * content meets quality standards before being delivered to users.
 */

import { EventEmitter } from 'events'
import { z } from 'zod'
import {
  AITextGenerationService,
  AIServiceConfig,
  GenerationOptions,
  GenerationResult,
  createAITextGenerationService,
  createServiceFromEnv as createBaseServiceFromEnv,
} from './text-generation'
import {
  QualitySystem,
  createProductionQualitySystem,
  createDevelopmentQualitySystem,
  QualitySystemConfig,
} from './quality-system'
import {
  AIGeneratedContent,
  AIContentType,
  AIProvider,
} from './content-storage'
import { QualityValidationResult } from './quality-validation'
import { PromptContext } from './prompt-templates'

// Enhanced configuration
export interface EnhancedAIServiceConfig extends AIServiceConfig {
  qualityValidation?: {
    enabled: boolean
    autoRegenerate: boolean
    maxRegenerationAttempts: number
    qualityThreshold: number
    storeAllAttempts: boolean
  }
  qualitySystem?: QualitySystemConfig
}

// Enhanced generation options
export interface EnhancedGenerationOptions extends GenerationOptions {
  skipQualityValidation?: boolean
  qualityThreshold?: number
  userId?: string
  childProfileId?: string
  bookId?: string
  storeContent?: boolean
}

// Enhanced generation result
export interface EnhancedGenerationResult extends GenerationResult {
  qualityValidation?: QualityValidationResult
  contentId?: string
  regenerationAttempts?: number
  qualityScore?: number
  improvementRecommendations?: string[]
}

// Quality validation error
export class QualityValidationError extends Error {
  constructor(
    message: string,
    public validationResult: QualityValidationResult,
    public content: string,
    public attempts: number
  ) {
    super(message)
    this.name = 'QualityValidationError'
  }
}

// Default enhanced configuration
export const DEFAULT_ENHANCED_CONFIG: Partial<EnhancedAIServiceConfig> = {
  qualityValidation: {
    enabled: true,
    autoRegenerate: true,
    maxRegenerationAttempts: 3,
    qualityThreshold: 7.0,
    storeAllAttempts: false,
  },
}

// Enhanced AI Text Generation Service
export class EnhancedAITextGenerationService extends EventEmitter {
  private textGenerationService: AITextGenerationService
  private qualitySystem: QualitySystem
  private config: EnhancedAIServiceConfig

  constructor(
    config: EnhancedAIServiceConfig,
    fallbackConfig?: AIServiceConfig,
    qualitySystemConfig?: QualitySystemConfig
  ) {
    super()
    this.config = { ...DEFAULT_ENHANCED_CONFIG, ...config }

    // Initialize base text generation service
    this.textGenerationService = createAITextGenerationService(
      config,
      fallbackConfig
    )

    // Initialize quality system
    this.qualitySystem =
      process.env.NODE_ENV === 'production'
        ? createProductionQualitySystem()
        : createDevelopmentQualitySystem()

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Forward quality system events
    this.qualitySystem.on('quality:validated', result => {
      this.emit('quality:validated', result)
    })

    this.qualitySystem.on('quality:failed', data => {
      this.emit('quality:failed', data)
    })

    this.qualitySystem.on('feedback:received', feedback => {
      this.emit('feedback:received', feedback)
    })

    this.qualitySystem.on('alert:created', alert => {
      this.emit('alert:created', alert)
    })

    this.qualitySystem.on('system:error', error => {
      this.emit('error', error)
    })
  }

  // Enhanced story outline generation with quality validation
  async generateStoryOutline(
    context: PromptContext,
    options: EnhancedGenerationOptions = {}
  ): Promise<EnhancedGenerationResult> {
    return this.generateWithQualityValidation(
      'story_outline',
      () => this.textGenerationService.generateStoryOutline(context, options),
      context,
      options
    )
  }

  // Enhanced story generation with quality validation
  async generateStory(
    context: PromptContext,
    outline?: string,
    options: EnhancedGenerationOptions = {}
  ): Promise<EnhancedGenerationResult> {
    return this.generateWithQualityValidation(
      'story_content',
      () => this.textGenerationService.generateStory(context, outline, options),
      context,
      options
    )
  }

  // Enhanced story revision with quality validation
  async reviseStory(
    context: PromptContext,
    originalStory: string,
    revisionInstructions: string,
    improvementAreas: string[],
    options: EnhancedGenerationOptions = {}
  ): Promise<EnhancedGenerationResult> {
    return this.generateWithQualityValidation(
      'story_revision',
      () =>
        this.textGenerationService.reviseStory(
          context,
          originalStory,
          revisionInstructions,
          improvementAreas,
          options
        ),
      context,
      options
    )
  }

  // Core generation method with quality validation
  private async generateWithQualityValidation(
    contentType: AIContentType,
    generationFn: () => Promise<GenerationResult>,
    context: PromptContext,
    options: EnhancedGenerationOptions
  ): Promise<EnhancedGenerationResult> {
    const startTime = Date.now()
    let attempts = 0
    let lastResult: GenerationResult | null = null
    let lastValidationResult: QualityValidationResult | null = null
    const maxAttempts =
      this.config.qualityValidation?.maxRegenerationAttempts || 3
    const qualityThreshold =
      options.qualityThreshold ||
      this.config.qualityValidation?.qualityThreshold ||
      7.0

    this.emit('generation:started', {
      contentType,
      userId: options.userId,
      childProfileId: options.childProfileId,
    })

    while (attempts < maxAttempts) {
      attempts++

      try {
        // Generate content
        const result = await generationFn()
        lastResult = result

        this.emit('generation:completed', {
          attempt: attempts,
          contentType,
          processingTime: result.metadata.processingTimeMs,
        })

        // Skip quality validation if disabled or explicitly skipped
        if (
          !this.config.qualityValidation?.enabled ||
          options.skipQualityValidation
        ) {
          return this.createEnhancedResult(result, null, attempts)
        }

        // Create AI content object for validation
        const aiContent = await this.createAIContentObject(
          result,
          contentType,
          context,
          options
        )

        // Perform quality validation
        const validationResult =
          await this.qualitySystem.validateContent(aiContent)
        lastValidationResult = validationResult

        this.emit('quality:checked', {
          contentId: aiContent.id,
          qualityScore: validationResult.qualityScore.overall,
          passesThreshold: validationResult.passesThreshold,
          attempt: attempts,
        })

        // Check if quality meets threshold
        if (
          validationResult.qualityScore.overall >= qualityThreshold &&
          validationResult.passesThreshold
        ) {
          // Quality validation passed
          const enhancedResult = this.createEnhancedResult(
            result,
            validationResult,
            attempts,
            aiContent.id
          )

          this.emit('generation:success', {
            contentId: aiContent.id,
            qualityScore: validationResult.qualityScore.overall,
            attempts,
            totalTime: Date.now() - startTime,
          })

          return enhancedResult
        }

        // Quality validation failed
        if (
          !this.config.qualityValidation?.autoRegenerate ||
          attempts >= maxAttempts
        ) {
          break
        }

        this.emit('quality:regenerating', {
          attempt: attempts,
          qualityScore: validationResult.qualityScore.overall,
          issues: validationResult.qualityScore,
        })

        // Brief delay before regeneration
        await new Promise(resolve => setTimeout(resolve, 1000))
      } catch (error) {
        this.emit('generation:error', {
          attempt: attempts,
          error: error instanceof Error ? error.message : 'Unknown error',
        })

        if (attempts >= maxAttempts) {
          throw error
        }

        // Brief delay before retry
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }

    // All attempts exhausted
    if (lastResult && lastValidationResult) {
      const enhancedResult = this.createEnhancedResult(
        lastResult,
        lastValidationResult,
        attempts
      )

      // Get improvement recommendations
      if (lastValidationResult.contentId) {
        try {
          enhancedResult.improvementRecommendations =
            await this.qualitySystem.getImprovementRecommendations(
              lastValidationResult.contentId
            )
        } catch (error) {
          // Non-critical error, continue without recommendations
        }
      }

      this.emit('generation:failed', {
        attempts,
        qualityScore: lastValidationResult.qualityScore.overall,
        totalTime: Date.now() - startTime,
      })

      throw new QualityValidationError(
        `Content quality below threshold after ${attempts} attempts. Score: ${lastValidationResult.qualityScore.overall}/${qualityThreshold}`,
        lastValidationResult,
        lastResult.content,
        attempts
      )
    }

    throw new Error(`Content generation failed after ${attempts} attempts`)
  }

  // Create AI content object for storage and validation
  private async createAIContentObject(
    result: GenerationResult,
    contentType: AIContentType,
    context: PromptContext,
    options: EnhancedGenerationOptions
  ): Promise<AIGeneratedContent> {
    const provider = this.mapProviderName(result.metadata.provider)

    const aiContent: Omit<
      AIGeneratedContent,
      'id' | 'created_at' | 'updated_at'
    > = {
      user_id: options.userId || 'anonymous',
      child_profile_id: options.childProfileId,
      book_id: options.bookId,
      content_type: contentType,
      provider,
      model_name: result.metadata.model,
      input_prompt: this.extractPromptFromContext(context),
      raw_response: result.content,
      parsed_content: this.parseContentByType(result.content, contentType),
      metadata: {
        generation_options: options,
        context_summary: this.summarizeContext(context),
        safety_check_passed: result.metadata.safetyCheckPassed,
        safety_result: result.metadata.safetyResult,
      },
      quality_scores: {},
      token_usage: result.usage
        ? {
            prompt_tokens: result.usage.promptTokens,
            completion_tokens: result.usage.completionTokens,
            total_tokens: result.usage.totalTokens,
            estimated_cost: result.usage.estimatedCost,
          }
        : {},
      generation_time_ms: result.metadata.processingTimeMs,
      cost_usd: result.usage?.estimatedCost,
      version: 1,
      is_active: true,
    }

    // Store content if enabled
    if (options.storeContent !== false) {
      return await this.qualitySystem
        .getContentStorage()
        .storeAIContent(aiContent)
    }

    // Return temporary object with generated ID for validation
    return {
      ...aiContent,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  }

  // Create enhanced result object
  private createEnhancedResult(
    result: GenerationResult,
    validationResult: QualityValidationResult | null,
    attempts: number,
    contentId?: string
  ): EnhancedGenerationResult {
    return {
      ...result,
      qualityValidation: validationResult || undefined,
      contentId,
      regenerationAttempts: attempts,
      qualityScore: validationResult?.qualityScore.overall,
      improvementRecommendations: validationResult?.recommendations,
    }
  }

  // Helper methods
  private mapProviderName(provider: string): AIProvider {
    switch (provider.toLowerCase()) {
      case 'openai':
        return 'openai'
      case 'anthropic':
        return 'anthropic'
      case 'google':
        return 'google'
      default:
        return 'custom'
    }
  }

  private extractPromptFromContext(context: PromptContext): string {
    return JSON.stringify({
      child: context.child,
      story: context.story,
      customInstructions: context.customInstructions,
    })
  }

  private parseContentByType(content: string, contentType: AIContentType): any {
    switch (contentType) {
      case 'story_outline':
        return this.textGenerationService.parseStoryOutline(content)
      case 'story_content':
      case 'story_revision':
        return { text: content, wordCount: content.split(/\s+/).length }
      default:
        return { text: content }
    }
  }

  private summarizeContext(context: PromptContext): string {
    return `Child: ${context.child.name}, Age: ${context.child.age}, Theme: ${context.story.theme}`
  }

  // User feedback collection
  async collectUserFeedback(
    userId: string,
    contentId: string,
    feedback: {
      rating?: { overall: number; [key: string]: number }
      textFeedback?: string
      engagementMetrics?: {
        reading_time_seconds: number
        pages_viewed: number
        completion_percentage: number
        interactions: number
        return_visits: number
      }
    },
    childProfileId?: string
  ) {
    return this.qualitySystem.collectUserFeedback(
      userId,
      contentId,
      feedback,
      childProfileId
    )
  }

  // Quality analytics and monitoring
  async generateQualityDashboard(timeRange?: { start: string; end: string }) {
    return this.qualitySystem.generateQualityDashboard(timeRange)
  }

  async getQualityMetrics() {
    return this.qualitySystem.generateQualityDashboard()
  }

  async getActiveAlerts() {
    return this.qualitySystem.getActiveAlerts()
  }

  async analyzeContentQuality(contentId: string) {
    return this.qualitySystem.analyzeContentQuality(contentId)
  }

  // Health and monitoring
  async performHealthCheck() {
    const baseServiceHealth = this.textGenerationService.getMetrics()
    const qualitySystemHealth = await this.qualitySystem.performHealthCheck()

    return {
      textGeneration: {
        status: 'healthy',
        metrics: baseServiceHealth,
      },
      qualitySystem: qualitySystemHealth,
      overall: qualitySystemHealth.isHealthy ? 'healthy' : 'unhealthy',
    }
  }

  // Service access methods
  getTextGenerationService(): AITextGenerationService {
    return this.textGenerationService
  }

  getQualitySystem(): QualitySystem {
    return this.qualitySystem
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    this.emit('service:shutting_down')
    await this.qualitySystem.shutdown()
    this.emit('service:shutdown')
  }
}

// Factory functions
export function createEnhancedAITextGenerationService(
  config: EnhancedAIServiceConfig,
  fallbackConfig?: AIServiceConfig,
  qualitySystemConfig?: QualitySystemConfig
): EnhancedAITextGenerationService {
  return new EnhancedAITextGenerationService(
    config,
    fallbackConfig,
    qualitySystemConfig
  )
}

export function createEnhancedServiceFromEnv(): EnhancedAITextGenerationService {
  const openaiApiKey = process.env.OPENAI_API_KEY
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY environment variable is required')
  }

  const config: EnhancedAIServiceConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: openaiApiKey,
    maxTokens: 4000,
    temperature: 0.7,
    maxRetries: 3,
    timeoutMs: 60000,
    contentSafety: {
      ageGroup: 'elementary',
      safetyLevel: 'strict',
      enableEnhancedSafety: true,
    },
    qualityValidation: {
      enabled: true,
      autoRegenerate: true,
      maxRegenerationAttempts: 3,
      qualityThreshold: 7.0,
      storeAllAttempts: false,
    },
  }

  // Optional fallback configuration
  let fallbackConfig: AIServiceConfig | undefined
  const geminiApiKey = process.env.GOOGLE_API_KEY
  if (geminiApiKey) {
    fallbackConfig = {
      provider: 'gemini',
      model: 'gemini-1.5-flash',
      apiKey: geminiApiKey,
      maxTokens: 4000,
      temperature: 0.7,
      maxRetries: 3,
      timeoutMs: 60000,
      contentSafety: {
        ageGroup: 'elementary',
        safetyLevel: 'strict',
        enableEnhancedSafety: true,
      },
    }
  }

  return createEnhancedAITextGenerationService(config, fallbackConfig)
}

// Production-ready configuration
export function createProductionEnhancedService(): EnhancedAITextGenerationService {
  const service = createEnhancedServiceFromEnv()

  // Start quality monitoring
  service.getQualitySystem().startMonitoring()

  return service
}

// Development configuration with relaxed quality thresholds
export function createDevelopmentEnhancedService(): EnhancedAITextGenerationService {
  const config: EnhancedAIServiceConfig = {
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: process.env.OPENAI_API_KEY || '',
    maxTokens: 2000,
    temperature: 0.8,
    maxRetries: 2,
    timeoutMs: 30000,
    contentSafety: {
      ageGroup: 'elementary',
      safetyLevel: 'moderate',
      enableEnhancedSafety: false,
    },
    qualityValidation: {
      enabled: true,
      autoRegenerate: false,
      maxRegenerationAttempts: 1,
      qualityThreshold: 5.0,
      storeAllAttempts: true,
    },
  }

  return createEnhancedAITextGenerationService(config)
}
