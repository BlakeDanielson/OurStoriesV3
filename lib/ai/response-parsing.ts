/**
 * AI Response Parsing Service (Refactored)
 *
 * This module provides the main response parsing service that orchestrates
 * all the parsing components. It has been refactored to use modular services.
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

// Import types and schemas
export * from './response-parsing-types'

// Import error classes
export * from './response-parsing-errors'

// Import services
import { FormatDetectionService } from './format-detection'
import { ContentExtractionService } from './content-extraction'
import { QualityScoringService } from './quality-scoring'
import { ResponseNormalizationService } from './response-normalization'

// Import specific types for this file
import type {
  ResponseParsingConfig,
  ParsedResponse,
  ResponseMetadata,
  ResponseFormat,
  ContentType,
  QualityScore,
} from './response-parsing-types'
import {
  FormatDetectionError,
  ValidationError,
} from './response-parsing-errors'

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
