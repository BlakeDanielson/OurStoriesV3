/**
 * Age-Appropriate Language Controls System
 *
 * This module provides comprehensive language adaptation and control mechanisms
 * specifically designed for children's content generation. It includes dynamic
 * vocabulary management, reading level validation, sentence complexity controls,
 * and seamless integration with the existing AI text generation pipeline.
 *
 * Features:
 * - Dynamic language complexity adaptation
 * - Age-specific vocabulary databases
 * - Reading level analysis and validation
 * - Sentence structure optimization
 * - Educational content integration
 * - Real-time language adjustment
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

const LanguageControlConfigSchema = z.object({
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

const AGE_LANGUAGE_CONFIGS: Record<AgeGroup, LanguageControlConfig> = {
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

// ============================================================================
// Vocabulary Databases
// ============================================================================

const AGE_APPROPRIATE_VOCABULARY = {
  toddler: {
    simple: [
      'big',
      'small',
      'happy',
      'sad',
      'good',
      'nice',
      'fun',
      'play',
      'love',
      'help',
    ],
    animals: [
      'cat',
      'dog',
      'bird',
      'fish',
      'bear',
      'bunny',
      'duck',
      'cow',
      'pig',
      'horse',
    ],
    colors: [
      'red',
      'blue',
      'green',
      'yellow',
      'pink',
      'purple',
      'orange',
      'black',
      'white',
    ],
    family: [
      'mom',
      'dad',
      'baby',
      'sister',
      'brother',
      'grandma',
      'grandpa',
      'family',
    ],
    actions: [
      'run',
      'jump',
      'walk',
      'eat',
      'sleep',
      'play',
      'laugh',
      'hug',
      'kiss',
      'dance',
    ],
  },
  preschool: {
    descriptive: [
      'beautiful',
      'wonderful',
      'amazing',
      'special',
      'gentle',
      'kind',
      'brave',
      'smart',
    ],
    emotions: [
      'excited',
      'surprised',
      'curious',
      'proud',
      'grateful',
      'peaceful',
      'joyful',
    ],
    learning: [
      'learn',
      'discover',
      'explore',
      'find',
      'create',
      'build',
      'make',
      'try',
    ],
    social: [
      'friend',
      'share',
      'help',
      'care',
      'listen',
      'talk',
      'play together',
      'be kind',
    ],
  },
  'early-elementary': {
    advanced: [
      'adventure',
      'journey',
      'challenge',
      'solution',
      'creative',
      'imagination',
      'cooperation',
    ],
    academic: [
      'science',
      'nature',
      'experiment',
      'observe',
      'question',
      'answer',
      'problem',
      'solve',
    ],
    character: [
      'responsible',
      'honest',
      'patient',
      'determined',
      'thoughtful',
      'respectful',
    ],
  },
  elementary: {
    complex: [
      'perseverance',
      'achievement',
      'consequence',
      'opportunity',
      'responsibility',
      'independence',
    ],
    educational: [
      'mathematics',
      'literature',
      'geography',
      'history',
      'technology',
      'environment',
    ],
    social: [
      'community',
      'citizenship',
      'diversity',
      'culture',
      'tradition',
      'cooperation',
      'leadership',
    ],
  },
} as const

// Complex word substitutions for age-appropriate alternatives
const VOCABULARY_SUBSTITUTIONS: Record<AgeGroup, VocabularyRule[]> = {
  toddler: [
    {
      pattern: 'enormous',
      replacement: 'very big',
      ageGroups: ['toddler'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'magnificent',
      replacement: 'beautiful',
      ageGroups: ['toddler'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'terrified',
      replacement: 'scared',
      ageGroups: ['toddler'],
      reason: 'Less intense emotion',
      isRegex: false,
    },
    {
      pattern: 'astonished',
      replacement: 'surprised',
      ageGroups: ['toddler'],
      reason: 'Simpler emotion word',
      isRegex: false,
    },
    {
      pattern: 'exhausted',
      replacement: 'very tired',
      ageGroups: ['toddler'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'delicious',
      replacement: 'yummy',
      ageGroups: ['toddler'],
      reason: 'Child-friendly vocabulary',
      isRegex: false,
    },
  ],
  preschool: [
    {
      pattern: 'tremendous',
      replacement: 'really big',
      ageGroups: ['preschool'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
    {
      pattern: 'astonished',
      replacement: 'surprised',
      ageGroups: ['preschool'],
      reason: 'Simpler emotion word',
      isRegex: false,
    },
    {
      pattern: 'investigate',
      replacement: 'look for',
      ageGroups: ['preschool'],
      reason: 'Simpler action word',
      isRegex: false,
    },
    {
      pattern: 'accomplish',
      replacement: 'finish',
      ageGroups: ['preschool'],
      reason: 'Simpler vocabulary',
      isRegex: false,
    },
  ],
  'early-elementary': [
    {
      pattern: 'extraordinary',
      replacement: 'amazing',
      ageGroups: ['early-elementary'],
      reason: 'Simpler but still rich vocabulary',
      isRegex: false,
    },
    {
      pattern: 'comprehend',
      replacement: 'understand',
      ageGroups: ['early-elementary'],
      reason: 'More common vocabulary',
      isRegex: false,
    },
    {
      pattern: 'demonstrate',
      replacement: 'show',
      ageGroups: ['early-elementary'],
      reason: 'Simpler action word',
      isRegex: false,
    },
  ],
  elementary: [
    {
      pattern: 'utilize',
      replacement: 'use',
      ageGroups: ['elementary'],
      reason: 'Simpler but equivalent word',
      isRegex: false,
    },
    {
      pattern: 'commence',
      replacement: 'begin',
      ageGroups: ['elementary'],
      reason: 'More common vocabulary',
      isRegex: false,
    },
  ],
}

// ============================================================================
// Reading Level Analysis Utilities
// ============================================================================

class ReadabilityAnalyzer {
  /**
   * Calculate Flesch-Kincaid Grade Level
   */
  static calculateFleschKincaidGradeLevel(text: string): number {
    const sentences = this.countSentences(text)
    const words = this.countWords(text)
    const syllables = this.countSyllables(text)

    if (sentences === 0 || words === 0) return 0

    const avgSentenceLength = words / sentences
    const avgSyllablesPerWord = syllables / words

    return 0.39 * avgSentenceLength + 11.8 * avgSyllablesPerWord - 15.59
  }

  /**
   * Calculate Flesch Reading Ease Score
   */
  static calculateFleschReadingEase(text: string): number {
    const sentences = this.countSentences(text)
    const words = this.countWords(text)
    const syllables = this.countSyllables(text)

    if (sentences === 0 || words === 0) return 0

    const avgSentenceLength = words / sentences
    const avgSyllablesPerWord = syllables / words

    return 206.835 - 1.015 * avgSentenceLength - 84.6 * avgSyllablesPerWord
  }

  /**
   * Count sentences in text
   */
  static countSentences(text: string): number {
    const sentences = text.match(/[.!?]+/g)
    return sentences ? sentences.length : 1
  }

  /**
   * Count words in text
   */
  static countWords(text: string): number {
    const words = text.match(/\b\w+\b/g)
    return words ? words.length : 0
  }

  /**
   * Count syllables in text
   */
  static countSyllables(text: string): number {
    const words = text.match(/\b\w+\b/g)
    if (!words) return 0

    return words.reduce(
      (total, word) => total + this.countSyllablesInWord(word),
      0
    )
  }

  /**
   * Count syllables in a single word
   */
  static countSyllablesInWord(word: string): number {
    word = word.toLowerCase()
    if (word.length <= 3) return 1

    // Remove silent e
    word = word.replace(/e$/, '')

    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g)
    const syllables = vowelGroups ? vowelGroups.length : 1

    // Minimum of 1 syllable
    return Math.max(1, syllables)
  }

  /**
   * Analyze sentence complexity
   */
  static analyzeSentenceComplexity(text: string): {
    averageLength: number
    maxLength: number
    longSentenceCount: number
    complexSentenceCount: number
  } {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)

    if (sentences.length === 0) {
      return {
        averageLength: 0,
        maxLength: 0,
        longSentenceCount: 0,
        complexSentenceCount: 0,
      }
    }

    const lengths = sentences.map(s => this.countWords(s))
    const averageLength =
      lengths.reduce((sum, len) => sum + len, 0) / lengths.length
    const maxLength = Math.max(...lengths)
    const longSentenceCount = lengths.filter(len => len > 15).length
    const complexSentenceCount = sentences.filter(
      s =>
        s.includes(',') ||
        s.includes(';') ||
        s.includes(':') ||
        s.includes('because') ||
        s.includes('although') ||
        s.includes('however')
    ).length

    return { averageLength, maxLength, longSentenceCount, complexSentenceCount }
  }
}

// ============================================================================
// Language Controls Service
// ============================================================================

export class LanguageControlsService {
  private config: LanguageControlConfig
  private vocabularyRules: VocabularyRule[]

  constructor(config: LanguageControlConfig) {
    this.config = LanguageControlConfigSchema.parse(config)
    this.vocabularyRules = [
      ...(VOCABULARY_SUBSTITUTIONS[config.ageGroup] || []),
      ...(config.customVocabularyRules || []),
    ]
  }

  /**
   * Analyze text for age-appropriateness and reading level
   */
  async analyzeLanguage(text: string): Promise<LanguageAnalysisResult> {
    const startTime = Date.now()

    const readabilityScore =
      ReadabilityAnalyzer.calculateFleschReadingEase(text)
    const gradeLevel =
      ReadabilityAnalyzer.calculateFleschKincaidGradeLevel(text)
    const sentenceAnalysis = ReadabilityAnalyzer.analyzeSentenceComplexity(text)
    const syllableAnalysis = this.analyzeSyllableComplexity(text)
    const vocabularyAnalysis = this.analyzeVocabularyComplexity(text)

    const suggestions = this.generateLanguageSuggestions(text, {
      readabilityScore,
      gradeLevel,
      sentenceAnalysis,
      syllableAnalysis,
      vocabularyAnalysis,
    })

    const ageAppropriate = this.isAgeAppropriate(
      gradeLevel,
      sentenceAnalysis,
      vocabularyAnalysis
    )

    return {
      readabilityScore,
      gradeLevel,
      averageSentenceLength: sentenceAnalysis.averageLength,
      averageSyllablesPerWord: syllableAnalysis.average,
      complexWordCount: vocabularyAnalysis.complexWordCount,
      vocabularyLevel: vocabularyAnalysis.level,
      ageAppropriate,
      suggestions,
      metadata: {
        analyzedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        wordCount: ReadabilityAnalyzer.countWords(text),
        sentenceCount: ReadabilityAnalyzer.countSentences(text),
        ageGroup: this.config.ageGroup,
        targetReadingLevel: this.config.readingLevel,
      },
    }
  }

  /**
   * Adapt text to be age-appropriate
   */
  async adaptLanguage(text: string): Promise<LanguageAdaptationResult> {
    const startTime = Date.now()
    const originalText = text
    let adaptedText = text
    const changesApplied: LanguageChange[] = []

    // Step 1: Apply vocabulary substitutions
    if (this.config.enableVocabularySubstitution) {
      const { text: substitutedText, changes } =
        this.applyVocabularySubstitutions(adaptedText)
      adaptedText = substitutedText
      changesApplied.push(...changes)
    }

    // Step 2: Simplify sentence structure
    const { text: simplifiedText, changes: structureChanges } =
      this.simplifySentenceStructure(adaptedText)
    adaptedText = simplifiedText
    changesApplied.push(...structureChanges)

    // Step 3: Educational enhancement
    if (this.config.enableEducationalEnhancement) {
      const { text: enhancedText, changes: educationalChanges } =
        this.addEducationalEnhancements(adaptedText)
      adaptedText = enhancedText
      changesApplied.push(...educationalChanges)
    }

    // Step 4: Final validation
    const analysisResult = await this.analyzeLanguage(adaptedText)
    const improvementScore = this.calculateImprovementScore(
      originalText,
      adaptedText
    )

    return {
      adaptedText,
      originalText,
      changesApplied,
      analysisResult,
      improvementScore,
      metadata: {
        adaptedAt: new Date(),
        processingTimeMs: Date.now() - startTime,
        ageGroup: this.config.ageGroup,
        readingLevel: this.config.readingLevel,
        adaptationStrategy: 'comprehensive',
      },
    }
  }

  /**
   * Validate if text meets age-appropriate criteria
   */
  async validateAgeAppropriateness(text: string): Promise<{
    isValid: boolean
    issues: LanguageSuggestion[]
    analysisResult: LanguageAnalysisResult
  }> {
    const analysisResult = await this.analyzeLanguage(text)
    const issues = analysisResult.suggestions.filter(
      s => s.severity === 'high' || s.severity === 'medium'
    )

    return {
      isValid: analysisResult.ageAppropriate && issues.length === 0,
      issues,
      analysisResult,
    }
  }

  /**
   * Generate dynamic prompt modifications based on age group
   */
  generatePromptModifications(): {
    vocabularyInstructions: string
    complexityInstructions: string
    structureInstructions: string
    educationalInstructions: string
  } {
    const ageConfig = AGE_LANGUAGE_CONFIGS[this.config.ageGroup]

    return {
      vocabularyInstructions: this.generateVocabularyInstructions(),
      complexityInstructions: this.generateComplexityInstructions(),
      structureInstructions: this.generateStructureInstructions(),
      educationalInstructions: this.generateEducationalInstructions(),
    }
  }

  // ============================================================================
  // Private Helper Methods
  // ============================================================================

  private analyzeSyllableComplexity(text: string): {
    average: number
    maxSyllables: number
    complexWordCount: number
  } {
    const words = text.match(/\b\w+\b/g) || []
    if (words.length === 0)
      return { average: 0, maxSyllables: 0, complexWordCount: 0 }

    const syllableCounts = words.map(word =>
      ReadabilityAnalyzer.countSyllablesInWord(word)
    )
    const average =
      syllableCounts.reduce((sum, count) => sum + count, 0) /
      syllableCounts.length
    const maxSyllables = Math.max(...syllableCounts)
    const complexWordCount = syllableCounts.filter(
      count => count > this.config.maxSyllablesPerWord
    ).length

    return { average, maxSyllables, complexWordCount }
  }

  private analyzeVocabularyComplexity(text: string): {
    level: LanguageComplexity
    complexWordCount: number
    simpleWordRatio: number
  } {
    const words = text.match(/\b\w+\b/g) || []
    if (words.length === 0)
      return { level: 'very-simple', complexWordCount: 0, simpleWordRatio: 1 }

    const ageVocab = AGE_APPROPRIATE_VOCABULARY[this.config.ageGroup]
    const allAgeWords = Object.values(ageVocab).flat()

    const simpleWords = words.filter(
      word =>
        allAgeWords.includes(word.toLowerCase()) ||
        ReadabilityAnalyzer.countSyllablesInWord(word) <= 2
    )

    const simpleWordRatio = simpleWords.length / words.length
    const complexWordCount = words.length - simpleWords.length

    let level: LanguageComplexity
    if (simpleWordRatio >= 0.9) level = 'very-simple'
    else if (simpleWordRatio >= 0.7) level = 'simple'
    else if (simpleWordRatio >= 0.5) level = 'moderate'
    else level = 'complex'

    return { level, complexWordCount, simpleWordRatio }
  }

  private generateLanguageSuggestions(
    text: string,
    analysis: {
      readabilityScore: number
      gradeLevel: number
      sentenceAnalysis: any
      syllableAnalysis: any
      vocabularyAnalysis: any
    }
  ): LanguageSuggestion[] {
    const suggestions: LanguageSuggestion[] = []

    // Grade level suggestions
    if (analysis.gradeLevel > (this.config.targetGradeLevel || 2)) {
      suggestions.push({
        type: 'complexity',
        severity: 'high',
        description: `Text grade level (${analysis.gradeLevel.toFixed(1)}) is too high for ${this.config.ageGroup} children`,
      })
    }

    // Sentence length suggestions
    if (
      analysis.sentenceAnalysis.averageLength > this.config.maxSentenceLength
    ) {
      suggestions.push({
        type: 'sentence-length',
        severity: 'medium',
        description: `Average sentence length (${analysis.sentenceAnalysis.averageLength.toFixed(1)} words) exceeds recommended maximum (${this.config.maxSentenceLength} words)`,
      })
    }

    // Vocabulary complexity suggestions
    if (
      analysis.vocabularyAnalysis.level === 'complex' &&
      this.config.vocabularyComplexity !== 'complex'
    ) {
      suggestions.push({
        type: 'vocabulary',
        severity: 'high',
        description: `Vocabulary is too complex for ${this.config.ageGroup} age group`,
      })
    }

    // Syllable complexity suggestions
    if (analysis.syllableAnalysis.complexWordCount > 0) {
      suggestions.push({
        type: 'vocabulary',
        severity: 'medium',
        description: `${analysis.syllableAnalysis.complexWordCount} words exceed maximum syllable count (${this.config.maxSyllablesPerWord})`,
      })
    }

    return suggestions
  }

  private isAgeAppropriate(
    gradeLevel: number,
    sentenceAnalysis: any,
    vocabularyAnalysis: any
  ): boolean {
    const targetGrade = this.config.targetGradeLevel || 2
    const maxGradeDeviation = 1

    return (
      gradeLevel <= targetGrade + maxGradeDeviation &&
      sentenceAnalysis.averageLength <= this.config.maxSentenceLength &&
      vocabularyAnalysis.level !== 'complex'
    )
  }

  private applyVocabularySubstitutions(text: string): {
    text: string
    changes: LanguageChange[]
  } {
    let adaptedText = text
    const changes: LanguageChange[] = []

    for (const rule of this.vocabularyRules) {
      if (!rule.ageGroups.includes(this.config.ageGroup)) continue

      const pattern = rule.isRegex
        ? new RegExp(rule.pattern, 'gi')
        : new RegExp(`\\b${rule.pattern}\\b`, 'gi')

      // Use exec() in a while loop instead of matchAll for better compatibility
      let match: RegExpExecArray | null
      while ((match = pattern.exec(adaptedText)) !== null) {
        changes.push({
          type: 'vocabulary',
          originalText: match[0],
          adaptedText: rule.replacement,
          reason: rule.reason,
          position: { start: match.index, end: match.index + match[0].length },
          confidence: 0.9,
        })

        // Prevent infinite loop for global regex
        if (!pattern.global) break
      }

      adaptedText = adaptedText.replace(pattern, rule.replacement)
    }

    return { text: adaptedText, changes }
  }

  private simplifySentenceStructure(text: string): {
    text: string
    changes: LanguageChange[]
  } {
    const sentences = text.split(/([.!?]+)/).filter(s => s.trim().length > 0)
    const changes: LanguageChange[] = []
    let adaptedText = ''
    let position = 0

    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i]
      const punctuation = sentences[i + 1] || '.'

      if (sentence && sentence.trim()) {
        const wordCount = ReadabilityAnalyzer.countWords(sentence)

        if (wordCount > this.config.maxSentenceLength) {
          // Split long sentences
          const splitSentences = this.splitLongSentence(sentence.trim())

          if (splitSentences.length > 1) {
            changes.push({
              type: 'sentence-split',
              originalText: sentence + punctuation,
              adaptedText: splitSentences.join('. ') + punctuation,
              reason: `Split sentence with ${wordCount} words into ${splitSentences.length} shorter sentences`,
              position: {
                start: position,
                end: position + sentence.length + punctuation.length,
              },
              confidence: 0.8,
            })

            adaptedText += splitSentences.join('. ') + punctuation
          } else {
            adaptedText += sentence + punctuation
          }
        } else {
          adaptedText += sentence + punctuation
        }

        position += sentence.length + punctuation.length
      }
    }

    return { text: adaptedText, changes }
  }

  private splitLongSentence(sentence: string): string[] {
    // Simple sentence splitting logic
    const conjunctions = [
      'and',
      'but',
      'or',
      'so',
      'because',
      'when',
      'while',
      'if',
    ]
    const words = sentence.split(' ')

    if (words.length <= this.config.maxSentenceLength) {
      return [sentence]
    }

    // Find natural break points
    for (const conjunction of conjunctions) {
      const conjunctionIndex = words.findIndex(
        word => word.toLowerCase() === conjunction
      )
      if (conjunctionIndex > 3 && conjunctionIndex < words.length - 3) {
        const firstPart = words.slice(0, conjunctionIndex).join(' ')
        const secondPart = words.slice(conjunctionIndex + 1).join(' ')

        // Recursively split if still too long
        const firstSplit = this.splitLongSentence(firstPart)
        const secondSplit = this.splitLongSentence(secondPart)

        return [...firstSplit, ...secondSplit]
      }
    }

    // If no natural break point, split at midpoint
    const midpoint = Math.floor(words.length / 2)
    const firstPart = words.slice(0, midpoint).join(' ')
    const secondPart = words.slice(midpoint).join(' ')

    return [firstPart, secondPart]
  }

  private addEducationalEnhancements(text: string): {
    text: string
    changes: LanguageChange[]
  } {
    // This is a simplified implementation - in practice, this would be more sophisticated
    const changes: LanguageChange[] = []
    const adaptedText = text

    // Add simple educational enhancements based on age group
    const ageVocab = AGE_APPROPRIATE_VOCABULARY[this.config.ageGroup]

    // For now, return text unchanged but log that enhancement was considered
    changes.push({
      type: 'enhancement',
      originalText: text,
      adaptedText: text,
      reason: 'Educational enhancement considered but no changes needed',
      position: { start: 0, end: text.length },
      confidence: 0.5,
    })

    return { text: adaptedText, changes }
  }

  private calculateImprovementScore(
    originalText: string,
    adaptedText: string
  ): number {
    // Simple improvement score calculation
    const originalGradeLevel =
      ReadabilityAnalyzer.calculateFleschKincaidGradeLevel(originalText)
    const adaptedGradeLevel =
      ReadabilityAnalyzer.calculateFleschKincaidGradeLevel(adaptedText)
    const targetGrade = this.config.targetGradeLevel || 2

    const originalDistance = Math.abs(originalGradeLevel - targetGrade)
    const adaptedDistance = Math.abs(adaptedGradeLevel - targetGrade)

    if (adaptedDistance < originalDistance) {
      return Math.min(
        100,
        ((originalDistance - adaptedDistance) / originalDistance) * 100
      )
    }

    return 0
  }

  private generateVocabularyInstructions(): string {
    const ageVocab = AGE_APPROPRIATE_VOCABULARY[this.config.ageGroup]
    const examples = Object.values(ageVocab).flat().slice(0, 10).join(', ')

    return (
      `Use ${this.config.vocabularyComplexity} vocabulary appropriate for ${this.config.ageGroup} children. ` +
      `Prefer words with ${this.config.maxSyllablesPerWord} syllables or fewer. ` +
      `Examples of appropriate words: ${examples}.`
    )
  }

  private generateComplexityInstructions(): string {
    return (
      `Keep sentences to ${this.config.maxSentenceLength} words or fewer. ` +
      `Use simple sentence structures with clear subject-verb-object patterns. ` +
      `Avoid complex grammatical constructions and subordinate clauses.`
    )
  }

  private generateStructureInstructions(): string {
    return (
      `Structure content with clear, logical flow. Use short paragraphs. ` +
      `Include repetitive patterns that help with comprehension and memory. ` +
      `Use transition words appropriate for ${this.config.ageGroup} age group.`
    )
  }

  private generateEducationalInstructions(): string {
    const educationalFocus = this.getEducationalFocus()
    return (
      `Subtly incorporate ${educationalFocus} learning opportunities. ` +
      `Include positive character development and social-emotional learning elements. ` +
      `Ensure content promotes curiosity, kindness, and growth mindset.`
    )
  }

  private getEducationalFocus(): string {
    switch (this.config.ageGroup) {
      case 'toddler':
        return 'basic concepts (colors, shapes, numbers), emotional recognition, and social skills'
      case 'preschool':
        return 'pre-literacy skills, problem-solving, and cooperation'
      case 'early-elementary':
        return 'reading comprehension, basic science concepts, and character development'
      case 'elementary':
        return 'critical thinking, academic subjects, and moral reasoning'
      default:
        return 'age-appropriate learning concepts'
    }
  }

  // ============================================================================
  // Public Configuration Methods
  // ============================================================================

  updateConfig(newConfig: Partial<LanguageControlConfig>): void {
    this.config = LanguageControlConfigSchema.parse({
      ...this.config,
      ...newConfig,
    })
    this.vocabularyRules = [
      ...(VOCABULARY_SUBSTITUTIONS[this.config.ageGroup] || []),
      ...(this.config.customVocabularyRules || []),
    ]
  }

  getConfig(): LanguageControlConfig {
    return { ...this.config }
  }

  addVocabularyRules(rules: VocabularyRule[]): void {
    this.vocabularyRules.push(...rules)
  }

  getVocabularyRules(): VocabularyRule[] {
    return [...this.vocabularyRules]
  }
}

// ============================================================================
// Factory Functions and Utilities
// ============================================================================

/**
 * Create a language controls service for a specific age group
 */
export function createLanguageControlsService(
  ageGroup: AgeGroup,
  readingLevel?: ReadingLevel,
  customConfig?: Partial<LanguageControlConfig>
): LanguageControlsService {
  const baseConfig = AGE_LANGUAGE_CONFIGS[ageGroup]
  const config = {
    ...baseConfig,
    readingLevel: readingLevel || baseConfig.readingLevel,
    ...customConfig,
  }

  return new LanguageControlsService(config)
}

/**
 * Get default language control configuration for an age group
 */
export function getDefaultLanguageConfig(
  ageGroup: AgeGroup
): LanguageControlConfig {
  return { ...AGE_LANGUAGE_CONFIGS[ageGroup] }
}

/**
 * Analyze text readability without creating a full service instance
 */
export function analyzeTextReadability(text: string): {
  gradeLevel: number
  readabilityScore: number
  wordCount: number
  sentenceCount: number
  averageSentenceLength: number
} {
  return {
    gradeLevel: ReadabilityAnalyzer.calculateFleschKincaidGradeLevel(text),
    readabilityScore: ReadabilityAnalyzer.calculateFleschReadingEase(text),
    wordCount: ReadabilityAnalyzer.countWords(text),
    sentenceCount: ReadabilityAnalyzer.countSentences(text),
    averageSentenceLength:
      ReadabilityAnalyzer.countWords(text) /
      ReadabilityAnalyzer.countSentences(text),
  }
}

/**
 * Enhanced error class for language control issues
 */
export class LanguageControlError extends Error {
  constructor(
    message: string,
    public code: string,
    public analysisResult?: LanguageAnalysisResult
  ) {
    super(message)
    this.name = 'LanguageControlError'
  }

  getUserFriendlyMessage(): string {
    switch (this.code) {
      case 'READING_LEVEL_TOO_HIGH':
        return 'The text is too complex for the target age group. Please simplify the vocabulary and sentence structure.'
      case 'VOCABULARY_TOO_COMPLEX':
        return 'Some words in the text are too advanced. Please use simpler, age-appropriate vocabulary.'
      case 'SENTENCES_TOO_LONG':
        return 'Some sentences are too long. Please break them into shorter, easier-to-read sentences.'
      default:
        return this.message
    }
  }
}

// Export all types and utilities
export {
  ReadabilityAnalyzer,
  AGE_LANGUAGE_CONFIGS,
  AGE_APPROPRIATE_VOCABULARY,
  VOCABULARY_SUBSTITUTIONS,
}
