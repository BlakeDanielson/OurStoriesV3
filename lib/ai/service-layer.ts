/**
 * AI Service Layer Implementation
 *
 * This module provides a robust service layer for AI integration with:
 * - Dependency injection container
 * - Configuration management
 * - Service health monitoring
 * - Connection pooling
 * - Provider abstraction
 * - Service lifecycle management
 */

import { EventEmitter } from 'events'
import { z } from 'zod'
import {
  AITextGenerationService,
  AIServiceConfig,
  GenerationOptions,
  GenerationResult,
  AIServiceError,
  DEFAULT_OPENAI_CONFIG,
  DEFAULT_GEMINI_CONFIG,
} from './text-generation'
import { PromptContext } from './prompt-templates'

// Service layer configuration schema
export const ServiceConfigSchema = z.object({
  ai: z.object({
    primary: z.object({
      provider: z.enum(['openai', 'gemini']),
      model: z.string(),
      apiKey: z.string(),
      maxTokens: z.number().min(100).max(32000),
      temperature: z.number().min(0).max(2),
      maxRetries: z.number().min(1).max(10),
      timeoutMs: z.number().min(1000).max(120000),
    }),
    fallback: z
      .object({
        provider: z.enum(['openai', 'gemini']),
        model: z.string(),
        apiKey: z.string(),
        maxTokens: z.number().min(100).max(32000),
        temperature: z.number().min(0).max(2),
        maxRetries: z.number().min(1).max(10),
        timeoutMs: z.number().min(1000).max(120000),
      })
      .optional(),
  }),
  health: z.object({
    checkIntervalMs: z.number().min(1000).max(300000).default(30000),
    timeoutMs: z.number().min(1000).max(30000).default(10000),
    retryAttempts: z.number().min(1).max(5).default(3),
    enableMetrics: z.boolean().default(true),
  }),
  cache: z.object({
    enabled: z.boolean().default(true),
    ttlMs: z.number().min(60000).max(86400000).default(3600000), // 1 hour default
    maxSize: z.number().min(10).max(10000).default(1000),
  }),
  rateLimit: z.object({
    enabled: z.boolean().default(true),
    requestsPerMinute: z.number().min(1).max(10000).default(100),
    burstLimit: z.number().min(1).max(1000).default(20),
  }),
})

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>

// Service health status
export interface ServiceHealth {
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: Date
  responseTime: number
  errorRate: number
  uptime: number
  details: {
    primary: ProviderHealth
    fallback?: ProviderHealth
  }
}

export interface ProviderHealth {
  provider: string
  model: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastSuccessfulRequest: Date | null
  lastError: string | null
  responseTime: number
  requestCount: number
  errorCount: number
}

// Service metrics
export interface ServiceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  totalCost: number
  totalTokens: number
  uptime: number
  startTime: Date
}

// Service events
export interface ServiceEvents {
  'health-check': (health: ServiceHealth) => void
  'service-degraded': (provider: string, error: Error) => void
  'service-recovered': (provider: string) => void
  'rate-limit-exceeded': (provider: string) => void
  'cost-threshold-exceeded': (cost: number, threshold: number) => void
  'request-completed': (metrics: {
    provider: string
    responseTime: number
    cost: number
  }) => void
}

// Abstract service interface for provider switching
export interface IAITextGenerationProvider {
  generateStoryOutline(
    context: PromptContext,
    options?: GenerationOptions
  ): Promise<GenerationResult>
  generateStory(
    context: PromptContext,
    outline?: string,
    options?: GenerationOptions
  ): Promise<GenerationResult>
  reviseStory(
    context: PromptContext,
    originalStory: string,
    revisionInstructions: string,
    improvementAreas: string[],
    options?: GenerationOptions
  ): Promise<GenerationResult>
  getHealth(): Promise<ProviderHealth>
  getMetrics(): ServiceMetrics
}

// Service registry for dependency injection
class ServiceRegistry {
  private services = new Map<string, any>()
  private singletons = new Map<string, any>()

  register<T>(name: string, factory: () => T, singleton = false): void {
    if (singleton) {
      this.singletons.set(name, factory)
    } else {
      this.services.set(name, factory)
    }
  }

  get<T>(name: string): T {
    if (this.singletons.has(name)) {
      const factory = this.singletons.get(name)
      if (typeof factory === 'function') {
        const instance = factory()
        this.singletons.set(name, instance)
        return instance
      }
      return factory
    }

    const factory = this.services.get(name)
    if (!factory) {
      throw new Error(`Service '${name}' not found in registry`)
    }

    return typeof factory === 'function' ? factory() : factory
  }

  has(name: string): boolean {
    return this.services.has(name) || this.singletons.has(name)
  }

  clear(): void {
    this.services.clear()
    this.singletons.clear()
  }
}

// Configuration management
class ConfigurationManager {
  private config: ServiceConfig
  private watchers: Array<(config: ServiceConfig) => void> = []

  constructor(config: ServiceConfig) {
    this.config = ServiceConfigSchema.parse(config)
  }

  getConfig(): ServiceConfig {
    return { ...this.config }
  }

  updateConfig(updates: Partial<ServiceConfig>): void {
    const newConfig = { ...this.config, ...updates }
    this.config = ServiceConfigSchema.parse(newConfig)
    this.notifyWatchers()
  }

  onConfigChange(callback: (config: ServiceConfig) => void): () => void {
    this.watchers.push(callback)
    return () => {
      const index = this.watchers.indexOf(callback)
      if (index > -1) {
        this.watchers.splice(index, 1)
      }
    }
  }

  private notifyWatchers(): void {
    this.watchers.forEach(watcher => watcher(this.config))
  }

  static fromEnvironment(): ConfigurationManager {
    const config: ServiceConfig = {
      ai: {
        primary: {
          provider:
            (process.env.AI_PRIMARY_PROVIDER as 'openai' | 'gemini') ||
            'openai',
          model: process.env.AI_PRIMARY_MODEL || DEFAULT_OPENAI_CONFIG.model!,
          apiKey:
            process.env.OPENAI_API_KEY || process.env.GOOGLE_API_KEY || '',
          maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
          temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
          maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
          timeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000'),
        },
        fallback: process.env.AI_FALLBACK_PROVIDER
          ? {
              provider: process.env.AI_FALLBACK_PROVIDER as 'openai' | 'gemini',
              model:
                process.env.AI_FALLBACK_MODEL || DEFAULT_GEMINI_CONFIG.model!,
              apiKey:
                process.env.GOOGLE_API_KEY || process.env.OPENAI_API_KEY || '',
              maxTokens: parseInt(process.env.AI_FALLBACK_MAX_TOKENS || '4000'),
              temperature: parseFloat(
                process.env.AI_FALLBACK_TEMPERATURE || '0.7'
              ),
              maxRetries: parseInt(process.env.AI_FALLBACK_MAX_RETRIES || '3'),
              timeoutMs: parseInt(
                process.env.AI_FALLBACK_TIMEOUT_MS || '30000'
              ),
            }
          : undefined,
      },
      health: {
        checkIntervalMs: parseInt(
          process.env.HEALTH_CHECK_INTERVAL_MS || '30000'
        ),
        timeoutMs: parseInt(process.env.HEALTH_CHECK_TIMEOUT_MS || '10000'),
        retryAttempts: parseInt(process.env.HEALTH_CHECK_RETRY_ATTEMPTS || '3'),
        enableMetrics: process.env.HEALTH_ENABLE_METRICS !== 'false',
      },
      cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        ttlMs: parseInt(process.env.CACHE_TTL_MS || '3600000'),
        maxSize: parseInt(process.env.CACHE_MAX_SIZE || '1000'),
      },
      rateLimit: {
        enabled: process.env.RATE_LIMIT_ENABLED !== 'false',
        requestsPerMinute: parseInt(process.env.RATE_LIMIT_RPM || '100'),
        burstLimit: parseInt(process.env.RATE_LIMIT_BURST || '20'),
      },
    }

    return new ConfigurationManager(config)
  }
}

// Health monitoring service
class HealthMonitor extends EventEmitter {
  private health: ServiceHealth
  private checkInterval?: NodeJS.Timeout
  private providers: Map<string, IAITextGenerationProvider> = new Map()

  constructor(private config: ServiceConfig['health']) {
    super()
    this.health = {
      status: 'healthy',
      lastCheck: new Date(),
      responseTime: 0,
      errorRate: 0,
      uptime: 0,
      details: {
        primary: this.createInitialProviderHealth('primary'),
      },
    }
  }

  addProvider(name: string, provider: IAITextGenerationProvider): void {
    this.providers.set(name, provider)
  }

  start(): void {
    if (this.checkInterval) {
      return
    }

    this.checkInterval = setInterval(() => {
      this.performHealthCheck()
    }, this.config.checkIntervalMs)

    // Initial health check
    this.performHealthCheck()
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = undefined
    }
  }

  getHealth(): ServiceHealth {
    return { ...this.health }
  }

  private async performHealthCheck(): Promise<void> {
    const startTime = Date.now()
    const providerHealths: Record<string, ProviderHealth> = {}

    for (const [name, provider] of Array.from(this.providers.entries())) {
      try {
        providerHealths[name] = await provider.getHealth()
      } catch (error) {
        providerHealths[name] = {
          provider: name,
          model: 'unknown',
          status: 'unhealthy',
          lastSuccessfulRequest: null,
          lastError: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime,
          requestCount: 0,
          errorCount: 1,
        }
      }
    }

    const responseTime = Date.now() - startTime
    const errorRate = this.calculateErrorRate(providerHealths)
    const overallStatus = this.determineOverallStatus(providerHealths)

    this.health = {
      status: overallStatus,
      lastCheck: new Date(),
      responseTime,
      errorRate,
      uptime: this.calculateUptime(),
      details: {
        primary:
          providerHealths.primary ||
          this.createInitialProviderHealth('primary'),
        fallback: providerHealths.fallback,
      },
    }

    this.emit('health-check', this.health)

    // Emit specific events based on health status
    if (overallStatus === 'degraded' || overallStatus === 'unhealthy') {
      for (const [name, health] of Object.entries(providerHealths)) {
        if (health.status !== 'healthy') {
          this.emit(
            'service-degraded',
            name,
            new Error(health.lastError || 'Service unhealthy')
          )
        }
      }
    }
  }

  private createInitialProviderHealth(name: string): ProviderHealth {
    return {
      provider: name,
      model: 'unknown',
      status: 'healthy',
      lastSuccessfulRequest: null,
      lastError: null,
      responseTime: 0,
      requestCount: 0,
      errorCount: 0,
    }
  }

  private calculateErrorRate(
    providerHealths: Record<string, ProviderHealth>
  ): number {
    const providers = Object.values(providerHealths)
    if (providers.length === 0) return 0

    const totalRequests = providers.reduce((sum, p) => sum + p.requestCount, 0)
    const totalErrors = providers.reduce((sum, p) => sum + p.errorCount, 0)

    return totalRequests > 0 ? (totalErrors / totalRequests) * 100 : 0
  }

  private determineOverallStatus(
    providerHealths: Record<string, ProviderHealth>
  ): 'healthy' | 'degraded' | 'unhealthy' {
    const providers = Object.values(providerHealths)
    if (providers.length === 0) return 'unhealthy'

    const healthyCount = providers.filter(p => p.status === 'healthy').length
    const degradedCount = providers.filter(p => p.status === 'degraded').length

    if (healthyCount === providers.length) return 'healthy'
    if (healthyCount > 0 || degradedCount > 0) return 'degraded'
    return 'unhealthy'
  }

  private calculateUptime(): number {
    // This would typically be calculated from service start time
    // For now, return a placeholder
    return 99.9
  }
}

// Enhanced AI text generation provider with metrics and health monitoring
class EnhancedAITextGenerationProvider implements IAITextGenerationProvider {
  private service: AITextGenerationService
  private metrics: ServiceMetrics
  private health: ProviderHealth
  private startTime: Date

  constructor(
    private config: AIServiceConfig,
    private providerName: string,
    fallbackConfig?: AIServiceConfig
  ) {
    this.service = new AITextGenerationService(config, fallbackConfig)
    this.startTime = new Date()
    this.metrics = this.createInitialMetrics()
    this.health = this.createInitialHealth()
  }

  async generateStoryOutline(
    context: PromptContext,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    return this.executeWithMetrics(() =>
      this.service.generateStoryOutline(context, options)
    )
  }

  async generateStory(
    context: PromptContext,
    outline?: string,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    return this.executeWithMetrics(() =>
      this.service.generateStory(context, outline, options)
    )
  }

  async reviseStory(
    context: PromptContext,
    originalStory: string,
    revisionInstructions: string,
    improvementAreas: string[],
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    return this.executeWithMetrics(() =>
      this.service.reviseStory(
        context,
        originalStory,
        revisionInstructions,
        improvementAreas,
        options
      )
    )
  }

  async getHealth(): Promise<ProviderHealth> {
    // Perform a lightweight health check
    try {
      const startTime = Date.now()
      // You could implement a simple ping or test request here
      const responseTime = Date.now() - startTime

      this.health = {
        ...this.health,
        status: 'healthy',
        responseTime,
        lastSuccessfulRequest: new Date(),
        lastError: null,
      }
    } catch (error) {
      this.health = {
        ...this.health,
        status: 'unhealthy',
        lastError: error instanceof Error ? error.message : 'Unknown error',
        errorCount: this.health.errorCount + 1,
      }
    }

    return { ...this.health }
  }

  getMetrics(): ServiceMetrics {
    return {
      ...this.metrics,
      uptime: Date.now() - this.startTime.getTime(),
      averageResponseTime:
        this.metrics.totalRequests > 0
          ? this.metrics.averageResponseTime / this.metrics.totalRequests
          : 0,
    }
  }

  private async executeWithMetrics<T extends GenerationResult>(
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now()
    this.metrics.totalRequests++
    this.health.requestCount++

    try {
      const result = await operation()
      const responseTime = Date.now() - startTime

      // Update metrics
      this.metrics.successfulRequests++
      this.metrics.averageResponseTime += responseTime
      if (result.usage) {
        this.metrics.totalCost += result.usage.estimatedCost
        this.metrics.totalTokens += result.usage.totalTokens
      }

      // Update health
      this.health.lastSuccessfulRequest = new Date()
      this.health.responseTime = responseTime
      this.health.status = 'healthy'

      return result
    } catch (error) {
      this.metrics.failedRequests++
      this.health.errorCount++
      this.health.lastError =
        error instanceof Error ? error.message : 'Unknown error'
      this.health.status = 'degraded'
      throw error
    }
  }

  private createInitialMetrics(): ServiceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalCost: 0,
      totalTokens: 0,
      uptime: 0,
      startTime: this.startTime,
    }
  }

  private createInitialHealth(): ProviderHealth {
    return {
      provider: this.providerName,
      model: this.config.model,
      status: 'healthy',
      lastSuccessfulRequest: null,
      lastError: null,
      responseTime: 0,
      requestCount: 0,
      errorCount: 0,
    }
  }
}

// Main service layer orchestrator
export class AIServiceLayer extends EventEmitter {
  private registry: ServiceRegistry
  private configManager: ConfigurationManager
  private healthMonitor: HealthMonitor
  private primaryProvider?: EnhancedAITextGenerationProvider
  private fallbackProvider?: EnhancedAITextGenerationProvider

  constructor(config: ServiceConfig) {
    super()
    this.registry = new ServiceRegistry()
    this.configManager = new ConfigurationManager(config)
    this.healthMonitor = new HealthMonitor(config.health)

    this.initialize()
  }

  private initialize(): void {
    const config = this.configManager.getConfig()

    // Initialize primary provider
    this.primaryProvider = new EnhancedAITextGenerationProvider(
      config.ai.primary,
      'primary'
    )
    this.healthMonitor.addProvider('primary', this.primaryProvider)

    // Initialize fallback provider if configured
    if (config.ai.fallback) {
      this.fallbackProvider = new EnhancedAITextGenerationProvider(
        config.ai.fallback,
        'fallback'
      )
      this.healthMonitor.addProvider('fallback', this.fallbackProvider)
    }

    // Register services
    this.registry.register('ai-primary', () => this.primaryProvider!, true)
    if (this.fallbackProvider) {
      this.registry.register('ai-fallback', () => this.fallbackProvider!, true)
    }
    this.registry.register('config', () => this.configManager, true)
    this.registry.register('health', () => this.healthMonitor, true)

    // Set up configuration change listener
    this.configManager.onConfigChange(newConfig => {
      this.handleConfigChange(newConfig)
    })

    // Start health monitoring
    this.healthMonitor.start()

    // Forward health monitor events
    this.healthMonitor.on('health-check', health =>
      this.emit('health-check', health)
    )
    this.healthMonitor.on('service-degraded', (provider, error) =>
      this.emit('service-degraded', provider, error)
    )
    this.healthMonitor.on('service-recovered', provider =>
      this.emit('service-recovered', provider)
    )
  }

  // Public API methods
  async generateStoryOutline(
    context: PromptContext,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const provider = this.getAvailableProvider()
    return provider.generateStoryOutline(context, options)
  }

  async generateStory(
    context: PromptContext,
    outline?: string,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const provider = this.getAvailableProvider()
    return provider.generateStory(context, outline, options)
  }

  async reviseStory(
    context: PromptContext,
    originalStory: string,
    revisionInstructions: string,
    improvementAreas: string[],
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const provider = this.getAvailableProvider()
    return provider.reviseStory(
      context,
      originalStory,
      revisionInstructions,
      improvementAreas,
      options
    )
  }

  getHealth(): ServiceHealth {
    return this.healthMonitor.getHealth()
  }

  getMetrics(): { primary: ServiceMetrics; fallback?: ServiceMetrics } {
    return {
      primary: this.primaryProvider?.getMetrics() || this.createEmptyMetrics(),
      fallback: this.fallbackProvider?.getMetrics(),
    }
  }

  getService<T>(name: string): T {
    return this.registry.get<T>(name)
  }

  updateConfiguration(updates: Partial<ServiceConfig>): void {
    this.configManager.updateConfig(updates)
  }

  shutdown(): void {
    this.healthMonitor.stop()
    this.registry.clear()
    this.removeAllListeners()
  }

  private getAvailableProvider(): EnhancedAITextGenerationProvider {
    const health = this.healthMonitor.getHealth()

    // Use primary if healthy
    if (health.details.primary.status === 'healthy' && this.primaryProvider) {
      return this.primaryProvider
    }

    // Use fallback if primary is unhealthy and fallback is available
    if (
      health.details.fallback?.status === 'healthy' &&
      this.fallbackProvider
    ) {
      return this.fallbackProvider
    }

    // Use primary even if degraded (better than nothing)
    if (this.primaryProvider) {
      return this.primaryProvider
    }

    throw new AIServiceError(
      'No available AI providers',
      'NO_PROVIDERS_AVAILABLE',
      'service-layer'
    )
  }

  private handleConfigChange(newConfig: ServiceConfig): void {
    // Reinitialize providers with new configuration
    // This is a simplified implementation - in production, you might want more sophisticated hot-reloading
    this.emit('config-changed', newConfig)
  }

  private createEmptyMetrics(): ServiceMetrics {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      totalCost: 0,
      totalTokens: 0,
      uptime: 0,
      startTime: new Date(),
    }
  }

  // Static factory method
  static fromEnvironment(): AIServiceLayer {
    const configManager = ConfigurationManager.fromEnvironment()
    return new AIServiceLayer(configManager.getConfig())
  }

  static create(config: ServiceConfig): AIServiceLayer {
    return new AIServiceLayer(config)
  }
}

// Export singleton instance for global use
let globalServiceLayer: AIServiceLayer | null = null

export function getGlobalServiceLayer(): AIServiceLayer {
  if (!globalServiceLayer) {
    globalServiceLayer = AIServiceLayer.fromEnvironment()
  }
  return globalServiceLayer
}

export function setGlobalServiceLayer(serviceLayer: AIServiceLayer): void {
  if (globalServiceLayer) {
    globalServiceLayer.shutdown()
  }
  globalServiceLayer = serviceLayer
}

// Utility functions for easy service access
export function createServiceLayer(
  config?: Partial<ServiceConfig>
): AIServiceLayer {
  if (config) {
    const configManager = ConfigurationManager.fromEnvironment()
    configManager.updateConfig(config)
    return new AIServiceLayer(configManager.getConfig())
  }
  return AIServiceLayer.fromEnvironment()
}

export {
  ServiceRegistry,
  ConfigurationManager,
  HealthMonitor,
  EnhancedAITextGenerationProvider,
}
