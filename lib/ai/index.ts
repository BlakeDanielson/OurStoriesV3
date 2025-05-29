/**
 * AI Services Module
 *
 * This module exports all AI-related services and utilities for the ourStories platform.
 *
 * Main exports:
 * - Prompt template system for generating structured prompts
 * - Text generation service with OpenAI integration
 * - Enhanced content safety and moderation system
 * - Age-appropriate language controls and adaptation
 * - Service layer with dependency injection and health monitoring
 * - Error handling and retry logic
 * - Context management for conversation tracking
 */

// ============================================================================
// Text Generation Service Exports
// ============================================================================

export {
  // Main service class
  AITextGenerationService,
  createAITextGenerationService,
  createServiceFromEnv,

  // Error classes
  AIServiceError,
  ContentSafetyError,
  RateLimitError,

  // Types
  type AIServiceConfig,
  type GenerationOptions,
  type GenerationResult,
  type StoryOutline,
} from './text-generation'

// ============================================================================
// Prompt Template Exports
// ============================================================================

export {
  // Template engine and utilities
  PromptTemplateEngine,
  createStoryPrompt,
  createOutlinePrompt,
  createRevisionPrompt,

  // Template definitions
  STORY_OUTLINE_TEMPLATE,
  STORY_GENERATION_TEMPLATE,
  STORY_REVISION_TEMPLATE,

  // Validation schemas
  ChildProfileSchema,
  StoryConfigurationSchema,

  // Types
  type ChildProfile,
  type StoryConfiguration,
  type PromptContext,
  type PromptTemplate,
  type FewShotExample,
  type TemplateVersion,
} from './prompt-templates'

// ============================================================================
// Content Safety Exports
// ============================================================================

export {
  // Main content safety service
  ContentSafetyService,
  createContentSafetyService,
  getDefaultSafetyConfig,
  EnhancedContentSafetyError,

  // Types
  type AgeGroup,
  type SafetyLevel,
  type ContentType,
  type SafetyConfig,
  type ContentSafetyResult,
  type SafetyViolation,
  type SafetyWarning,
  type BlocklistEntry,
  type AllowlistEntry,
} from './content-safety'

// ============================================================================
// Language Controls Exports
// ============================================================================

export {
  // Main language controls service
  LanguageControlsService,
  createLanguageControlsService,
  getDefaultLanguageConfig,
  analyzeTextReadability,
  ReadabilityAnalyzer,
  LanguageControlError,

  // Configuration and vocabulary data
  AGE_LANGUAGE_CONFIGS,
  AGE_APPROPRIATE_VOCABULARY,
  VOCABULARY_SUBSTITUTIONS,

  // Types
  type ReadingLevel,
  type LanguageComplexity,
  type LanguageControlConfig,
  type VocabularyRule,
  type LanguageAnalysisResult,
  type LanguageSuggestion,
  type LanguageAdaptationResult,
  type LanguageChange,
} from './language-controls'

// ============================================================================
// Service Layer Exports
// ============================================================================

export {
  // Main service layer orchestrator
  AIServiceLayer,
  getGlobalServiceLayer,
  setGlobalServiceLayer,
  createServiceLayer,

  // Core service layer components
  ServiceRegistry,
  ConfigurationManager,
  HealthMonitor,
  EnhancedAITextGenerationProvider,

  // Configuration and validation
  ServiceConfigSchema,

  // Types and interfaces
  type ServiceConfig,
  type ServiceHealth,
  type ProviderHealth,
  type ServiceMetrics,
  type ServiceEvents,
  type IAITextGenerationProvider,
} from './service-layer'

// ============================================================================
// Context Management Exports
// ============================================================================

export {
  // Main context management service
  ContextManagementService,
  TokenCounterService,
  RelevanceScoringService,
  ContextCompressionService,
  ConversationSessionManager,
  createContextManagementService,
  createProductionContextManagementService,
  ContextManagementError,

  // Types
  type ContextEntry,
  type ConversationSession,
  type RelevanceScoringConfig,
  type CompressionConfig,
  type ContextManagementConfig,
  type ContextOptimizationResult,
} from './context-management'

// ============================================================================
// Imports for AI Utility Object
// ============================================================================

import { promptTemplateEngine } from './prompt-templates'
import {
  createServiceFromEnv as createTextService,
  createAITextGenerationService,
} from './text-generation'
import { getGlobalServiceLayer } from './service-layer'
import {
  createContentSafetyService,
  getDefaultSafetyConfig,
  type AgeGroup,
  type SafetyLevel,
} from './content-safety'
import {
  createLanguageControlsService,
  getDefaultLanguageConfig,
  analyzeTextReadability,
  type ReadingLevel,
  type LanguageControlConfig,
} from './language-controls'
import {
  createContextManagementService,
  createProductionContextManagementService,
} from './context-management'

// ============================================================================
// Main AI Utility Object
// ============================================================================

/**
 * Main AI utility object providing convenient access to all AI services
 */
export const AI = {
  // Text generation
  createService: createTextService,
  createTextGenerationService: createAITextGenerationService,

  // Content safety
  createContentSafetyService,
  getDefaultSafetyConfig,

  // Language controls
  createLanguageControlsService,
  getDefaultLanguageConfig,
  analyzeTextReadability,

  // Context management
  createContextManagementService,
  createProductionContextManagementService,

  // Template utilities
  templates: promptTemplateEngine,

  // Service layer access
  getServiceLayer: getGlobalServiceLayer,

  // Utility functions
  utils: {
    // Create a complete AI service with content safety and language controls
    createCompleteService: (config?: {
      ageGroup?: AgeGroup
      safetyLevel?: SafetyLevel
      readingLevel?: ReadingLevel
      enableEnhancedSafety?: boolean
      enableLanguageControls?: boolean
      enableContextManagement?: boolean
    }) => {
      const textService = createTextService()
      const safetyService = createContentSafetyService(
        config?.ageGroup || 'elementary',
        config?.safetyLevel || 'moderate'
      )
      const languageService =
        config?.enableLanguageControls !== false
          ? createLanguageControlsService(
              config?.ageGroup || 'elementary',
              config?.readingLevel
            )
          : undefined

      const contextService =
        config?.enableContextManagement !== false
          ? createContextManagementService()
          : undefined

      return {
        textGeneration: textService,
        contentSafety: safetyService,
        languageControls: languageService,
        contextManagement: contextService,

        // Enhanced story generation with safety and language controls
        generateSafeStory: async (context: any, options: any = {}) => {
          // Enable safety check by default
          const safeOptions = { ...options, enableSafetyCheck: true }
          const result = await textService.generateStory(
            context,
            undefined,
            safeOptions
          )

          // Apply language controls if enabled
          if (languageService && config?.enableLanguageControls !== false) {
            const validation = await languageService.validateAgeAppropriateness(
              result.content
            )

            if (!validation.isValid) {
              // Adapt the content to be age-appropriate
              const adaptation = await languageService.adaptLanguage(
                result.content
              )

              return {
                ...result,
                content: adaptation.adaptedText,
                metadata: {
                  ...result.metadata,
                  languageAdaptation: {
                    applied: true,
                    changesCount: adaptation.changesApplied.length,
                    improvementScore: adaptation.improvementScore,
                    originalGradeLevel: validation.analysisResult.gradeLevel,
                    adaptedGradeLevel: adaptation.analysisResult.gradeLevel,
                  },
                },
              }
            }
          }

          return result
        },

        // Generate story with conversation context
        generateStoryWithContext: async (
          sessionId: string,
          prompt: string,
          userPreferences?: Record<string, any>,
          options: any = {}
        ) => {
          if (!contextService) {
            throw new Error('Context management is not enabled')
          }

          // Get optimized context
          const contextResult = await contextService.getOptimizedContext(
            sessionId,
            prompt,
            userPreferences
          )

          // Generate story with context
          const enhancedPrompt = contextResult.context
            ? `${contextResult.context}\n\nCurrent request: ${prompt}`
            : prompt

          const safeOptions = { ...options, enableSafetyCheck: true }
          const story = await textService.generateStory(
            enhancedPrompt,
            undefined,
            safeOptions
          )

          // Add the generated story to context
          contextService.addContextEntry(
            sessionId,
            'ai_response',
            story.content,
            {
              storyId: story.id,
              optimization: contextResult.optimization,
              ...story.metadata,
            }
          )

          return {
            ...story,
            contextOptimization: contextResult.optimization,
            contextEntries: contextResult.entries.length,
          }
        },

        // Create conversation session
        createConversationSession: (
          sessionId: string,
          userId?: string,
          childId?: string,
          metadata?: Record<string, any>
        ) => {
          if (!contextService) {
            throw new Error('Context management is not enabled')
          }
          return contextService.createSession(
            sessionId,
            userId,
            childId,
            metadata
          )
        },

        // Add user message to context
        addUserMessage: (
          sessionId: string,
          message: string,
          metadata?: Record<string, any>
        ) => {
          if (!contextService) {
            throw new Error('Context management is not enabled')
          }
          return contextService.addContextEntry(
            sessionId,
            'user_input',
            message,
            metadata
          )
        },

        // Analyze text for age-appropriateness
        analyzeContent: async (text: string) => {
          const results: any = {
            readability: analyzeTextReadability(text),
          }

          if (languageService) {
            results.languageAnalysis =
              await languageService.analyzeLanguage(text)
            results.validation =
              await languageService.validateAgeAppropriateness(text)
          }

          return results
        },

        // Generate prompt modifications for age-appropriate content
        getPromptModifications: () => {
          if (languageService) {
            return languageService.generatePromptModifications()
          }
          return null
        },

        // Cleanup method
        destroy: () => {
          contextService?.destroy()
        },
      }
    },

    // Quick readability analysis
    analyzeReadability: analyzeTextReadability,

    // Create age-specific language service
    createLanguageService: createLanguageControlsService,

    // Create context management service
    createContextService: createContextManagementService,
  },
} as const
