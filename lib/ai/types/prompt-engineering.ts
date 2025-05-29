// Style and Content Type Definitions
export type StyleCategory =
  | 'traditional'
  | 'digital'
  | 'fantasy'
  | 'modern'
  | 'vintage'
  | 'experimental'
export type AgeGroup = 'child' | 'teen' | 'adult' | 'all'
export type ContentType =
  | 'portrait'
  | 'landscape'
  | 'character'
  | 'scene'
  | 'object'
  | 'abstract'
export type EnhancementIntensity = 'light' | 'medium' | 'heavy'
export type ComplexityLevel = 'simple' | 'medium' | 'complex'

// Style Template System
export interface StyleTemplate {
  name: string
  category: StyleCategory
  description: string
  styleModifiers: string[]
  negativePrompts: string[]
  qualityEnhancers: string[]
  ageAppropriate: AgeGroup[]
  compatibleContentTypes: ContentType[]
  examplePrompts?: string[]
  metadata?: {
    popularity: number
    averageRating: number
    createdAt: Date
    updatedAt: Date
  }
}

// Composition Rules System
export interface CompositionRule {
  contentType: ContentType
  framing: string[]
  lighting: string[]
  perspective: string[]
  focusPoints?: string[]
  depthElements?: string[]
  pose?: string[]
  elements?: string[]
  colorGuidance?: string[]
}

export interface OptimalComposition {
  exaggeration: 'low' | 'medium' | 'high'
  colorSaturation: 'muted' | 'natural' | 'vibrant'
  contrast: 'low' | 'medium' | 'high'
  detailLevel: 'minimal' | 'moderate' | 'intricate'
  mood: 'calm' | 'energetic' | 'dramatic' | 'playful'
}

// Quality Enhancement System
export interface QualityEnhancer {
  name: string
  category: 'technical' | 'artistic' | 'lighting' | 'composition' | 'style'
  description: string
  impactScore: number // 1-10 scale
  promptText: string
  conflictsWith?: string[]
  bestUsedWith?: string[]
  ageAppropriate: AgeGroup[]
}

// Prompt Optimization
export interface PromptOptimizationRequest {
  basePrompt: string
  style?: string
  contentType?: ContentType
  ageGroup?: AgeGroup
  qualityEnhancers?: string[]
  customModifiers?: string[]
  negativePrompt?: string
  enhancementIntensity?: EnhancementIntensity
  complexityTarget?: ComplexityLevel
  abTestVariant?: string
}

export interface PromptOptimizationResult {
  enhancedPrompt: string
  negativePrompt: string
  styleMetadata: {
    style: string
    category: StyleCategory
    ageGroup: AgeGroup
    contentType: ContentType
    appliedEnhancers: string[]
    appliedModifiers: string[]
  }
  optimizationMetrics: {
    processingTime: number
    enhancementCount: number
    complexityScore: number
    confidenceScore: number
  }
  suggestions?: {
    alternativeStyles: string[]
    additionalEnhancers: string[]
    improvementTips: string[]
  }
}

// Semantic Analysis
export interface SemanticAnalysis {
  entities: string[]
  adjectives: string[]
  actions: string[]
  sentiment: 'positive' | 'neutral' | 'negative'
  themes: string[]
  complexity: number
  clarity: number
}

export interface PromptImprovementSuggestions {
  specificity: string[]
  setting: string[]
  style: string[]
  mood: string[]
  technical: string[]
}

// A/B Testing Framework
export interface ABTestVariant {
  name: string
  promptModifications: Partial<PromptOptimizationRequest>
  description?: string
}

export interface ABTestConfig {
  testName: string
  variants: ABTestVariant[]
  trafficSplit: number[]
  successMetrics: string[]
  duration?: number // in days
  targetSampleSize?: number
  description?: string
}

export interface ABTest {
  id: string
  config: ABTestConfig
  status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled'
  startDate: Date
  endDate?: Date
  currentSampleSize: number
  variants: ABTestVariant[]
  trafficSplit: number[]
}

export interface ABTestResult {
  testId: string
  variant: string
  userId: string
  metrics: Record<string, number>
  timestamp: Date
  metadata?: Record<string, any>
}

export interface ABTestAnalysis {
  testId: string
  sampleSize: number
  variants: {
    name: string
    sampleSize: number
    metrics: Record<
      string,
      {
        mean: number
        standardDeviation: number
        confidenceInterval: [number, number]
      }
    >
  }[]
  statisticalSignificance: Record<string, number> // p-values for each metric
  winningVariant?: string
  recommendations: string[]
  confidence: number
}

// Performance and Caching
export interface CacheEntry<T> {
  data: T
  timestamp: Date
  accessCount: number
  lastAccessed: Date
}

export interface PerformanceMetrics {
  cacheHitRate: number
  averageOptimizationTime: number
  totalOptimizations: number
  errorRate: number
  popularStyles: Record<string, number>
  popularEnhancers: Record<string, number>
}

// Batch Processing
export interface BatchOptimizationRequest {
  requests: PromptOptimizationRequest[]
  options?: {
    parallel?: boolean
    maxConcurrency?: number
    progressCallback?: (completed: number, total: number) => void
  }
}

export interface BatchOptimizationResult {
  results: PromptOptimizationResult[]
  summary: {
    totalProcessed: number
    successCount: number
    errorCount: number
    averageProcessingTime: number
    totalProcessingTime: number
  }
  errors?: Array<{
    index: number
    error: string
    request: PromptOptimizationRequest
  }>
}

// Template Management
export interface TemplateUpdateRequest {
  name: string
  updates: Partial<StyleTemplate>
  reason?: string
  version?: string
}

export interface TemplateVersion {
  version: string
  template: StyleTemplate
  createdAt: Date
  createdBy: string
  changelog: string
}

// Export utility types
export type StyleName = string
export type EnhancerName = string
export type TestId = string
export type UserId = string
export type VariantName = string
