import type { Json } from './common'
import type { ReadingStatus } from './stories'

// User Feedback table types
export interface UserFeedbackTable {
  Row: {
    book_id: string
    child_profile_id: string | null
    comment: string | null
    created_at: string | null
    favorite_pages: number[] | null
    id: string
    rating: number | null
    reading_progress: Json | null
    reading_status: ReadingStatus | null
    updated_at: string | null
    user_id: string
  }
  Insert: {
    book_id: string
    child_profile_id?: string | null
    comment?: string | null
    created_at?: string | null
    favorite_pages?: number[] | null
    id?: string
    rating?: number | null
    reading_progress?: Json | null
    reading_status?: ReadingStatus | null
    updated_at?: string | null
    user_id: string
  }
  Update: {
    book_id?: string
    child_profile_id?: string | null
    comment?: string | null
    created_at?: string | null
    favorite_pages?: number[] | null
    id?: string
    rating?: number | null
    reading_progress?: Json | null
    reading_status?: ReadingStatus | null
    updated_at?: string | null
    user_id?: string
  }
  Relationships: [
    {
      foreignKeyName: 'user_feedback_book_id_fkey'
      columns: ['book_id']
      isOneToOne: false
      referencedRelation: 'books'
      referencedColumns: ['id']
    },
    {
      foreignKeyName: 'user_feedback_child_profile_id_fkey'
      columns: ['child_profile_id']
      isOneToOne: false
      referencedRelation: 'child_profiles'
      referencedColumns: ['id']
    },
    {
      foreignKeyName: 'user_feedback_user_id_fkey'
      columns: ['user_id']
      isOneToOne: false
      referencedRelation: 'users'
      referencedColumns: ['id']
    },
  ]
}

// Feedback-related database structure
export interface FeedbackTables {
  user_feedback: UserFeedbackTable
}

// Convenience type exports
export type UserFeedback = UserFeedbackTable['Row']
export type UserFeedbackInsert = UserFeedbackTable['Insert']
export type UserFeedbackUpdate = UserFeedbackTable['Update']
