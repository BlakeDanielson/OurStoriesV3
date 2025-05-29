/**
 * Quality System Integration
 * Unified interface for the complete quality validation system
 */

import { EventEmitter } from 'events'
import {
  ContentStorageService,
  createProductionContentStorageService,
  AIGeneratedContent,
} from './content-storage'
import {
  QualityValidationService,
  createQualityValidationService,
  QualityValidationResult,
  ValidationConfig,
} from './quality-validation'
import {
  FeedbackIntegrationService,
  createFeedbackIntegrationService,
  UserFeedback,
  FeedbackAnalysis,
} from './feedback-integration'
import {
  QualityMetricsService,
  createQualityMetricsService,
  QualityDashboard,
  QualityAlert,
} from './quality-metrics'

// System configuration
export interface QualitySystemConfig {
  contentStorage?: {
    enableCaching: boolean
    cacheConfig: {
      ttl: number
      maxSize: number
    }
    retentionPolicies: {
      conversationHistory: number
      analyticsEvents: number
      tempSessions: number
    }
  }
  validation?: Partial<ValidationConfig>
  monitoring?: {
    enableRealTimeMonitoring: boolean
    alertThresholds: {
      qualityScore: number
      passRate: number
      userSatisfaction: number
    }
  }
}

// System status
export interface QualitySystemStatus {
  isHealthy: boolean
  services: {
    contentStorage: 'healthy' | 'unhealthy'
    qualityValidation: 'healthy' | 'unhealthy'
    feedbackIntegration: 'healthy' | 'unhealthy'
    qualityMetrics: 'healthy' | 'unhealthy'
  }
  activeAlerts: number
  lastHealthCheck: string
}

// Main quality system class
export class QualitySystem extends EventEmitter {
  private contentStorage!: ContentStorageService
  private qualityValidation!: QualityValidationService
  private feedbackIntegration!: FeedbackIntegrationService
  private qualityMetrics!: QualityMetricsService
  private config: QualitySystemConfig
  private isInitialized = false

  constructor(config: QualitySystemConfig = {}) {
    super()
    this.config = config
    this.initializeServices()
  }

  // Initialize all services
  private initializeServices(): void {
    try {
      // Initialize content storage
      this.contentStorage = createProductionContentStorageService()

      // Initialize quality validation
      this.qualityValidation = createQualityValidationService(
        this.contentStorage,
        this.config.validation
      )

      // Initialize feedback integration
      this.feedbackIntegration = createFeedbackIntegrationService(
        this.contentStorage,
        this.qualityValidation
      )

      // Initialize quality metrics
      this.qualityMetrics = createQualityMetricsService(
        this.contentStorage,
        this.qualityValidation,
        this.feedbackIntegration
      )

      this.setupEventListeners()
      this.isInitialized = true

      this.emit('system:initialized')
    } catch (error) {
      this.emit('system:error', { operation: 'initialization', error })
      throw error
    }
  }

  // Setup cross-service event listeners
  private setupEventListeners(): void {
    // Quality validation events
    this.qualityValidation.on(
      'validation:completed',
      (result: QualityValidationResult) => {
        this.emit('quality:validated', result)
      }
    )

    this.qualityValidation.on('validation:failed', data => {
      this.emit('quality:failed', data)
    })

    // Feedback events
    this.feedbackIntegration.on(
      'feedback:collected',
      (feedback: UserFeedback) => {
        this.emit('feedback:received', feedback)
      }
    )

    this.feedbackIntegration.on(
      'feedback:analyzed',
      (analysis: FeedbackAnalysis) => {
        this.emit('feedback:analyzed', analysis)
      }
    )

    // Metrics events
    this.qualityMetrics.on('alert:created', (alert: QualityAlert) => {
      this.emit('alert:created', alert)
    })

    this.qualityMetrics.on(
      'dashboard:generated',
      (dashboard: QualityDashboard) => {
        this.emit('dashboard:updated', dashboard)
      }
    )

    // Error handling
    const services = [
      this.contentStorage,
      this.qualityValidation,
      this.feedbackIntegration,
      this.qualityMetrics,
    ]
    services.forEach((service: any) => {
      service.on('error', (error: any) => {
        this.emit('system:error', error)
      })
    })
  }

  // Main validation workflow
  async validateContent(
    content: AIGeneratedContent
  ): Promise<QualityValidationResult> {
    this.ensureInitialized()

    try {
      // Perform quality validation
      const validationResult =
        await this.qualityValidation.validateContent(content)

      // Store validation result
      await this.contentStorage.recordAnalyticsEvent({
        userId: content.user_id,
        childProfileId: content.child_profile_id,
        eventType: 'quality_validation',
        eventName: 'content_validated',
        eventData: {
          contentId: content.id,
          validationResult,
          passesThreshold: validationResult.passesThreshold,
        },
      })

      this.emit('content:validated', {
        contentId: content.id,
        result: validationResult,
      })

      return validationResult
    } catch (error) {
      this.emit('system:error', {
        operation: 'validateContent',
        contentId: content.id,
        error,
      })
      throw error
    }
  }

  // Feedback collection
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
  ): Promise<UserFeedback> {
    this.ensureInitialized()

    try {
      let result: UserFeedback

      if (feedback.rating) {
        result = await this.feedbackIntegration.submitRating(
          userId,
          contentId,
          feedback.rating,
          childProfileId
        )
      } else if (feedback.textFeedback) {
        result = await this.feedbackIntegration.submitTextFeedback(
          userId,
          contentId,
          feedback.textFeedback,
          childProfileId
        )
      } else if (feedback.engagementMetrics) {
        result = await this.feedbackIntegration.recordEngagementMetrics(
          userId,
          contentId,
          feedback.engagementMetrics,
          childProfileId
        )
      } else {
        throw new Error('No valid feedback data provided')
      }

      this.emit('feedback:collected', result)
      return result
    } catch (error) {
      this.emit('system:error', {
        operation: 'collectUserFeedback',
        userId,
        contentId,
        error,
      })
      throw error
    }
  }

  // Dashboard generation
  async generateQualityDashboard(timeRange?: {
    start: string
    end: string
  }): Promise<QualityDashboard> {
    this.ensureInitialized()

    const defaultTimeRange = timeRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Last 30 days
      end: new Date().toISOString(),
    }

    try {
      const dashboard =
        await this.qualityMetrics.generateDashboard(defaultTimeRange)
      this.emit('dashboard:generated', dashboard)
      return dashboard
    } catch (error) {
      this.emit('system:error', {
        operation: 'generateQualityDashboard',
        error,
      })
      throw error
    }
  }

  // Batch validation
  async validateContentBatch(
    contentIds: string[]
  ): Promise<QualityValidationResult[]> {
    this.ensureInitialized()

    try {
      const results = await this.qualityValidation.validateBatch(contentIds)

      this.emit('batch:validated', {
        contentIds,
        results,
        passCount: results.filter(r => r.passesThreshold).length,
        totalCount: results.length,
      })

      return results
    } catch (error) {
      this.emit('system:error', {
        operation: 'validateContentBatch',
        contentIds,
        error,
      })
      throw error
    }
  }

  // Quality improvement recommendations
  async getImprovementRecommendations(contentId: string): Promise<string[]> {
    this.ensureInitialized()

    try {
      const recommendations =
        await this.feedbackIntegration.generateImprovementRecommendations(
          contentId
        )

      this.emit('recommendations:generated', {
        contentId,
        recommendations,
      })

      return recommendations
    } catch (error) {
      this.emit('system:error', {
        operation: 'getImprovementRecommendations',
        contentId,
        error,
      })
      throw error
    }
  }

  // System monitoring
  async startMonitoring(): Promise<void> {
    this.ensureInitialized()

    try {
      if (this.config.monitoring?.enableRealTimeMonitoring) {
        await this.qualityMetrics.startRealTimeMonitoring()
      }

      // Set up periodic health checks
      setInterval(
        async () => {
          try {
            await this.performHealthCheck()
          } catch (error) {
            this.emit('system:error', { operation: 'healthCheck', error })
          }
        },
        5 * 60 * 1000
      ) // Every 5 minutes

      this.emit('monitoring:started')
    } catch (error) {
      this.emit('system:error', { operation: 'startMonitoring', error })
      throw error
    }
  }

  // Health check
  async performHealthCheck(): Promise<QualitySystemStatus> {
    this.ensureInitialized()

    try {
      const [
        contentStorageHealth,
        qualityValidationHealth,
        feedbackHealth,
        metricsHealth,
      ] = await Promise.all([
        this.contentStorage.healthCheck(),
        Promise.resolve({ status: 'healthy', details: {} }), // qualityValidation doesn't have healthCheck
        Promise.resolve({ status: 'healthy', details: {} }), // feedbackIntegration doesn't have healthCheck
        this.qualityMetrics.healthCheck(),
      ])

      const activeAlerts = this.qualityMetrics.getActiveAlerts()

      const status: QualitySystemStatus = {
        isHealthy: [
          contentStorageHealth.status,
          qualityValidationHealth.status,
          feedbackHealth.status,
          metricsHealth.status,
        ].every(s => s === 'healthy'),
        services: {
          contentStorage: contentStorageHealth.status as
            | 'healthy'
            | 'unhealthy',
          qualityValidation: qualityValidationHealth.status as
            | 'healthy'
            | 'unhealthy',
          feedbackIntegration: feedbackHealth.status as 'healthy' | 'unhealthy',
          qualityMetrics: metricsHealth.status as 'healthy' | 'unhealthy',
        },
        activeAlerts: activeAlerts.length,
        lastHealthCheck: new Date().toISOString(),
      }

      this.emit('health:checked', status)
      return status
    } catch (error) {
      this.emit('system:error', { operation: 'performHealthCheck', error })
      throw error
    }
  }

  // Alert management
  async getActiveAlerts(): Promise<QualityAlert[]> {
    this.ensureInitialized()
    return this.qualityMetrics.getActiveAlerts()
  }

  async resolveAlert(alertId: string): Promise<void> {
    this.ensureInitialized()
    await this.qualityMetrics.resolveAlert(alertId)
    this.emit('alert:resolved', { alertId })
  }

  // Analytics and reporting
  async exportQualityReport(
    timeRange: { start: string; end: string },
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    this.ensureInitialized()

    try {
      const report = await this.qualityMetrics.exportQualityReport(
        timeRange,
        format
      )

      this.emit('report:exported', {
        timeRange,
        format,
        reportSize: JSON.stringify(report).length,
      })

      return report
    } catch (error) {
      this.emit('system:error', {
        operation: 'exportQualityReport',
        timeRange,
        error,
      })
      throw error
    }
  }

  // Content analysis
  async analyzeContentQuality(contentId: string): Promise<{
    validation: QualityValidationResult | null
    feedback: FeedbackAnalysis | null
    recommendations: string[]
  }> {
    this.ensureInitialized()

    try {
      const content = await this.contentStorage.getAIContent(contentId)
      if (!content) {
        throw new Error(`Content not found: ${contentId}`)
      }

      const [validation, recommendations] = await Promise.all([
        this.qualityValidation.validateContent(content),
        this.getImprovementRecommendations(contentId),
      ])

      let feedback: FeedbackAnalysis | null = null
      try {
        feedback = await this.feedbackIntegration.analyzeFeedback(contentId)
      } catch (error) {
        // Feedback analysis might fail if no feedback exists
        feedback = null
      }

      const analysis = {
        validation,
        feedback,
        recommendations,
      }

      this.emit('content:analyzed', {
        contentId,
        analysis,
      })

      return analysis
    } catch (error) {
      this.emit('system:error', {
        operation: 'analyzeContentQuality',
        contentId,
        error,
      })
      throw error
    }
  }

  // Utility methods
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Quality system not initialized')
    }
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    try {
      // Clear any intervals or timeouts
      this.removeAllListeners()

      // Clear caches
      this.contentStorage.clearCache()

      this.emit('system:shutdown')
    } catch (error) {
      this.emit('system:error', { operation: 'shutdown', error })
      throw error
    }
  }

  // Service access (for advanced usage)
  getContentStorage(): ContentStorageService {
    this.ensureInitialized()
    return this.contentStorage
  }

  getQualityValidation(): QualityValidationService {
    this.ensureInitialized()
    return this.qualityValidation
  }

  getFeedbackIntegration(): FeedbackIntegrationService {
    this.ensureInitialized()
    return this.feedbackIntegration
  }

  getQualityMetrics(): QualityMetricsService {
    this.ensureInitialized()
    return this.qualityMetrics
  }
}

// Factory function
export function createQualitySystem(
  config: QualitySystemConfig = {}
): QualitySystem {
  return new QualitySystem(config)
}

// Production configuration
export function createProductionQualitySystem(): QualitySystem {
  const config: QualitySystemConfig = {
    contentStorage: {
      enableCaching: true,
      cacheConfig: {
        ttl: 3600, // 1 hour
        maxSize: 10000,
      },
      retentionPolicies: {
        conversationHistory: 30, // 30 days
        analyticsEvents: 90, // 90 days
        tempSessions: 24, // 24 hours
      },
    },
    validation: {
      thresholds: {
        minimum_overall: 6.5,
        minimum_educational: 6.0,
        minimum_age_appropriate: 7.5,
        minimum_coherence: 6.5,
        required_categories: [
          'educational_value',
          'age_appropriateness',
          'coherence',
        ],
      },
      enableAutomaticRegeneration: true,
      enableFeedbackCollection: true,
      qualityModels: {
        coherence: 'rule-based',
        creativity: 'rule-based',
        educational: 'rule-based',
      },
    },
    monitoring: {
      enableRealTimeMonitoring: true,
      alertThresholds: {
        qualityScore: 6.0,
        passRate: 0.8,
        userSatisfaction: 3.5,
      },
    },
  }

  return new QualitySystem(config)
}

// Development configuration
export function createDevelopmentQualitySystem(): QualitySystem {
  const config: QualitySystemConfig = {
    contentStorage: {
      enableCaching: true,
      cacheConfig: {
        ttl: 1800, // 30 minutes
        maxSize: 1000,
      },
      retentionPolicies: {
        conversationHistory: 7, // 7 days
        analyticsEvents: 30, // 30 days
        tempSessions: 12, // 12 hours
      },
    },
    validation: {
      thresholds: {
        minimum_overall: 5.0,
        minimum_educational: 4.0,
        minimum_age_appropriate: 6.0,
        minimum_coherence: 5.0,
        required_categories: ['age_appropriateness'],
      },
      enableAutomaticRegeneration: false,
      enableFeedbackCollection: true,
      qualityModels: {
        coherence: 'rule-based',
        creativity: 'rule-based',
        educational: 'rule-based',
      },
    },
    monitoring: {
      enableRealTimeMonitoring: false,
      alertThresholds: {
        qualityScore: 4.0,
        passRate: 0.6,
        userSatisfaction: 2.5,
      },
    },
  }

  return new QualitySystem(config)
}
