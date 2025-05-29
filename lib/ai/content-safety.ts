/**
 * Comprehensive Content Safety and Moderation System
 *
 * This module provides multi-layer content safety filtering specifically designed
 * for children's content generation, including age-appropriate controls, custom
 * filtering rules, blocklist/allowlist management, and content scoring.
 */

import OpenAI from 'openai'
import { z } from 'zod'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type AgeGroup = 'toddler' | 'preschool' | 'elementary'
export type SafetyLevel = 'strict' | 'moderate' | 'relaxed'
export type ContentType = 'story' | 'outline' | 'revision' | 'prompt'

export interface SafetyConfig {
  ageGroup: AgeGroup
  safetyLevel: SafetyLevel
  enableOpenAIModerationAPI: boolean
  enableCustomFilters: boolean
  enableBlocklistFiltering: boolean
  enableContentScoring: boolean
  minimumSafetyScore: number
  minimumAgeAppropriatenessScore: number
  minimumEducationalScore: number
}

export interface ContentSafetyResult {
  passed: boolean
  safetyScore: number
  ageAppropriatenessScore: number
  educationalScore: number
  overallScore: number
  violations: SafetyViolation[]
  warnings: SafetyWarning[]
  metadata: {
    checkedAt: Date
    processingTimeMs: number
    filtersApplied: string[]
    contentType: ContentType
    ageGroup: AgeGroup
    safetyLevel: SafetyLevel
  }
}

export interface SafetyViolation {
  type:
    | 'openai_moderation'
    | 'custom_filter'
    | 'blocklist'
    | 'age_inappropriate'
    | 'educational_concern'
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: string
  description: string
  flaggedContent?: string
  suggestion?: string
}

export interface SafetyWarning {
  type: 'vocabulary' | 'theme' | 'complexity' | 'cultural' | 'educational'
  message: string
  suggestion?: string
}

export interface BlocklistEntry {
  term: string
  category: 'inappropriate' | 'scary' | 'violent' | 'adult' | 'negative'
  severity: 'low' | 'medium' | 'high'
  ageGroups: AgeGroup[]
  isRegex: boolean
}

export interface AllowlistEntry {
  term: string
  category: 'educational' | 'positive' | 'creative' | 'safe'
  ageGroups: AgeGroup[]
  boost: number // Score boost for containing this term
}

// ============================================================================
// Validation Schemas
// ============================================================================

const SafetyConfigSchema = z.object({
  ageGroup: z.enum(['toddler', 'preschool', 'elementary']),
  safetyLevel: z.enum(['strict', 'moderate', 'relaxed']),
  enableOpenAIModerationAPI: z.boolean(),
  enableCustomFilters: z.boolean(),
  enableBlocklistFiltering: z.boolean(),
  enableContentScoring: z.boolean(),
  minimumSafetyScore: z.number().min(0).max(100),
  minimumAgeAppropriatenessScore: z.number().min(0).max(100),
  minimumEducationalScore: z.number().min(0).max(100),
})

// ============================================================================
// Age-Specific Content Rules
// ============================================================================

const AGE_SPECIFIC_RULES = {
  toddler: {
    maxComplexityWords: ['big', 'small', 'happy', 'sad', 'good', 'bad'],
    forbiddenThemes: [
      'death',
      'violence',
      'scary',
      'monsters',
      'danger',
      'fear',
      'anger',
      'conflict',
    ],
    requiredThemes: [
      'love',
      'family',
      'friendship',
      'kindness',
      'sharing',
      'learning',
    ],
    maxSentenceLength: 8,
    maxStoryLength: 300,
    vocabularyLevel: 'basic',
  },
  preschool: {
    maxComplexityWords: [
      'adventure',
      'discover',
      'explore',
      'learn',
      'grow',
      'help',
    ],
    forbiddenThemes: [
      'death',
      'violence',
      'scary monsters',
      'real danger',
      'adult problems',
    ],
    allowedMildThemes: [
      'gentle challenges',
      'overcoming fears',
      'problem solving',
    ],
    requiredThemes: [
      'friendship',
      'learning',
      'creativity',
      'cooperation',
      'empathy',
    ],
    maxSentenceLength: 12,
    maxStoryLength: 600,
    vocabularyLevel: 'simple',
  },
  elementary: {
    maxComplexityWords: [
      'challenge',
      'responsibility',
      'consequence',
      'perseverance',
      'achievement',
    ],
    forbiddenThemes: [
      'graphic violence',
      'adult relationships',
      'substance abuse',
      'explicit content',
    ],
    allowedThemes: [
      'mild conflict resolution',
      'character growth',
      'moral lessons',
      'educational content',
    ],
    requiredThemes: [
      'personal growth',
      'learning',
      'positive values',
      'social skills',
    ],
    maxSentenceLength: 20,
    maxStoryLength: 1500,
    vocabularyLevel: 'intermediate',
  },
} as const

// ============================================================================
// Default Blocklist and Allowlist
// ============================================================================

const DEFAULT_BLOCKLIST: BlocklistEntry[] = [
  // Inappropriate content
  {
    term: 'violence',
    category: 'violent',
    severity: 'high',
    ageGroups: ['toddler', 'preschool'],
    isRegex: false,
  },
  {
    term: 'death',
    category: 'inappropriate',
    severity: 'high',
    ageGroups: ['toddler', 'preschool'],
    isRegex: false,
  },
  {
    term: 'kill',
    category: 'violent',
    severity: 'high',
    ageGroups: ['toddler', 'preschool'],
    isRegex: false,
  },
  {
    term: 'scary',
    category: 'scary',
    severity: 'medium',
    ageGroups: ['toddler'],
    isRegex: false,
  },
  {
    term: 'monster',
    category: 'scary',
    severity: 'medium',
    ageGroups: ['toddler'],
    isRegex: false,
  },
  {
    term: 'nightmare',
    category: 'scary',
    severity: 'medium',
    ageGroups: ['toddler', 'preschool'],
    isRegex: false,
  },

  // Adult themes
  {
    term: 'alcohol',
    category: 'adult',
    severity: 'high',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    isRegex: false,
  },
  {
    term: 'drugs',
    category: 'adult',
    severity: 'high',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    isRegex: false,
  },
  {
    term: 'smoking',
    category: 'adult',
    severity: 'medium',
    ageGroups: ['toddler', 'preschool'],
    isRegex: false,
  },

  // Negative emotions (age-dependent)
  {
    term: 'hate',
    category: 'negative',
    severity: 'medium',
    ageGroups: ['toddler'],
    isRegex: false,
  },
  {
    term: 'angry',
    category: 'negative',
    severity: 'low',
    ageGroups: ['toddler'],
    isRegex: false,
  },

  // Regex patterns for more complex filtering
  {
    term: '\\b(damn|hell|stupid|dumb)\\b',
    category: 'inappropriate',
    severity: 'medium',
    ageGroups: ['toddler', 'preschool'],
    isRegex: true,
  },
]

const DEFAULT_ALLOWLIST: AllowlistEntry[] = [
  // Educational terms
  {
    term: 'learn',
    category: 'educational',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    boost: 10,
  },
  {
    term: 'discover',
    category: 'educational',
    ageGroups: ['preschool', 'elementary'],
    boost: 8,
  },
  {
    term: 'explore',
    category: 'educational',
    ageGroups: ['preschool', 'elementary'],
    boost: 8,
  },
  {
    term: 'science',
    category: 'educational',
    ageGroups: ['elementary'],
    boost: 12,
  },
  {
    term: 'math',
    category: 'educational',
    ageGroups: ['elementary'],
    boost: 12,
  },

  // Positive values
  {
    term: 'kindness',
    category: 'positive',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    boost: 15,
  },
  {
    term: 'friendship',
    category: 'positive',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    boost: 12,
  },
  {
    term: 'sharing',
    category: 'positive',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    boost: 10,
  },
  {
    term: 'helping',
    category: 'positive',
    ageGroups: ['toddler', 'preschool', 'elementary'],
    boost: 10,
  },
  {
    term: 'cooperation',
    category: 'positive',
    ageGroups: ['preschool', 'elementary'],
    boost: 8,
  },

  // Creative terms
  {
    term: 'imagination',
    category: 'creative',
    ageGroups: ['preschool', 'elementary'],
    boost: 8,
  },
  {
    term: 'creative',
    category: 'creative',
    ageGroups: ['preschool', 'elementary'],
    boost: 6,
  },
  {
    term: 'artistic',
    category: 'creative',
    ageGroups: ['elementary'],
    boost: 6,
  },
]

// ============================================================================
// Content Safety Service
// ============================================================================

export class ContentSafetyService {
  private openaiClient?: OpenAI
  private config: SafetyConfig
  private blocklist: BlocklistEntry[]
  private allowlist: AllowlistEntry[]

  constructor(
    config: SafetyConfig,
    openaiApiKey?: string,
    customBlocklist?: BlocklistEntry[],
    customAllowlist?: AllowlistEntry[]
  ) {
    this.config = SafetyConfigSchema.parse(config)

    if (openaiApiKey && config.enableOpenAIModerationAPI) {
      this.openaiClient = new OpenAI({ apiKey: openaiApiKey })
    }

    this.blocklist = [...DEFAULT_BLOCKLIST, ...(customBlocklist || [])]
    this.allowlist = [...DEFAULT_ALLOWLIST, ...(customAllowlist || [])]
  }

  /**
   * Main content safety check method
   */
  async checkContentSafety(
    content: string,
    contentType: ContentType = 'story'
  ): Promise<ContentSafetyResult> {
    const startTime = Date.now()
    const violations: SafetyViolation[] = []
    const warnings: SafetyWarning[] = []
    const filtersApplied: string[] = []

    try {
      // 1. OpenAI Moderation API Check
      if (this.config.enableOpenAIModerationAPI && this.openaiClient) {
        const moderationResult = await this.checkOpenAIModeration(content)
        if (moderationResult.violations.length > 0) {
          violations.push(...moderationResult.violations)
        }
        filtersApplied.push('openai_moderation')
      }

      // 2. Custom Age-Appropriate Content Filters
      if (this.config.enableCustomFilters) {
        const customResult = this.checkCustomFilters(content, contentType)
        violations.push(...customResult.violations)
        warnings.push(...customResult.warnings)
        filtersApplied.push('custom_filters')
      }

      // 3. Blocklist/Allowlist Filtering
      if (this.config.enableBlocklistFiltering) {
        const blocklistResult = this.checkBlocklistFiltering(content)
        violations.push(...blocklistResult.violations)
        warnings.push(...blocklistResult.warnings)
        filtersApplied.push('blocklist_filtering')
      }

      // 4. Content Scoring
      let scores = { safety: 100, ageAppropriateness: 100, educational: 50 }
      if (this.config.enableContentScoring) {
        scores = this.calculateContentScores(content, violations, warnings)
        filtersApplied.push('content_scoring')
      }

      // 5. Determine overall pass/fail
      const passed = this.determineOverallResult(violations, scores)
      const overallScore =
        (scores.safety + scores.ageAppropriateness + scores.educational) / 3

      return {
        passed,
        safetyScore: scores.safety,
        ageAppropriatenessScore: scores.ageAppropriateness,
        educationalScore: scores.educational,
        overallScore,
        violations,
        warnings,
        metadata: {
          checkedAt: new Date(),
          processingTimeMs: Date.now() - startTime,
          filtersApplied,
          contentType,
          ageGroup: this.config.ageGroup,
          safetyLevel: this.config.safetyLevel,
        },
      }
    } catch (error) {
      // If safety check fails, err on the side of caution
      return {
        passed: false,
        safetyScore: 0,
        ageAppropriatenessScore: 0,
        educationalScore: 0,
        overallScore: 0,
        violations: [
          {
            type: 'custom_filter',
            severity: 'critical',
            category: 'system_error',
            description: `Content safety check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          },
        ],
        warnings: [],
        metadata: {
          checkedAt: new Date(),
          processingTimeMs: Date.now() - startTime,
          filtersApplied: ['error'],
          contentType,
          ageGroup: this.config.ageGroup,
          safetyLevel: this.config.safetyLevel,
        },
      }
    }
  }

  /**
   * OpenAI Moderation API check
   */
  private async checkOpenAIModeration(
    content: string
  ): Promise<{ violations: SafetyViolation[] }> {
    if (!this.openaiClient) {
      return { violations: [] }
    }

    try {
      const moderation = await this.openaiClient.moderations.create({
        input: content,
      })

      const result = moderation.results[0]
      const violations: SafetyViolation[] = []

      if (result.flagged) {
        const flaggedCategories = Object.entries(result.categories)
          .filter(([_, flagged]) => flagged)
          .map(([category]) => category)

        for (const category of flaggedCategories) {
          violations.push({
            type: 'openai_moderation',
            severity: this.mapOpenAISeverity(category),
            category,
            description: `Content flagged by OpenAI moderation for: ${category}`,
            flaggedContent:
              content.length > 100
                ? content.substring(0, 100) + '...'
                : content,
            suggestion:
              'Remove or rephrase the flagged content to make it more appropriate.',
          })
        }
      }

      return { violations }
    } catch (error) {
      console.warn('OpenAI moderation check failed:', error)
      return { violations: [] }
    }
  }

  /**
   * Custom content filters based on age group and safety level
   */
  private checkCustomFilters(
    content: string,
    contentType: ContentType
  ): { violations: SafetyViolation[]; warnings: SafetyWarning[] } {
    const violations: SafetyViolation[] = []
    const warnings: SafetyWarning[] = []
    const rules = AGE_SPECIFIC_RULES[this.config.ageGroup]

    // Check forbidden themes
    for (const theme of rules.forbiddenThemes) {
      if (content.toLowerCase().includes(theme.toLowerCase())) {
        violations.push({
          type: 'age_inappropriate',
          severity: 'high',
          category: 'forbidden_theme',
          description: `Content contains forbidden theme for ${this.config.ageGroup}: "${theme}"`,
          flaggedContent: theme,
          suggestion: `Replace with age-appropriate alternatives focusing on ${rules.requiredThemes.join(', ')}`,
        })
      }
    }

    // Check sentence length (for stories)
    if (contentType === 'story') {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
      const longSentences = sentences.filter(
        s => s.split(' ').length > rules.maxSentenceLength
      )

      if (longSentences.length > 0) {
        warnings.push({
          type: 'complexity',
          message: `${longSentences.length} sentences exceed recommended length for ${this.config.ageGroup} (max ${rules.maxSentenceLength} words)`,
          suggestion: 'Break long sentences into shorter, simpler ones.',
        })
      }
    }

    // Check story length
    if (
      contentType === 'story' &&
      content.split(' ').length > rules.maxStoryLength
    ) {
      warnings.push({
        type: 'complexity',
        message: `Story length (${content.split(' ').length} words) exceeds recommended maximum for ${this.config.ageGroup} (${rules.maxStoryLength} words)`,
        suggestion:
          'Consider shortening the story or breaking it into chapters.',
      })
    }

    // Check for required positive themes
    const hasRequiredTheme = rules.requiredThemes.some(theme =>
      content.toLowerCase().includes(theme.toLowerCase())
    )

    if (!hasRequiredTheme && contentType === 'story') {
      warnings.push({
        type: 'educational',
        message: `Story should include at least one positive theme: ${rules.requiredThemes.join(', ')}`,
        suggestion: 'Add elements that promote positive values and learning.',
      })
    }

    return { violations, warnings }
  }

  /**
   * Blocklist and allowlist filtering
   */
  private checkBlocklistFiltering(content: string): {
    violations: SafetyViolation[]
    warnings: SafetyWarning[]
  } {
    const violations: SafetyViolation[] = []
    const warnings: SafetyWarning[] = []

    // Check blocklist
    for (const entry of this.blocklist) {
      if (!entry.ageGroups.includes(this.config.ageGroup)) continue

      const found = entry.isRegex
        ? new RegExp(entry.term, 'gi').test(content)
        : content.toLowerCase().includes(entry.term.toLowerCase())

      if (found) {
        const violation: SafetyViolation = {
          type: 'blocklist',
          severity: entry.severity,
          category: entry.category,
          description: `Content contains blocked term: "${entry.term}"`,
          flaggedContent: entry.term,
          suggestion:
            'Remove or replace the flagged term with age-appropriate alternatives.',
        }

        if (entry.severity === 'high') {
          violations.push(violation)
        } else {
          warnings.push({
            type: 'vocabulary',
            message: violation.description,
            suggestion: violation.suggestion,
          })
        }
      }
    }

    return { violations, warnings }
  }

  /**
   * Calculate content scores
   */
  private calculateContentScores(
    content: string,
    violations: SafetyViolation[],
    warnings: SafetyWarning[]
  ): { safety: number; ageAppropriateness: number; educational: number } {
    let safetyScore = 100
    let ageAppropriatenessScore = 100
    let educationalScore = 50 // Base score

    // Deduct points for violations
    for (const violation of violations) {
      const deduction =
        violation.severity === 'critical'
          ? 50
          : violation.severity === 'high'
            ? 30
            : violation.severity === 'medium'
              ? 15
              : 5

      if (
        violation.type === 'openai_moderation' ||
        violation.type === 'blocklist'
      ) {
        safetyScore -= deduction
      } else if (violation.type === 'age_inappropriate') {
        ageAppropriatenessScore -= deduction
      } else if (violation.type === 'educational_concern') {
        educationalScore -= deduction
      }
    }

    // Deduct smaller amounts for warnings
    for (const warning of warnings) {
      const deduction = 5
      if (warning.type === 'vocabulary' || warning.type === 'theme') {
        ageAppropriatenessScore -= deduction
      } else if (warning.type === 'educational') {
        educationalScore -= deduction
      } else if (warning.type === 'complexity') {
        ageAppropriatenessScore -= deduction / 2
      }
    }

    // Add points for allowlist terms
    for (const entry of this.allowlist) {
      if (!entry.ageGroups.includes(this.config.ageGroup)) continue

      if (content.toLowerCase().includes(entry.term.toLowerCase())) {
        if (entry.category === 'educational') {
          educationalScore += entry.boost
        } else if (entry.category === 'positive') {
          ageAppropriatenessScore += entry.boost / 2
          safetyScore += entry.boost / 4
        }
      }
    }

    // Ensure scores stay within bounds
    return {
      safety: Math.max(0, Math.min(100, safetyScore)),
      ageAppropriateness: Math.max(0, Math.min(100, ageAppropriatenessScore)),
      educational: Math.max(0, Math.min(100, educationalScore)),
    }
  }

  /**
   * Determine overall pass/fail result
   */
  private determineOverallResult(
    violations: SafetyViolation[],
    scores: { safety: number; ageAppropriateness: number; educational: number }
  ): boolean {
    // Fail immediately for critical violations
    if (violations.some(v => v.severity === 'critical')) {
      return false
    }

    // Check minimum score requirements
    if (scores.safety < this.config.minimumSafetyScore) {
      return false
    }

    if (
      scores.ageAppropriateness < this.config.minimumAgeAppropriatenessScore
    ) {
      return false
    }

    if (scores.educational < this.config.minimumEducationalScore) {
      return false
    }

    // Additional safety level checks
    if (this.config.safetyLevel === 'strict') {
      // Strict mode: no high severity violations allowed
      if (violations.some(v => v.severity === 'high')) {
        return false
      }
    } else if (this.config.safetyLevel === 'moderate') {
      // Moderate mode: max 1 high severity violation
      if (violations.filter(v => v.severity === 'high').length > 1) {
        return false
      }
    }
    // Relaxed mode: allow multiple violations as long as scores meet minimums

    return true
  }

  /**
   * Map OpenAI moderation categories to severity levels
   */
  private mapOpenAISeverity(
    category: string
  ): 'low' | 'medium' | 'high' | 'critical' {
    const highSeverityCategories = ['sexual', 'violence', 'self-harm']
    const mediumSeverityCategories = ['hate', 'harassment']

    if (highSeverityCategories.includes(category)) {
      return 'critical'
    } else if (mediumSeverityCategories.includes(category)) {
      return 'high'
    } else {
      return 'medium'
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SafetyConfig>): void {
    this.config = SafetyConfigSchema.parse({ ...this.config, ...newConfig })
  }

  /**
   * Add custom blocklist entries
   */
  addBlocklistEntries(entries: BlocklistEntry[]): void {
    this.blocklist.push(...entries)
  }

  /**
   * Add custom allowlist entries
   */
  addAllowlistEntries(entries: AllowlistEntry[]): void {
    this.allowlist.push(...entries)
  }

  /**
   * Get current configuration
   */
  getConfig(): SafetyConfig {
    return { ...this.config }
  }

  /**
   * Get current blocklist
   */
  getBlocklist(): BlocklistEntry[] {
    return [...this.blocklist]
  }

  /**
   * Get current allowlist
   */
  getAllowlist(): AllowlistEntry[] {
    return [...this.allowlist]
  }
}

// ============================================================================
// Factory Functions and Utilities
// ============================================================================

/**
 * Create a content safety service with default configuration for age group
 */
export function createContentSafetyService(
  ageGroup: AgeGroup,
  safetyLevel: SafetyLevel = 'moderate',
  openaiApiKey?: string
): ContentSafetyService {
  const config: SafetyConfig = {
    ageGroup,
    safetyLevel,
    enableOpenAIModerationAPI: !!openaiApiKey,
    enableCustomFilters: true,
    enableBlocklistFiltering: true,
    enableContentScoring: true,
    minimumSafetyScore:
      safetyLevel === 'strict' ? 90 : safetyLevel === 'moderate' ? 75 : 60,
    minimumAgeAppropriatenessScore:
      safetyLevel === 'strict' ? 95 : safetyLevel === 'moderate' ? 80 : 65,
    minimumEducationalScore:
      safetyLevel === 'strict' ? 70 : safetyLevel === 'moderate' ? 50 : 30,
  }

  return new ContentSafetyService(config, openaiApiKey)
}

/**
 * Get default safety configuration for age group
 */
export function getDefaultSafetyConfig(
  ageGroup: AgeGroup,
  safetyLevel: SafetyLevel = 'moderate'
): SafetyConfig {
  return {
    ageGroup,
    safetyLevel,
    enableOpenAIModerationAPI: true,
    enableCustomFilters: true,
    enableBlocklistFiltering: true,
    enableContentScoring: true,
    minimumSafetyScore:
      safetyLevel === 'strict' ? 90 : safetyLevel === 'moderate' ? 75 : 60,
    minimumAgeAppropriatenessScore:
      safetyLevel === 'strict' ? 95 : safetyLevel === 'moderate' ? 80 : 65,
    minimumEducationalScore:
      safetyLevel === 'strict' ? 70 : safetyLevel === 'moderate' ? 50 : 30,
  }
}

/**
 * Enhanced Content Safety Error with detailed information
 */
export class EnhancedContentSafetyError extends Error {
  constructor(
    message: string,
    public result: ContentSafetyResult,
    public originalContent: string
  ) {
    super(message)
    this.name = 'EnhancedContentSafetyError'
  }

  /**
   * Get a user-friendly error message
   */
  getUserFriendlyMessage(): string {
    const criticalViolations = this.result.violations.filter(
      v => v.severity === 'critical'
    )
    const highViolations = this.result.violations.filter(
      v => v.severity === 'high'
    )

    if (criticalViolations.length > 0) {
      return `Content contains inappropriate material that cannot be used in children's stories. Please revise and try again.`
    } else if (highViolations.length > 0) {
      return `Content may not be suitable for the target age group. Please consider making it more age-appropriate.`
    } else {
      return `Content needs improvement to meet safety and educational standards for children.`
    }
  }

  /**
   * Get suggestions for improvement
   */
  getImprovementSuggestions(): string[] {
    return this.result.violations
      .filter(v => v.suggestion)
      .map(v => v.suggestion!)
      .concat(
        this.result.warnings.filter(w => w.suggestion).map(w => w.suggestion!)
      )
  }
}
