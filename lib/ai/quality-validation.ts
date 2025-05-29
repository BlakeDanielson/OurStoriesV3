/**
 * AI Quality Validation Service
 * Comprehensive quality assessment and validation for AI-generated children's content
 */

import { z } from 'zod'
import { EventEmitter } from 'events'
import {
  ContentStorageService,
  AIGeneratedContent,
  AIContentType,
} from './content-storage'

// Quality scoring schemas
export const QualityScoreSchema = z.object({
  overall: z.number().min(0).max(10),
  coherence: z.number().min(0).max(10),
  creativity: z.number().min(0).max(10),
  engagement: z.number().min(0).max(10),
  educational_value: z.number().min(0).max(10),
  age_appropriateness: z.number().min(0).max(10),
  language_quality: z.number().min(0).max(10),
  story_structure: z.number().min(0).max(10),
  character_development: z.number().min(0).max(10),
})

export const ContentRelevanceScoreSchema = z.object({
  theme_adherence: z.number().min(0).max(10),
  character_consistency: z.number().min(0).max(10),
  user_preference_alignment: z.number().min(0).max(10),
  educational_goal_achievement: z.number().min(0).max(10),
  cultural_sensitivity: z.number().min(0).max(10),
})

export const EducationalValueScoreSchema = z.object({
  learning_objectives: z.number().min(0).max(10),
  skill_development: z.number().min(0).max(10),
  concept_introduction: z.number().min(0).max(10),
  moral_lessons: z.number().min(0).max(10),
  cognitive_development: z.number().min(0).max(10),
})

export type QualityScore = z.infer<typeof QualityScoreSchema>
export type ContentRelevanceScore = z.infer<typeof ContentRelevanceScoreSchema>
export type EducationalValueScore = z.infer<typeof EducationalValueScoreSchema>

// Validation interfaces
export interface QualityValidationResult {
  contentId: string
  qualityScore: QualityScore
  relevanceScore: ContentRelevanceScore
  educationalScore: EducationalValueScore
  feedback: string[]
  recommendations: string[]
  passesThreshold: boolean
  validatedAt: string
}

export interface QualityThresholds {
  minimum_overall: number
  minimum_educational: number
  minimum_age_appropriate: number
  minimum_coherence: number
  required_categories: string[]
}

export interface ValidationConfig {
  thresholds: QualityThresholds
  enableAutomaticRegeneration: boolean
  enableFeedbackCollection: boolean
  qualityModels: {
    coherence: string
    creativity: string
    educational: string
  }
}

// Quality validation service
export class QualityValidationService extends EventEmitter {
  private contentStorage: ContentStorageService
  private config: ValidationConfig

  constructor(contentStorage: ContentStorageService, config: ValidationConfig) {
    super()
    this.contentStorage = contentStorage
    this.config = config
  }

  // Main validation method
  async validateContent(
    content: AIGeneratedContent
  ): Promise<QualityValidationResult> {
    try {
      const qualityScore = await this.assessQuality(content)
      const relevanceScore = await this.assessRelevance(content)
      const educationalScore = await this.assessEducationalValue(content)

      const feedback = this.generateFeedback(
        qualityScore,
        relevanceScore,
        educationalScore
      )
      const recommendations = this.generateRecommendations(
        qualityScore,
        relevanceScore,
        educationalScore
      )
      const passesThreshold = this.checkThresholds(
        qualityScore,
        relevanceScore,
        educationalScore
      )

      const result: QualityValidationResult = {
        contentId: content.id,
        qualityScore,
        relevanceScore,
        educationalScore,
        feedback,
        recommendations,
        passesThreshold,
        validatedAt: new Date().toISOString(),
      }

      // Store validation results
      await this.storeValidationResult(result)

      // Emit events for monitoring
      this.emit('validation:completed', result)

      if (!passesThreshold && this.config.enableAutomaticRegeneration) {
        this.emit('validation:failed', { contentId: content.id, result })
      }

      return result
    } catch (error) {
      this.emit('validation:error', { contentId: content.id, error })
      throw error
    }
  }

  // Quality assessment algorithms
  private async assessQuality(
    content: AIGeneratedContent
  ): Promise<QualityScore> {
    const parsedContent = content.parsed_content
    const rawText = content.raw_response

    // Coherence scoring
    const coherence = await this.scoreCoherence(rawText, parsedContent)

    // Creativity scoring
    const creativity = await this.scoreCreativity(rawText, parsedContent)

    // Engagement scoring
    const engagement = await this.scoreEngagement(rawText, parsedContent)

    // Educational value scoring
    const educational_value = await this.scoreEducationalValue(
      rawText,
      parsedContent
    )

    // Age appropriateness scoring
    const age_appropriateness = await this.scoreAgeAppropriateness(
      rawText,
      content.metadata
    )

    // Language quality scoring
    const language_quality = await this.scoreLanguageQuality(rawText)

    // Story structure scoring
    const story_structure = await this.scoreStoryStructure(parsedContent)

    // Character development scoring
    const character_development =
      await this.scoreCharacterDevelopment(parsedContent)

    const overall = this.calculateOverallScore({
      coherence,
      creativity,
      engagement,
      educational_value,
      age_appropriateness,
      language_quality,
      story_structure,
      character_development,
    })

    return {
      overall,
      coherence,
      creativity,
      engagement,
      educational_value,
      age_appropriateness,
      language_quality,
      story_structure,
      character_development,
    }
  }

  private async assessRelevance(
    content: AIGeneratedContent
  ): Promise<ContentRelevanceScore> {
    const metadata = content.metadata
    const parsedContent = content.parsed_content

    return {
      theme_adherence: await this.scoreThemeAdherence(parsedContent, metadata),
      character_consistency: await this.scoreCharacterConsistency(
        parsedContent,
        metadata
      ),
      user_preference_alignment: await this.scoreUserPreferenceAlignment(
        parsedContent,
        metadata
      ),
      educational_goal_achievement: await this.scoreEducationalGoalAchievement(
        parsedContent,
        metadata
      ),
      cultural_sensitivity: await this.scoreCulturalSensitivity(parsedContent),
    }
  }

  private async assessEducationalValue(
    content: AIGeneratedContent
  ): Promise<EducationalValueScore> {
    const parsedContent = content.parsed_content
    const metadata = content.metadata

    return {
      learning_objectives: await this.scoreLearningObjectives(
        parsedContent,
        metadata
      ),
      skill_development: await this.scoreSkillDevelopment(
        parsedContent,
        metadata
      ),
      concept_introduction: await this.scoreConceptIntroduction(
        parsedContent,
        metadata
      ),
      moral_lessons: await this.scoreMoralLessons(parsedContent),
      cognitive_development: await this.scoreCognitiveDevelopment(
        parsedContent,
        metadata
      ),
    }
  }

  // Individual scoring methods
  private async scoreCoherence(
    rawText: string,
    parsedContent: any
  ): Promise<number> {
    // Analyze text flow, logical progression, and narrative consistency
    const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 0)

    if (sentences.length < 3) return 3 // Too short for coherence analysis

    // Basic coherence indicators
    let score = 5 // Base score

    // Check for logical flow indicators
    const transitionWords = [
      'then',
      'next',
      'after',
      'because',
      'so',
      'but',
      'however',
      'meanwhile',
    ]
    const transitionCount = sentences.filter(sentence =>
      transitionWords.some(word => sentence.toLowerCase().includes(word))
    ).length

    score += Math.min(2, transitionCount * 0.5) // Bonus for transitions

    // Check for repetitive content (negative indicator)
    const uniqueWords = new Set(rawText.toLowerCase().split(/\s+/))
    const totalWords = rawText.split(/\s+/).length
    const uniqueRatio = uniqueWords.size / totalWords

    if (uniqueRatio < 0.3) score -= 2 // Penalty for repetition
    if (uniqueRatio > 0.7) score += 1 // Bonus for variety

    return Math.max(1, Math.min(10, score))
  }

  private async scoreCreativity(
    rawText: string,
    parsedContent: any
  ): Promise<number> {
    // Assess originality, imagination, and creative elements
    let score = 5 // Base score

    // Check for creative elements
    const creativeWords = [
      'magical',
      'wonderful',
      'amazing',
      'incredible',
      'fantastic',
      'mysterious',
      'adventure',
    ]
    const creativeCount = creativeWords.filter(word =>
      rawText.toLowerCase().includes(word)
    ).length

    score += Math.min(2, creativeCount * 0.3)

    // Check for dialogue (indicates character interaction)
    const dialogueMatches = rawText.match(/["'].*?["']/g) || []
    if (dialogueMatches.length > 0) score += 1

    // Check for descriptive language
    const adjectives =
      rawText.match(
        /\b(beautiful|colorful|bright|dark|loud|quiet|big|small|happy|sad)\b/gi
      ) || []
    score += Math.min(1.5, adjectives.length * 0.1)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreEngagement(
    rawText: string,
    parsedContent: any
  ): Promise<number> {
    // Assess how engaging and interesting the content is
    let score = 5 // Base score

    // Check for engaging elements
    const engagingWords = [
      'exciting',
      'fun',
      'surprise',
      'discover',
      'explore',
      'play',
      'laugh',
    ]
    const engagingCount = engagingWords.filter(word =>
      rawText.toLowerCase().includes(word)
    ).length

    score += Math.min(2, engagingCount * 0.4)

    // Check for questions (reader engagement)
    const questionCount = (rawText.match(/\?/g) || []).length
    score += Math.min(1, questionCount * 0.3)

    // Check for action words
    const actionWords = [
      'run',
      'jump',
      'dance',
      'sing',
      'play',
      'explore',
      'discover',
    ]
    const actionCount = actionWords.filter(word =>
      rawText.toLowerCase().includes(word)
    ).length

    score += Math.min(1.5, actionCount * 0.2)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreEducationalValue(
    rawText: string,
    parsedContent: any
  ): Promise<number> {
    // Assess learning potential and educational content
    let score = 5 // Base score

    // Check for educational elements
    const educationalWords = [
      'learn',
      'teach',
      'understand',
      'remember',
      'practice',
      'try',
      'think',
    ]
    const educationalCount = educationalWords.filter(word =>
      rawText.toLowerCase().includes(word)
    ).length

    score += Math.min(2, educationalCount * 0.3)

    // Check for problem-solving elements
    const problemWords = [
      'problem',
      'solve',
      'figure out',
      'find a way',
      'help',
    ]
    const problemCount = problemWords.filter(word =>
      rawText.toLowerCase().includes(word)
    ).length

    score += Math.min(1.5, problemCount * 0.4)

    // Check for moral/social lessons
    const moralWords = [
      'kind',
      'share',
      'help',
      'friend',
      'care',
      'respect',
      'honest',
    ]
    const moralCount = moralWords.filter(word =>
      rawText.toLowerCase().includes(word)
    ).length

    score += Math.min(1.5, moralCount * 0.3)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreAgeAppropriateness(
    rawText: string,
    metadata: any
  ): Promise<number> {
    // Assess if content is appropriate for target age
    const targetAge = metadata.target_age || 5
    let score = 8 // Start high, deduct for issues

    // Check vocabulary complexity
    const complexWords = rawText.match(/\b\w{8,}\b/g) || []
    const totalWords = rawText.split(/\s+/).length
    const complexRatio = complexWords.length / totalWords

    if (targetAge < 6 && complexRatio > 0.1) score -= 2
    if (targetAge < 8 && complexRatio > 0.15) score -= 1

    // Check sentence length
    const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const avgSentenceLength =
      sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) /
      sentences.length

    if (targetAge < 6 && avgSentenceLength > 10) score -= 1
    if (targetAge < 8 && avgSentenceLength > 15) score -= 1

    return Math.max(1, Math.min(10, score))
  }

  private async scoreLanguageQuality(rawText: string): Promise<number> {
    // Assess grammar, spelling, and language use
    let score = 7 // Start with good score

    // Basic grammar checks
    const sentences = rawText.split(/[.!?]+/).filter(s => s.trim().length > 0)

    // Check for proper capitalization
    const properlyCapitalized = sentences.filter(
      s => s.trim().charAt(0) === s.trim().charAt(0).toUpperCase()
    ).length

    const capitalizationRatio = properlyCapitalized / sentences.length
    if (capitalizationRatio < 0.8) score -= 1

    // Check for common grammar patterns
    const hasProperPunctuation =
      rawText.includes('.') || rawText.includes('!') || rawText.includes('?')
    if (!hasProperPunctuation) score -= 2

    // Check for varied sentence structure
    const shortSentences = sentences.filter(
      s => s.split(/\s+/).length < 5
    ).length
    const longSentences = sentences.filter(
      s => s.split(/\s+/).length > 12
    ).length
    const variety =
      (sentences.length - shortSentences - longSentences) / sentences.length

    if (variety > 0.6) score += 1

    return Math.max(1, Math.min(10, score))
  }

  private async scoreStoryStructure(parsedContent: any): Promise<number> {
    // Assess narrative structure (beginning, middle, end)
    let score = 5 // Base score

    if (parsedContent.pages && Array.isArray(parsedContent.pages)) {
      const pageCount = parsedContent.pages.length

      // Good structure indicators
      if (pageCount >= 3) score += 2 // Has beginning, middle, end
      if (pageCount >= 5) score += 1 // More developed structure

      // Check for story progression
      const firstPage = parsedContent.pages[0]?.text || ''
      const lastPage = parsedContent.pages[pageCount - 1]?.text || ''

      // Introduction indicators
      if (
        firstPage.toLowerCase().includes('once') ||
        firstPage.toLowerCase().includes('there was')
      ) {
        score += 1
      }

      // Conclusion indicators
      if (
        lastPage.toLowerCase().includes('end') ||
        lastPage.toLowerCase().includes('happy')
      ) {
        score += 1
      }
    }

    return Math.max(1, Math.min(10, score))
  }

  private async scoreCharacterDevelopment(parsedContent: any): Promise<number> {
    // Assess character presence and development
    let score = 5 // Base score

    const fullText = this.extractFullText(parsedContent)

    // Check for character names
    const characterNames = fullText.match(/\b[A-Z][a-z]+\b/g) || []
    const uniqueCharacters = new Set(
      characterNames.filter(
        name =>
          ![
            'The',
            'And',
            'But',
            'So',
            'Then',
            'When',
            'Where',
            'What',
            'Who',
            'How',
          ].includes(name)
      )
    )

    if (uniqueCharacters.size >= 1) score += 1
    if (uniqueCharacters.size >= 2) score += 1

    // Check for character actions and emotions
    const emotionWords = [
      'happy',
      'sad',
      'excited',
      'worried',
      'proud',
      'scared',
      'surprised',
    ]
    const emotionCount = emotionWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score += Math.min(2, emotionCount * 0.3)

    return Math.max(1, Math.min(10, score))
  }

  // Relevance scoring methods
  private async scoreThemeAdherence(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    const theme = metadata.theme || ''
    const fullText = this.extractFullText(parsedContent)

    if (!theme) return 5 // No theme specified

    let score = 5
    const themeWords = theme.toLowerCase().split(/\s+/)
    const textLower = fullText.toLowerCase()

    const themeMatches = themeWords.filter((word: string) =>
      textLower.includes(word)
    ).length
    score += Math.min(3, themeMatches * 1.5)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreCharacterConsistency(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    // Check if character traits are maintained throughout
    const characterTraits = metadata.character_traits || []
    const fullText = this.extractFullText(parsedContent)

    if (characterTraits.length === 0) return 7 // No specific traits to check

    let score = 5
    const textLower = fullText.toLowerCase()

    const traitMatches = characterTraits.filter((trait: string) =>
      textLower.includes(trait.toLowerCase())
    ).length

    score += Math.min(4, (traitMatches / characterTraits.length) * 4)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreUserPreferenceAlignment(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    // Check alignment with user preferences
    const preferences = metadata.user_preferences || {}
    const score = 6 // Default good score

    // This would integrate with user preference data
    // For now, return base score
    return score
  }

  private async scoreEducationalGoalAchievement(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    const educationalGoals = metadata.educational_goals || []
    const fullText = this.extractFullText(parsedContent)

    if (educationalGoals.length === 0) return 6

    let score = 4
    const textLower = fullText.toLowerCase()

    // Check for educational goal keywords
    const goalMatches = educationalGoals.filter((goal: string) =>
      textLower.includes(goal.toLowerCase())
    ).length

    score += Math.min(5, (goalMatches / educationalGoals.length) * 5)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreCulturalSensitivity(parsedContent: any): Promise<number> {
    const fullText = this.extractFullText(parsedContent)
    let score = 8 // Start high, deduct for issues

    // Check for potentially insensitive content
    const sensitiveWords = ['weird', 'strange', 'ugly', 'stupid', 'dumb']
    const sensitiveCount = sensitiveWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score -= sensitiveCount * 1.5

    // Bonus for inclusive language
    const inclusiveWords = [
      'different',
      'unique',
      'special',
      'diverse',
      'everyone',
    ]
    const inclusiveCount = inclusiveWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score += Math.min(2, inclusiveCount * 0.5)

    return Math.max(1, Math.min(10, score))
  }

  // Educational value scoring methods
  private async scoreLearningObjectives(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    const objectives = metadata.learning_objectives || []
    const fullText = this.extractFullText(parsedContent)

    if (objectives.length === 0) return 5

    let score = 3
    const textLower = fullText.toLowerCase()

    const objectiveMatches = objectives.filter((obj: string) =>
      textLower.includes(obj.toLowerCase())
    ).length

    score += Math.min(6, (objectiveMatches / objectives.length) * 6)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreSkillDevelopment(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    const fullText = this.extractFullText(parsedContent)
    let score = 5

    // Check for skill development opportunities
    const skillWords = [
      'practice',
      'learn',
      'try',
      'improve',
      'develop',
      'grow',
    ]
    const skillCount = skillWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score += Math.min(3, skillCount * 0.5)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreConceptIntroduction(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    const targetAge = metadata.target_age || 5
    const fullText = this.extractFullText(parsedContent)
    let score = 5

    // Age-appropriate concept introduction
    const conceptWords = [
      'number',
      'color',
      'shape',
      'letter',
      'sound',
      'animal',
      'plant',
    ]
    const conceptCount = conceptWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score += Math.min(3, conceptCount * 0.4)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreMoralLessons(parsedContent: any): Promise<number> {
    const fullText = this.extractFullText(parsedContent)
    let score = 4

    // Check for moral and social lessons
    const moralWords = [
      'kind',
      'share',
      'help',
      'honest',
      'brave',
      'patient',
      'respectful',
    ]
    const moralCount = moralWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score += Math.min(4, moralCount * 0.6)

    return Math.max(1, Math.min(10, score))
  }

  private async scoreCognitiveDevelopment(
    parsedContent: any,
    metadata: any
  ): Promise<number> {
    const fullText = this.extractFullText(parsedContent)
    let score = 5

    // Check for cognitive development elements
    const cognitiveWords = [
      'think',
      'remember',
      'understand',
      'solve',
      'figure out',
      'wonder',
    ]
    const cognitiveCount = cognitiveWords.filter(word =>
      fullText.toLowerCase().includes(word)
    ).length

    score += Math.min(3, cognitiveCount * 0.5)

    return Math.max(1, Math.min(10, score))
  }

  // Helper methods
  private extractFullText(parsedContent: any): string {
    if (typeof parsedContent === 'string') return parsedContent

    if (parsedContent.pages && Array.isArray(parsedContent.pages)) {
      return parsedContent.pages.map((page: any) => page.text || '').join(' ')
    }

    if (parsedContent.content) return parsedContent.content
    if (parsedContent.text) return parsedContent.text

    return JSON.stringify(parsedContent)
  }

  private calculateOverallScore(scores: Omit<QualityScore, 'overall'>): number {
    const weights = {
      coherence: 0.15,
      creativity: 0.12,
      engagement: 0.15,
      educational_value: 0.18,
      age_appropriateness: 0.15,
      language_quality: 0.1,
      story_structure: 0.08,
      character_development: 0.07,
    }

    const weightedSum = Object.entries(weights).reduce((sum, [key, weight]) => {
      return sum + scores[key as keyof typeof scores] * weight
    }, 0)

    return Math.round(weightedSum * 10) / 10
  }

  private generateFeedback(
    quality: QualityScore,
    relevance: ContentRelevanceScore,
    educational: EducationalValueScore
  ): string[] {
    const feedback: string[] = []

    // Quality feedback
    if (quality.coherence < 6) {
      feedback.push(
        'Story flow could be improved with better transitions between ideas'
      )
    }
    if (quality.creativity < 6) {
      feedback.push(
        'Consider adding more imaginative elements and creative descriptions'
      )
    }
    if (quality.engagement < 6) {
      feedback.push(
        'Story could be more engaging with interactive elements or questions'
      )
    }
    if (quality.educational_value < 6) {
      feedback.push(
        'Educational content could be enhanced with learning opportunities'
      )
    }

    // Relevance feedback
    if (relevance.theme_adherence < 6) {
      feedback.push('Story should better align with the specified theme')
    }
    if (relevance.character_consistency < 6) {
      feedback.push('Character traits should be more consistently represented')
    }

    // Educational feedback
    if (educational.learning_objectives < 6) {
      feedback.push('Learning objectives could be more clearly integrated')
    }
    if (educational.moral_lessons < 6) {
      feedback.push('Consider adding positive moral or social lessons')
    }

    return feedback
  }

  private generateRecommendations(
    quality: QualityScore,
    relevance: ContentRelevanceScore,
    educational: EducationalValueScore
  ): string[] {
    const recommendations: string[] = []

    // High-impact recommendations
    if (quality.overall < 7) {
      recommendations.push(
        'Consider regenerating with improved prompts focusing on story quality'
      )
    }
    if (educational.learning_objectives < 6) {
      recommendations.push(
        'Enhance educational content with specific learning goals'
      )
    }
    if (quality.age_appropriateness < 7) {
      recommendations.push(
        'Adjust vocabulary and complexity for target age group'
      )
    }

    return recommendations
  }

  private checkThresholds(
    quality: QualityScore,
    relevance: ContentRelevanceScore,
    educational: EducationalValueScore
  ): boolean {
    const thresholds = this.config.thresholds

    return (
      quality.overall >= thresholds.minimum_overall &&
      educational.learning_objectives >= thresholds.minimum_educational &&
      quality.age_appropriateness >= thresholds.minimum_age_appropriate &&
      quality.coherence >= thresholds.minimum_coherence
    )
  }

  private async storeValidationResult(
    result: QualityValidationResult
  ): Promise<void> {
    try {
      await this.contentStorage.recordAnalyticsEvent({
        eventType: 'quality_validation',
        eventName: 'content_validated',
        eventData: {
          contentId: result.contentId,
          qualityScore: result.qualityScore,
          relevanceScore: result.relevanceScore,
          educationalScore: result.educationalScore,
          passesThreshold: result.passesThreshold,
        },
        performanceMetrics: {
          validationTime: Date.now(),
        },
      })
    } catch (error) {
      this.emit('error', { operation: 'storeValidationResult', error })
    }
  }

  // Batch validation
  async validateBatch(
    contentIds: string[]
  ): Promise<QualityValidationResult[]> {
    const results: QualityValidationResult[] = []

    for (const contentId of contentIds) {
      try {
        const content = await this.contentStorage.getAIContent(contentId)
        if (content) {
          const result = await this.validateContent(content)
          results.push(result)
        }
      } catch (error) {
        this.emit('error', { operation: 'validateBatch', contentId, error })
      }
    }

    return results
  }

  // Quality metrics
  async getQualityMetrics(
    userId: string,
    timeRange?: { start: string; end: string }
  ): Promise<any> {
    // This would integrate with analytics to provide quality metrics
    // Implementation would depend on analytics storage structure
    return {
      averageQuality: 7.5,
      totalValidations: 100,
      passRate: 0.85,
      topIssues: ['coherence', 'educational_value'],
    }
  }
}

// Factory function
export function createQualityValidationService(
  contentStorage: ContentStorageService,
  config?: Partial<ValidationConfig>
): QualityValidationService {
  const defaultConfig: ValidationConfig = {
    thresholds: {
      minimum_overall: 6.0,
      minimum_educational: 5.0,
      minimum_age_appropriate: 7.0,
      minimum_coherence: 6.0,
      required_categories: ['educational_value', 'age_appropriateness'],
    },
    enableAutomaticRegeneration: true,
    enableFeedbackCollection: true,
    qualityModels: {
      coherence: 'rule-based',
      creativity: 'rule-based',
      educational: 'rule-based',
    },
  }

  const mergedConfig = { ...defaultConfig, ...config }
  return new QualityValidationService(contentStorage, mergedConfig)
}

export const DEFAULT_QUALITY_THRESHOLDS: QualityThresholds = {
  minimum_overall: 6.0,
  minimum_educational: 5.0,
  minimum_age_appropriate: 7.0,
  minimum_coherence: 6.0,
  required_categories: ['educational_value', 'age_appropriateness'],
}
