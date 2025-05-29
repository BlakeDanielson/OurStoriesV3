/**
 * AI Service Layer Usage Examples
 *
 * This file demonstrates how to use the enhanced AI service layer
 * with dependency injection, configuration management, and health monitoring.
 */

import {
  AIServiceLayer,
  ServiceConfig,
  getGlobalServiceLayer,
  createServiceLayer,
  ConfigurationManager,
  HealthMonitor,
} from './service-layer'
import { PromptContext } from './prompt-templates'

// Example 1: Using the global service layer (simplest approach)
export async function basicUsageExample() {
  // Get the global service layer instance (automatically configured from environment)
  const serviceLayer = getGlobalServiceLayer()

  // Create a story context
  const context: PromptContext = {
    child: {
      name: 'Emma',
      ageRange: 'preschool',
      personalityTraits: ['curious', 'kind', 'creative'],
      hobbies: ['painting', 'gardening'],
      interests: ['butterflies', 'colors'],
      readingLevel: 'beginner',
    },
    story: {
      theme: 'friendship',
      storyArc: 'discovery-journey',
      illustrationStyle: 'watercolor',
      storyLength: 'short',
      educationalFocus: 'colors and nature',
      moralLesson: 'helping others brings joy',
    },
    safetyLevel: 'strict',
  }

  try {
    // Generate a story outline
    const outline = await serviceLayer.generateStoryOutline(context, {
      enableSafetyCheck: true,
      includeUsageStats: true,
    })

    console.log('Generated outline:', outline.content)
    console.log('Usage stats:', outline.usage)

    // Generate the full story
    const story = await serviceLayer.generateStory(context, outline.content, {
      enableSafetyCheck: true,
      includeUsageStats: true,
    })

    console.log('Generated story:', story.content)
    console.log('Total cost:', story.usage?.estimatedCost)

    return story
  } catch (error) {
    console.error('Story generation failed:', error)
    throw error
  }
}

// Example 2: Custom configuration with health monitoring
export async function advancedUsageExample() {
  // Create a custom configuration
  const customConfig: ServiceConfig = {
    ai: {
      primary: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY || '',
        maxTokens: 2000,
        temperature: 0.8,
        maxRetries: 5,
        timeoutMs: 45000,
      },
      fallback: {
        provider: 'gemini',
        model: 'gemini-2.5-flash',
        apiKey: process.env.GOOGLE_API_KEY || '',
        maxTokens: 2000,
        temperature: 0.7,
        maxRetries: 3,
        timeoutMs: 30000,
      },
    },
    health: {
      checkIntervalMs: 15000, // Check every 15 seconds
      timeoutMs: 5000,
      retryAttempts: 2,
      enableMetrics: true,
    },
    cache: {
      enabled: true,
      ttlMs: 1800000, // 30 minutes
      maxSize: 500,
    },
    rateLimit: {
      enabled: true,
      requestsPerMinute: 50,
      burstLimit: 10,
    },
  }

  // Create a service layer with custom configuration
  const serviceLayer = createServiceLayer(customConfig)

  // Set up event listeners for monitoring
  serviceLayer.on('health-check', health => {
    console.log('Health check:', {
      status: health.status,
      responseTime: health.responseTime,
      errorRate: health.errorRate,
      uptime: health.uptime,
    })
  })

  serviceLayer.on('service-degraded', (provider, error) => {
    console.warn(`Service degraded - ${provider}:`, error.message)
  })

  serviceLayer.on('service-recovered', provider => {
    console.log(`Service recovered - ${provider}`)
  })

  // Get health status
  const health = serviceLayer.getHealth()
  console.log('Current health:', health)

  // Get metrics
  const metrics = serviceLayer.getMetrics()
  console.log('Service metrics:', metrics)

  return serviceLayer
}

// Example 3: Dependency injection usage
export async function dependencyInjectionExample() {
  const serviceLayer = getGlobalServiceLayer()

  // Access specific services through the registry
  const configManager = serviceLayer.getService<ConfigurationManager>('config')
  const healthMonitor = serviceLayer.getService<HealthMonitor>('health')

  // Update configuration at runtime
  configManager.updateConfig({
    ai: {
      primary: {
        provider: 'openai',
        model: 'gpt-4o-mini',
        apiKey: process.env.OPENAI_API_KEY || '',
        maxTokens: 3000,
        temperature: 0.6,
        maxRetries: 4,
        timeoutMs: 35000,
      },
    },
  })

  // Monitor configuration changes
  const unsubscribe = configManager.onConfigChange(newConfig => {
    console.log('Configuration updated:', newConfig)
  })

  // Get current health
  const health = healthMonitor.getHealth()
  console.log('Health status:', health)

  // Clean up
  return () => {
    unsubscribe()
    serviceLayer.shutdown()
  }
}

// Example 4: Error handling and fallback scenarios
export async function errorHandlingExample() {
  const serviceLayer = getGlobalServiceLayer()

  const context: PromptContext = {
    child: {
      name: 'Alex',
      ageRange: 'elementary',
      personalityTraits: ['adventurous', 'smart', 'funny'],
      hobbies: ['reading', 'science'],
      interests: ['space', 'robots'],
      readingLevel: 'advanced',
    },
    story: {
      theme: 'adventure',
      storyArc: 'hero-journey',
      illustrationStyle: 'digital',
      storyLength: 'medium',
      educationalFocus: 'science and technology',
      moralLesson: 'perseverance leads to success',
    },
    safetyLevel: 'moderate',
  }

  try {
    // This will automatically handle retries and fallback to secondary provider if needed
    const result = await serviceLayer.generateStory(context, undefined, {
      enableSafetyCheck: true,
      includeUsageStats: true,
    })

    console.log('Story generated successfully')
    console.log('Provider used:', result.metadata.provider)
    console.log('Safety check passed:', result.metadata.safetyCheckPassed)

    return result
  } catch (error) {
    console.error('All providers failed:', error)

    // Check health status to understand what went wrong
    const health = serviceLayer.getHealth()
    console.log('Service health:', health)

    throw error
  }
}

// Example 5: Monitoring and metrics collection
export function monitoringExample() {
  const serviceLayer = getGlobalServiceLayer()

  // Set up comprehensive monitoring
  const monitoringInterval = setInterval(() => {
    const health = serviceLayer.getHealth()
    const metrics = serviceLayer.getMetrics()

    console.log('=== Service Status Report ===')
    console.log('Overall Status:', health.status)
    console.log('Last Check:', health.lastCheck)
    console.log('Response Time:', health.responseTime, 'ms')
    console.log('Error Rate:', health.errorRate.toFixed(2), '%')
    console.log('Uptime:', health.uptime.toFixed(2), '%')

    console.log('\n=== Primary Provider ===')
    console.log('Provider:', health.details.primary.provider)
    console.log('Model:', health.details.primary.model)
    console.log('Status:', health.details.primary.status)
    console.log('Requests:', health.details.primary.requestCount)
    console.log('Errors:', health.details.primary.errorCount)

    if (health.details.fallback) {
      console.log('\n=== Fallback Provider ===')
      console.log('Provider:', health.details.fallback.provider)
      console.log('Model:', health.details.fallback.model)
      console.log('Status:', health.details.fallback.status)
      console.log('Requests:', health.details.fallback.requestCount)
      console.log('Errors:', health.details.fallback.errorCount)
    }

    console.log('\n=== Metrics ===')
    console.log('Total Requests:', metrics.primary.totalRequests)
    console.log(
      'Success Rate:',
      metrics.primary.totalRequests > 0
        ? (
            (metrics.primary.successfulRequests /
              metrics.primary.totalRequests) *
            100
          ).toFixed(2) + '%'
        : 'N/A'
    )
    console.log(
      'Average Response Time:',
      metrics.primary.averageResponseTime.toFixed(2),
      'ms'
    )
    console.log('Total Cost:', '$' + metrics.primary.totalCost.toFixed(4))
    console.log('Total Tokens:', metrics.primary.totalTokens)
    console.log(
      'Uptime:',
      (metrics.primary.uptime / 1000 / 60).toFixed(2),
      'minutes'
    )
    console.log('========================\n')
  }, 30000) // Report every 30 seconds

  // Return cleanup function
  return () => {
    clearInterval(monitoringInterval)
  }
}

// Example 6: Configuration from environment variables
export function environmentConfigExample() {
  // The service layer can be configured via environment variables:
  /*
  AI_PRIMARY_PROVIDER=openai
  AI_PRIMARY_MODEL=gpt-4o-mini
  OPENAI_API_KEY=your_openai_key
  AI_MAX_TOKENS=4000
  AI_TEMPERATURE=0.7
  AI_MAX_RETRIES=3
  AI_TIMEOUT_MS=30000
  
  AI_FALLBACK_PROVIDER=gemini
  AI_FALLBACK_MODEL=gemini-2.5-flash
  GOOGLE_API_KEY=your_google_key
  
  HEALTH_CHECK_INTERVAL_MS=30000
  HEALTH_ENABLE_METRICS=true
  
  CACHE_ENABLED=true
  CACHE_TTL_MS=3600000
  CACHE_MAX_SIZE=1000
  
  RATE_LIMIT_ENABLED=true
  RATE_LIMIT_RPM=100
  RATE_LIMIT_BURST=20
  */

  // Create service layer from environment
  const serviceLayer = AIServiceLayer.fromEnvironment()

  console.log('Service layer configured from environment variables')
  console.log('Health:', serviceLayer.getHealth())

  return serviceLayer
}

// Export all examples for easy testing
export const examples = {
  basic: basicUsageExample,
  advanced: advancedUsageExample,
  dependencyInjection: dependencyInjectionExample,
  errorHandling: errorHandlingExample,
  monitoring: monitoringExample,
  environment: environmentConfigExample,
}
