/**
 * AI Response Quality Scoring Service
 *
 * This module provides quality scoring capabilities for AI-generated responses,
 * evaluating structure, completeness, coherence, and formatting.
 */

import type {
  ResponseParsingConfig,
  QualityScore,
  ResponseFormat,
  ContentType,
} from './response-parsing-types'

// Quality scoring service
export class QualityScoringService {
  private config: ResponseParsingConfig

  constructor(config: ResponseParsingConfig) {
    this.config = config
  }

  scoreResponse(
    content: any,
    format: ResponseFormat,
    contentType: ContentType
  ): QualityScore {
    const structure = this.scoreStructure(content, contentType)
    const completeness = this.scoreCompleteness(content, contentType)
    const coherence = this.scoreCoherence(content)
    const formatting = this.scoreFormatting(content, format)

    const overall = Math.round(
      (structure + completeness + coherence + formatting) / 4
    )

    return {
      overall,
      structure,
      completeness,
      coherence,
      formatting,
    }
  }

  private scoreStructure(content: any, contentType: ContentType): number {
    if (!content || typeof content !== 'object') {
      return contentType === 'story' && typeof content === 'string' ? 60 : 20
    }

    switch (contentType) {
      case 'story_outline':
        return this.scoreStoryOutlineStructure(content)
      case 'story':
        return this.scoreStoryStructure(content)
      case 'story_revision':
        return this.scoreRevisionStructure(content)
      default:
        return this.scoreGenericStructure(content)
    }
  }

  private scoreCompleteness(content: any, contentType: ContentType): number {
    if (!content) return 0

    switch (contentType) {
      case 'story_outline':
        return this.scoreStoryOutlineCompleteness(content)
      case 'story':
        return this.scoreStoryCompleteness(content)
      case 'story_revision':
        return this.scoreRevisionCompleteness(content)
      default:
        return this.scoreGenericCompleteness(content)
    }
  }

  private scoreCoherence(content: any): number {
    if (typeof content === 'string') {
      return this.scoreTextCoherence(content)
    }

    if (content && typeof content === 'object') {
      const textFields = ['content', 'summary', 'description', 'revisedContent']
      let totalScore = 0
      let fieldCount = 0

      for (const field of textFields) {
        if (content[field] && typeof content[field] === 'string') {
          totalScore += this.scoreTextCoherence(content[field])
          fieldCount++
        }
      }

      return fieldCount > 0 ? Math.round(totalScore / fieldCount) : 70
    }

    return 50
  }

  private scoreFormatting(content: any, format: ResponseFormat): number {
    switch (format) {
      case 'json':
        return 90 // JSON is inherently well-formatted if parsed
      case 'markdown':
        return 85 // Markdown has good structure
      case 'structured_text':
        return 80 // Structured text is organized
      case 'mixed':
        return 75 // Mixed format can be complex
      case 'plain_text':
        return 60 // Plain text has minimal formatting
      default:
        return 40 // Unknown format
    }
  }

  private scoreStoryOutlineStructure(content: any): number {
    let score = 0
    const requiredFields = [
      'title',
      'summary',
      'characters',
      'setting',
      'chapters',
    ]
    const optionalFields = ['themes', 'educationalGoals', 'estimatedLength']

    // Check required fields
    for (const field of requiredFields) {
      if (content[field]) score += 15
    }

    // Check optional fields
    for (const field of optionalFields) {
      if (content[field]) score += 5
    }

    // Bonus for well-structured chapters
    if (
      content.chapters &&
      Array.isArray(content.chapters) &&
      content.chapters.length > 0
    ) {
      score += 10
    }

    return Math.min(score, 100)
  }

  private scoreStoryStructure(content: any): number {
    let score = 0

    if (content.title) score += 20
    if (content.content && content.content.length > 100) score += 40
    if (content.characters && Array.isArray(content.characters)) score += 15
    if (content.themes && Array.isArray(content.themes)) score += 10
    if (content.chapters && Array.isArray(content.chapters)) score += 15

    return Math.min(score, 100)
  }

  private scoreRevisionStructure(content: any): number {
    let score = 0

    if (content.revisedContent) score += 40
    if (content.changes && Array.isArray(content.changes)) score += 30
    if (content.improvementAreas && Array.isArray(content.improvementAreas))
      score += 15
    if (content.feedback) score += 15

    return Math.min(score, 100)
  }

  private scoreGenericStructure(content: any): number {
    if (typeof content === 'string') return 60
    if (!content || typeof content !== 'object') return 20

    const fieldCount = Object.keys(content).length
    return Math.min(fieldCount * 10, 100)
  }

  private scoreStoryOutlineCompleteness(content: any): number {
    let score = 0

    if (content.title && content.title.length > 3) score += 15
    if (content.summary && content.summary.length > 50) score += 20
    if (content.characters && content.characters.length > 0) score += 15
    if (content.setting && content.setting.length > 10) score += 10
    if (content.chapters && content.chapters.length > 0) score += 25
    if (content.themes && content.themes.length > 0) score += 10
    if (content.educationalGoals && content.educationalGoals.length > 0)
      score += 5

    return Math.min(score, 100)
  }

  private scoreStoryCompleteness(content: any): number {
    let score = 0

    if (content.title && content.title.length > 3) score += 20
    if (content.content && content.content.length > 500) score += 50
    if (content.characters && content.characters.length > 0) score += 15
    if (content.themes && content.themes.length > 0) score += 10
    if (content.educationalElements && content.educationalElements.length > 0)
      score += 5

    return Math.min(score, 100)
  }

  private scoreRevisionCompleteness(content: any): number {
    let score = 0

    if (content.revisedContent && content.revisedContent.length > 100)
      score += 50
    if (content.changes && content.changes.length > 0) score += 25
    if (content.improvementAreas && content.improvementAreas.length > 0)
      score += 15
    if (content.feedback && content.feedback.length > 20) score += 10

    return Math.min(score, 100)
  }

  private scoreGenericCompleteness(content: any): number {
    if (typeof content === 'string') {
      return content.length > 50 ? 80 : 40
    }

    if (content && typeof content === 'object') {
      const fields = Object.keys(content)
      const nonEmptyFields = fields.filter(key => {
        const value = content[key]
        return value !== null && value !== undefined && value !== ''
      })

      return Math.min((nonEmptyFields.length / fields.length) * 100, 100)
    }

    return 20
  }

  private scoreTextCoherence(text: string): number {
    if (!text || text.length < 10) return 20

    let score = 50 // Base score

    // Check for proper sentence structure
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length > 1) score += 10

    // Check for paragraph structure
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0)
    if (paragraphs.length > 1) score += 10

    // Check for transition words
    const transitionWords = [
      'however',
      'therefore',
      'meanwhile',
      'furthermore',
      'consequently',
      'additionally',
    ]
    const hasTransitions = transitionWords.some(word =>
      text.toLowerCase().includes(word)
    )
    if (hasTransitions) score += 10

    // Check for consistent tense (simple heuristic)
    const pastTenseWords = text.match(/\b\w+ed\b/g) || []
    const presentTenseWords = text.match(/\b\w+s\b/g) || []
    const tenseConsistency =
      Math.abs(pastTenseWords.length - presentTenseWords.length) < 5
    if (tenseConsistency) score += 10

    // Penalize very short or very repetitive text
    if (text.length < 50) score -= 20

    const words = text.toLowerCase().split(/\s+/)
    const uniqueWords = new Set(words)
    const repetitionRatio = uniqueWords.size / words.length
    if (repetitionRatio < 0.5) score -= 15

    return Math.max(Math.min(score, 100), 0)
  }
}
