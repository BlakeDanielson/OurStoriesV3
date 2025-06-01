/**
 * AI Response Parsing Error Classes
 *
 * This module contains all error classes used throughout the response parsing system.
 */

import { z } from 'zod'
import type { ResponseFormat } from './response-parsing-types'

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
