import { createBrowserSupabaseClient } from './supabase'
import { createServerSupabaseClient } from './supabase-server'
import {
  Database,
  User,
  ChildProfile,
  Book,
  BookPage,
  UserFeedback,
  BookStatus,
  ReadingStatus,
} from './types/database'

type SupabaseClient = ReturnType<typeof createServerSupabaseClient>

// Generic database operation helpers
export class DatabaseOperations {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  // User operations
  async getUser(userId: string) {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    return { data, error }
  }

  async updateUser(userId: string, updates: Partial<User>) {
    const { data, error } = await this.supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    return { data, error }
  }

  // Child Profile operations
  async getChildProfiles(parentId: string) {
    const { data, error } = await this.supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false })

    return { data, error }
  }

  async getChildProfile(childId: string) {
    const { data, error } = await this.supabase
      .from('child_profiles')
      .select('*')
      .eq('id', childId)
      .single()

    return { data, error }
  }

  async createChildProfile(
    childData: Database['public']['Tables']['child_profiles']['Insert']
  ) {
    const { data, error } = await this.supabase
      .from('child_profiles')
      .insert(childData)
      .select()
      .single()

    return { data, error }
  }

  async updateChildProfile(
    childId: string,
    updates: Database['public']['Tables']['child_profiles']['Update']
  ) {
    const { data, error } = await this.supabase
      .from('child_profiles')
      .update(updates)
      .eq('id', childId)
      .select()
      .single()

    return { data, error }
  }

  async deleteChildProfile(childId: string) {
    const { data, error } = await this.supabase
      .from('child_profiles')
      .delete()
      .eq('id', childId)

    return { data, error }
  }

  // Book operations
  async getBooks(childProfileId?: string, status?: BookStatus) {
    let query = this.supabase
      .from('books')
      .select(
        `
        *,
        child_profiles!inner(id, name, parent_id)
      `
      )
      .order('created_at', { ascending: false })

    if (childProfileId) {
      query = query.eq('child_profile_id', childProfileId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data, error } = await query

    return { data, error }
  }

  async getBook(bookId: string) {
    const { data, error } = await this.supabase
      .from('books')
      .select(
        `
        *,
        child_profiles!inner(id, name, parent_id),
        book_pages(*)
      `
      )
      .eq('id', bookId)
      .single()

    return { data, error }
  }

  async createBook(bookData: Database['public']['Tables']['books']['Insert']) {
    const { data, error } = await this.supabase
      .from('books')
      .insert(bookData)
      .select()
      .single()

    return { data, error }
  }

  async updateBook(
    bookId: string,
    updates: Database['public']['Tables']['books']['Update']
  ) {
    const { data, error } = await this.supabase
      .from('books')
      .update(updates)
      .eq('id', bookId)
      .select()
      .single()

    return { data, error }
  }

  async deleteBook(bookId: string) {
    const { data, error } = await this.supabase
      .from('books')
      .delete()
      .eq('id', bookId)

    return { data, error }
  }

  // Book Page operations
  async getBookPages(bookId: string) {
    const { data, error } = await this.supabase
      .from('book_pages')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })

    return { data, error }
  }

  async getBookPage(pageId: string) {
    const { data, error } = await this.supabase
      .from('book_pages')
      .select('*')
      .eq('id', pageId)
      .single()

    return { data, error }
  }

  async createBookPage(
    pageData: Database['public']['Tables']['book_pages']['Insert']
  ) {
    const { data, error } = await this.supabase
      .from('book_pages')
      .insert(pageData)
      .select()
      .single()

    return { data, error }
  }

  async updateBookPage(
    pageId: string,
    updates: Database['public']['Tables']['book_pages']['Update']
  ) {
    const { data, error } = await this.supabase
      .from('book_pages')
      .update(updates)
      .eq('id', pageId)
      .select()
      .single()

    return { data, error }
  }

  async deleteBookPage(pageId: string) {
    const { data, error } = await this.supabase
      .from('book_pages')
      .delete()
      .eq('id', pageId)

    return { data, error }
  }

  // User Feedback operations
  async getUserFeedback(userId: string, bookId?: string) {
    let query = this.supabase
      .from('user_feedback')
      .select(
        `
        *,
        books!inner(id, title, child_profile_id),
        child_profiles(id, name)
      `
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    const { data, error } = await query

    return { data, error }
  }

  async getFeedbackForBook(bookId: string, userId: string) {
    const { data, error } = await this.supabase
      .from('user_feedback')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', userId)
      .single()

    return { data, error }
  }

  async createUserFeedback(
    feedbackData: Database['public']['Tables']['user_feedback']['Insert']
  ) {
    const { data, error } = await this.supabase
      .from('user_feedback')
      .insert(feedbackData)
      .select()
      .single()

    return { data, error }
  }

  async updateUserFeedback(
    feedbackId: string,
    updates: Database['public']['Tables']['user_feedback']['Update']
  ) {
    const { data, error } = await this.supabase
      .from('user_feedback')
      .update(updates)
      .eq('id', feedbackId)
      .select()
      .single()

    return { data, error }
  }

  async upsertUserFeedback(
    userId: string,
    bookId: string,
    feedbackData: Omit<
      Database['public']['Tables']['user_feedback']['Insert'],
      'user_id' | 'book_id'
    >
  ) {
    const { data, error } = await this.supabase
      .from('user_feedback')
      .upsert({
        user_id: userId,
        book_id: bookId,
        ...feedbackData,
      })
      .select()
      .single()

    return { data, error }
  }

  // Database function calls
  async getBooksWithProgress(userId: string, childProfileId?: string) {
    const { data, error } = await this.supabase.rpc('get_books_with_progress', {
      user_id: userId,
      child_profile_id: childProfileId,
    })

    return { data, error }
  }

  async getChildrenWithBookCounts(parentUserId: string) {
    const { data, error } = await this.supabase.rpc(
      'get_children_with_book_counts',
      {
        parent_user_id: parentUserId,
      }
    )

    return { data, error }
  }

  async getReadingStatistics(userId: string) {
    const { data, error } = await this.supabase.rpc('get_reading_statistics', {
      user_id: userId,
    })

    return { data, error }
  }

  async searchBooks(
    userId: string,
    searchTerm: string,
    filters?: {
      genre?: string
      childId?: string
      status?: BookStatus
    }
  ) {
    const { data, error } = await this.supabase.rpc('search_books', {
      user_id: userId,
      search_term: searchTerm,
      genre_filter: filters?.genre,
      child_filter: filters?.childId,
      status_filter: filters?.status,
    })

    return { data, error }
  }

  async updateBookStatus(
    bookId: string,
    newStatus: BookStatus,
    totalPages?: number
  ) {
    const { data, error } = await this.supabase.rpc('update_book_status', {
      book_id: bookId,
      new_status: newStatus,
      total_pages_count: totalPages,
    })

    return { data, error }
  }
}

// Factory functions for creating database operation instances
export const createServerDatabaseOperations = () => {
  const supabase = createServerSupabaseClient()
  return new DatabaseOperations(supabase)
}

export const createBrowserDatabaseOperations = () => {
  const supabase = createBrowserSupabaseClient()
  return new DatabaseOperations(supabase)
}

// Convenience exports for common operations
export const db = {
  server: createServerDatabaseOperations,
  browser: createBrowserDatabaseOperations,
}

// Type-safe query builders
export const queryBuilders = {
  // Books with related data
  booksWithDetails: () => `
    *,
    child_profiles!inner(id, name, parent_id),
    book_pages(id, page_number, content, image_url),
    user_feedback(id, rating, reading_status, reading_progress)
  `,

  // Child profiles with book counts
  childProfilesWithBooks: () => `
    *,
    books(id, title, status, created_at)
  `,

  // User feedback with book details
  feedbackWithBooks: () => `
    *,
    books!inner(id, title, cover_image_url, child_profile_id),
    child_profiles(id, name)
  `,
}

// Real-time subscription helpers
export const subscriptions = {
  // Subscribe to book status changes
  bookStatus: (bookId: string, callback: (payload: any) => void) => {
    const supabase = createBrowserSupabaseClient()

    return supabase
      .channel(`book-${bookId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'books',
          filter: `id=eq.${bookId}`,
        },
        callback
      )
      .subscribe()
  },

  // Subscribe to user's books
  userBooks: (userId: string, callback: (payload: any) => void) => {
    const supabase = createBrowserSupabaseClient()

    return supabase
      .channel(`user-books-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'books',
          filter: `child_profiles.parent_id=eq.${userId}`,
        },
        callback
      )
      .subscribe()
  },
}

export default db
