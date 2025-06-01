/**
 * AI Response Content Extraction Service
 *
 * This module provides content extraction capabilities for AI-generated responses,
 * handling various formats and content types.
 */

import { z } from 'zod'
import type { ContentType } from './response-parsing-types'
import {
  ValidationError,
  ResponseParsingError,
} from './response-parsing-errors'

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
