import { createBrowserSupabaseClient } from './supabase'
import {
  Database,
  Book,
  BookPage,
  UserFeedback,
  BookStatus,
} from './types/database'
import {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js'

type SupabaseClient = ReturnType<typeof createBrowserSupabaseClient>

// Real-time event types
export type BookStatusUpdate = {
  bookId: string
  status: BookStatus
  totalPages?: number
  completedAt?: string
}

export type BookPageAdded = {
  bookId: string
  page: BookPage
}

export type ReadingProgressUpdate = {
  bookId: string
  userId: string
  progress: UserFeedback
}

// Subscription callback types
export type BookStatusCallback = (update: BookStatusUpdate) => void
export type BookPageCallback = (update: BookPageAdded) => void
export type ReadingProgressCallback = (update: ReadingProgressUpdate) => void

// Real-time subscription manager
export class RealtimeSubscriptions {
  private supabase: SupabaseClient
  private channels: Map<string, RealtimeChannel> = new Map()
  private userId: string | null = null

  constructor() {
    this.supabase = createBrowserSupabaseClient()
    this.initializeAuth()
  }

  private async initializeAuth() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    this.userId = user?.id || null
  }

  // Subscribe to book status changes for a specific user's books
  subscribeToBookStatus(callback: BookStatusCallback): () => void {
    if (!this.userId) {
      console.warn('User not authenticated for real-time subscriptions')
      return () => {}
    }

    const channelName = `book-status-${this.userId}`

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'books',
          filter: `child_profiles.parent_id=eq.${this.userId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<
            Database['public']['Tables']['books']['Row']
          >
        ) => {
          const newRecord = payload.new
          const oldRecord = payload.old

          if (
            newRecord &&
            oldRecord &&
            'status' in newRecord &&
            'status' in oldRecord
          ) {
            // Only trigger if status actually changed and both statuses are not null
            if (
              newRecord.status !== oldRecord.status &&
              newRecord.status !== null
            ) {
              callback({
                bookId: newRecord.id,
                status: newRecord.status,
                totalPages: newRecord.total_pages || undefined,
                completedAt: newRecord.completed_at || undefined,
              })
            }
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    // Return unsubscribe function
    return () => {
      this.unsubscribe(channelName)
    }
  }

  // Subscribe to new book pages being added
  subscribeToBookPages(bookId: string, callback: BookPageCallback): () => void {
    if (!this.userId) {
      console.warn('User not authenticated for real-time subscriptions')
      return () => {}
    }

    const channelName = `book-pages-${bookId}`

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'book_pages',
          filter: `book_id=eq.${bookId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<
            Database['public']['Tables']['book_pages']['Row']
          >
        ) => {
          const newRecord = payload.new

          if (newRecord && 'id' in newRecord) {
            callback({
              bookId: bookId,
              page: newRecord as BookPage,
            })
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => {
      this.unsubscribe(channelName)
    }
  }

  // Subscribe to reading progress updates
  subscribeToReadingProgress(
    bookId: string,
    callback: ReadingProgressCallback
  ): () => void {
    if (!this.userId) {
      console.warn('User not authenticated for real-time subscriptions')
      return () => {}
    }

    const channelName = `reading-progress-${bookId}-${this.userId}`

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'user_feedback',
          filter: `book_id=eq.${bookId}`,
        },
        (
          payload: RealtimePostgresChangesPayload<
            Database['public']['Tables']['user_feedback']['Row']
          >
        ) => {
          const newRecord = payload.new

          if (
            newRecord &&
            'user_id' in newRecord &&
            newRecord.user_id === this.userId
          ) {
            callback({
              bookId: bookId,
              userId: this.userId!,
              progress: newRecord as UserFeedback,
            })
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => {
      this.unsubscribe(channelName)
    }
  }

  // Subscribe to all books for a user (useful for dashboard)
  subscribeToUserBooks(callback: BookStatusCallback): () => void {
    if (!this.userId) {
      console.warn('User not authenticated for real-time subscriptions')
      return () => {}
    }

    const channelName = `user-books-${this.userId}`

    const channel = this.supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events
          schema: 'public',
          table: 'books',
        },
        async (
          payload: RealtimePostgresChangesPayload<
            Database['public']['Tables']['books']['Row']
          >
        ) => {
          const newRecord = payload.new

          // Verify this book belongs to the user's children
          if (newRecord && 'child_profile_id' in newRecord) {
            const { data: childProfile } = await this.supabase
              .from('child_profiles')
              .select('parent_id')
              .eq('id', newRecord.child_profile_id)
              .single()

            if (
              childProfile?.parent_id === this.userId &&
              newRecord.status !== null
            ) {
              callback({
                bookId: newRecord.id,
                status: newRecord.status,
                totalPages: newRecord.total_pages || undefined,
                completedAt: newRecord.completed_at || undefined,
              })
            }
          }
        }
      )
      .subscribe()

    this.channels.set(channelName, channel)

    return () => {
      this.unsubscribe(channelName)
    }
  }

  // Unsubscribe from a specific channel
  private unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName)
    if (channel) {
      this.supabase.removeChannel(channel)
      this.channels.delete(channelName)
    }
  }

  // Unsubscribe from all channels
  unsubscribeAll() {
    this.channels.forEach((channel, channelName) => {
      this.supabase.removeChannel(channel)
    })
    this.channels.clear()
  }

  // Get connection status
  getConnectionStatus() {
    return this.supabase.realtime.isConnected()
  }

  // Manually refresh user authentication
  async refreshAuth() {
    const {
      data: { user },
    } = await this.supabase.auth.getUser()
    this.userId = user?.id || null
    return this.userId
  }
}

// Singleton instance for global use
export const realtimeSubscriptions = new RealtimeSubscriptions()

// Utility functions for common subscription patterns
export const subscribeToBookGeneration = (
  bookId: string,
  onStatusChange: BookStatusCallback,
  onPageAdded: BookPageCallback
) => {
  const unsubscribeStatus =
    realtimeSubscriptions.subscribeToBookStatus(onStatusChange)
  const unsubscribePages = realtimeSubscriptions.subscribeToBookPages(
    bookId,
    onPageAdded
  )

  return () => {
    unsubscribeStatus()
    unsubscribePages()
  }
}

export default realtimeSubscriptions
