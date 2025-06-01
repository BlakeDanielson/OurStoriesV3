/**
 * Language Controls Types and Interfaces
 *
 * Type definitions for the age-appropriate language controls system
 */

import { z } from 'zod'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type AgeGroup =
  | 'toddler'
  | 'preschool'
  | 'early-elementary'
  | 'elementary'

export type ReadingLevel = 'beginner' | 'intermediate' | 'advanced'

export type LanguageComplexity =
  | 'very-simple'
  | 'simple'
  | 'moderate'
  | 'complex'

export interface LanguageControlConfig {
  ageGroup: AgeGroup
  readingLevel?: ReadingLevel
  targetGradeLevel?: number
  maxSentenceLength: number
  maxSyllablesPerWord: number
  vocabularyComplexity: LanguageComplexity
  enableEducationalEnhancement: boolean
  enableVocabularySubstitution: boolean
  enableReadabilityValidation: boolean
  customVocabularyRules?: VocabularyRule[]
}

export interface VocabularyRule {
  pattern: string | RegExp
  replacement: string
  ageGroups: AgeGroup[]
  reason: string
  isRegex: boolean
}

export interface LanguageAnalysisResult {
  readabilityScore: number
  gradeLevel: number
  averageSentenceLength: number
  averageSyllablesPerWord: number
  complexWordCount: number
  vocabularyLevel: LanguageComplexity
  ageAppropriate: boolean
  suggestions: LanguageSuggestion[]
  metadata: {
    analyzedAt: Date
    processingTimeMs: number
    wordCount: number
    sentenceCount: number
    ageGroup: AgeGroup
    targetReadingLevel?: ReadingLevel
  }
}

export interface LanguageSuggestion {
  type:
    | 'vocabulary'
    | 'sentence-length'
    | 'complexity'
    | 'educational'
    | 'structure'
  severity: 'low' | 'medium' | 'high'
  description: string
  originalText?: string
  suggestedText?: string
  position?: { start: number; end: number }
}

export interface LanguageAdaptationResult {
  adaptedText: string
  originalText: string
  changesApplied: LanguageChange[]
  analysisResult: LanguageAnalysisResult
  improvementScore: number
  metadata: {
    adaptedAt: Date
    processingTimeMs: number
    ageGroup: AgeGroup
    readingLevel?: ReadingLevel
    adaptationStrategy: string
  }
}

export interface LanguageChange {
  type: 'vocabulary' | 'sentence-split' | 'simplification' | 'enhancement'
  originalText: string
  adaptedText: string
  reason: string
  position: { start: number; end: number }
  confidence: number
}

// ============================================================================
// Validation Schemas
// ============================================================================

export const LanguageControlConfigSchema = z.object({
  ageGroup: z.enum(['toddler', 'preschool', 'early-elementary', 'elementary']),
  readingLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  targetGradeLevel: z.number().min(0).max(12).optional(),
  maxSentenceLength: z.number().min(3).max(50),
  maxSyllablesPerWord: z.number().min(1).max(6),
  vocabularyComplexity: z.enum([
    'very-simple',
    'simple',
    'moderate',
    'complex',
  ]),
  enableEducationalEnhancement: z.boolean(),
  enableVocabularySubstitution: z.boolean(),
  enableReadabilityValidation: z.boolean(),
  customVocabularyRules: z
    .array(
      z.object({
        pattern: z.string(),
        replacement: z.string(),
        ageGroups: z.array(
          z.enum(['toddler', 'preschool', 'early-elementary', 'elementary'])
        ),
        reason: z.string(),
        isRegex: z.boolean(),
      })
    )
    .optional(),
})

// ============================================================================
// Age-Specific Language Configurations
// ============================================================================

export const AGE_LANGUAGE_CONFIGS: Record<AgeGroup, LanguageControlConfig> = {
  toddler: {
    ageGroup: 'toddler',
    readingLevel: 'beginner',
    targetGradeLevel: 0,
    maxSentenceLength: 8,
    maxSyllablesPerWord: 2,
    vocabularyComplexity: 'very-simple',
    enableEducationalEnhancement: true,
    enableVocabularySubstitution: true,
    enableReadabilityValidation: true,
  },
  preschool: {
    ageGroup: 'preschool',
    readingLevel: 'beginner',
    targetGradeLevel: 1,
    maxSentenceLength: 12,
    maxSyllablesPerWord: 3,
    vocabularyComplexity: 'simple',
    enableEducationalEnhancement: true,
    enableVocabularySubstitution: true,
    enableReadabilityValidation: true,
  },
  'early-elementary': {
    ageGroup: 'early-elementary',
    readingLevel: 'intermediate',
    targetGradeLevel: 2,
    maxSentenceLength: 15,
    maxSyllablesPerWord: 3,
    vocabularyComplexity: 'simple',
    enableEducationalEnhancement: true,
    enableVocabularySubstitution: true,
    enableReadabilityValidation: true,
  },
  elementary: {
    ageGroup: 'elementary',
    readingLevel: 'advanced',
    targetGradeLevel: 4,
    maxSentenceLength: 20,
    maxSyllablesPerWord: 4,
    vocabularyComplexity: 'moderate',
    enableEducationalEnhancement: true,
    enableVocabularySubstitution: true,
    enableReadabilityValidation: true,
  },
}
