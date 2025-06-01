/**
 * Readability Analyzer for Language Controls
 *
 * Provides text analysis capabilities for readability scoring and complexity assessment
 */

import { LanguageComplexity } from './language-controls-types'

// ============================================================================
// Readability Analysis Class
// ============================================================================

export class ReadabilityAnalyzer {
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
    const words = text.trim().split(/\s+/)
    return words.filter(word => word.length > 0).length
  }

  /**
   * Count total syllables in text
   */
  static countSyllables(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
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

    const lengths = sentences.map(s => s.trim().split(/\s+/).length)
    const averageLength =
      lengths.reduce((sum, len) => sum + len, 0) / lengths.length
    const maxLength = Math.max(...lengths)
    const longSentenceCount = lengths.filter(len => len > 20).length
    const complexSentenceCount = sentences.filter(
      s => s.includes(',') || s.includes(';') || s.includes(':')
    ).length

    return {
      averageLength,
      maxLength,
      longSentenceCount,
      complexSentenceCount,
    }
  }

  /**
   * Analyze vocabulary complexity
   */
  static analyzeVocabularyComplexity(text: string): {
    level: LanguageComplexity
    complexWordCount: number
    simpleWordRatio: number
  } {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    const totalWords = words.length

    if (totalWords === 0) {
      return {
        level: 'very-simple',
        complexWordCount: 0,
        simpleWordRatio: 1,
      }
    }

    // Count complex words (3+ syllables)
    const complexWords = words.filter(
      word => this.countSyllablesInWord(word) >= 3
    )
    const complexWordCount = complexWords.length
    const complexWordRatio = complexWordCount / totalWords
    const simpleWordRatio = 1 - complexWordRatio

    // Determine complexity level
    let level: LanguageComplexity
    if (complexWordRatio < 0.05) {
      level = 'very-simple'
    } else if (complexWordRatio < 0.15) {
      level = 'simple'
    } else if (complexWordRatio < 0.25) {
      level = 'moderate'
    } else {
      level = 'complex'
    }

    return {
      level,
      complexWordCount,
      simpleWordRatio,
    }
  }

  /**
   * Get reading level description from grade level
   */
  static getReadingLevelDescription(gradeLevel: number): string {
    if (gradeLevel <= 1) return 'Very Easy (Kindergarten-1st grade)'
    if (gradeLevel <= 3) return 'Easy (2nd-3rd grade)'
    if (gradeLevel <= 6) return 'Fairly Easy (4th-6th grade)'
    if (gradeLevel <= 9) return 'Standard (7th-9th grade)'
    if (gradeLevel <= 13) return 'Fairly Difficult (10th-13th grade)'
    if (gradeLevel <= 16) return 'Difficult (College level)'
    return 'Very Difficult (Graduate level)'
  }

  /**
   * Get readability score description
   */
  static getReadabilityDescription(score: number): string {
    if (score >= 90) return 'Very Easy'
    if (score >= 80) return 'Easy'
    if (score >= 70) return 'Fairly Easy'
    if (score >= 60) return 'Standard'
    if (score >= 50) return 'Fairly Difficult'
    if (score >= 30) return 'Difficult'
    return 'Very Difficult'
  }
}
