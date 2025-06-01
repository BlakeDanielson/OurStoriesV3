/**
 * AI Response Parsing Types and Schemas
 *
 * This module contains all type definitions, interfaces, and Zod schemas
 * used throughout the response parsing system.
 */

import { z } from 'zod'

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

// Type exports for convenience
export type StoryOutline = z.infer<typeof StoryOutlineSchema>
export type StoryContent = z.infer<typeof StoryContentSchema>
export type StoryRevision = z.infer<typeof StoryRevisionSchema>
