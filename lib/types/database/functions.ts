import type { BookStatus } from './stories'

// Database function types
export interface DatabaseFunctions {
  get_books_with_progress: {
    Args: { user_id: string; child_profile_id?: string }
    Returns: {
      id: string
      title: string
      description: string
      status: BookStatus
      cover_image_url: string
      genre: string
      child_name: string
      created_at: string
    }[]
  }
  get_children_with_book_counts: {
    Args: { parent_user_id: string }
    Returns: {
      id: string
      name: string
      age: number
      avatar_url: string
      book_count: number
    }[]
  }
  get_reading_statistics: {
    Args: { user_id: string }
    Returns: {
      total_books: number
      completed_books: number
      reading_time_minutes: number
    }[]
  }
  search_books: {
    Args: {
      search_query?: string
      genre_filter?: string
      status_filter?: BookStatus
      child_profile_id?: string
    }
    Returns: {
      id: string
      title: string
      description: string
      status: BookStatus
      cover_image_url: string
      genre: string
      child_name: string
      created_at: string
    }[]
  }
  update_book_status: {
    Args: {
      book_id: string
      new_status: BookStatus
      total_pages_count?: number
    }
    Returns: boolean
  }
}

// Convenience type exports for function arguments and returns
export type GetBooksWithProgressArgs =
  DatabaseFunctions['get_books_with_progress']['Args']
export type GetBooksWithProgressReturns =
  DatabaseFunctions['get_books_with_progress']['Returns']

export type GetChildrenWithBookCountsArgs =
  DatabaseFunctions['get_children_with_book_counts']['Args']
export type GetChildrenWithBookCountsReturns =
  DatabaseFunctions['get_children_with_book_counts']['Returns']

export type GetReadingStatisticsArgs =
  DatabaseFunctions['get_reading_statistics']['Args']
export type GetReadingStatisticsReturns =
  DatabaseFunctions['get_reading_statistics']['Returns']

export type SearchBooksArgs = DatabaseFunctions['search_books']['Args']
export type SearchBooksReturns = DatabaseFunctions['search_books']['Returns']

export type UpdateBookStatusArgs =
  DatabaseFunctions['update_book_status']['Args']
export type UpdateBookStatusReturns =
  DatabaseFunctions['update_book_status']['Returns']
