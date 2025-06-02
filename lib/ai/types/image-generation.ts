export type ImageGenerationProvider =
  | 'replicate'
  | 'runpod'
  | 'modal'
  | 'openai'

export type ImageModel =
  | 'flux1'
  | 'flux-1.1-pro'
  | 'flux-kontext-pro'
  | 'imagen-4'
  | 'minimax-image-01'
  | 'flux-1.1-pro-ultra'
  | 'gpt-image-1'
  | 'dall-e-3'
  | 'dall-e-2'

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

// New types for reference image support
export interface ReferenceImage {
  url: string
  type: 'character' | 'style' | 'composition'
  weight?: number // 0.1 to 1.0, how strongly to influence the generation
  description?: string // Optional description of what this reference represents
}

export interface CharacterReference extends ReferenceImage {
  type: 'character'
  characterName: string
  childProfileId?: string
  faceRegion?: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface RateLimit {
  requestsPerMinute: number
  concurrent: number
}

export interface ProviderModelConfig {
  flux1: string
  'flux-1.1-pro': string
  'flux-kontext-pro': string
  'imagen-4': string
  'minimax-image-01': string
  'flux-1.1-pro-ultra': string
  'gpt-image-1': string
  'dall-e-3': string
  'dall-e-2': string
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
  openai?: ProviderSettings
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

  // New reference image support
  referenceImages?: ReferenceImage[]
  characterReferences?: CharacterReference[]
  preserveFacialFeatures?: boolean // Whether to maintain facial features from reference
  characterConsistency?: number // 0.1 to 1.0, how consistent character should be across images

  // OpenAI-specific parameters
  openaiQuality?: 'auto' | 'high' | 'medium' | 'low' | 'hd' | 'standard'
  openaiStyle?: 'vivid' | 'natural'
  openaiBackground?: 'transparent' | 'opaque' | 'auto'
  openaiModeration?: 'low' | 'auto'
  openaiOutputFormat?: 'png' | 'jpeg' | 'webp'
  openaiOutputCompression?: number // 0-100 for gpt-image-1

  // OpenAI Image Edit specific parameters
  useImageEdit?: boolean // Whether to use image edit instead of generation
  editImages?: string[] // Array of image URLs/base64 to edit (up to 16 for gpt-image-1)
  editMask?: string // Optional mask image URL/base64 for selective editing
}

// New interface specifically for OpenAI image editing
export interface OpenAIImageEditRequest {
  images: string[] // Array of image URLs or base64 strings (up to 16 for gpt-image-1)
  prompt: string
  model: 'gpt-image-1' | 'dall-e-2'
  mask?: string // Optional mask image for selective editing
  n?: number // Number of images to generate (1-10)
  size?: string // Image size
  quality?: 'auto' | 'high' | 'medium' | 'low' | 'standard'
  background?: 'transparent' | 'opaque' | 'auto'
  user?: string // Unique user identifier
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

  // New reference image metadata
  referenceImages?: ReferenceImage[]
  characterReferences?: CharacterReference[]
  preserveFacialFeatures?: boolean
  characterConsistency?: number
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

  // New fields for reference image results
  characterSimilarityScore?: number // 0.0 to 1.0, how well the character matches the reference
  referenceImageUsage?: {
    imageUrl: string
    influenceScore: number
    processingNotes?: string
  }[]
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
  output?: string[] | string
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

// OpenAI-specific response interface
export interface OpenAIResponse {
  created: number
  data: Array<{
    url?: string
    b64_json?: string
    revised_prompt?: string
  }>
  usage?: {
    total_tokens: number
    input_tokens: number
    output_tokens: number
    input_tokens_details?: {
      text_tokens: number
      image_tokens: number
    }
  }
}
