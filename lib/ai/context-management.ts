import { z } from 'zod'
import { EventEmitter } from 'events'

// ============================================================================
// TYPES AND SCHEMAS
// ============================================================================

/**
 * Context entry representing a single piece of conversation history
 */
export const ContextEntrySchema = z.object({
  id: z.string(),
  timestamp: z.date(),
  type: z.enum(['user_input', 'ai_response', 'system_message', 'metadata']),
  content: z.string(),
  metadata: z.record(z.any()).optional(),
  tokenCount: z.number().optional(),
  relevanceScore: z.number().min(0).max(1).optional(),
  compressed: z.boolean().default(false),
  originalLength: z.number().optional(),
})

export type ContextEntry = z.infer<typeof ContextEntrySchema>

/**
 * Conversation session containing multiple context entries
 */
export const ConversationSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  childId: z.string().optional(),
  startTime: z.date(),
  lastActivity: z.date(),
  entries: z.array(ContextEntrySchema),
  metadata: z.record(z.any()).optional(),
  totalTokens: z.number().default(0),
  maxTokens: z.number().default(4000),
  compressionLevel: z
    .enum(['none', 'light', 'moderate', 'aggressive'])
    .default('light'),
})

export type ConversationSession = z.infer<typeof ConversationSessionSchema>

/**
 * Context relevance scoring configuration
 */
export const RelevanceScoringConfigSchema = z.object({
  temporalDecayFactor: z.number().min(0).max(1).default(0.1),
  semanticSimilarityWeight: z.number().min(0).max(1).default(0.4),
  userPreferenceWeight: z.number().min(0).max(1).default(0.3),
  contentTypeWeight: z.number().min(0).max(1).default(0.3),
  recencyBoost: z.number().min(1).max(2).default(1.2),
})

export type RelevanceScoringConfig = z.infer<
  typeof RelevanceScoringConfigSchema
>

/**
 * Context compression configuration
 */
export const CompressionConfigSchema = z.object({
  enabled: z.boolean().default(true),
  compressionThreshold: z.number().min(0.1).max(1).default(0.7),
  maxCompressionRatio: z.number().min(0.1).max(0.9).default(0.5),
  preserveKeyInformation: z.boolean().default(true),
  summaryLength: z.number().min(50).max(500).default(150),
})

export type CompressionConfig = z.infer<typeof CompressionConfigSchema>

/**
 * Context management configuration
 */
export const ContextManagementConfigSchema = z.object({
  maxContextEntries: z.number().min(10).max(1000).default(100),
  maxTokenBudget: z.number().min(1000).max(100000).default(4000),
  relevanceScoring: RelevanceScoringConfigSchema.default({}),
  compression: CompressionConfigSchema.default({}),
  autoCleanup: z.boolean().default(true),
  cleanupInterval: z.number().min(60).max(86400).default(3600), // seconds
  sessionTimeout: z.number().min(300).max(86400).default(1800), // seconds
})

export type ContextManagementConfig = z.infer<
  typeof ContextManagementConfigSchema
>

/**
 * Context optimization result
 */
export const ContextOptimizationResultSchema = z.object({
  originalTokenCount: z.number(),
  optimizedTokenCount: z.number(),
  compressionRatio: z.number(),
  entriesRemoved: z.number(),
  entriesCompressed: z.number(),
  relevanceThreshold: z.number(),
  optimizationTime: z.number(),
})

export type ContextOptimizationResult = z.infer<
  typeof ContextOptimizationResultSchema
>

// ============================================================================
// ERRORS
// ============================================================================

export class ContextManagementError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Record<string, any>
  ) {
    super(message)
    this.name = 'ContextManagementError'
  }
}

// ============================================================================
// TOKEN COUNTER SERVICE
// ============================================================================

/**
 * Service for counting tokens in text content
 */
export class TokenCounterService {
  private static readonly AVERAGE_CHARS_PER_TOKEN = 4
  private static readonly PUNCTUATION_WEIGHT = 0.8
  private static readonly WHITESPACE_WEIGHT = 0.3

  /**
   * Estimate token count for text content
   */
  static estimateTokenCount(text: string): number {
    if (!text || text.length === 0) return 0

    // Basic estimation based on character count and content analysis
    const charCount = text.length
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const punctuationCount = (text.match(/[.,!?;:]/g) || []).length

    // Weighted calculation
    const baseTokens = charCount / this.AVERAGE_CHARS_PER_TOKEN
    const wordAdjustment = wordCount * 0.1
    const punctuationAdjustment = punctuationCount * this.PUNCTUATION_WEIGHT

    return Math.ceil(baseTokens + wordAdjustment + punctuationAdjustment)
  }

  /**
   * Calculate token budget usage
   */
  static calculateBudgetUsage(entries: ContextEntry[]): {
    totalTokens: number
    entryBreakdown: Array<{ id: string; tokens: number; percentage: number }>
  } {
    const totalTokens = entries.reduce((sum, entry) => {
      return sum + (entry.tokenCount || this.estimateTokenCount(entry.content))
    }, 0)

    const entryBreakdown = entries.map(entry => {
      const tokens = entry.tokenCount || this.estimateTokenCount(entry.content)
      return {
        id: entry.id,
        tokens,
        percentage: totalTokens > 0 ? (tokens / totalTokens) * 100 : 0,
      }
    })

    return { totalTokens, entryBreakdown }
  }
}

// ============================================================================
// RELEVANCE SCORING SERVICE
// ============================================================================

/**
 * Service for scoring context relevance
 */
export class RelevanceScoringService {
  constructor(private config: RelevanceScoringConfig) {}

  /**
   * Calculate relevance score for a context entry
   */
  calculateRelevanceScore(
    entry: ContextEntry,
    currentContext: string,
    userPreferences: Record<string, any> = {},
    referenceTime: Date = new Date()
  ): number {
    const temporalScore = this.calculateTemporalRelevance(
      entry.timestamp,
      referenceTime
    )
    const semanticScore = this.calculateSemanticSimilarity(
      entry.content,
      currentContext
    )
    const preferenceScore = this.calculateUserPreferenceAlignment(
      entry,
      userPreferences
    )
    const contentTypeScore = this.calculateContentTypeRelevance(entry)

    // Weighted combination
    const relevanceScore =
      (temporalScore * this.config.temporalDecayFactor +
        semanticScore * this.config.semanticSimilarityWeight +
        preferenceScore * this.config.userPreferenceWeight +
        contentTypeScore * this.config.contentTypeWeight) /
      (this.config.temporalDecayFactor +
        this.config.semanticSimilarityWeight +
        this.config.userPreferenceWeight +
        this.config.contentTypeWeight)

    // Apply recency boost for recent entries
    const timeDiff = referenceTime.getTime() - entry.timestamp.getTime()
    const isRecent = timeDiff < 300000 // 5 minutes

    return Math.min(
      1,
      isRecent ? relevanceScore * this.config.recencyBoost : relevanceScore
    )
  }

  /**
   * Calculate temporal relevance based on entry age
   */
  private calculateTemporalRelevance(
    entryTime: Date,
    referenceTime: Date
  ): number {
    const timeDiff = referenceTime.getTime() - entryTime.getTime()
    const hoursDiff = timeDiff / (1000 * 60 * 60)

    // Exponential decay over time
    return Math.exp(-hoursDiff * 0.1)
  }

  /**
   * Calculate semantic similarity between entry content and current context
   */
  private calculateSemanticSimilarity(
    entryContent: string,
    currentContext: string
  ): number {
    if (!currentContext || !entryContent) return 0

    // Simple keyword-based similarity (could be enhanced with embeddings)
    const entryWords = this.extractKeywords(entryContent.toLowerCase())
    const contextWords = this.extractKeywords(currentContext.toLowerCase())

    if (entryWords.length === 0 || contextWords.length === 0) return 0

    const intersection = entryWords.filter(word => contextWords.includes(word))
    const union = Array.from(new Set([...entryWords, ...contextWords]))

    return intersection.length / union.length
  }

  /**
   * Calculate user preference alignment
   */
  private calculateUserPreferenceAlignment(
    entry: ContextEntry,
    userPreferences: Record<string, any>
  ): number {
    if (!userPreferences || Object.keys(userPreferences).length === 0)
      return 0.5

    let alignmentScore = 0
    let totalWeight = 0

    // Check for theme preferences
    if (userPreferences.themes && entry.metadata?.theme) {
      const themeMatch = userPreferences.themes.includes(entry.metadata.theme)
      alignmentScore += themeMatch ? 1 : 0
      totalWeight += 1
    }

    // Check for content type preferences
    if (userPreferences.contentTypes && entry.type) {
      const typeMatch = userPreferences.contentTypes.includes(entry.type)
      alignmentScore += typeMatch ? 1 : 0
      totalWeight += 1
    }

    // Check for age appropriateness
    if (userPreferences.ageGroup && entry.metadata?.ageGroup) {
      const ageMatch = userPreferences.ageGroup === entry.metadata.ageGroup
      alignmentScore += ageMatch ? 1 : 0
      totalWeight += 1
    }

    return totalWeight > 0 ? alignmentScore / totalWeight : 0.5
  }

  /**
   * Calculate content type relevance
   */
  private calculateContentTypeRelevance(entry: ContextEntry): number {
    // Weight different content types by importance
    const typeWeights: Record<string, number> = {
      user_input: 0.9,
      ai_response: 0.8,
      system_message: 0.6,
      metadata: 0.4,
    }

    return typeWeights[entry.type] || 0.5
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const stopWords = [
      'the',
      'a',
      'an',
      'and',
      'or',
      'but',
      'in',
      'on',
      'at',
      'to',
      'for',
      'of',
      'with',
      'by',
      'is',
      'are',
      'was',
      'were',
      'be',
      'been',
      'being',
      'have',
      'has',
      'had',
      'do',
      'does',
      'did',
      'will',
      'would',
      'could',
      'should',
      'may',
      'might',
      'must',
      'can',
      'this',
      'that',
      'these',
      'those',
    ]

    return text
      .split(/\s+/)
      .map(word => word.replace(/[^\w]/g, ''))
      .filter(word => word.length > 2 && !stopWords.includes(word))
      .slice(0, 20) // Limit to top 20 keywords
  }
}

// ============================================================================
// CONTEXT COMPRESSION SERVICE
// ============================================================================

/**
 * Service for compressing context entries
 */
export class ContextCompressionService {
  constructor(private config: CompressionConfig) {}

  /**
   * Compress a context entry
   */
  async compressEntry(entry: ContextEntry): Promise<ContextEntry> {
    if (!this.config.enabled || entry.compressed) {
      return entry
    }

    const originalLength = entry.content.length
    const targetLength = Math.max(
      this.config.summaryLength,
      originalLength * this.config.maxCompressionRatio
    )

    if (originalLength <= targetLength) {
      return entry
    }

    const compressedContent = await this.summarizeContent(
      entry.content,
      targetLength
    )

    return {
      ...entry,
      content: compressedContent,
      compressed: true,
      originalLength,
      tokenCount: TokenCounterService.estimateTokenCount(compressedContent),
    }
  }

  /**
   * Compress multiple entries
   */
  async compressEntries(entries: ContextEntry[]): Promise<ContextEntry[]> {
    const compressionPromises = entries.map(entry => this.compressEntry(entry))
    return Promise.all(compressionPromises)
  }

  /**
   * Summarize content to target length
   */
  private async summarizeContent(
    content: string,
    targetLength: number
  ): Promise<string> {
    if (content.length <= targetLength) {
      return content
    }

    // Simple extractive summarization
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)

    if (sentences.length <= 1) {
      return content.substring(0, targetLength) + '...'
    }

    // Score sentences by importance
    const scoredSentences = sentences.map((sentence, index) => ({
      sentence: sentence.trim(),
      score: this.scoreSentenceImportance(sentence, index, sentences.length),
      index,
    }))

    // Sort by score and select top sentences
    scoredSentences.sort((a, b) => b.score - a.score)

    let summary = ''
    let currentLength = 0

    for (const { sentence } of scoredSentences) {
      const sentenceWithPunctuation = sentence + '.'
      if (currentLength + sentenceWithPunctuation.length <= targetLength) {
        summary += sentenceWithPunctuation + ' '
        currentLength += sentenceWithPunctuation.length + 1
      } else {
        break
      }
    }

    return summary.trim() || content.substring(0, targetLength) + '...'
  }

  /**
   * Score sentence importance for summarization
   */
  private scoreSentenceImportance(
    sentence: string,
    index: number,
    totalSentences: number
  ): number {
    let score = 0

    // Position scoring (first and last sentences are often important)
    if (index === 0 || index === totalSentences - 1) {
      score += 0.3
    }

    // Length scoring (moderate length sentences are often more informative)
    const wordCount = sentence.split(/\s+/).length
    if (wordCount >= 5 && wordCount <= 20) {
      score += 0.2
    }

    // Keyword scoring (sentences with important keywords)
    const importantKeywords = [
      'story',
      'character',
      'adventure',
      'learn',
      'discover',
      'magic',
      'friend',
      'family',
      'help',
      'solve',
      'create',
      'imagine',
    ]

    const lowerSentence = sentence.toLowerCase()
    const keywordMatches = importantKeywords.filter(keyword =>
      lowerSentence.includes(keyword)
    ).length

    score += keywordMatches * 0.1

    // Avoid very short or very long sentences
    if (wordCount < 3 || wordCount > 30) {
      score -= 0.2
    }

    return Math.max(0, score)
  }
}

// ============================================================================
// CONVERSATION SESSION MANAGER
// ============================================================================

/**
 * Manager for conversation sessions
 */
export class ConversationSessionManager extends EventEmitter {
  private sessions: Map<string, ConversationSession> = new Map()
  private cleanupInterval?: NodeJS.Timeout

  constructor(private config: ContextManagementConfig) {
    super()

    if (this.config.autoCleanup) {
      this.startCleanupInterval()
    }
  }

  /**
   * Create a new conversation session
   */
  createSession(
    sessionId: string,
    userId?: string,
    childId?: string,
    metadata?: Record<string, any>
  ): ConversationSession {
    const session: ConversationSession = {
      id: sessionId,
      userId,
      childId,
      startTime: new Date(),
      lastActivity: new Date(),
      entries: [],
      metadata,
      totalTokens: 0,
      maxTokens: this.config.maxTokenBudget,
      compressionLevel: 'light',
    }

    this.sessions.set(sessionId, session)
    this.emit('sessionCreated', session)

    return session
  }

  /**
   * Get a conversation session
   */
  getSession(sessionId: string): ConversationSession | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Add entry to conversation session
   */
  addEntry(
    sessionId: string,
    entry: Omit<ContextEntry, 'id' | 'timestamp' | 'tokenCount'>
  ): ContextEntry {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new ContextManagementError(
        `Session not found: ${sessionId}`,
        'SESSION_NOT_FOUND'
      )
    }

    const fullEntry: ContextEntry = {
      ...entry,
      id: `${sessionId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      tokenCount: TokenCounterService.estimateTokenCount(entry.content),
      compressed: entry.compressed || false,
    }

    session.entries.push(fullEntry)
    session.lastActivity = new Date()
    session.totalTokens += fullEntry.tokenCount || 0

    this.emit('entryAdded', { sessionId, entry: fullEntry })

    return fullEntry
  }

  /**
   * Update session metadata
   */
  updateSessionMetadata(
    sessionId: string,
    metadata: Record<string, any>
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new ContextManagementError(
        `Session not found: ${sessionId}`,
        'SESSION_NOT_FOUND'
      )
    }

    session.metadata = { ...session.metadata, ...metadata }
    session.lastActivity = new Date()

    this.emit('sessionUpdated', session)
  }

  /**
   * Remove a conversation session
   */
  removeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId)
    if (session) {
      this.sessions.delete(sessionId)
      this.emit('sessionRemoved', session)
      return true
    }
    return false
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ConversationSession[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    const now = new Date()
    const expiredSessions: string[] = []

    // Convert Map to array for iteration
    const sessionEntries = Array.from(this.sessions.entries())
    for (const [sessionId, session] of sessionEntries) {
      const timeSinceLastActivity =
        now.getTime() - session.lastActivity.getTime()
      if (timeSinceLastActivity > this.config.sessionTimeout * 1000) {
        expiredSessions.push(sessionId)
      }
    }

    expiredSessions.forEach(sessionId => {
      this.removeSession(sessionId)
    })

    if (expiredSessions.length > 0) {
      this.emit('sessionsCleanedUp', expiredSessions)
    }

    return expiredSessions.length
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, this.config.cleanupInterval * 1000)
  }

  /**
   * Stop automatic cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
  }

  /**
   * Destroy the session manager
   */
  destroy(): void {
    this.stopCleanupInterval()
    this.sessions.clear()
    this.removeAllListeners()
  }
}

// ============================================================================
// CONTEXT MANAGEMENT SERVICE
// ============================================================================

/**
 * Main context management service
 */
export class ContextManagementService extends EventEmitter {
  private sessionManager: ConversationSessionManager
  private relevanceScoring: RelevanceScoringService
  private compression: ContextCompressionService

  constructor(private config: ContextManagementConfig) {
    super()

    this.sessionManager = new ConversationSessionManager(config)
    this.relevanceScoring = new RelevanceScoringService(config.relevanceScoring)
    this.compression = new ContextCompressionService(config.compression)

    // Forward session manager events
    this.sessionManager.on('sessionCreated', session =>
      this.emit('sessionCreated', session)
    )
    this.sessionManager.on('entryAdded', data => this.emit('entryAdded', data))
    this.sessionManager.on('sessionUpdated', session =>
      this.emit('sessionUpdated', session)
    )
    this.sessionManager.on('sessionRemoved', session =>
      this.emit('sessionRemoved', session)
    )
    this.sessionManager.on('sessionsCleanedUp', sessionIds =>
      this.emit('sessionsCleanedUp', sessionIds)
    )
  }

  /**
   * Create a new conversation session
   */
  createSession(
    sessionId: string,
    userId?: string,
    childId?: string,
    metadata?: Record<string, any>
  ): ConversationSession {
    return this.sessionManager.createSession(
      sessionId,
      userId,
      childId,
      metadata
    )
  }

  /**
   * Add context entry to session
   */
  addContextEntry(
    sessionId: string,
    type: ContextEntry['type'],
    content: string,
    metadata?: Record<string, any>
  ): ContextEntry {
    return this.sessionManager.addEntry(sessionId, {
      type,
      content,
      metadata,
      compressed: false,
    })
  }

  /**
   * Get optimized context for AI generation
   */
  async getOptimizedContext(
    sessionId: string,
    currentPrompt: string,
    userPreferences: Record<string, any> = {}
  ): Promise<{
    context: string
    entries: ContextEntry[]
    optimization: ContextOptimizationResult
  }> {
    const startTime = Date.now()
    const session = this.sessionManager.getSession(sessionId)

    if (!session) {
      throw new ContextManagementError(
        `Session not found: ${sessionId}`,
        'SESSION_NOT_FOUND'
      )
    }

    const originalTokenCount = TokenCounterService.calculateBudgetUsage(
      session.entries
    ).totalTokens

    // Step 1: Score relevance for all entries
    const scoredEntries = session.entries.map(entry => ({
      ...entry,
      relevanceScore: this.relevanceScoring.calculateRelevanceScore(
        entry,
        currentPrompt,
        userPreferences
      ),
    }))

    // Step 2: Sort by relevance and apply token budget
    scoredEntries.sort(
      (a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)
    )

    const selectedEntries: ContextEntry[] = []
    let currentTokens = TokenCounterService.estimateTokenCount(currentPrompt)
    const maxTokens = session.maxTokens

    for (const entry of scoredEntries) {
      const entryTokens =
        entry.tokenCount ||
        TokenCounterService.estimateTokenCount(entry.content)
      if (currentTokens + entryTokens <= maxTokens) {
        selectedEntries.push(entry)
        currentTokens += entryTokens
      } else {
        break
      }
    }

    // Step 3: Compress entries if needed
    let finalEntries = selectedEntries
    let entriesCompressed = 0

    if (this.config.compression.enabled && currentTokens > maxTokens * 0.8) {
      const compressionCandidates = selectedEntries.filter(
        entry => !entry.compressed && entry.content.length > 200
      )

      if (compressionCandidates.length > 0) {
        const compressedCandidates = await this.compression.compressEntries(
          compressionCandidates
        )
        entriesCompressed = compressedCandidates.filter(
          entry => entry.compressed
        ).length

        // Replace original entries with compressed versions
        finalEntries = selectedEntries.map(entry => {
          const compressed = compressedCandidates.find(c => c.id === entry.id)
          return compressed || entry
        })
      }
    }

    // Step 4: Build context string
    const contextParts = finalEntries
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(entry => {
        const prefix =
          entry.type === 'user_input'
            ? 'User: '
            : entry.type === 'ai_response'
              ? 'Assistant: '
              : entry.type === 'system_message'
                ? 'System: '
                : ''
        return `${prefix}${entry.content}`
      })

    const context = contextParts.join('\n\n')
    const optimizedTokenCount = TokenCounterService.estimateTokenCount(context)

    const optimization: ContextOptimizationResult = {
      originalTokenCount,
      optimizedTokenCount,
      compressionRatio:
        originalTokenCount > 0
          ? Math.min(1, optimizedTokenCount / originalTokenCount)
          : 1,
      entriesRemoved: session.entries.length - finalEntries.length,
      entriesCompressed,
      relevanceThreshold:
        finalEntries.length > 0
          ? Math.min(...finalEntries.map(e => e.relevanceScore || 0))
          : 0,
      optimizationTime: Date.now() - startTime,
    }

    this.emit('contextOptimized', { sessionId, optimization })

    return {
      context,
      entries: finalEntries,
      optimization,
    }
  }

  /**
   * Update session configuration
   */
  updateSessionConfig(
    sessionId: string,
    updates: Partial<
      Pick<ConversationSession, 'maxTokens' | 'compressionLevel'>
    >
  ): void {
    const session = this.sessionManager.getSession(sessionId)
    if (!session) {
      throw new ContextManagementError(
        `Session not found: ${sessionId}`,
        'SESSION_NOT_FOUND'
      )
    }

    if (updates.maxTokens !== undefined) {
      session.maxTokens = updates.maxTokens
    }

    if (updates.compressionLevel !== undefined) {
      session.compressionLevel = updates.compressionLevel
    }

    session.lastActivity = new Date()
    this.emit('sessionUpdated', session)
  }

  /**
   * Get session statistics
   */
  getSessionStatistics(sessionId: string): {
    entryCount: number
    totalTokens: number
    averageRelevance: number
    compressionRatio: number
    sessionDuration: number
    lastActivity: Date
  } {
    const session = this.sessionManager.getSession(sessionId)
    if (!session) {
      throw new ContextManagementError(
        `Session not found: ${sessionId}`,
        'SESSION_NOT_FOUND'
      )
    }

    const entryCount = session.entries.length
    const totalTokens = session.totalTokens
    const averageRelevance =
      entryCount > 0
        ? session.entries.reduce(
            (sum, entry) => sum + (entry.relevanceScore || 0),
            0
          ) / entryCount
        : 0

    const compressedEntries = session.entries.filter(entry => entry.compressed)
    const compressionRatio =
      compressedEntries.length > 0
        ? compressedEntries.reduce((sum, entry) => {
            const original = entry.originalLength || entry.content.length
            return sum + entry.content.length / original
          }, 0) / compressedEntries.length
        : 1

    const sessionDuration =
      session.lastActivity.getTime() - session.startTime.getTime()

    return {
      entryCount,
      totalTokens,
      averageRelevance,
      compressionRatio,
      sessionDuration,
      lastActivity: session.lastActivity,
    }
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions(): number {
    return this.sessionManager.cleanupExpiredSessions()
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): ConversationSession[] {
    return this.sessionManager.getActiveSessions()
  }

  /**
   * Destroy the context management service
   */
  destroy(): void {
    this.sessionManager.destroy()
    this.removeAllListeners()
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create context management service with default configuration
 */
export function createContextManagementService(
  config: Partial<ContextManagementConfig> = {}
): ContextManagementService {
  const validatedConfig = ContextManagementConfigSchema.parse(config)
  return new ContextManagementService(validatedConfig)
}

/**
 * Create context management service with production settings
 */
export function createProductionContextManagementService(): ContextManagementService {
  return createContextManagementService({
    maxContextEntries: 200,
    maxTokenBudget: 8000,
    relevanceScoring: {
      temporalDecayFactor: 0.15,
      semanticSimilarityWeight: 0.5,
      userPreferenceWeight: 0.3,
      contentTypeWeight: 0.2,
      recencyBoost: 1.3,
    },
    compression: {
      enabled: true,
      compressionThreshold: 0.6,
      maxCompressionRatio: 0.4,
      preserveKeyInformation: true,
      summaryLength: 200,
    },
    autoCleanup: true,
    cleanupInterval: 1800, // 30 minutes
    sessionTimeout: 3600, // 1 hour
  })
}
