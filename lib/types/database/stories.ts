import type { Json } from './common'

// Story-related enums
export type BookStatus = 'draft' | 'generating' | 'completed' | 'failed'
export type ReadingStatus = 'not_started' | 'in_progress' | 'completed'

// Books table types
export interface BooksTable {
  Row: {
    ai_prompt: string | null
    child_profile_id: string
    completed_at: string | null
    cover_image_url: string | null
    created_at: string | null
    description: string | null
    estimated_reading_time: number | null
    generation_settings: Json | null
    genre: string | null
    id: string
    metadata: Json | null
    status: BookStatus | null
    themes: string[] | null
    title: string
    total_pages: number | null
    updated_at: string | null
  }
  Insert: {
    ai_prompt?: string | null
    child_profile_id: string
    completed_at?: string | null
    cover_image_url?: string | null
    created_at?: string | null
    description?: string | null
    estimated_reading_time?: number | null
    generation_settings?: Json | null
    genre?: string | null
    id?: string
    metadata?: Json | null
    status?: BookStatus | null
    themes?: string[] | null
    title: string
    total_pages?: number | null
    updated_at?: string | null
  }
  Update: {
    ai_prompt?: string | null
    child_profile_id?: string
    completed_at?: string | null
    cover_image_url?: string | null
    created_at?: string | null
    description?: string | null
    estimated_reading_time?: number | null
    generation_settings?: Json | null
    genre?: string | null
    id?: string
    metadata?: Json | null
    status?: BookStatus | null
    themes?: string[] | null
    title?: string
    total_pages?: number | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: 'books_child_profile_id_fkey'
      columns: ['child_profile_id']
      isOneToOne: false
      referencedRelation: 'child_profiles'
      referencedColumns: ['id']
    },
  ]
}

// Book Pages table types
export interface BookPagesTable {
  Row: {
    ai_metadata: Json | null
    audio_url: string | null
    book_id: string
    content: string
    created_at: string | null
    id: string
    image_prompt: string | null
    image_url: string | null
    page_number: number
    page_type: string | null
    updated_at: string | null
  }
  Insert: {
    ai_metadata?: Json | null
    audio_url?: string | null
    book_id: string
    content: string
    created_at?: string | null
    id?: string
    image_prompt?: string | null
    image_url?: string | null
    page_number: number
    page_type?: string | null
    updated_at?: string | null
  }
  Update: {
    ai_metadata?: Json | null
    audio_url?: string | null
    book_id?: string
    content?: string
    created_at?: string | null
    id?: string
    image_prompt?: string | null
    image_url?: string | null
    page_number?: number
    page_type?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: 'book_pages_book_id_fkey'
      columns: ['book_id']
      isOneToOne: false
      referencedRelation: 'books'
      referencedColumns: ['id']
    },
  ]
}

// Stories-related database structure
export interface StoriesTables {
  books: BooksTable
  book_pages: BookPagesTable
}

export interface StoriesEnums {
  book_status: BookStatus
  reading_status: ReadingStatus
}

// Convenience type exports
export type Book = BooksTable['Row']
export type BookInsert = BooksTable['Insert']
export type BookUpdate = BooksTable['Update']

export type BookPage = BookPagesTable['Row']
export type BookPageInsert = BookPagesTable['Insert']
export type BookPageUpdate = BookPagesTable['Update']

// Constants for stories enums
export const StoriesConstants = {
  book_status: ['draft', 'generating', 'completed', 'failed'] as const,
  reading_status: ['not_started', 'in_progress', 'completed'] as const,
} as const
