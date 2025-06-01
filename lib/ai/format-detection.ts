/**
 * AI Response Format Detection Service
 *
 * This module provides format detection capabilities for AI-generated content,
 * identifying whether content is JSON, Markdown, structured text, or plain text.
 */

import type { ResponseFormat } from './response-parsing-types'

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
