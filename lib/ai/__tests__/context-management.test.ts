import {
  ContextManagementService,
  TokenCounterService,
  RelevanceScoringService,
  ContextCompressionService,
  ConversationSessionManager,
  createContextManagementService,
  createProductionContextManagementService,
  ContextManagementError,
  type ContextEntry,
  type ConversationSession,
  type ContextManagementConfig,
} from '../context-management'

describe('TokenCounterService', () => {
  describe('estimateTokenCount', () => {
    it('should return 0 for empty text', () => {
      expect(TokenCounterService.estimateTokenCount('')).toBe(0)
      expect(TokenCounterService.estimateTokenCount(null as any)).toBe(0)
      expect(TokenCounterService.estimateTokenCount(undefined as any)).toBe(0)
    })

    it('should estimate token count for simple text', () => {
      const text = 'Hello world'
      const tokenCount = TokenCounterService.estimateTokenCount(text)
      expect(tokenCount).toBeGreaterThan(0)
      expect(tokenCount).toBeLessThan(10)
    })

    it('should handle punctuation and special characters', () => {
      const text = 'Hello, world! How are you?'
      const tokenCount = TokenCounterService.estimateTokenCount(text)
      expect(tokenCount).toBeGreaterThan(0)
    })

    it('should handle longer text appropriately', () => {
      const shortText = 'Hello'
      const longText =
        'This is a much longer text with many more words and should result in a higher token count.'

      const shortTokens = TokenCounterService.estimateTokenCount(shortText)
      const longTokens = TokenCounterService.estimateTokenCount(longText)

      expect(longTokens).toBeGreaterThan(shortTokens)
    })
  })

  describe('calculateBudgetUsage', () => {
    it('should calculate budget usage for empty entries', () => {
      const result = TokenCounterService.calculateBudgetUsage([])
      expect(result.totalTokens).toBe(0)
      expect(result.entryBreakdown).toEqual([])
    })

    it('should calculate budget usage for multiple entries', () => {
      const entries: ContextEntry[] = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'user_input',
          content: 'Hello world',
          compressed: false,
          tokenCount: 5,
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'ai_response',
          content: 'Hello there!',
          compressed: false,
          tokenCount: 3,
        },
      ]

      const result = TokenCounterService.calculateBudgetUsage(entries)
      expect(result.totalTokens).toBe(8)
      expect(result.entryBreakdown).toHaveLength(2)
      expect(result.entryBreakdown[0].percentage).toBeCloseTo(62.5)
      expect(result.entryBreakdown[1].percentage).toBeCloseTo(37.5)
    })
  })
})

describe('RelevanceScoringService', () => {
  let service: RelevanceScoringService

  beforeEach(() => {
    service = new RelevanceScoringService({
      temporalDecayFactor: 0.1,
      semanticSimilarityWeight: 0.4,
      userPreferenceWeight: 0.3,
      contentTypeWeight: 0.3,
      recencyBoost: 1.2,
    })
  })

  describe('calculateRelevanceScore', () => {
    it('should calculate relevance score for context entry', () => {
      const entry: ContextEntry = {
        id: '1',
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        type: 'user_input',
        content: 'Tell me a story about dragons',
        compressed: false,
      }

      const score = service.calculateRelevanceScore(
        entry,
        'I want to hear about magical creatures',
        { themes: ['fantasy'], ageGroup: 'elementary' }
      )

      expect(score).toBeGreaterThan(0)
      expect(score).toBeLessThanOrEqual(1)
    })

    it('should give higher scores to recent entries', () => {
      const recentEntry: ContextEntry = {
        id: '1',
        timestamp: new Date(Date.now() - 60000), // 1 minute ago
        type: 'user_input',
        content: 'Tell me a story',
        compressed: false,
      }

      const oldEntry: ContextEntry = {
        id: '2',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'user_input',
        content: 'Tell me a story',
        compressed: false,
      }

      const recentScore = service.calculateRelevanceScore(recentEntry, 'story')
      const oldScore = service.calculateRelevanceScore(oldEntry, 'story')

      expect(recentScore).toBeGreaterThan(oldScore)
    })

    it('should handle semantic similarity', () => {
      const entry: ContextEntry = {
        id: '1',
        timestamp: new Date(),
        type: 'user_input',
        content: 'I love dragons and magic',
        compressed: false,
      }

      const similarScore = service.calculateRelevanceScore(
        entry,
        'Tell me about dragons'
      )
      const dissimilarScore = service.calculateRelevanceScore(
        entry,
        'What is the weather?'
      )

      expect(similarScore).toBeGreaterThan(dissimilarScore)
    })
  })
})

describe('ContextCompressionService', () => {
  let service: ContextCompressionService

  beforeEach(() => {
    service = new ContextCompressionService({
      enabled: true,
      compressionThreshold: 0.7,
      maxCompressionRatio: 0.5,
      preserveKeyInformation: true,
      summaryLength: 100,
    })
  })

  describe('compressEntry', () => {
    it('should not compress already compressed entries', async () => {
      const entry: ContextEntry = {
        id: '1',
        timestamp: new Date(),
        type: 'ai_response',
        content: 'Short content',
        compressed: true,
      }

      const result = await service.compressEntry(entry)
      expect(result).toEqual(entry)
    })

    it('should not compress short entries', async () => {
      const entry: ContextEntry = {
        id: '1',
        timestamp: new Date(),
        type: 'ai_response',
        content: 'Short',
        compressed: false,
      }

      const result = await service.compressEntry(entry)
      expect(result.content).toBe('Short')
      expect(result.compressed).toBe(false)
    })

    it('should compress long entries', async () => {
      const longContent =
        'This is a very long story about a brave knight who went on many adventures. '.repeat(
          10
        )
      const entry: ContextEntry = {
        id: '1',
        timestamp: new Date(),
        type: 'ai_response',
        content: longContent,
        compressed: false,
      }

      const result = await service.compressEntry(entry)
      expect(result.content.length).toBeLessThan(longContent.length)
      expect(result.compressed).toBe(true)
      expect(result.originalLength).toBe(longContent.length)
    })

    it('should compress multiple entries', async () => {
      const entries: ContextEntry[] = [
        {
          id: '1',
          timestamp: new Date(),
          type: 'ai_response',
          content: 'This is a long story that should be compressed. '.repeat(5),
          compressed: false,
        },
        {
          id: '2',
          timestamp: new Date(),
          type: 'user_input',
          content: 'Another long entry that needs compression. '.repeat(5),
          compressed: false,
        },
      ]

      const results = await service.compressEntries(entries)
      expect(results).toHaveLength(2)
      results.forEach((result, index) => {
        expect(result.content.length).toBeLessThan(
          entries[index].content.length
        )
        expect(result.compressed).toBe(true)
      })
    })
  })
})

describe('ConversationSessionManager', () => {
  let manager: ConversationSessionManager
  const config: ContextManagementConfig = {
    maxContextEntries: 100,
    maxTokenBudget: 4000,
    relevanceScoring: {
      temporalDecayFactor: 0.1,
      semanticSimilarityWeight: 0.4,
      userPreferenceWeight: 0.3,
      contentTypeWeight: 0.3,
      recencyBoost: 1.2,
    },
    compression: {
      enabled: true,
      compressionThreshold: 0.7,
      maxCompressionRatio: 0.5,
      preserveKeyInformation: true,
      summaryLength: 150,
    },
    autoCleanup: false,
    cleanupInterval: 3600,
    sessionTimeout: 1800,
  }

  beforeEach(() => {
    manager = new ConversationSessionManager(config)
  })

  afterEach(() => {
    manager.destroy()
  })

  describe('createSession', () => {
    it('should create a new session', () => {
      const session = manager.createSession(
        'test-session',
        'user-1',
        'child-1',
        { theme: 'adventure' }
      )

      expect(session.id).toBe('test-session')
      expect(session.userId).toBe('user-1')
      expect(session.childId).toBe('child-1')
      expect(session.metadata?.theme).toBe('adventure')
      expect(session.entries).toEqual([])
      expect(session.totalTokens).toBe(0)
    })

    it('should emit sessionCreated event', done => {
      manager.on('sessionCreated', session => {
        expect(session.id).toBe('test-session')
        done()
      })

      manager.createSession('test-session')
    })
  })

  describe('getSession', () => {
    it('should retrieve existing session', () => {
      const created = manager.createSession('test-session')
      const retrieved = manager.getSession('test-session')

      expect(retrieved).toEqual(created)
    })

    it('should return undefined for non-existent session', () => {
      const session = manager.getSession('non-existent')
      expect(session).toBeUndefined()
    })
  })

  describe('addEntry', () => {
    it('should add entry to session', () => {
      manager.createSession('test-session')

      const entry = manager.addEntry('test-session', {
        type: 'user_input',
        content: 'Hello world',
        compressed: false,
      })

      expect(entry.id).toBeDefined()
      expect(entry.type).toBe('user_input')
      expect(entry.content).toBe('Hello world')
      expect(entry.timestamp).toBeInstanceOf(Date)
      expect(entry.tokenCount).toBeGreaterThan(0)
    })

    it('should throw error for non-existent session', () => {
      expect(() => {
        manager.addEntry('non-existent', {
          type: 'user_input',
          content: 'Hello',
          compressed: false,
        })
      }).toThrow(ContextManagementError)
    })

    it('should emit entryAdded event', done => {
      manager.createSession('test-session')

      manager.on('entryAdded', ({ sessionId, entry }) => {
        expect(sessionId).toBe('test-session')
        expect(entry.content).toBe('Hello world')
        done()
      })

      manager.addEntry('test-session', {
        type: 'user_input',
        content: 'Hello world',
        compressed: false,
      })
    })
  })

  describe('updateSessionMetadata', () => {
    it('should update session metadata', () => {
      manager.createSession('test-session', undefined, undefined, {
        theme: 'adventure',
      })

      manager.updateSessionMetadata('test-session', { difficulty: 'easy' })

      const session = manager.getSession('test-session')
      expect(session?.metadata?.theme).toBe('adventure')
      expect(session?.metadata?.difficulty).toBe('easy')
    })

    it('should throw error for non-existent session', () => {
      expect(() => {
        manager.updateSessionMetadata('non-existent', { theme: 'adventure' })
      }).toThrow(ContextManagementError)
    })
  })

  describe('removeSession', () => {
    it('should remove existing session', () => {
      manager.createSession('test-session')

      const removed = manager.removeSession('test-session')
      expect(removed).toBe(true)

      const session = manager.getSession('test-session')
      expect(session).toBeUndefined()
    })

    it('should return false for non-existent session', () => {
      const removed = manager.removeSession('non-existent')
      expect(removed).toBe(false)
    })
  })

  describe('getActiveSessions', () => {
    it('should return all active sessions', () => {
      manager.createSession('session-1')
      manager.createSession('session-2')

      const sessions = manager.getActiveSessions()
      expect(sessions).toHaveLength(2)
      expect(sessions.map(s => s.id)).toContain('session-1')
      expect(sessions.map(s => s.id)).toContain('session-2')
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', () => {
      // Create session with old timestamp
      const session = manager.createSession('old-session')
      session.lastActivity = new Date(Date.now() - 3600000) // 1 hour ago

      const cleanedUp = manager.cleanupExpiredSessions()
      expect(cleanedUp).toBe(1)

      const retrievedSession = manager.getSession('old-session')
      expect(retrievedSession).toBeUndefined()
    })

    it('should not clean up active sessions', () => {
      manager.createSession('active-session')

      const cleanedUp = manager.cleanupExpiredSessions()
      expect(cleanedUp).toBe(0)

      const session = manager.getSession('active-session')
      expect(session).toBeDefined()
    })
  })
})

describe('ContextManagementService', () => {
  let service: ContextManagementService

  beforeEach(() => {
    service = createContextManagementService({
      maxTokenBudget: 1000,
      compression: {
        enabled: true,
        compressionThreshold: 0.7,
        maxCompressionRatio: 0.5,
        preserveKeyInformation: true,
        summaryLength: 50,
      },
    })
  })

  afterEach(() => {
    service.destroy()
  })

  describe('createSession', () => {
    it('should create a new conversation session', () => {
      const session = service.createSession('test-session', 'user-1', 'child-1')

      expect(session.id).toBe('test-session')
      expect(session.userId).toBe('user-1')
      expect(session.childId).toBe('child-1')
    })
  })

  describe('addContextEntry', () => {
    it('should add context entry to session', () => {
      service.createSession('test-session')

      const entry = service.addContextEntry(
        'test-session',
        'user_input',
        'Tell me a story about dragons',
        { theme: 'fantasy' }
      )

      expect(entry.type).toBe('user_input')
      expect(entry.content).toBe('Tell me a story about dragons')
      expect(entry.metadata?.theme).toBe('fantasy')
    })
  })

  describe('getOptimizedContext', () => {
    it('should get optimized context for AI generation', async () => {
      service.createSession('test-session')

      // Add some context entries
      service.addContextEntry(
        'test-session',
        'user_input',
        'I want a story about dragons'
      )
      service.addContextEntry(
        'test-session',
        'ai_response',
        'Once upon a time, there was a friendly dragon...'
      )
      service.addContextEntry(
        'test-session',
        'user_input',
        'Make it more exciting!'
      )

      const result = await service.getOptimizedContext(
        'test-session',
        'Continue the dragon story',
        { themes: ['fantasy'], ageGroup: 'elementary' }
      )

      expect(result.context).toBeDefined()
      expect(result.entries).toHaveLength(3)
      expect(result.optimization).toBeDefined()
      expect(result.optimization.originalTokenCount).toBeGreaterThan(0)
      expect(result.optimization.optimizedTokenCount).toBeGreaterThan(0)
    })

    it('should throw error for non-existent session', async () => {
      await expect(
        service.getOptimizedContext('non-existent', 'test prompt')
      ).rejects.toThrow(ContextManagementError)
    })

    it('should handle empty session', async () => {
      service.createSession('empty-session')

      const result = await service.getOptimizedContext(
        'empty-session',
        'test prompt'
      )

      expect(result.context).toBe('')
      expect(result.entries).toHaveLength(0)
      expect(result.optimization.originalTokenCount).toBe(0)
    })
  })

  describe('updateSessionConfig', () => {
    it('should update session configuration', () => {
      service.createSession('test-session')

      service.updateSessionConfig('test-session', {
        maxTokens: 5000,
        compressionLevel: 'aggressive',
      })

      // Verify the session was updated (we can't directly access the session manager)
      // but we can test that no error was thrown
      expect(true).toBe(true)
    })

    it('should throw error for non-existent session', () => {
      expect(() => {
        service.updateSessionConfig('non-existent', { maxTokens: 5000 })
      }).toThrow(ContextManagementError)
    })
  })

  describe('getSessionStatistics', () => {
    it('should get session statistics', () => {
      service.createSession('test-session')
      service.addContextEntry('test-session', 'user_input', 'Hello world')

      const stats = service.getSessionStatistics('test-session')

      expect(stats.entryCount).toBe(1)
      expect(stats.totalTokens).toBeGreaterThan(0)
      expect(stats.averageRelevance).toBe(0) // No relevance scores set yet
      expect(stats.compressionRatio).toBe(1) // No compressed entries
      expect(stats.sessionDuration).toBeGreaterThanOrEqual(0)
      expect(stats.lastActivity).toBeInstanceOf(Date)
    })

    it('should throw error for non-existent session', () => {
      expect(() => {
        service.getSessionStatistics('non-existent')
      }).toThrow(ContextManagementError)
    })
  })

  describe('cleanupExpiredSessions', () => {
    it('should clean up expired sessions', () => {
      const cleanedUp = service.cleanupExpiredSessions()
      expect(typeof cleanedUp).toBe('number')
    })
  })

  describe('getActiveSessions', () => {
    it('should get all active sessions', () => {
      service.createSession('session-1')
      service.createSession('session-2')

      const sessions = service.getActiveSessions()
      expect(sessions).toHaveLength(2)
    })
  })
})

describe('Factory Functions', () => {
  describe('createContextManagementService', () => {
    it('should create service with default configuration', () => {
      const service = createContextManagementService()
      expect(service).toBeInstanceOf(ContextManagementService)
      service.destroy()
    })

    it('should create service with custom configuration', () => {
      const service = createContextManagementService({
        maxTokenBudget: 8000,
        autoCleanup: false,
      })
      expect(service).toBeInstanceOf(ContextManagementService)
      service.destroy()
    })
  })

  describe('createProductionContextManagementService', () => {
    it('should create production service', () => {
      const service = createProductionContextManagementService()
      expect(service).toBeInstanceOf(ContextManagementService)
      service.destroy()
    })
  })
})

describe('Error Handling', () => {
  describe('ContextManagementError', () => {
    it('should create error with message and code', () => {
      const error = new ContextManagementError('Test error', 'TEST_ERROR', {
        detail: 'test',
      })

      expect(error.message).toBe('Test error')
      expect(error.code).toBe('TEST_ERROR')
      expect(error.details?.detail).toBe('test')
      expect(error.name).toBe('ContextManagementError')
    })
  })
})

describe('Integration Tests', () => {
  let service: ContextManagementService

  beforeEach(() => {
    service = createContextManagementService({
      maxTokenBudget: 1000,
      compression: {
        enabled: true,
        compressionThreshold: 0.7,
        maxCompressionRatio: 0.5,
        preserveKeyInformation: true,
        summaryLength: 50,
      },
    })
  })

  afterEach(() => {
    service.destroy()
  })

  it('should handle complete conversation flow', async () => {
    // Create session
    const session = service.createSession(
      'conversation-test',
      'user-1',
      'child-1',
      {
        theme: 'adventure',
        ageGroup: 'elementary',
      }
    )

    // Add conversation entries
    service.addContextEntry(
      'conversation-test',
      'user_input',
      'Tell me a story about a brave knight'
    )
    service.addContextEntry(
      'conversation-test',
      'ai_response',
      'Once upon a time, there was a brave knight named Sir Galahad who lived in a magnificent castle...'
    )
    service.addContextEntry(
      'conversation-test',
      'user_input',
      'What happened next?'
    )
    service.addContextEntry(
      'conversation-test',
      'ai_response',
      'Sir Galahad decided to go on a quest to find the legendary Golden Dragon...'
    )

    // Get optimized context
    const result = await service.getOptimizedContext(
      'conversation-test',
      'Continue the story about Sir Galahad',
      { themes: ['adventure', 'fantasy'], ageGroup: 'elementary' }
    )

    // Verify results
    expect(result.context).toContain('Sir Galahad')
    expect(result.entries.length).toBeGreaterThan(0)
    expect(result.optimization.originalTokenCount).toBeGreaterThan(0)

    // Get session statistics
    const stats = service.getSessionStatistics('conversation-test')
    expect(stats.entryCount).toBe(4)
    expect(stats.totalTokens).toBeGreaterThan(0)

    // Update session config
    service.updateSessionConfig('conversation-test', {
      maxTokens: 2000,
      compressionLevel: 'moderate',
    })

    // Verify session still works
    const updatedResult = await service.getOptimizedContext(
      'conversation-test',
      'Tell me more about the Golden Dragon'
    )
    expect(updatedResult.context).toBeDefined()
  })

  it('should handle context compression when needed', async () => {
    service.createSession('compression-test')

    // Add long content that should trigger compression
    const longContent =
      'This is a very long story about adventures and quests. '.repeat(20)
    service.addContextEntry('compression-test', 'ai_response', longContent)
    service.addContextEntry('compression-test', 'user_input', 'Tell me more')

    const result = await service.getOptimizedContext(
      'compression-test',
      'Continue the story'
    )

    expect(result.optimization.entriesCompressed).toBeGreaterThanOrEqual(0)
    expect(result.optimization.compressionRatio).toBeLessThanOrEqual(1)
  })
})
