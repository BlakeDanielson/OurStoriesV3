/**
 * Quality Metrics Dashboard Service
 * Comprehensive analytics and monitoring for quality validation system
 */

import { z } from 'zod'
import { EventEmitter } from 'events'
import { ContentStorageService } from './content-storage'
import {
  QualityValidationService,
  QualityValidationResult,
} from './quality-validation'
import {
  FeedbackIntegrationService,
  FeedbackAnalysis,
} from './feedback-integration'

// Metrics schemas
export const QualityMetricsSchema = z.object({
  timeRange: z.object({
    start: z.string(),
    end: z.string(),
  }),
  totalContent: z.number(),
  averageQualityScore: z.number(),
  passRate: z.number(),
  topIssues: z.array(z.string()),
  improvementTrends: z.array(
    z.object({
      metric: z.string(),
      trend: z.enum(['improving', 'stable', 'declining']),
      change: z.number(),
    })
  ),
})

export const ProviderPerformanceSchema = z.object({
  provider: z.string(),
  model: z.string(),
  totalGenerations: z.number(),
  averageQuality: z.number(),
  passRate: z.number(),
  averageCost: z.number(),
  averageTime: z.number(),
  userSatisfaction: z.number(),
})

export const ContentCategoryMetricsSchema = z.object({
  category: z.string(),
  totalContent: z.number(),
  averageQuality: z.number(),
  userEngagement: z.number(),
  educationalEffectiveness: z.number(),
  topPerformingThemes: z.array(z.string()),
})

export type QualityMetrics = z.infer<typeof QualityMetricsSchema>
export type ProviderPerformance = z.infer<typeof ProviderPerformanceSchema>
export type ContentCategoryMetrics = z.infer<
  typeof ContentCategoryMetricsSchema
>

// Dashboard interfaces
export interface QualityDashboard {
  overview: QualityMetrics
  providerPerformance: ProviderPerformance[]
  categoryMetrics: ContentCategoryMetrics[]
  recentValidations: QualityValidationResult[]
  alerts: QualityAlert[]
  recommendations: string[]
  generatedAt: string
}

export interface QualityAlert {
  id: string
  type:
    | 'quality_drop'
    | 'threshold_breach'
    | 'feedback_concern'
    | 'performance_issue'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  contentId?: string
  provider?: string
  createdAt: string
  resolved: boolean
}

export interface QualityTrend {
  metric: string
  timePoints: Array<{
    timestamp: string
    value: number
  }>
  trend: 'improving' | 'stable' | 'declining'
  changeRate: number
}

// Quality metrics service
export class QualityMetricsService extends EventEmitter {
  private contentStorage: ContentStorageService
  private qualityValidation: QualityValidationService
  private feedbackService: FeedbackIntegrationService
  private alerts: QualityAlert[] = []

  constructor(
    contentStorage: ContentStorageService,
    qualityValidation: QualityValidationService,
    feedbackService: FeedbackIntegrationService
  ) {
    super()
    this.contentStorage = contentStorage
    this.qualityValidation = qualityValidation
    this.feedbackService = feedbackService
    this.setupEventListeners()
  }

  // Main dashboard generation
  async generateDashboard(timeRange: {
    start: string
    end: string
  }): Promise<QualityDashboard> {
    try {
      const [
        overview,
        providerPerformance,
        categoryMetrics,
        recentValidations,
        recommendations,
      ] = await Promise.all([
        this.getQualityOverview(timeRange),
        this.getProviderPerformance(timeRange),
        this.getCategoryMetrics(timeRange),
        this.getRecentValidations(10),
        this.generateRecommendations(timeRange),
      ])

      const dashboard: QualityDashboard = {
        overview,
        providerPerformance,
        categoryMetrics,
        recentValidations,
        alerts: this.getActiveAlerts(),
        recommendations,
        generatedAt: new Date().toISOString(),
      }

      this.emit('dashboard:generated', dashboard)
      return dashboard
    } catch (error) {
      this.emit('error', { operation: 'generateDashboard', error })
      throw error
    }
  }

  // Quality overview metrics
  async getQualityOverview(timeRange: {
    start: string
    end: string
  }): Promise<QualityMetrics> {
    try {
      // This would query the analytics system for quality data
      // For now, return mock data with realistic structure
      const overview: QualityMetrics = {
        timeRange,
        totalContent: 1250,
        averageQualityScore: 7.3,
        passRate: 0.87,
        topIssues: [
          'coherence_below_threshold',
          'educational_value_low',
          'age_appropriateness_concerns',
          'character_development_weak',
        ],
        improvementTrends: [
          {
            metric: 'overall_quality',
            trend: 'improving',
            change: 0.15,
          },
          {
            metric: 'educational_value',
            trend: 'stable',
            change: 0.02,
          },
          {
            metric: 'user_satisfaction',
            trend: 'improving',
            change: 0.23,
          },
        ],
      }

      return overview
    } catch (error) {
      this.emit('error', { operation: 'getQualityOverview', error })
      throw error
    }
  }

  // Provider performance analysis
  async getProviderPerformance(timeRange: {
    start: string
    end: string
  }): Promise<ProviderPerformance[]> {
    try {
      // This would analyze performance by AI provider
      const performance: ProviderPerformance[] = [
        {
          provider: 'openai',
          model: 'gpt-4',
          totalGenerations: 850,
          averageQuality: 7.8,
          passRate: 0.92,
          averageCost: 0.045,
          averageTime: 3200,
          userSatisfaction: 4.3,
        },
        {
          provider: 'anthropic',
          model: 'claude-3-sonnet',
          totalGenerations: 400,
          averageQuality: 7.5,
          passRate: 0.89,
          averageCost: 0.038,
          averageTime: 2800,
          userSatisfaction: 4.1,
        },
      ]

      return performance
    } catch (error) {
      this.emit('error', { operation: 'getProviderPerformance', error })
      throw error
    }
  }

  // Content category analysis
  async getCategoryMetrics(timeRange: {
    start: string
    end: string
  }): Promise<ContentCategoryMetrics[]> {
    try {
      const categories: ContentCategoryMetrics[] = [
        {
          category: 'adventure_stories',
          totalContent: 320,
          averageQuality: 7.6,
          userEngagement: 8.2,
          educationalEffectiveness: 7.1,
          topPerformingThemes: [
            'treasure_hunt',
            'magical_forest',
            'space_exploration',
          ],
        },
        {
          category: 'educational_stories',
          totalContent: 280,
          averageQuality: 7.9,
          userEngagement: 7.4,
          educationalEffectiveness: 8.5,
          topPerformingThemes: [
            'counting_games',
            'alphabet_adventures',
            'science_discovery',
          ],
        },
        {
          category: 'bedtime_stories',
          totalContent: 450,
          averageQuality: 7.2,
          userEngagement: 7.8,
          educationalEffectiveness: 6.9,
          topPerformingThemes: [
            'gentle_animals',
            'peaceful_dreams',
            'family_love',
          ],
        },
      ]

      return categories
    } catch (error) {
      this.emit('error', { operation: 'getCategoryMetrics', error })
      throw error
    }
  }

  // Recent validations
  async getRecentValidations(
    limit: number = 10
  ): Promise<QualityValidationResult[]> {
    try {
      // This would query recent validation results
      // For now, return empty array - would be implemented with actual data
      return []
    } catch (error) {
      this.emit('error', { operation: 'getRecentValidations', error })
      throw error
    }
  }

  // Quality trends analysis
  async getQualityTrends(
    metrics: string[],
    timeRange: { start: string; end: string },
    granularity: 'hour' | 'day' | 'week' = 'day'
  ): Promise<QualityTrend[]> {
    try {
      const trends: QualityTrend[] = []

      for (const metric of metrics) {
        // This would calculate actual trends from data
        const trend: QualityTrend = {
          metric,
          timePoints: this.generateMockTimePoints(timeRange, granularity),
          trend: 'improving',
          changeRate: 0.12,
        }
        trends.push(trend)
      }

      return trends
    } catch (error) {
      this.emit('error', { operation: 'getQualityTrends', error })
      throw error
    }
  }

  // Alert management
  async createAlert(
    alert: Omit<QualityAlert, 'id' | 'createdAt' | 'resolved'>
  ): Promise<QualityAlert> {
    const newAlert: QualityAlert = {
      id: this.generateAlertId(),
      ...alert,
      createdAt: new Date().toISOString(),
      resolved: false,
    }

    this.alerts.push(newAlert)
    this.emit('alert:created', newAlert)

    // Store alert in analytics
    await this.contentStorage.recordAnalyticsEvent({
      eventType: 'quality_alert',
      eventName: `alert_${alert.type}`,
      eventData: {
        alertId: newAlert.id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        contentId: alert.contentId,
        provider: alert.provider,
      },
    })

    return newAlert
  }

  async resolveAlert(alertId: string): Promise<void> {
    const alert = this.alerts.find(a => a.id === alertId)
    if (alert) {
      alert.resolved = true
      this.emit('alert:resolved', alert)

      await this.contentStorage.recordAnalyticsEvent({
        eventType: 'quality_alert',
        eventName: 'alert_resolved',
        eventData: { alertId },
      })
    }
  }

  getActiveAlerts(): QualityAlert[] {
    return this.alerts.filter(alert => !alert.resolved)
  }

  // Recommendations generation
  async generateRecommendations(timeRange: {
    start: string
    end: string
  }): Promise<string[]> {
    try {
      const overview = await this.getQualityOverview(timeRange)
      const recommendations: string[] = []

      // Quality-based recommendations
      if (overview.averageQualityScore < 7.0) {
        recommendations.push(
          'Overall quality scores are below target. Consider reviewing prompt templates and quality thresholds.'
        )
      }

      if (overview.passRate < 0.85) {
        recommendations.push(
          'Quality pass rate is low. Review validation criteria and consider adjusting thresholds.'
        )
      }

      // Issue-based recommendations
      if (overview.topIssues.includes('coherence_below_threshold')) {
        recommendations.push(
          'Coherence issues detected. Improve story flow and narrative structure in prompts.'
        )
      }

      if (overview.topIssues.includes('educational_value_low')) {
        recommendations.push(
          'Educational value needs improvement. Enhance learning objectives in content generation.'
        )
      }

      if (overview.topIssues.includes('age_appropriateness_concerns')) {
        recommendations.push(
          'Age appropriateness issues found. Review vocabulary and complexity controls.'
        )
      }

      // Trend-based recommendations
      const decliningTrends = overview.improvementTrends.filter(
        t => t.trend === 'declining'
      )
      if (decliningTrends.length > 0) {
        recommendations.push(
          `Declining trends detected in: ${decliningTrends.map(t => t.metric).join(', ')}. Investigate root causes.`
        )
      }

      return recommendations
    } catch (error) {
      this.emit('error', { operation: 'generateRecommendations', error })
      throw error
    }
  }

  // Real-time monitoring
  async startRealTimeMonitoring(): Promise<void> {
    // Set up real-time quality monitoring
    setInterval(async () => {
      try {
        await this.checkQualityThresholds()
        await this.monitorPerformanceMetrics()
      } catch (error) {
        this.emit('error', { operation: 'realTimeMonitoring', error })
      }
    }, 60000) // Check every minute

    this.emit('monitoring:started')
  }

  private async checkQualityThresholds(): Promise<void> {
    // Check for quality threshold breaches
    const recentValidations = await this.getRecentValidations(50)

    const recentPassRate =
      recentValidations.filter(v => v.passesThreshold).length /
      recentValidations.length

    if (recentPassRate < 0.8) {
      await this.createAlert({
        type: 'threshold_breach',
        severity: 'high',
        message: `Quality pass rate dropped to ${(recentPassRate * 100).toFixed(1)}% in recent validations`,
      })
    }
  }

  private async monitorPerformanceMetrics(): Promise<void> {
    // Monitor performance metrics and create alerts if needed
    const timeRange = {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Last 24 hours
      end: new Date().toISOString(),
    }

    const overview = await this.getQualityOverview(timeRange)

    if (overview.averageQualityScore < 6.5) {
      await this.createAlert({
        type: 'quality_drop',
        severity: 'medium',
        message: `Average quality score dropped to ${overview.averageQualityScore.toFixed(2)}`,
      })
    }
  }

  // Event listeners setup
  private setupEventListeners(): void {
    // Listen for quality validation events
    this.qualityValidation.on('validation:failed', async data => {
      await this.createAlert({
        type: 'quality_drop',
        severity: 'medium',
        message: `Content validation failed for content ${data.contentId}`,
        contentId: data.contentId,
      })
    })

    // Listen for feedback events
    this.feedbackService.on(
      'feedback:analyzed',
      async (analysis: FeedbackAnalysis) => {
        if (analysis.average_ratings.overall < 2.5) {
          await this.createAlert({
            type: 'feedback_concern',
            severity: 'high',
            message: `Poor user feedback detected for content ${analysis.content_id}`,
            contentId: analysis.content_id,
          })
        }
      }
    )
  }

  // Utility methods
  private generateMockTimePoints(
    timeRange: { start: string; end: string },
    granularity: 'hour' | 'day' | 'week'
  ): Array<{ timestamp: string; value: number }> {
    const points: Array<{ timestamp: string; value: number }> = []
    const start = new Date(timeRange.start)
    const end = new Date(timeRange.end)

    let current = new Date(start)
    const increment =
      granularity === 'hour'
        ? 60 * 60 * 1000
        : granularity === 'day'
          ? 24 * 60 * 60 * 1000
          : 7 * 24 * 60 * 60 * 1000

    while (current <= end) {
      points.push({
        timestamp: current.toISOString(),
        value: 7.0 + Math.random() * 1.5, // Mock quality scores between 7.0-8.5
      })
      current = new Date(current.getTime() + increment)
    }

    return points
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Export methods
  async exportQualityReport(
    timeRange: { start: string; end: string },
    format: 'json' | 'csv' = 'json'
  ): Promise<any> {
    const dashboard = await this.generateDashboard(timeRange)

    if (format === 'json') {
      return dashboard
    }

    // Convert to CSV format
    return this.convertToCSV(dashboard)
  }

  private convertToCSV(dashboard: QualityDashboard): string {
    // Simple CSV conversion for overview metrics
    const headers = ['Metric', 'Value']
    const rows = [
      ['Total Content', dashboard.overview.totalContent.toString()],
      [
        'Average Quality Score',
        dashboard.overview.averageQualityScore.toString(),
      ],
      ['Pass Rate', dashboard.overview.passRate.toString()],
      ['Top Issues', dashboard.overview.topIssues.join('; ')],
    ]

    return [headers, ...rows].map(row => row.join(',')).join('\n')
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: any
  }> {
    try {
      const activeAlerts = this.getActiveAlerts()
      const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')

      return {
        status: criticalAlerts.length === 0 ? 'healthy' : 'unhealthy',
        details: {
          activeAlerts: activeAlerts.length,
          criticalAlerts: criticalAlerts.length,
          lastDashboardGeneration: new Date().toISOString(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }
}

// Factory function
export function createQualityMetricsService(
  contentStorage: ContentStorageService,
  qualityValidation: QualityValidationService,
  feedbackService: FeedbackIntegrationService
): QualityMetricsService {
  return new QualityMetricsService(
    contentStorage,
    qualityValidation,
    feedbackService
  )
}

// Metrics aggregation utilities
export class MetricsAggregator {
  static calculateAverageScore(scores: number[]): number {
    if (scores.length === 0) return 0
    return scores.reduce((sum, score) => sum + score, 0) / scores.length
  }

  static calculatePercentile(scores: number[], percentile: number): number {
    if (scores.length === 0) return 0
    const sorted = [...scores].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  static calculateTrend(
    values: number[]
  ): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable'

    const firstHalf = values.slice(0, Math.floor(values.length / 2))
    const secondHalf = values.slice(Math.floor(values.length / 2))

    const firstAvg = this.calculateAverageScore(firstHalf)
    const secondAvg = this.calculateAverageScore(secondHalf)

    const change = (secondAvg - firstAvg) / firstAvg

    if (change > 0.05) return 'improving'
    if (change < -0.05) return 'declining'
    return 'stable'
  }

  static groupByTimeInterval(
    data: Array<{ timestamp: string; value: number }>,
    interval: 'hour' | 'day' | 'week'
  ): Array<{ timestamp: string; value: number }> {
    // Group data points by time interval
    const grouped = new Map<string, number[]>()

    data.forEach(point => {
      const date = new Date(point.timestamp)
      let key: string

      switch (interval) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
          break
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
          break
        case 'week':
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          key = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
          break
      }

      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(point.value)
    })

    // Calculate averages for each group
    return Array.from(grouped.entries()).map(([key, values]) => ({
      timestamp: key,
      value: this.calculateAverageScore(values),
    }))
  }
}
