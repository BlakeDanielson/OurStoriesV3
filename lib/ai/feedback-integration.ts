/**
 * User Feedback Integration Service
 * Collects, analyzes, and integrates user feedback for continuous improvement
 */

import { z } from 'zod'
import { EventEmitter } from 'events'
import { ContentStorageService } from './content-storage'
import {
  QualityValidationService,
  QualityValidationResult,
} from './quality-validation'

// Feedback schemas
export const FeedbackTypeSchema = z.enum([
  'rating',
  'text_feedback',
  'engagement_metric',
  'completion_rate',
  'regeneration_request',
])

export const FeedbackRatingSchema = z.object({
  overall: z.number().min(1).max(5),
  story_quality: z.number().min(1).max(5).optional(),
  educational_value: z.number().min(1).max(5).optional(),
  age_appropriateness: z.number().min(1).max(5).optional(),
  engagement: z.number().min(1).max(5).optional(),
})

export const EngagementMetricsSchema = z.object({
  reading_time_seconds: z.number().min(0),
  pages_viewed: z.number().min(0),
  completion_percentage: z.number().min(0).max(100),
  interactions: z.number().min(0),
  return_visits: z.number().min(0),
})

export type FeedbackType = z.infer<typeof FeedbackTypeSchema>
export type FeedbackRating = z.infer<typeof FeedbackRatingSchema>
export type EngagementMetrics = z.infer<typeof EngagementMetricsSchema>

// Feedback interfaces
export interface UserFeedback {
  id: string
  user_id: string
  child_profile_id?: string
  content_id: string
  feedback_type: FeedbackType
  rating?: FeedbackRating
  text_feedback?: string
  engagement_metrics?: EngagementMetrics
  metadata: Record<string, any>
  created_at: string
}

export interface FeedbackAnalysis {
  content_id: string
  total_feedback_count: number
  average_ratings: FeedbackRating
  sentiment_score: number
  common_themes: string[]
  improvement_suggestions: string[]
  quality_correlation: number
  analyzed_at: string
}

export interface FeedbackTrends {
  time_period: string
  total_feedback: number
  average_satisfaction: number
  top_issues: string[]
  improvement_areas: string[]
  quality_trend: 'improving' | 'stable' | 'declining'
}

// Feedback integration service
export class FeedbackIntegrationService extends EventEmitter {
  private contentStorage: ContentStorageService
  private qualityValidation?: QualityValidationService

  constructor(
    contentStorage: ContentStorageService,
    qualityValidation?: QualityValidationService
  ) {
    super()
    this.contentStorage = contentStorage
    this.qualityValidation = qualityValidation
  }

  // Feedback collection
  async collectFeedback(
    feedback: Omit<UserFeedback, 'id' | 'created_at'>
  ): Promise<UserFeedback> {
    try {
      const feedbackRecord: UserFeedback = {
        id: this.generateFeedbackId(),
        ...feedback,
        created_at: new Date().toISOString(),
      }

      // Store feedback in analytics
      await this.contentStorage.recordAnalyticsEvent({
        userId: feedback.user_id,
        childProfileId: feedback.child_profile_id,
        eventType: 'user_feedback',
        eventName: `feedback_${feedback.feedback_type}`,
        eventData: {
          contentId: feedback.content_id,
          feedbackType: feedback.feedback_type,
          rating: feedback.rating,
          textFeedback: feedback.text_feedback,
          engagementMetrics: feedback.engagement_metrics,
        },
      })

      this.emit('feedback:collected', feedbackRecord)

      // Trigger analysis if enough feedback collected
      await this.checkForAnalysisTrigger(feedback.content_id)

      return feedbackRecord
    } catch (error) {
      this.emit('error', { operation: 'collectFeedback', error })
      throw error
    }
  }

  // Rating feedback
  async submitRating(
    userId: string,
    contentId: string,
    rating: FeedbackRating,
    childProfileId?: string
  ): Promise<UserFeedback> {
    return this.collectFeedback({
      user_id: userId,
      child_profile_id: childProfileId,
      content_id: contentId,
      feedback_type: 'rating',
      rating,
      metadata: { source: 'rating_widget' },
    })
  }

  // Text feedback
  async submitTextFeedback(
    userId: string,
    contentId: string,
    textFeedback: string,
    childProfileId?: string,
    metadata: Record<string, any> = {}
  ): Promise<UserFeedback> {
    return this.collectFeedback({
      user_id: userId,
      child_profile_id: childProfileId,
      content_id: contentId,
      feedback_type: 'text_feedback',
      text_feedback: textFeedback,
      metadata: { ...metadata, source: 'feedback_form' },
    })
  }

  // Engagement metrics
  async recordEngagementMetrics(
    userId: string,
    contentId: string,
    metrics: EngagementMetrics,
    childProfileId?: string
  ): Promise<UserFeedback> {
    return this.collectFeedback({
      user_id: userId,
      child_profile_id: childProfileId,
      content_id: contentId,
      feedback_type: 'engagement_metric',
      engagement_metrics: metrics,
      metadata: { source: 'engagement_tracker' },
    })
  }

  // Feedback analysis
  async analyzeFeedback(contentId: string): Promise<FeedbackAnalysis> {
    try {
      // Get all feedback for content
      const feedbackData = await this.getFeedbackForContent(contentId)

      if (feedbackData.length === 0) {
        throw new Error('No feedback data available for analysis')
      }

      // Calculate average ratings
      const ratings = feedbackData.filter(f => f.rating).map(f => f.rating!)

      const averageRatings = this.calculateAverageRatings(ratings)

      // Analyze text feedback
      const textFeedbacks = feedbackData
        .filter(f => f.text_feedback)
        .map(f => f.text_feedback!)

      const sentimentScore = await this.analyzeSentiment(textFeedbacks)
      const commonThemes = await this.extractCommonThemes(textFeedbacks)
      const improvementSuggestions =
        await this.generateImprovementSuggestions(textFeedbacks)

      // Correlate with quality scores
      const qualityCorrelation = await this.calculateQualityCorrelation(
        contentId,
        averageRatings
      )

      const analysis: FeedbackAnalysis = {
        content_id: contentId,
        total_feedback_count: feedbackData.length,
        average_ratings: averageRatings,
        sentiment_score: sentimentScore,
        common_themes: commonThemes,
        improvement_suggestions: improvementSuggestions,
        quality_correlation: qualityCorrelation,
        analyzed_at: new Date().toISOString(),
      }

      // Store analysis results
      await this.storeFeedbackAnalysis(analysis)

      this.emit('feedback:analyzed', analysis)

      return analysis
    } catch (error) {
      this.emit('error', { operation: 'analyzeFeedback', error })
      throw error
    }
  }

  // Feedback trends analysis
  async getFeedbackTrends(
    timeRange: { start: string; end: string },
    userId?: string
  ): Promise<FeedbackTrends> {
    try {
      // This would query the analytics system for feedback trends
      // For now, return mock data structure
      const trends: FeedbackTrends = {
        time_period: `${timeRange.start} to ${timeRange.end}`,
        total_feedback: 150,
        average_satisfaction: 4.2,
        top_issues: [
          'story_length',
          'character_development',
          'educational_content',
        ],
        improvement_areas: ['creativity', 'engagement', 'age_appropriateness'],
        quality_trend: 'improving',
      }

      return trends
    } catch (error) {
      this.emit('error', { operation: 'getFeedbackTrends', error })
      throw error
    }
  }

  // Feedback-driven improvements
  async generateImprovementRecommendations(
    contentId: string
  ): Promise<string[]> {
    try {
      const analysis = await this.analyzeFeedback(contentId)
      const recommendations: string[] = []

      // Rating-based recommendations
      if (analysis.average_ratings.overall < 3.5) {
        recommendations.push(
          'Consider regenerating content with improved quality parameters'
        )
      }

      if (
        analysis.average_ratings.story_quality &&
        analysis.average_ratings.story_quality < 3.5
      ) {
        recommendations.push(
          'Focus on improving story structure and narrative flow'
        )
      }

      if (
        analysis.average_ratings.educational_value &&
        analysis.average_ratings.educational_value < 3.5
      ) {
        recommendations.push(
          'Enhance educational content and learning objectives'
        )
      }

      if (
        analysis.average_ratings.engagement &&
        analysis.average_ratings.engagement < 3.5
      ) {
        recommendations.push('Add more interactive and engaging elements')
      }

      // Theme-based recommendations
      if (analysis.common_themes.includes('too_short')) {
        recommendations.push('Increase story length and detail')
      }

      if (analysis.common_themes.includes('too_complex')) {
        recommendations.push('Simplify language and concepts for target age')
      }

      if (analysis.common_themes.includes('boring')) {
        recommendations.push('Add more exciting and adventurous elements')
      }

      // Sentiment-based recommendations
      if (analysis.sentiment_score < 0.3) {
        recommendations.push(
          'Address negative feedback themes in content generation'
        )
      }

      return recommendations
    } catch (error) {
      this.emit('error', {
        operation: 'generateImprovementRecommendations',
        error,
      })
      throw error
    }
  }

  // Integration with quality validation
  async integrateFeedbackWithQuality(contentId: string): Promise<void> {
    if (!this.qualityValidation) return

    try {
      const analysis = await this.analyzeFeedback(contentId)

      // Update quality thresholds based on feedback
      if (analysis.quality_correlation < 0.5) {
        this.emit('quality:threshold_adjustment_needed', {
          contentId,
          correlation: analysis.quality_correlation,
          feedback: analysis,
        })
      }

      // Trigger re-validation if feedback indicates quality issues
      if (analysis.average_ratings.overall < 3.0) {
        this.emit('quality:revalidation_needed', {
          contentId,
          reason: 'poor_user_feedback',
          feedback: analysis,
        })
      }
    } catch (error) {
      this.emit('error', { operation: 'integrateFeedbackWithQuality', error })
    }
  }

  // Helper methods
  private async getFeedbackForContent(
    contentId: string
  ): Promise<UserFeedback[]> {
    // This would query the analytics system for feedback data
    // For now, return empty array - would be implemented with actual data source
    return []
  }

  private calculateAverageRatings(ratings: FeedbackRating[]): FeedbackRating {
    if (ratings.length === 0) {
      return { overall: 0 }
    }

    const sums: Record<string, number> = {}
    const counts: Record<string, number> = {}

    ratings.forEach(rating => {
      Object.entries(rating).forEach(([key, value]) => {
        if (typeof value === 'number') {
          sums[key] = (sums[key] || 0) + value
          counts[key] = (counts[key] || 0) + 1
        }
      })
    })

    return {
      overall: sums.overall / counts.overall,
      story_quality:
        counts.story_quality > 0
          ? (sums.story_quality || 0) / counts.story_quality
          : undefined,
      educational_value:
        counts.educational_value > 0
          ? (sums.educational_value || 0) / counts.educational_value
          : undefined,
      age_appropriateness:
        counts.age_appropriateness > 0
          ? (sums.age_appropriateness || 0) / counts.age_appropriateness
          : undefined,
      engagement:
        counts.engagement > 0
          ? (sums.engagement || 0) / counts.engagement
          : undefined,
    }
  }

  private async analyzeSentiment(textFeedbacks: string[]): Promise<number> {
    if (textFeedbacks.length === 0) return 0.5

    // Simple sentiment analysis based on keywords
    const positiveWords = [
      'good',
      'great',
      'love',
      'amazing',
      'wonderful',
      'excellent',
      'fantastic',
      'perfect',
    ]
    const negativeWords = [
      'bad',
      'terrible',
      'hate',
      'awful',
      'boring',
      'stupid',
      'worst',
      'horrible',
    ]

    let totalSentiment = 0

    textFeedbacks.forEach(feedback => {
      const lowerFeedback = feedback.toLowerCase()
      let sentimentScore = 0.5 // Neutral baseline

      const positiveCount = positiveWords.filter(word =>
        lowerFeedback.includes(word)
      ).length
      const negativeCount = negativeWords.filter(word =>
        lowerFeedback.includes(word)
      ).length

      sentimentScore += positiveCount * 0.1 - negativeCount * 0.1
      sentimentScore = Math.max(0, Math.min(1, sentimentScore))

      totalSentiment += sentimentScore
    })

    return totalSentiment / textFeedbacks.length
  }

  private async extractCommonThemes(
    textFeedbacks: string[]
  ): Promise<string[]> {
    if (textFeedbacks.length === 0) return []

    const themes: Record<string, number> = {}

    // Define theme keywords
    const themeKeywords = {
      too_short: ['short', 'brief', 'quick', 'more pages'],
      too_long: ['long', 'lengthy', 'too much', 'dragging'],
      too_complex: ['complex', 'difficult', 'hard', 'confusing'],
      too_simple: ['simple', 'easy', 'basic', 'childish'],
      boring: ['boring', 'dull', 'uninteresting', 'bland'],
      exciting: ['exciting', 'fun', 'engaging', 'interesting'],
      educational: ['learn', 'educational', 'teaching', 'informative'],
      creative: ['creative', 'imaginative', 'original', 'unique'],
    }

    textFeedbacks.forEach(feedback => {
      const lowerFeedback = feedback.toLowerCase()

      Object.entries(themeKeywords).forEach(([theme, keywords]) => {
        const matches = keywords.filter(keyword =>
          lowerFeedback.includes(keyword)
        ).length
        if (matches > 0) {
          themes[theme] = (themes[theme] || 0) + matches
        }
      })
    })

    // Return top themes
    return Object.entries(themes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([theme]) => theme)
  }

  private async generateImprovementSuggestions(
    textFeedbacks: string[]
  ): Promise<string[]> {
    const themes = await this.extractCommonThemes(textFeedbacks)
    const suggestions: string[] = []

    themes.forEach(theme => {
      switch (theme) {
        case 'too_short':
          suggestions.push(
            'Increase story length and add more detailed descriptions'
          )
          break
        case 'too_long':
          suggestions.push('Reduce story length and focus on key plot points')
          break
        case 'too_complex':
          suggestions.push('Simplify vocabulary and sentence structure')
          break
        case 'too_simple':
          suggestions.push('Add more sophisticated concepts and vocabulary')
          break
        case 'boring':
          suggestions.push(
            'Include more action, adventure, and engaging elements'
          )
          break
        case 'educational':
          suggestions.push('Maintain strong educational content')
          break
        case 'creative':
          suggestions.push(
            'Continue with creative and imaginative storytelling'
          )
          break
      }
    })

    return suggestions
  }

  private async calculateQualityCorrelation(
    contentId: string,
    ratings: FeedbackRating
  ): Promise<number> {
    // This would correlate user ratings with quality validation scores
    // For now, return a mock correlation
    return 0.75
  }

  private async storeFeedbackAnalysis(
    analysis: FeedbackAnalysis
  ): Promise<void> {
    try {
      await this.contentStorage.recordAnalyticsEvent({
        eventType: 'feedback_analysis',
        eventName: 'analysis_completed',
        eventData: {
          contentId: analysis.content_id,
          totalFeedback: analysis.total_feedback_count,
          averageRatings: analysis.average_ratings,
          sentimentScore: analysis.sentiment_score,
          commonThemes: analysis.common_themes,
          qualityCorrelation: analysis.quality_correlation,
        },
      })
    } catch (error) {
      this.emit('error', { operation: 'storeFeedbackAnalysis', error })
    }
  }

  private async checkForAnalysisTrigger(contentId: string): Promise<void> {
    // Check if we have enough feedback to trigger analysis
    const feedbackCount = await this.getFeedbackCount(contentId)

    if (feedbackCount >= 5) {
      // Trigger analysis after 5 pieces of feedback
      await this.analyzeFeedback(contentId)
    }
  }

  private async getFeedbackCount(contentId: string): Promise<number> {
    // This would query the actual feedback count
    return 0
  }

  private generateFeedbackId(): string {
    return `feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Batch operations
  async analyzeBatchFeedback(
    contentIds: string[]
  ): Promise<FeedbackAnalysis[]> {
    const analyses: FeedbackAnalysis[] = []

    for (const contentId of contentIds) {
      try {
        const analysis = await this.analyzeFeedback(contentId)
        analyses.push(analysis)
      } catch (error) {
        this.emit('error', {
          operation: 'analyzeBatchFeedback',
          contentId,
          error,
        })
      }
    }

    return analyses
  }

  // Feedback export for training
  async exportFeedbackForTraining(timeRange?: {
    start: string
    end: string
  }): Promise<any[]> {
    // Export feedback data in format suitable for ML training
    // This would integrate with the analytics system
    return []
  }
}

// Factory function
export function createFeedbackIntegrationService(
  contentStorage: ContentStorageService,
  qualityValidation?: QualityValidationService
): FeedbackIntegrationService {
  return new FeedbackIntegrationService(contentStorage, qualityValidation)
}

// Feedback collection utilities
export class FeedbackCollector {
  private feedbackService: FeedbackIntegrationService

  constructor(feedbackService: FeedbackIntegrationService) {
    this.feedbackService = feedbackService
  }

  // Quick rating collection
  async quickRating(
    userId: string,
    contentId: string,
    rating: number
  ): Promise<UserFeedback> {
    return this.feedbackService.submitRating(userId, contentId, {
      overall: rating,
    })
  }

  // Thumbs up/down collection
  async thumbsRating(
    userId: string,
    contentId: string,
    isPositive: boolean
  ): Promise<UserFeedback> {
    const rating = isPositive ? 5 : 1
    return this.feedbackService.submitRating(userId, contentId, {
      overall: rating,
    })
  }

  // Engagement tracking
  async trackReading(
    userId: string,
    contentId: string,
    startTime: number,
    endTime: number,
    pagesViewed: number,
    completionPercentage: number
  ): Promise<UserFeedback> {
    const metrics: EngagementMetrics = {
      reading_time_seconds: Math.floor((endTime - startTime) / 1000),
      pages_viewed: pagesViewed,
      completion_percentage: completionPercentage,
      interactions: 1,
      return_visits: 0,
    }

    return this.feedbackService.recordEngagementMetrics(
      userId,
      contentId,
      metrics
    )
  }
}
