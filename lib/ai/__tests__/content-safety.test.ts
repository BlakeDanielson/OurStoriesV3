/**
 * Content Safety System Tests
 *
 * Comprehensive tests for the content safety and moderation system,
 * including age-appropriate filtering, custom rules, and scoring.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import {
  ContentSafetyService,
  createContentSafetyService,
  getDefaultSafetyConfig,
  EnhancedContentSafetyError,
  type AgeGroup,
  type SafetyLevel,
  type ContentType,
  type SafetyConfig,
  type BlocklistEntry,
  type AllowlistEntry,
} from '../content-safety'

// Mock OpenAI for testing
jest.mock('openai', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      moderations: {
        create: jest.fn(),
      },
    })),
  }
})

describe('ContentSafetyService', () => {
  let service: ContentSafetyService
  let mockOpenAI: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Create a basic service for testing
    const config: SafetyConfig = {
      ageGroup: 'elementary',
      safetyLevel: 'moderate',
      enableOpenAIModerationAPI: true,
      enableCustomFilters: true,
      enableBlocklistFiltering: true,
      enableContentScoring: true,
      minimumSafetyScore: 75,
      minimumAgeAppropriatenessScore: 80,
      minimumEducationalScore: 50,
    }

    service = new ContentSafetyService(config, 'test-api-key')

    // Mock OpenAI moderation response
    const OpenAI = require('openai').default
    mockOpenAI = new OpenAI()
    mockOpenAI.moderations.create.mockResolvedValue({
      results: [
        {
          flagged: false,
          categories: {
            sexual: false,
            hate: false,
            harassment: false,
            'self-harm': false,
            'sexual/minors': false,
            'hate/threatening': false,
            'violence/graphic': false,
            'self-harm/intent': false,
            'self-harm/instructions': false,
            'harassment/threatening': false,
            violence: false,
          },
        },
      ],
    })
  })

  describe('Factory Functions', () => {
    it('should create content safety service with default config', () => {
      const service = createContentSafetyService('toddler', 'strict')
      expect(service).toBeInstanceOf(ContentSafetyService)

      const config = service.getConfig()
      expect(config.ageGroup).toBe('toddler')
      expect(config.safetyLevel).toBe('strict')
      expect(config.minimumSafetyScore).toBe(90) // Strict level
    })

    it('should get default safety config for age group', () => {
      const config = getDefaultSafetyConfig('preschool', 'moderate')
      expect(config.ageGroup).toBe('preschool')
      expect(config.safetyLevel).toBe('moderate')
      expect(config.minimumSafetyScore).toBe(75)
      expect(config.minimumAgeAppropriatenessScore).toBe(80)
    })
  })

  describe('Basic Content Safety Checks', () => {
    it('should pass safe content', async () => {
      const content =
        'Once upon a time, there was a kind little rabbit who loved to share carrots with friends.'

      const result = await service.checkContentSafety(content, 'story')

      expect(result.passed).toBe(true)
      expect(result.safetyScore).toBeGreaterThan(75)
      expect(result.violations).toHaveLength(0)
    })

    it('should detect inappropriate content for toddlers', async () => {
      const toddlerService = createContentSafetyService('toddler', 'strict')
      const content =
        'The scary monster chased the child through the dark forest.'

      const result = await toddlerService.checkContentSafety(content, 'story')

      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(0)
      expect(
        result.violations.some(v => v.category === 'forbidden_theme')
      ).toBe(true)
    })

    it('should handle different content types', async () => {
      const outlineContent = 'Story outline: A child learns about friendship'
      const storyContent = 'Once upon a time, a child made a new friend.'

      const outlineResult = await service.checkContentSafety(
        outlineContent,
        'outline'
      )
      const storyResult = await service.checkContentSafety(
        storyContent,
        'story'
      )

      expect(outlineResult.passed).toBe(true)
      expect(storyResult.passed).toBe(true)
      expect(outlineResult.metadata.contentType).toBe('outline')
      expect(storyResult.metadata.contentType).toBe('story')
    })
  })

  describe('Age-Specific Rules', () => {
    it('should apply toddler-specific rules', async () => {
      const toddlerService = createContentSafetyService('toddler', 'strict')

      // Test forbidden themes for toddlers
      const scaryContent = 'The monster was very scary and frightening.'
      const result = await toddlerService.checkContentSafety(
        scaryContent,
        'story'
      )

      expect(result.passed).toBe(false)
      expect(
        result.violations.some(
          v => v.flaggedContent === 'scary' || v.flaggedContent === 'monster'
        )
      ).toBe(true)
    })

    it('should apply preschool-specific rules', async () => {
      const preschoolService = createContentSafetyService(
        'preschool',
        'moderate'
      )

      // Content that's okay for preschool but not toddler
      const content = 'The child had to overcome their fear of the dark.'
      const result = await preschoolService.checkContentSafety(content, 'story')

      expect(result.passed).toBe(true) // Should pass for preschool
    })

    it('should apply elementary-specific rules', async () => {
      const elementaryService = createContentSafetyService(
        'elementary',
        'moderate'
      )

      // More complex content appropriate for elementary
      const content =
        'The student learned about responsibility and the consequences of their actions.'
      const result = await elementaryService.checkContentSafety(
        content,
        'story'
      )

      expect(result.passed).toBe(true)
      expect(result.educationalScore).toBeGreaterThan(50) // Should boost educational score
    })
  })

  describe('Blocklist and Allowlist Filtering', () => {
    it('should detect blocklisted terms', async () => {
      const content = 'The character said damn, that was stupid.'

      const result = await service.checkContentSafety(content, 'story')

      // Should detect inappropriate language
      expect(result.violations.length).toBeGreaterThan(0)
      expect(result.violations.some(v => v.type === 'blocklist')).toBe(true)
    })

    it('should boost scores for allowlisted terms', async () => {
      const educationalContent =
        'The child learned about science and math while showing kindness to friends.'
      const basicContent = 'The child walked to the store.'

      const educationalResult = await service.checkContentSafety(
        educationalContent,
        'story'
      )
      const basicResult = await service.checkContentSafety(
        basicContent,
        'story'
      )

      expect(educationalResult.educationalScore).toBeGreaterThan(
        basicResult.educationalScore
      )
      expect(educationalResult.ageAppropriatenessScore).toBeGreaterThan(
        basicResult.ageAppropriatenessScore
      )
    })

    it('should handle custom blocklist entries', () => {
      const customBlocklist: BlocklistEntry[] = [
        {
          term: 'custom-bad-word',
          category: 'inappropriate',
          severity: 'high',
          ageGroups: ['elementary'],
          isRegex: false,
        },
      ]

      service.addBlocklistEntries(customBlocklist)
      const blocklist = service.getBlocklist()

      expect(blocklist.some(entry => entry.term === 'custom-bad-word')).toBe(
        true
      )
    })

    it('should handle custom allowlist entries', () => {
      const customAllowlist: AllowlistEntry[] = [
        {
          term: 'custom-good-word',
          category: 'educational',
          ageGroups: ['elementary'],
          boost: 15,
        },
      ]

      service.addAllowlistEntries(customAllowlist)
      const allowlist = service.getAllowlist()

      expect(allowlist.some(entry => entry.term === 'custom-good-word')).toBe(
        true
      )
    })
  })

  describe('Content Scoring', () => {
    it('should calculate appropriate scores', async () => {
      const content = 'A story about friendship, learning, and kindness.'

      const result = await service.checkContentSafety(content, 'story')

      expect(result.safetyScore).toBeGreaterThanOrEqual(0)
      expect(result.safetyScore).toBeLessThanOrEqual(100)
      expect(result.ageAppropriatenessScore).toBeGreaterThanOrEqual(0)
      expect(result.ageAppropriatenessScore).toBeLessThanOrEqual(100)
      expect(result.educationalScore).toBeGreaterThanOrEqual(0)
      expect(result.educationalScore).toBeLessThanOrEqual(100)
      expect(result.overallScore).toBeGreaterThanOrEqual(0)
      expect(result.overallScore).toBeLessThanOrEqual(100)
    })

    it('should penalize content with violations', async () => {
      const safeContent = 'A happy story about friendship.'
      const unsafeContent = 'A story with violence and scary monsters.'

      const safeResult = await service.checkContentSafety(safeContent, 'story')
      const unsafeResult = await service.checkContentSafety(
        unsafeContent,
        'story'
      )

      expect(safeResult.safetyScore).toBeGreaterThan(unsafeResult.safetyScore)
      expect(safeResult.ageAppropriatenessScore).toBeGreaterThan(
        unsafeResult.ageAppropriatenessScore
      )
    })
  })

  describe('Safety Level Configuration', () => {
    it('should apply strict safety level rules', async () => {
      const strictService = createContentSafetyService('elementary', 'strict')
      const content = 'The child felt angry about the situation.'

      const result = await strictService.checkContentSafety(content, 'story')

      // Strict mode should have higher standards
      const config = strictService.getConfig()
      expect(config.minimumSafetyScore).toBe(90)
      expect(config.minimumAgeAppropriatenessScore).toBe(95)
    })

    it('should apply relaxed safety level rules', async () => {
      const relaxedService = createContentSafetyService('elementary', 'relaxed')

      const config = relaxedService.getConfig()
      expect(config.minimumSafetyScore).toBe(60)
      expect(config.minimumAgeAppropriatenessScore).toBe(65)
    })

    it('should update configuration dynamically', () => {
      const originalConfig = service.getConfig()
      expect(originalConfig.safetyLevel).toBe('moderate')

      service.updateConfig({ safetyLevel: 'strict' })

      const updatedConfig = service.getConfig()
      expect(updatedConfig.safetyLevel).toBe('strict')
    })
  })

  describe('OpenAI Moderation Integration', () => {
    it('should handle OpenAI moderation flagged content', async () => {
      // Mock flagged content response
      mockOpenAI.moderations.create.mockResolvedValueOnce({
        results: [
          {
            flagged: true,
            categories: {
              sexual: true,
              hate: false,
              harassment: false,
              'self-harm': false,
              'sexual/minors': false,
              'hate/threatening': false,
              'violence/graphic': false,
              'self-harm/intent': false,
              'self-harm/instructions': false,
              'harassment/threatening': false,
              violence: false,
            },
          },
        ],
      })

      const content = 'Inappropriate content that would be flagged.'
      const result = await service.checkContentSafety(content, 'story')

      expect(result.passed).toBe(false)
      expect(result.violations.some(v => v.type === 'openai_moderation')).toBe(
        true
      )
    })

    it('should handle OpenAI moderation API failures gracefully', async () => {
      // Mock API failure
      mockOpenAI.moderations.create.mockRejectedValueOnce(
        new Error('API Error')
      )

      const content = 'Some content to check.'
      const result = await service.checkContentSafety(content, 'story')

      // Should not fail the entire check due to API error
      expect(result).toBeDefined()
      expect(result.metadata.filtersApplied).toContain('openai_moderation')
    })
  })

  describe('Error Handling', () => {
    it('should create EnhancedContentSafetyError with detailed information', () => {
      const mockResult = {
        passed: false,
        safetyScore: 30,
        ageAppropriatenessScore: 40,
        educationalScore: 20,
        overallScore: 30,
        violations: [
          {
            type: 'age_inappropriate' as const,
            severity: 'high' as const,
            category: 'forbidden_theme',
            description: 'Content contains forbidden theme',
            suggestion: 'Remove inappropriate content',
          },
        ],
        warnings: [],
        metadata: {
          checkedAt: new Date(),
          processingTimeMs: 100,
          filtersApplied: ['custom_filters'],
          contentType: 'story' as ContentType,
          ageGroup: 'toddler' as AgeGroup,
          safetyLevel: 'strict' as SafetyLevel,
        },
      }

      const error = new EnhancedContentSafetyError(
        'Content failed safety checks',
        mockResult,
        'Original content'
      )

      expect(error.name).toBe('EnhancedContentSafetyError')
      expect(error.result).toBe(mockResult)
      expect(error.originalContent).toBe('Original content')
      expect(error.getUserFriendlyMessage()).toContain('not be suitable')
      expect(error.getImprovementSuggestions()).toContain(
        'Remove inappropriate content'
      )
    })

    it('should handle system errors gracefully', async () => {
      // Create a service that will fail
      const faultyService = new ContentSafetyService({
        ageGroup: 'elementary',
        safetyLevel: 'moderate',
        enableOpenAIModerationAPI: false,
        enableCustomFilters: true,
        enableBlocklistFiltering: true,
        enableContentScoring: true,
        minimumSafetyScore: 75,
        minimumAgeAppropriatenessScore: 80,
        minimumEducationalScore: 50,
      })

      // Force an error by passing invalid content
      const result = await faultyService.checkContentSafety('', 'story')

      // Should return a safe failure state
      expect(result).toBeDefined()
      expect(result.passed).toBeDefined()
    })
  })

  describe('Performance and Metadata', () => {
    it('should track processing time', async () => {
      const content = 'A simple story for testing.'

      const result = await service.checkContentSafety(content, 'story')

      expect(result.metadata.processingTimeMs).toBeGreaterThanOrEqual(0)
      expect(result.metadata.checkedAt).toBeInstanceOf(Date)
      expect(result.metadata.filtersApplied).toBeInstanceOf(Array)
      expect(result.metadata.filtersApplied.length).toBeGreaterThan(0)
    })

    it('should include appropriate metadata', async () => {
      const content = 'Test content.'

      const result = await service.checkContentSafety(content, 'outline')

      expect(result.metadata.contentType).toBe('outline')
      expect(result.metadata.ageGroup).toBe('elementary')
      expect(result.metadata.safetyLevel).toBe('moderate')
    })
  })

  describe('Complex Content Scenarios', () => {
    it('should handle mixed content appropriately', async () => {
      const mixedContent = `
        Once upon a time, there was a brave little scientist named Emma. 
        She loved to explore and learn about the world around her. 
        One day, she discovered that sharing her knowledge with friends 
        made learning even more fun and exciting.
      `

      const result = await service.checkContentSafety(mixedContent, 'story')

      expect(result.passed).toBe(true)
      expect(result.educationalScore).toBeGreaterThan(60) // Should boost for educational content
      expect(result.ageAppropriatenessScore).toBeGreaterThan(80) // Should boost for positive themes
    })

    it('should handle long content with complexity warnings', async () => {
      const longContent =
        'This is a very long sentence that goes on and on and contains many words that might be too complex for the target age group and could potentially cause comprehension issues for young readers.'

      const toddlerService = createContentSafetyService('toddler', 'moderate')
      const result = await toddlerService.checkContentSafety(
        longContent,
        'story'
      )

      expect(result.warnings.some(w => w.type === 'complexity')).toBe(true)
    })

    it('should handle content with multiple issues', async () => {
      const problematicContent =
        'The scary monster was very violent and used bad language like damn while drinking alcohol.'

      const result = await service.checkContentSafety(
        problematicContent,
        'story'
      )

      expect(result.passed).toBe(false)
      expect(result.violations.length).toBeGreaterThan(1) // Multiple violations
      expect(result.violations.some(v => v.type === 'age_inappropriate')).toBe(
        true
      )
      expect(result.violations.some(v => v.type === 'blocklist')).toBe(true)
    })
  })
})
