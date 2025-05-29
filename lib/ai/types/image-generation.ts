export type ImageGenerationProvider = 'replicate' | 'runpod' | 'modal'

export type ImageModel = 'flux1' | 'sdxl'

export type ImageStyle =
  | 'watercolor'
  | 'oil_painting'
  | 'digital_art'
  | 'cartoon'
  | 'realistic'
  | 'sketch'
  | 'anime'

export type QualityEnhancer =
  | 'high_detail'
  | 'professional_lighting'
  | 'sharp_focus'
  | 'vibrant_colors'
  | 'cinematic'

export interface RateLimit {
  requestsPerMinute: number
  concurrent: number
}

export interface ProviderModelConfig {
  flux1: string
  sdxl: string
}

export interface ProviderSettings {
  apiKey: string
  baseUrl: string
  models: ProviderModelConfig
  rateLimit: RateLimit
}

export interface ProviderConfig {
  replicate: ProviderSettings
  runpod: ProviderSettings
  modal?: ProviderSettings
}

export interface ImageGenerationRequest {
  prompt: string
  model: ImageModel
  width: number
  height: number
  style?: ImageStyle
  negativePrompt?: string
  qualityEnhancers?: QualityEnhancer[]
  seed?: number
  steps?: number
  guidanceScale?: number
  loraWeights?: Record<string, number>
}

export interface ImageGenerationMetadata {
  prompt: string
  width: number
  height: number
  style?: ImageStyle
  negativePrompt?: string
  qualityEnhancers?: QualityEnhancer[]
  seed?: number
  steps?: number
  guidanceScale?: number
  loraWeights?: Record<string, number>
}

export interface ImageGenerationResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  imageUrl?: string
  provider: ImageGenerationProvider
  model: ImageModel
  generationTime?: number
  error?: string
  metadata: ImageGenerationMetadata
  cost?: number
}

export interface ProviderHealth {
  isHealthy: boolean
  lastChecked: Date
  consecutiveFailures: number
  averageResponseTime: number
}

export interface GenerationMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageGenerationTime: number
  totalCost: number
  providerUsage: Record<ImageGenerationProvider, number>
}

export interface ReplicateResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  output?: string[]
  error?: string
  metrics?: {
    predict_time?: number
  }
}

export interface RunPodResponse {
  id: string
  status: 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'CANCELLED'
  output?: {
    images?: string[]
  }
  error?: string
  executionTime?: number
}

export interface ProviderAdapter {
  generateImage(
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse>
  checkStatus(id: string): Promise<ImageGenerationResponse>
  testConnection(): Promise<boolean>
}

export interface ImageGenerationServiceConfig {
  providers: ProviderConfig
  defaultProvider: ImageGenerationProvider
  timeoutMs: number
  maxRetries: number
  healthCheckIntervalMs: number
}

export interface CostCalculation {
  basePrice: number
  provider: ImageGenerationProvider
  model: ImageModel
  resolution: string
  additionalFees: number
  total: number
}

export interface PromptEnhancement {
  originalPrompt: string
  enhancedPrompt: string
  styleModifiers: string[]
  qualityEnhancers: string[]
  negativePrompt: string
}

export interface GenerationQueue {
  id: string
  request: ImageGenerationRequest
  provider: ImageGenerationProvider
  priority: number
  createdAt: Date
  attempts: number
}

export interface ProviderStatus {
  provider: ImageGenerationProvider
  isAvailable: boolean
  currentLoad: number
  queueLength: number
  averageWaitTime: number
}
