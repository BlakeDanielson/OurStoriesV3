/**
 * Enhanced AI Text Generation Demo
 *
 * This example demonstrates how to use the enhanced AI text generation service
 * with integrated quality validation for children's stories.
 */

import {
  createEnhancedServiceFromEnv,
  createDevelopmentEnhancedService,
  EnhancedAITextGenerationService,
  QualityValidationError,
} from '../enhanced-text-generation'
import { PromptContext } from '../prompt-templates'

// Example usage of the enhanced service
export async function demonstrateEnhancedGeneration() {
  console.log('🚀 Starting Enhanced AI Text Generation Demo...\n')

  // Create the enhanced service
  const service =
    process.env.NODE_ENV === 'production'
      ? createEnhancedServiceFromEnv()
      : createDevelopmentEnhancedService()

  // Set up event listeners for monitoring
  setupEventListeners(service)

  // Example child profile and story configuration
  const context: PromptContext = {
    child: {
      name: 'Emma',
      age: 7,
      personalityTraits: ['curious', 'brave', 'kind'],
      hobbies: ['reading', 'drawing', 'exploring'],
      interests: ['animals', 'space', 'friendship'],
      readingLevel: 'intermediate',
    },
    story: {
      theme: 'space adventure',
      storyArc: 'hero-journey',
      illustrationStyle: 'colorful cartoon',
      storyLength: 'medium',
      educationalFocus: 'science and friendship',
      moralLesson: 'teamwork and perseverance',
    },
    safetyLevel: 'strict',
  }

  try {
    console.log('📝 Generating story with quality validation...')

    // Generate a story with quality validation
    const result = await service.generateStory(context, undefined, {
      userId: 'demo-user-123',
      childProfileId: 'emma-profile-456',
      storeContent: true,
      includeUsageStats: true,
    })

    console.log('✅ Story generated successfully!')
    console.log(`📊 Quality Score: ${result.qualityScore}/10`)
    console.log(`🔄 Regeneration Attempts: ${result.regenerationAttempts}`)
    console.log(`📄 Content ID: ${result.contentId}`)
    console.log(`⏱️  Processing Time: ${result.metadata.processingTimeMs}ms`)

    if (result.usage) {
      console.log(
        `💰 Estimated Cost: $${result.usage.estimatedCost.toFixed(4)}`
      )
      console.log(`🔤 Total Tokens: ${result.usage.totalTokens}`)
    }

    console.log('\n📖 Generated Story:')
    console.log('='.repeat(50))
    console.log(result.content)
    console.log('='.repeat(50))

    if (
      result.improvementRecommendations &&
      result.improvementRecommendations.length > 0
    ) {
      console.log('\n💡 Improvement Recommendations:')
      result.improvementRecommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`)
      })
    }

    // Demonstrate feedback collection
    if (result.contentId) {
      console.log('\n📝 Collecting user feedback...')
      await service.collectUserFeedback(
        'demo-user-123',
        result.contentId,
        {
          rating: {
            overall: 4,
            story_quality: 4,
            educational_value: 5,
            engagement: 4,
          },
          textFeedback:
            'Emma loved the space adventure! The friendship theme was perfect.',
          engagementMetrics: {
            reading_time_seconds: 180,
            pages_viewed: 8,
            completion_percentage: 100,
            interactions: 3,
            return_visits: 1,
          },
        },
        'emma-profile-456'
      )
      console.log('✅ Feedback collected successfully!')
    }

    // Demonstrate quality analytics
    console.log('\n📊 Generating quality dashboard...')
    const dashboard = await service.generateQualityDashboard()
    console.log(
      `📈 Overall Quality Trend: ${dashboard.overview.improvementTrends[0]?.trend || 'stable'}`
    )
    console.log(
      `⭐ Average Quality Score: ${dashboard.overview.averageQualityScore.toFixed(2)}`
    )
    console.log(
      `✅ Pass Rate: ${(dashboard.overview.passRate * 100).toFixed(1)}%`
    )
  } catch (error) {
    if (error instanceof QualityValidationError) {
      console.error('❌ Quality validation failed:')
      console.error(
        `   Score: ${error.validationResult.qualityScore.overall}/10`
      )
      console.error(`   Attempts: ${error.attempts}`)
      console.error(`   Issues:`, error.validationResult.feedback)
      console.error(
        `   Recommendations:`,
        error.validationResult.recommendations
      )
    } else {
      console.error('❌ Generation failed:', error)
    }
  } finally {
    // Cleanup
    await service.shutdown()
    console.log('\n🔚 Demo completed!')
  }
}

// Set up event listeners for real-time monitoring
function setupEventListeners(service: EnhancedAITextGenerationService) {
  service.on('generation:started', data => {
    console.log(`🎬 Generation started for ${data.contentType}`)
  })

  service.on('generation:completed', data => {
    console.log(
      `⚡ Generation completed (attempt ${data.attempt}) in ${data.processingTime}ms`
    )
  })

  service.on('quality:checked', data => {
    console.log(
      `🔍 Quality check: ${data.qualityScore}/10 (${data.passesThreshold ? 'PASS' : 'FAIL'})`
    )
  })

  service.on('quality:regenerating', data => {
    console.log(
      `🔄 Regenerating due to low quality (${data.qualityScore}/10) - attempt ${data.attempt}`
    )
  })

  service.on('generation:success', data => {
    console.log(
      `🎉 Generation successful! Quality: ${data.qualityScore}/10 in ${data.attempts} attempts`
    )
  })

  service.on('generation:failed', data => {
    console.log(
      `💥 Generation failed after ${data.attempts} attempts. Final score: ${data.qualityScore}/10`
    )
  })

  service.on('feedback:received', feedback => {
    console.log(`📝 Feedback received for content ${feedback.content_id}`)
  })

  service.on('alert:created', alert => {
    console.log(`🚨 Quality alert: ${alert.alertType} - ${alert.message}`)
  })

  service.on('error', error => {
    console.error('❌ Service error:', error)
  })
}

// Example of batch story generation with quality validation
export async function demonstrateBatchGeneration() {
  console.log('🚀 Starting Batch Generation Demo...\n')

  const service = createDevelopmentEnhancedService()
  setupEventListeners(service)

  const children = [
    {
      name: 'Alex',
      age: 5,
      personalityTraits: ['adventurous', 'funny'],
      hobbies: ['building blocks', 'singing'],
      interests: ['dinosaurs', 'music'],
    },
    {
      name: 'Sofia',
      age: 9,
      personalityTraits: ['creative', 'thoughtful'],
      hobbies: ['painting', 'gardening'],
      interests: ['nature', 'art', 'animals'],
    },
  ]

  const storyThemes = [
    'underwater adventure',
    'magical forest',
    'robot friends',
  ]

  try {
    for (const child of children) {
      for (const theme of storyThemes) {
        const context: PromptContext = {
          child: {
            ...child,
            readingLevel: child.age < 7 ? 'beginner' : 'intermediate',
          },
          story: {
            theme,
            storyArc: 'hero-journey',
            illustrationStyle: 'friendly cartoon',
            storyLength: 'short',
            educationalFocus: 'creativity and problem-solving',
          },
          safetyLevel: 'strict',
        }

        console.log(
          `\n📚 Generating "${theme}" story for ${child.name} (age ${child.age})...`
        )

        const result = await service.generateStory(context, undefined, {
          userId: `user-${child.name.toLowerCase()}`,
          childProfileId: `${child.name.toLowerCase()}-profile`,
          qualityThreshold: 6.0, // Slightly lower threshold for demo
          storeContent: false, // Don't store demo content
        })

        console.log(
          `✅ Generated for ${child.name}: Quality ${result.qualityScore}/10`
        )
      }
    }

    // Get quality metrics for the batch
    const metrics = await service.getQualityMetrics()
    console.log('\n📊 Batch Generation Summary:')
    console.log(
      `   Average Quality: ${metrics.overview.averageQualityScore.toFixed(2)}/10`
    )
    console.log(
      `   Pass Rate: ${(metrics.overview.passRate * 100).toFixed(1)}%`
    )
    console.log(`   Total Stories: ${metrics.overview.totalContent}`)
  } catch (error) {
    console.error('❌ Batch generation failed:', error)
  } finally {
    await service.shutdown()
    console.log('\n🔚 Batch demo completed!')
  }
}

// Health check demonstration
export async function demonstrateHealthCheck() {
  console.log('🏥 Starting Health Check Demo...\n')

  const service = createDevelopmentEnhancedService()

  try {
    const health = await service.performHealthCheck()

    console.log('🏥 System Health Status:')
    console.log(`   Overall: ${health.overall}`)
    console.log(`   Text Generation: ${health.textGeneration.status}`)
    console.log(
      `   Quality System: ${health.qualitySystem.isHealthy ? 'healthy' : 'unhealthy'}`
    )

    if (health.qualitySystem.activeAlerts > 0) {
      console.log(`   ⚠️  Active Alerts: ${health.qualitySystem.activeAlerts}`)

      const alerts = await service.getActiveAlerts()
      alerts.forEach(alert => {
        console.log(`      - ${alert.type}: ${alert.message}`)
      })
    }
  } catch (error) {
    console.error('❌ Health check failed:', error)
  } finally {
    await service.shutdown()
    console.log('\n🔚 Health check completed!')
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  demonstrateEnhancedGeneration()
    .then(() => demonstrateBatchGeneration())
    .then(() => demonstrateHealthCheck())
    .catch(console.error)
}
