/**
 * AI Content Storage Service
 * Comprehensive storage and retrieval for AI-generated content with Supabase integration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { EventEmitter } from 'events'

// Database types
export const AIContentTypeSchema = z.enum([
  'story_outline',
  'story_content',
  'story_revision',
  'character_description',
  'scene_description',
  'educational_content',
])

export const AIProviderSchema = z.enum([
  'openai',
  'anthropic',
  'google',
  'custom',
])

export type AIContentType = z.infer<typeof AIContentTypeSchema>
export type AIProvider = z.infer<typeof AIProviderSchema>

// Core interfaces
export interface AIGeneratedContent {
  id: string
  user_id: string
  child_profile_id?: string
  book_id?: string
  content_type: AIContentType
  provider: AIProvider
  model_name: string
  input_prompt: string
  raw_response: string
  parsed_content: any
  metadata: Record<string, any>
  quality_scores: Record<string, any>
  token_usage: Record<string, any>
  generation_time_ms?: number
  cost_usd?: number
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ConversationSession {
  id: string
  user_id: string
  child_profile_id?: string
  session_name?: string
  context_summary?: string
  total_entries: number
  total_tokens: number
  last_activity_at: string
  expires_at?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ContentStorageConfig {
  supabaseUrl: string
  supabaseKey: string
  enableCaching: boolean
  cacheConfig: {
    ttl: number
    maxSize: number
  }
  retentionPolicies: {
    conversationHistory: number
    analyticsEvents: number
    tempSessions: number
  }
}

// Simple LRU Cache
class LRUCache<T> {
  private cache = new Map<string, { data: T; timestamp: number; ttl: number }>()
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    if (Date.now() - entry.timestamp > entry.ttl * 1000) {
      this.cache.delete(key)
      return null
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)
    return entry.data
  }

  set(key: string, data: T, ttl: number = 3600): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, { data, timestamp: Date.now(), ttl })
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }
}

// Content Storage Service
export class ContentStorageService extends EventEmitter {
  private supabase: SupabaseClient
  private config: ContentStorageConfig
  private cache: LRUCache<any>

  constructor(config: ContentStorageConfig) {
    super()
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey)
    this.cache = new LRUCache(config.cacheConfig.maxSize)
    this.startCleanupJob()
  }

  // AI Content Storage
  async storeAIContent(
    content: Omit<AIGeneratedContent, 'id' | 'created_at' | 'updated_at'>
  ): Promise<AIGeneratedContent> {
    try {
      const { data, error } = await this.supabase
        .from('ai_generated_content')
        .insert(content)
        .select()
        .single()

      if (error) throw error

      if (this.config.enableCaching) {
        this.cache.set(
          `ai_content:${data.id}`,
          data,
          this.config.cacheConfig.ttl
        )
      }

      this.emit('content:stored', {
        contentId: data.id,
        contentType: content.content_type,
      })
      return data
    } catch (error) {
      this.emit('error', { operation: 'storeAIContent', error })
      throw error
    }
  }

  async getAIContent(contentId: string): Promise<AIGeneratedContent | null> {
    if (this.config.enableCaching) {
      const cached = this.cache.get(`ai_content:${contentId}`)
      if (cached) return cached
    }

    try {
      const { data, error } = await this.supabase
        .from('ai_generated_content')
        .select('*')
        .eq('id', contentId)
        .eq('is_active', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      if (!data) return null

      if (this.config.enableCaching) {
        this.cache.set(
          `ai_content:${contentId}`,
          data,
          this.config.cacheConfig.ttl
        )
      }

      return data
    } catch (error) {
      this.emit('error', { operation: 'getAIContent', error })
      throw error
    }
  }

  async getUserAIContent(
    userId: string,
    options: {
      contentType?: AIContentType
      childProfileId?: string
      limit?: number
    } = {}
  ): Promise<AIGeneratedContent[]> {
    try {
      let query = this.supabase
        .from('ai_generated_content')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (options.contentType) {
        query = query.eq('content_type', options.contentType)
      }

      if (options.childProfileId) {
        query = query.eq('child_profile_id', options.childProfileId)
      }

      if (options.limit) {
        query = query.limit(options.limit)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      this.emit('error', { operation: 'getUserAIContent', error })
      throw error
    }
  }

  // Conversation Management
  async createConversationSession(
    userId: string,
    options: {
      childProfileId?: string
      sessionName?: string
      expiresInHours?: number
    } = {}
  ): Promise<ConversationSession> {
    try {
      const expiresAt = options.expiresInHours
        ? new Date(
            Date.now() + options.expiresInHours * 60 * 60 * 1000
          ).toISOString()
        : new Date(
            Date.now() +
              this.config.retentionPolicies.tempSessions * 60 * 60 * 1000
          ).toISOString()

      const { data, error } = await this.supabase
        .from('conversation_sessions')
        .insert({
          user_id: userId,
          child_profile_id: options.childProfileId,
          session_name: options.sessionName,
          expires_at: expiresAt,
        })
        .select()
        .single()

      if (error) throw error

      this.emit('session:created', { sessionId: data.id, userId })
      return data
    } catch (error) {
      this.emit('error', { operation: 'createConversationSession', error })
      throw error
    }
  }

  async getUserSessions(
    userId: string,
    activeOnly: boolean = true
  ): Promise<ConversationSession[]> {
    try {
      let query = this.supabase
        .from('conversation_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_activity_at', { ascending: false })

      if (activeOnly) {
        query = query.eq('is_active', true)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      this.emit('error', { operation: 'getUserSessions', error })
      throw error
    }
  }

  // Analytics
  async recordAnalyticsEvent(event: {
    userId?: string
    childProfileId?: string
    sessionId?: string
    eventType: string
    eventName: string
    eventData?: Record<string, any>
    performanceMetrics?: Record<string, any>
  }): Promise<void> {
    try {
      const { error } = await this.supabase.from('analytics_events').insert({
        user_id: event.userId,
        child_profile_id: event.childProfileId,
        session_id: event.sessionId,
        event_type: event.eventType,
        event_name: event.eventName,
        event_data: event.eventData || {},
        performance_metrics: event.performanceMetrics || {},
      })

      if (error) throw error

      this.emit('analytics:recorded', {
        eventType: event.eventType,
        eventName: event.eventName,
      })
    } catch (error) {
      this.emit('error', { operation: 'recordAnalyticsEvent', error })
      throw error
    }
  }

  // Cleanup and maintenance
  private startCleanupJob(): void {
    setInterval(
      async () => {
        try {
          await this.cleanupExpiredData()
        } catch (error) {
          this.emit('error', { operation: 'cleanupJob', error })
        }
      },
      60 * 60 * 1000
    ) // 1 hour
  }

  async cleanupExpiredData(): Promise<{ deletedSessions: number }> {
    try {
      const { data } = await this.supabase.rpc('cleanup_expired_conversations')

      this.emit('cleanup:completed', { deletedSessions: data || 0 })

      return { deletedSessions: data || 0 }
    } catch (error) {
      this.emit('error', { operation: 'cleanupExpiredData', error })
      throw error
    }
  }

  // Cache management
  clearCache(): void {
    this.cache.clear()
    this.emit('cache:cleared')
  }

  getCacheStats(): { size: number; maxSize: number } {
    return {
      size: this.cache.size(),
      maxSize: this.config.cacheConfig.maxSize,
    }
  }

  // Health check
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    details: any
  }> {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count(*)')
        .limit(1)

      if (error) throw error

      return {
        status: 'healthy',
        details: {
          database: 'connected',
          cache: this.getCacheStats(),
        },
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }
}

// Factory functions
export function createContentStorageService(
  config: ContentStorageConfig
): ContentStorageService {
  return new ContentStorageService(config)
}

export function createProductionContentStorageService(): ContentStorageService {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  const config: ContentStorageConfig = {
    supabaseUrl,
    supabaseKey,
    enableCaching: true,
    cacheConfig: {
      ttl: 3600, // 1 hour
      maxSize: 10000,
    },
    retentionPolicies: {
      conversationHistory: 30, // 30 days
      analyticsEvents: 90, // 90 days
      tempSessions: 24, // 24 hours
    },
  }

  return new ContentStorageService(config)
}

export const DEFAULT_CONTENT_STORAGE_CONFIG: ContentStorageConfig = {
  supabaseUrl: '',
  supabaseKey: '',
  enableCaching: true,
  cacheConfig: {
    ttl: 1800, // 30 minutes
    maxSize: 5000,
  },
  retentionPolicies: {
    conversationHistory: 7, // 7 days
    analyticsEvents: 30, // 30 days
    tempSessions: 12, // 12 hours
  },
}
