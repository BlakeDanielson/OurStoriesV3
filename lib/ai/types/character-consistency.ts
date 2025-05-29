// Character Profile Types
export interface CharacterProfile {
  id: string
  name: string
  age: number
  description: string
  physicalTraits?: PhysicalTraits
  clothing?: ClothingDescription
  personality?: PersonalityTraits
  consistencyScore: number
  referenceImages: string[]
  createdAt: Date
  updatedAt: Date
  version: number
}

export interface PhysicalTraits {
  hair?: string
  eyes?: string
  skin?: string
  height?: string
  build?: string
  facialFeatures?: string[]
  distinguishingMarks?: string[]
}

export interface ClothingDescription {
  style?: string
  colors?: string[]
  accessories?: string[]
  patterns?: string[]
  materials?: string[]
}

export interface PersonalityTraits {
  traits?: string[]
  expressions?: string[]
  mannerisms?: string[]
  voiceDescription?: string
}

export interface CharacterProfileInput {
  name: string
  age: number
  description: string
  physicalTraits?: Partial<PhysicalTraits>
  clothing?: Partial<ClothingDescription>
  personality?: Partial<PersonalityTraits>
}

export interface CharacterProfileUpdate {
  name?: string
  age?: number
  description?: string
  physicalTraits?: Partial<PhysicalTraits>
  clothing?: Partial<ClothingDescription>
  personality?: Partial<PersonalityTraits>
}

// Character Trait System
export interface CharacterTrait {
  category: TraitCategory
  name: string
  description: string
  promptText: string
  importance: number // 1-10 scale
  ageAppropriate: string[]
  conflictsWith?: string[]
}

export type TraitCategory =
  | 'physical_appearance'
  | 'clothing_style'
  | 'personality'
  | 'expression'
  | 'pose'
  | 'environment'

// Prompt Template System
export interface CharacterPromptTemplate {
  id: string
  name: string
  description: string
  structure: string[]
  requiredFields: string[]
  optionalFields: string[]
  ageGroups: string[]
  contentTypes: string[]
  createdAt: Date
}

export interface CharacterPromptTemplateInput {
  name: string
  description?: string
  structure: string[]
  requiredFields: string[]
  optionalFields?: string[]
  ageGroups?: string[]
  contentTypes?: string[]
}

export interface CharacterPromptContext {
  scene?: string
  style?: string
  mood?: string
  pose?: string
  environment?: string
  lighting?: string
  perspective?: string
  [key: string]: string | undefined
}

export interface CharacterVariation {
  id: string
  characterId: string
  prompt: string
  context: CharacterPromptContext
  generatedAt: Date
  consistencyScore?: number
}

// Similarity Analysis Types
export interface SimilarityAnalysis {
  similarityScore: number
  faceMatch: FaceMatchResult
  colorSimilarity: ColorSimilarityResult
  structuralSimilarity: StructuralSimilarityResult
  confidence: number
  metadata: SimilarityMetadata
}

export interface FaceMatchResult {
  score: number
  landmarks: FaceLandmark[]
  confidence: number
  boundingBox?: BoundingBox
  faceEmbedding?: number[]
}

export interface FaceLandmark {
  type: string
  x: number
  y: number
  confidence: number
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface ColorSimilarityResult {
  histogram: number
  dominantColors: ColorInfo[]
  averageColor?: ColorInfo
  colorDistribution?: Record<string, number>
}

export interface ColorInfo {
  r: number
  g: number
  b: number
  hex: string
  percentage: number
}

export interface StructuralSimilarityResult {
  edges: number
  shapes: number
  texture?: number
  composition?: number
}

export interface SimilarityMetadata {
  processingTime: number
  imageSize?: { width: number; height: number }
  algorithm: string
  version: string
}

// Character Feature Extraction
export interface CharacterFeatures {
  faceDetection: FaceDetectionResult
  colorAnalysis: ColorAnalysisResult
  poseEstimation: PoseEstimationResult
  clothingDetection: ClothingDetectionResult
  confidence: number
  extractedAt: Date
}

export interface FaceDetectionResult {
  detected: boolean
  boundingBox: BoundingBox | null
  landmarks: FaceLandmark[]
  confidence: number
  faceEmbedding?: number[]
}

export interface ColorAnalysisResult {
  dominantColors: ColorInfo[]
  colorPalette: ColorInfo[]
  averageColor: ColorInfo
  colorHarmony: string
}

export interface PoseEstimationResult {
  pose: string
  keypoints: Keypoint[]
  confidence: number
  bodyParts: BodyPartDetection[]
}

export interface Keypoint {
  name: string
  x: number
  y: number
  confidence: number
}

export interface BodyPartDetection {
  part: string
  boundingBox: BoundingBox
  confidence: number
}

export interface ClothingDetectionResult {
  items: ClothingItem[]
  style: string
  colors: ColorInfo[]
  confidence: number
}

export interface ClothingItem {
  type: string
  boundingBox: BoundingBox
  color: ColorInfo
  confidence: number
}

// Consistency Scoring Types
export interface ConsistencyScore {
  characterId: string
  overallScore: number
  faceConsistency: number
  colorConsistency: number
  styleConsistency: number
  poseConsistency?: number
  clothingConsistency?: number
  imageCount: number
  meetsTarget: boolean
  breakdown: ConsistencyBreakdown
  recommendations: string[]
  calculatedAt: Date
}

export interface ConsistencyBreakdown {
  faceMatching: {
    averageScore: number
    variance: number
    outliers: number[]
  }
  colorConsistency: {
    paletteStability: number
    dominantColorMatch: number
    lightingVariation: number
  }
  poseVariation: {
    diversityScore: number
    naturalness: number
    appropriateness: number
  }
  clothingConsistency: {
    styleMatch: number
    colorMatch: number
    accessoryMatch: number
  }
}

// Consistency Validation Types
export interface ConsistencyValidationResult {
  characterId: string
  totalImages: number
  consistencyScore: number
  passesThreshold: boolean
  threshold: number
  inconsistentImages: InconsistentImage[]
  recommendations: string[]
  validatedAt: Date
  processingTime: number
}

export interface InconsistentImage {
  imageIndex: number
  imageData: string
  similarityScore: number
  issues: string[]
  suggestions: string[]
}

// Character Reference Management
export interface CharacterReference {
  id: string
  characterId: string
  imageData: string
  description: string
  features: CharacterFeatures
  isCanonical: boolean
  quality: number
  createdAt: Date
  tags: string[]
}

// Performance and Metrics Types
export interface ConsistencyMetrics {
  characterId: string
  averageScore: number
  totalValidations: number
  averageProcessingTime: number
  scoreHistory: ConsistencyScoreEntry[]
  trend: 'improving' | 'declining' | 'stable'
  lastValidation: Date
}

export interface ConsistencyScoreEntry {
  score: number
  imageCount: number
  processingTime: number
  timestamp: Date
}

// Batch Processing Types
export interface BatchConsistencyRequest {
  validations: BatchValidationItem[]
  options?: BatchProcessingOptions
}

export interface BatchValidationItem {
  characterId: string
  images: string[]
  referenceImage?: string
}

export interface BatchProcessingOptions {
  parallel: boolean
  maxConcurrency: number
  timeout: number
  includeDetailedAnalysis: boolean
}

export interface BatchConsistencyResult {
  results: ConsistencyValidationResult[]
  summary: BatchSummary
  processingTime: number
  errors: BatchError[]
}

export interface BatchSummary {
  totalCharacters: number
  totalImages: number
  averageScore: number
  passRate: number
  processingTime: number
}

export interface BatchError {
  characterId: string
  error: string
  imageIndex?: number
}

// Configuration Types
export interface CharacterConsistencyConfig {
  consistencyThreshold: number
  similarityAlgorithm: 'ssim' | 'mse' | 'perceptual' | 'hybrid'
  faceDetectionModel: string
  colorAnalysisMethod: 'histogram' | 'kmeans' | 'dominant'
  enablePoseEstimation: boolean
  enableClothingDetection: boolean
  cacheResults: boolean
  maxCacheSize: number
}

// Error Types
export interface CharacterConsistencyError extends Error {
  code: string
  characterId?: string
  imageIndex?: number
  details?: Record<string, any>
}

// Service Response Types
export interface ServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}

// Export utility types
export type CharacterProfileHistory = CharacterProfile[]
export type CharacterVariationList = CharacterVariation[]
export type ConsistencyScoreList = ConsistencyScore[]
