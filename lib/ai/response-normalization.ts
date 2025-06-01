/**
 * AI Response Normalization Service
 *
 * This module provides content normalization capabilities for AI-generated responses,
 * handling whitespace, formatting, and content limits.
 */

import type {
  ResponseParsingConfig,
  ResponseFormat,
  ContentType,
} from './response-parsing-types'

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
