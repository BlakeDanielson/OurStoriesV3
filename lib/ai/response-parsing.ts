/**
 * AI Response Parsing Service
 *
 * This module provides comprehensive response parsing and validation systems
 * for AI-generated content, handling various response formats and edge cases.
 *
 * Features:
 * - Structured response parsing (JSON, Markdown, Plain text)
 * - Format validation with Zod schemas
 * - Content extraction and normalization
 * - Metadata processing and validation
 * - Response quality scoring
 * - Error handling and fallback parsing
 */

import { z } from 'zod'
import { EventEmitter } from 'events'

// Validation schemas
export const StoryOutlineSchema = z.object({
  title: z.string(),
  summary: z.string(),
  characters: z.array(z.string()),
  setting: z.string(),
  chapters: z.array(
    z.object({
      title: z.string(),
      summary: z.string(),
      keyEvents: z.array(z.string()),
      educationalElements: z.array(z.string()).optional(),
    })
  ),
  themes: z.array(z.string()),
  educationalGoals: z.array(z.string()),
  estimatedLength: z.number(),
})

export const StoryContentSchema = z.object({
  title: z.string(),
  content: z.string(),
  chapters: z
    .array(
      z.object({
        title: z.string(),
        content: z.string(),
        summary: z.string(),
        keyEvents: z.array(z.string()),
      })
    )
    .optional(),
  characters: z.array(z.string()),
  themes: z.array(z.string()),
  educationalElements: z.array(z.string()),
  wordCount: z.number().optional(),
})

export const StoryRevisionSchema = z.object({
  revisedContent: z.string(),
  changes: z.array(
    z.object({
      type: z.string(),
      description: z.string(),
      location: z.string().optional(),
    })
  ),
  improvementAreas: z.array(z.string()),
  feedback: z.string(),
})

// Core interfaces
export interface ParsedResponse<T = any> {
  content: T
  format: ResponseFormat
  quality: QualityScore
  metadata: ResponseMetadata
  warnings: string[]
  errors: string[]
}

export interface ResponseMetadata {
  originalFormat: ResponseFormat
  parsedAt: Date
  processingTimeMs: number
  contentLength: number
  structureScore: number
  completenessScore: number
  validationPassed: boolean
  extractedFields: string[]
  missingFields: string[]
}

export interface QualityScore {
  overall: number // 0-100
  structure: number // 0-100
  completeness: number // 0-100
  coherence: number // 0-100
  formatting: number // 0-100
}

export type ResponseFormat =
  | 'json'
  | 'markdown'
  | 'plain_text'
  | 'structured_text'
  | 'mixed'
  | 'unknown'

export type ContentType =
  | 'story'
  | 'story_outline'
  | 'story_revision'
  | 'character_description'
  | 'scene_description'
  | 'educational_content'
  | 'metadata'

// Configuration interface
export interface ResponseParsingConfig {
  enableStrictValidation: boolean
  enableQualityScoring: boolean
  enableContentNormalization: boolean
  enableFallbackParsing: boolean
  maxProcessingTimeMs: number
  qualityThresholds: {
    minimum: number
    good: number
    excellent: number
  }
  contentLimits: {
    maxContentLength: number
    minContentLength: number
    maxChapters: number
    maxCharacters: number
  }
  parsingOptions: {
    preserveFormatting: boolean
    extractMetadata: boolean
    validateStructure: boolean
    normalizeWhitespace: boolean
  }
}

// Error classes
export class ResponseParsingError extends Error {
  constructor(
    message: string,
    public code: string,
    public format: ResponseFormat,
    public originalContent?: string
  ) {
    super(message)
    this.name = 'ResponseParsingError'
  }
}

export class ValidationError extends ResponseParsingError {
  constructor(
    message: string,
    public validationErrors: z.ZodError,
    format: ResponseFormat
  ) {
    super(message, 'VALIDATION_ERROR', format)
    this.name = 'ValidationError'
  }
}

export class FormatDetectionError extends ResponseParsingError {
  constructor(message: string, originalContent?: string) {
    super(message, 'FORMAT_DETECTION_ERROR', 'unknown', originalContent)
    this.name = 'FormatDetectionError'
  }
}

// Format detection service
export class FormatDetectionService {
  private static readonly JSON_PATTERNS = [
    /^\s*\{[\s\S]*\}\s*$/,
    /^\s*\[[\s\S]*\]\s*$/,
  ]

  private static readonly MARKDOWN_PATTERNS = [
    /^#+\s+/m,
    /\*\*.*?\*\*/,
    /\*.*?\*/,
    /```[\s\S]*?```/,
    /\[.*?\]\(.*?\)/,
  ]

  private static readonly STRUCTURED_TEXT_PATTERNS = [
    /^[A-Za-z\s]+:\s*.+$/m,
    /^Title:\s*/m,
    /^Summary:\s*/m,
    /^Characters:\s*/m,
  ]

  detectFormat(content: string): ResponseFormat {
    if (!content || typeof content !== 'string') {
      return 'unknown'
    }

    const trimmedContent = content.trim()

    if (this.isJsonFormat(trimmedContent)) {
      return 'json'
    }

    if (
      this.isMarkdownFormat(trimmedContent) &&
      this.isStructuredTextFormat(trimmedContent)
    ) {
      return 'mixed'
    }

    if (this.isMarkdownFormat(trimmedContent)) {
      return 'markdown'
    }

    if (this.isStructuredTextFormat(trimmedContent)) {
      return 'structured_text'
    }

    return 'plain_text'
  }

  private isJsonFormat(content: string): boolean {
    try {
      JSON.parse(content)
      return true
    } catch {
      return FormatDetectionService.JSON_PATTERNS.some(pattern =>
        pattern.test(content)
      )
    }
  }

  private isMarkdownFormat(content: string): boolean {
    return FormatDetectionService.MARKDOWN_PATTERNS.some(pattern =>
      pattern.test(content)
    )
  }

  private isStructuredTextFormat(content: string): boolean {
    return FormatDetectionService.STRUCTURED_TEXT_PATTERNS.some(pattern =>
      pattern.test(content)
    )
  }

  private isMixedFormat(content: string): boolean {
    const hasMarkdown = this.isMarkdownFormat(content)
    const hasStructured = this.isStructuredTextFormat(content)
    const hasJson = content.includes('{') && content.includes('}')

    return (
      (hasMarkdown && hasStructured) ||
      (hasMarkdown && hasJson) ||
      (hasStructured && hasJson)
    )
  }
}

// Content extraction service
export class ContentExtractionService {
  extractFromJson<T>(content: string, schema: z.ZodSchema<T>): T {
    try {
      const parsed = JSON.parse(content)
      return schema.parse(parsed)
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new ValidationError('JSON validation failed', error, 'json')
      }
      throw new ResponseParsingError(
        `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'JSON_PARSE_ERROR',
        'json',
        content
      )
    }
  }

  extractFromMarkdown(content: string, contentType: ContentType): any {
    const sections = this.parseMarkdownSections(content)

    switch (contentType) {
      case 'story_outline':
        return this.extractStoryOutlineFromMarkdown(sections)
      case 'story':
        return this.extractStoryFromMarkdown(sections)
      case 'story_revision':
        return this.extractRevisionFromMarkdown(sections)
      default:
        return this.extractGenericFromMarkdown(sections)
    }
  }

  extractFromStructuredText(content: string, contentType: ContentType): any {
    const sections = this.parseStructuredTextSections(content)

    switch (contentType) {
      case 'story_outline':
        return this.extractStoryOutlineFromStructured(sections)
      case 'story':
        return this.extractStoryFromStructured(sections)
      default:
        return this.extractGenericFromStructured(sections)
    }
  }

  extractFromPlainText(content: string, contentType: ContentType): any {
    switch (contentType) {
      case 'story':
        return this.extractStoryFromPlainText(content)
      case 'story_outline':
        return this.extractOutlineFromPlainText(content)
      default:
        return { content: content.trim() }
    }
  }

  private parseMarkdownSections(content: string): Map<string, string> {
    const sections = new Map<string, string>()
    const lines = content.split('\n')
    let currentSection = 'content'
    let currentContent: string[] = []

    for (const line of lines) {
      const headerMatch = line.match(/^#+\s+(.+)$/)
      if (headerMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections.set(currentSection, currentContent.join('\n').trim())
        }
        // Start new section
        currentSection = headerMatch[1].toLowerCase().replace(/\s+/g, '_')
        currentContent = []
      } else {
        currentContent.push(line)
      }
    }

    // Save final section
    if (currentContent.length > 0) {
      sections.set(currentSection, currentContent.join('\n').trim())
    }

    return sections
  }

  private parseStructuredTextSections(content: string): Map<string, string> {
    const sections = new Map<string, string>()
    const lines = content.split('\n')
    let currentSection = 'content'
    let currentContent: string[] = []

    for (const line of lines) {
      const sectionMatch = line.match(/^([A-Za-z\s]+):\s*(.*)$/)
      if (sectionMatch) {
        // Save previous section
        if (currentContent.length > 0) {
          sections.set(currentSection, currentContent.join('\n').trim())
        }
        // Start new section
        currentSection = sectionMatch[1].toLowerCase().replace(/\s+/g, '_')
        currentContent = sectionMatch[2] ? [sectionMatch[2]] : []
      } else if (line.trim()) {
        currentContent.push(line)
      }
    }

    // Save final section
    if (currentContent.length > 0) {
      sections.set(currentSection, currentContent.join('\n').trim())
    }

    return sections
  }

  private extractStoryOutlineFromMarkdown(sections: Map<string, string>): any {
    return {
      title:
        sections.get('title') ||
        sections.get('story_title') ||
        'Untitled Story',
      summary: sections.get('summary') || sections.get('description') || '',
      characters: this.extractList(sections.get('characters') || ''),
      setting: sections.get('setting') || sections.get('location') || '',
      chapters: this.extractChaptersFromMarkdown(sections),
      themes: this.extractList(sections.get('themes') || ''),
      educationalGoals: this.extractList(
        sections.get('educational_goals') ||
          sections.get('learning_objectives') ||
          ''
      ),
      estimatedLength: this.extractNumber(
        sections.get('estimated_length') || sections.get('word_count') || '0'
      ),
    }
  }

  private extractStoryFromMarkdown(sections: Map<string, string>): any {
    const chapters = this.extractChaptersFromMarkdown(sections)
    const mainContent = sections.get('content') || sections.get('story') || ''

    return {
      title: sections.get('title') || 'Untitled Story',
      content: mainContent,
      chapters: chapters.length > 0 ? chapters : undefined,
      characters: this.extractList(sections.get('characters') || ''),
      themes: this.extractList(sections.get('themes') || ''),
      educationalElements: this.extractList(
        sections.get('educational_elements') || ''
      ),
      wordCount: this.estimateWordCount(mainContent),
    }
  }

  private extractRevisionFromMarkdown(sections: Map<string, string>): any {
    return {
      revisedContent:
        sections.get('revised_content') || sections.get('content') || '',
      changes: this.extractChangesFromText(sections.get('changes') || ''),
      improvementAreas: this.extractList(
        sections.get('improvement_areas') || ''
      ),
      feedback: sections.get('feedback') || sections.get('notes') || '',
    }
  }

  private extractStoryOutlineFromStructured(
    sections: Map<string, string>
  ): any {
    return {
      title: sections.get('title') || 'Untitled Story',
      summary: sections.get('summary') || '',
      characters: this.extractList(sections.get('characters') || ''),
      setting: sections.get('setting') || '',
      chapters: this.extractChaptersFromStructured(sections),
      themes: this.extractList(sections.get('themes') || ''),
      educationalGoals: this.extractList(
        sections.get('educational_goals') || ''
      ),
      estimatedLength: this.extractNumber(
        sections.get('estimated_length') || '0'
      ),
    }
  }

  private extractStoryFromStructured(sections: Map<string, string>): any {
    return {
      title: sections.get('title') || 'Untitled Story',
      content: sections.get('content') || sections.get('story') || '',
      characters: this.extractList(sections.get('characters') || ''),
      themes: this.extractList(sections.get('themes') || ''),
      educationalElements: this.extractList(
        sections.get('educational_elements') || ''
      ),
    }
  }

  private extractGenericFromMarkdown(sections: Map<string, string>): any {
    const result: any = {}
    // Convert Map to object using Array.from for ES6 compatibility
    Array.from(sections.entries()).forEach(([key, value]) => {
      result[key] = value
    })
    return result
  }

  private extractGenericFromStructured(sections: Map<string, string>): any {
    const result: any = {}
    // Convert Map to object using Array.from for ES6 compatibility
    Array.from(sections.entries()).forEach(([key, value]) => {
      result[key] = value
    })
    return result
  }

  private extractStoryFromPlainText(content: string): any {
    const lines = content.split('\n').filter(line => line.trim())
    const title = lines[0] || 'Untitled Story'
    const storyContent = lines.slice(1).join('\n').trim()

    return {
      title,
      content: storyContent,
      wordCount: this.estimateWordCount(storyContent),
    }
  }

  private extractOutlineFromPlainText(content: string): any {
    const lines = content.split('\n').filter(line => line.trim())
    const title = lines[0] || 'Untitled Story'
    const summary = lines.slice(1, 3).join(' ').trim()

    return {
      title,
      summary,
      characters: [],
      setting: '',
      chapters: [],
      themes: [],
      educationalGoals: [],
      estimatedLength: 0,
    }
  }

  private extractChaptersFromMarkdown(sections: Map<string, string>): any[] {
    const chapters: any[] = []

    // Convert Map to array for ES6 compatibility
    Array.from(sections.entries()).forEach(([key, value]) => {
      const chapterMatch = key.match(/^chapter_?(\d+)/)
      if (chapterMatch) {
        const chapterNumber = parseInt(chapterMatch[1])
        chapters[chapterNumber - 1] = {
          title: `Chapter ${chapterNumber}`,
          content: value,
          summary: value.substring(0, 200) + (value.length > 200 ? '...' : ''),
          keyEvents: this.extractKeyEvents(value),
        }
      }
    })

    return chapters.filter(Boolean)
  }

  private extractChaptersFromStructured(sections: Map<string, string>): any[] {
    const chapters: any[] = []

    // Convert Map to array for ES6 compatibility
    Array.from(sections.entries()).forEach(([key, value]) => {
      const chapterMatch = key.match(/^chapter_?(\d+)/)
      if (chapterMatch) {
        const chapterNumber = parseInt(chapterMatch[1])
        chapters[chapterNumber - 1] = {
          title: `Chapter ${chapterNumber}`,
          summary: value,
          keyEvents: this.extractKeyEvents(value),
          educationalElements: [],
        }
      }
    })

    return chapters.filter(Boolean)
  }

  private extractList(text: string): string[] {
    if (!text) return []

    // Handle different list formats
    const lines = text.split('\n')
    const items: string[] = []

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue

      // Remove list markers
      const cleaned = trimmed
        .replace(/^[-*+]\s+/, '') // Markdown bullets
        .replace(/^\d+\.\s+/, '') // Numbered lists
        .replace(/^[•·]\s+/, '') // Unicode bullets
        .trim()

      if (cleaned) {
        items.push(cleaned)
      }
    }

    // If no list format detected, try comma separation
    if (items.length === 0 && text.includes(',')) {
      return text
        .split(',')
        .map(item => item.trim())
        .filter(Boolean)
    }

    return items.length > 0 ? items : [text.trim()].filter(Boolean)
  }

  private extractNumber(text: string): number {
    const match = text.match(/\d+/)
    return match ? parseInt(match[0]) : 0
  }

  private extractKeyEvents(text: string): string[] {
    // Simple extraction of sentences that might be key events
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10)
      .slice(0, 3)
  }

  private extractChangesFromText(text: string): any[] {
    const changes: any[] = []
    const lines = text.split('\n').filter(line => line.trim())

    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.includes(':')) {
        const [type, description] = trimmed.split(':', 2)
        changes.push({
          type: type.trim(),
          description: description.trim(),
        })
      } else if (trimmed) {
        changes.push({
          type: 'general',
          description: trimmed,
        })
      }
    }

    return changes
  }

  private estimateWordCount(text: string): number {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }
}

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

// Response normalization service
export class ResponseNormalizationService {
  private config: ResponseParsingConfig

  constructor(config: ResponseParsingConfig) {
    this.config = config
  }

  normalizeResponse<T>(
    content: T,
    format: ResponseFormat,
    contentType: ContentType
  ): T {
    if (!this.config.enableContentNormalization) {
      return content
    }

    let normalized = this.normalizeContent(content)

    if (this.config.parsingOptions.normalizeWhitespace) {
      normalized = this.normalizeWhitespace(normalized)
    }

    if (this.config.parsingOptions.preserveFormatting) {
      normalized = this.preserveImportantFormatting(normalized)
    }

    normalized = this.validateContentLimits(normalized, contentType)

    return normalized
  }

  private normalizeContent<T>(content: T): T {
    if (typeof content === 'string') {
      return this.normalizeString(content) as T
    }

    if (content && typeof content === 'object' && !Array.isArray(content)) {
      const normalized: any = {}
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string') {
          normalized[key] = this.normalizeString(value)
        } else if (Array.isArray(value)) {
          normalized[key] = value.map(item =>
            typeof item === 'string' ? this.normalizeString(item) : item
          )
        } else {
          normalized[key] = value
        }
      }
      return normalized as T
    }

    return content
  }

  private normalizeString(text: string): string {
    return text
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\r/g, '\n') // Handle old Mac line endings
      .replace(/\u00A0/g, ' ') // Replace non-breaking spaces
      .replace(/[\u2018\u2019]/g, "'") // Normalize quotes
      .replace(/[\u201C\u201D]/g, '"') // Normalize double quotes
      .replace(/\u2026/g, '...') // Normalize ellipsis
      .replace(/\u2013/g, '-') // Normalize en dash
      .replace(/\u2014/g, '--') // Normalize em dash
      .trim()
  }

  private normalizeWhitespace<T>(content: T): T {
    if (typeof content === 'string') {
      return content
        .replace(/[ \t]+/g, ' ') // Normalize spaces and tabs
        .replace(/\n{3,}/g, '\n\n') // Limit consecutive newlines
        .trim() as T
    }

    if (content && typeof content === 'object' && !Array.isArray(content)) {
      const normalized: any = {}
      for (const [key, value] of Object.entries(content)) {
        if (typeof value === 'string') {
          normalized[key] = this.normalizeWhitespace(value)
        } else {
          normalized[key] = value
        }
      }
      return normalized as T
    }

    return content
  }

  private preserveImportantFormatting<T>(content: T): T {
    if (typeof content === 'string') {
      // Preserve intentional formatting like dialogue, poetry, etc.
      const preserved = content
        .replace(/"\s*\n\s*"/g, '"\n"') // Preserve dialogue formatting
        .replace(/\n\s*\n\s*\n/g, '\n\n') // Preserve paragraph breaks

      return preserved as T
    }

    return content
  }

  private validateContentLimits<T>(content: T, contentType: ContentType): T {
    if (typeof content === 'string') {
      const { maxContentLength, minContentLength } = this.config.contentLimits

      if (content.length > maxContentLength) {
        console.warn(
          `Content length ${content.length} exceeds maximum ${maxContentLength}`
        )
        return content.substring(0, maxContentLength) as T
      }

      if (content.length < minContentLength) {
        console.warn(
          `Content length ${content.length} below minimum ${minContentLength}`
        )
      }
    }

    if (content && typeof content === 'object') {
      const obj = content as any

      // Validate chapter limits
      if (obj.chapters && Array.isArray(obj.chapters)) {
        const { maxChapters } = this.config.contentLimits
        if (obj.chapters.length > maxChapters) {
          console.warn(
            `Chapter count ${obj.chapters.length} exceeds maximum ${maxChapters}`
          )
          obj.chapters = obj.chapters.slice(0, maxChapters)
        }
      }

      // Validate character limits
      if (obj.characters && Array.isArray(obj.characters)) {
        const { maxCharacters } = this.config.contentLimits
        if (obj.characters.length > maxCharacters) {
          console.warn(
            `Character count ${obj.characters.length} exceeds maximum ${maxCharacters}`
          )
          obj.characters = obj.characters.slice(0, maxCharacters)
        }
      }
    }

    return content
  }
}

// Main response parsing service
export class ResponseParsingService extends EventEmitter {
  private formatDetectionService: FormatDetectionService
  private contentExtractionService: ContentExtractionService
  private qualityScoringService: QualityScoringService
  private normalizationService: ResponseNormalizationService
  private config: ResponseParsingConfig

  constructor(config: Partial<ResponseParsingConfig> = {}) {
    super()

    this.config = {
      enableStrictValidation: true,
      enableQualityScoring: true,
      enableContentNormalization: true,
      enableFallbackParsing: true,
      maxProcessingTimeMs: 10000,
      qualityThresholds: {
        minimum: 30,
        good: 70,
        excellent: 90,
      },
      contentLimits: {
        maxContentLength: 50000,
        minContentLength: 10,
        maxChapters: 20,
        maxCharacters: 50,
      },
      parsingOptions: {
        preserveFormatting: true,
        extractMetadata: true,
        validateStructure: true,
        normalizeWhitespace: true,
      },
      ...config,
    }

    this.formatDetectionService = new FormatDetectionService()
    this.contentExtractionService = new ContentExtractionService()
    this.qualityScoringService = new QualityScoringService(this.config)
    this.normalizationService = new ResponseNormalizationService(this.config)
  }

  async parseResponse<T = any>(
    rawContent: string,
    contentType: ContentType,
    schema?: z.ZodSchema<T>
  ): Promise<ParsedResponse<T>> {
    const startTime = Date.now()
    const warnings: string[] = []
    const errors: string[] = []

    try {
      // Emit parsing start event
      this.emit('parsing:start', {
        contentType,
        contentLength: rawContent.length,
      })

      // Detect format
      const format = this.formatDetectionService.detectFormat(rawContent)
      this.emit('format:detected', { format })

      // Extract content based on format
      let extractedContent: any
      try {
        extractedContent = await this.extractContent(
          rawContent,
          format,
          contentType,
          schema
        )
      } catch (error) {
        if (this.config.enableFallbackParsing) {
          warnings.push(
            `Primary parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
          )
          extractedContent = await this.fallbackParsing(rawContent, contentType)
        } else {
          throw error
        }
      }

      // Normalize content
      const normalizedContent = this.normalizationService.normalizeResponse(
        extractedContent,
        format,
        contentType
      )

      // Validate with schema if provided
      if (schema && this.config.enableStrictValidation) {
        try {
          schema.parse(normalizedContent)
        } catch (error) {
          if (error instanceof z.ZodError) {
            const validationErrors = error.errors.map(
              e => `${e.path.join('.')}: ${e.message}`
            )
            errors.push(...validationErrors)

            if (!this.config.enableFallbackParsing) {
              throw new ValidationError(
                'Schema validation failed',
                error,
                format
              )
            }
          }
        }
      }

      // Calculate quality score
      const quality = this.config.enableQualityScoring
        ? this.qualityScoringService.scoreResponse(
            normalizedContent,
            format,
            contentType
          )
        : {
            overall: 100,
            structure: 100,
            completeness: 100,
            coherence: 100,
            formatting: 100,
          }

      // Check quality threshold
      if (quality.overall < this.config.qualityThresholds.minimum) {
        warnings.push(
          `Quality score ${quality.overall} below minimum threshold ${this.config.qualityThresholds.minimum}`
        )
      }

      // Create metadata
      const processingTimeMs = Date.now() - startTime
      const metadata: ResponseMetadata = {
        originalFormat: format,
        parsedAt: new Date(),
        processingTimeMs,
        contentLength: rawContent.length,
        structureScore: quality.structure,
        completenessScore: quality.completeness,
        validationPassed: errors.length === 0,
        extractedFields: this.getExtractedFields(normalizedContent),
        missingFields: this.getMissingFields(normalizedContent, contentType),
      }

      const result: ParsedResponse<T> = {
        content: normalizedContent,
        format,
        quality,
        metadata,
        warnings,
        errors,
      }

      // Emit completion event
      this.emit('parsing:complete', {
        contentType,
        format,
        quality: quality.overall,
        processingTimeMs,
        warnings: warnings.length,
        errors: errors.length,
      })

      return result
    } catch (error) {
      const processingTimeMs = Date.now() - startTime

      // Emit error event
      this.emit('parsing:error', {
        contentType,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTimeMs,
      })

      throw error
    }
  }

  private async extractContent(
    rawContent: string,
    format: ResponseFormat,
    contentType: ContentType,
    schema?: z.ZodSchema<any>
  ): Promise<any> {
    switch (format) {
      case 'json':
        if (schema) {
          return this.contentExtractionService.extractFromJson(
            rawContent,
            schema
          )
        }
        return JSON.parse(rawContent)

      case 'markdown':
        return this.contentExtractionService.extractFromMarkdown(
          rawContent,
          contentType
        )

      case 'structured_text':
        return this.contentExtractionService.extractFromStructuredText(
          rawContent,
          contentType
        )

      case 'plain_text':
        return this.contentExtractionService.extractFromPlainText(
          rawContent,
          contentType
        )

      case 'mixed':
        // Try JSON first, then markdown, then structured text
        try {
          return JSON.parse(rawContent)
        } catch {
          try {
            return this.contentExtractionService.extractFromMarkdown(
              rawContent,
              contentType
            )
          } catch {
            return this.contentExtractionService.extractFromStructuredText(
              rawContent,
              contentType
            )
          }
        }

      default:
        throw new FormatDetectionError(
          `Unsupported format: ${format}`,
          rawContent
        )
    }
  }

  private async fallbackParsing(
    rawContent: string,
    contentType: ContentType
  ): Promise<any> {
    // Try different parsing strategies as fallback
    const strategies = [
      () =>
        this.contentExtractionService.extractFromPlainText(
          rawContent,
          contentType
        ),
      () =>
        this.contentExtractionService.extractFromMarkdown(
          rawContent,
          contentType
        ),
      () =>
        this.contentExtractionService.extractFromStructuredText(
          rawContent,
          contentType
        ),
      () => ({ content: rawContent.trim() }), // Last resort
    ]

    for (const strategy of strategies) {
      try {
        return strategy()
      } catch {
        continue
      }
    }

    // If all strategies fail, return minimal structure
    return { content: rawContent.trim() }
  }

  private getExtractedFields(content: any): string[] {
    if (!content || typeof content !== 'object') {
      return []
    }

    return Object.keys(content).filter(key => {
      const value = content[key]
      return value !== null && value !== undefined && value !== ''
    })
  }

  private getMissingFields(content: any, contentType: ContentType): string[] {
    const requiredFields = this.getRequiredFields(contentType)
    const extractedFields = this.getExtractedFields(content)

    return requiredFields.filter(field => !extractedFields.includes(field))
  }

  private getRequiredFields(contentType: ContentType): string[] {
    switch (contentType) {
      case 'story_outline':
        return ['title', 'summary', 'characters', 'setting', 'chapters']
      case 'story':
        return ['title', 'content']
      case 'story_revision':
        return ['revisedContent', 'changes']
      default:
        return ['content']
    }
  }

  updateConfig(newConfig: Partial<ResponseParsingConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.qualityScoringService = new QualityScoringService(this.config)
    this.normalizationService = new ResponseNormalizationService(this.config)
  }

  getConfig(): ResponseParsingConfig {
    return { ...this.config }
  }

  getMetrics() {
    return {
      config: this.getConfig(),
      services: {
        formatDetection: 'FormatDetectionService',
        contentExtraction: 'ContentExtractionService',
        qualityScoring: 'QualityScoringService',
        normalization: 'ResponseNormalizationService',
      },
    }
  }
}

// Factory functions
export function createResponseParsingService(
  config: Partial<ResponseParsingConfig> = {}
): ResponseParsingService {
  return new ResponseParsingService(config)
}

export function createProductionResponseParsingService(): ResponseParsingService {
  return new ResponseParsingService({
    enableStrictValidation: true,
    enableQualityScoring: true,
    enableContentNormalization: true,
    enableFallbackParsing: true,
    qualityThresholds: {
      minimum: 50,
      good: 75,
      excellent: 90,
    },
    contentLimits: {
      maxContentLength: 100000,
      minContentLength: 20,
      maxChapters: 50,
      maxCharacters: 100,
    },
  })
}

// Default configurations
export const DEFAULT_CONFIG: ResponseParsingConfig = {
  enableStrictValidation: false,
  enableQualityScoring: true,
  enableContentNormalization: true,
  enableFallbackParsing: true,
  maxProcessingTimeMs: 5000,
  qualityThresholds: {
    minimum: 30,
    good: 70,
    excellent: 90,
  },
  contentLimits: {
    maxContentLength: 50000,
    minContentLength: 10,
    maxChapters: 20,
    maxCharacters: 50,
  },
  parsingOptions: {
    preserveFormatting: true,
    extractMetadata: true,
    validateStructure: true,
    normalizeWhitespace: true,
  },
}

export const PRODUCTION_CONFIG: ResponseParsingConfig = {
  enableStrictValidation: true,
  enableQualityScoring: true,
  enableContentNormalization: true,
  enableFallbackParsing: true,
  maxProcessingTimeMs: 10000,
  qualityThresholds: {
    minimum: 50,
    good: 75,
    excellent: 90,
  },
  contentLimits: {
    maxContentLength: 100000,
    minContentLength: 20,
    maxChapters: 50,
    maxCharacters: 100,
  },
  parsingOptions: {
    preserveFormatting: true,
    extractMetadata: true,
    validateStructure: true,
    normalizeWhitespace: true,
  },
}
