import { createBrowserSupabaseClient } from '../supabase'
import { Database } from '../types/database'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type ChildProfile = Tables['child_profiles']['Row']
type Book = Tables['books']['Row']
type BookPage = Tables['book_pages']['Row']
type UserFeedback = Tables['user_feedback']['Row']

/**
 * RLS Helper Functions
 *
 * These functions provide safe, RLS-compliant database operations
 * that automatically respect user permissions and data access policies.
 */

/**
 * Get the current authenticated user's profile
 */
export const getCurrentUserProfile = async () => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch user profile: ${error.message}`)
  }

  return profile
}

/**
 * Get all child profiles for the current user (parent)
 */
export const getUserChildren = async () => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: children, error } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('parent_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch children: ${error.message}`)
  }

  return children || []
}

/**
 * Get a specific child profile (only if user is the parent)
 */
export const getChildProfile = async (childId: string) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: child, error } = await supabase
    .from('child_profiles')
    .select('*')
    .eq('id', childId)
    .eq('parent_id', user.id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch child profile: ${error.message}`)
  }

  return child
}

/**
 * Get all books for the current user's children
 */
export const getUserBooks = async (childId?: string) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  let query = supabase
    .from('books')
    .select(
      `
      *,
      child_profiles!inner (
        id,
        name,
        parent_id
      )
    `
    )
    .eq('child_profiles.parent_id', user.id)

  if (childId) {
    query = query.eq('child_profile_id', childId)
  }

  const { data: books, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    throw new Error(`Failed to fetch books: ${error.message}`)
  }

  return books || []
}

/**
 * Get a specific book (only if user owns the child profile)
 */
export const getBook = async (bookId: string) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: book, error } = await supabase
    .from('books')
    .select(
      `
      *,
      child_profiles!inner (
        id,
        name,
        parent_id
      )
    `
    )
    .eq('id', bookId)
    .eq('child_profiles.parent_id', user.id)
    .single()

  if (error) {
    throw new Error(`Failed to fetch book: ${error.message}`)
  }

  return book
}

/**
 * Get pages for a specific book (only if user owns the child profile)
 */
export const getBookPages = async (bookId: string) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  // First verify the user owns this book through RLS
  const book = await getBook(bookId)
  if (!book) {
    throw new Error('Book not found or access denied')
  }

  const { data: pages, error } = await supabase
    .from('book_pages')
    .select('*')
    .eq('book_id', bookId)
    .order('page_number', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch book pages: ${error.message}`)
  }

  return pages || []
}

/**
 * Get user feedback for the current user
 */
export const getUserFeedback = async (bookId?: string) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  let query = supabase
    .from('user_feedback')
    .select(
      `
      *,
      books!inner (
        id,
        title,
        child_profiles!inner (
          id,
          name,
          parent_id
        )
      )
    `
    )
    .eq('user_id', user.id)

  if (bookId) {
    query = query.eq('book_id', bookId)
  }

  const { data: feedback, error } = await query.order('created_at', {
    ascending: false,
  })

  if (error) {
    throw new Error(`Failed to fetch user feedback: ${error.message}`)
  }

  return feedback || []
}

/**
 * Create a new child profile (RLS will ensure user is the parent)
 */
export const createChildProfile = async (
  childData: Omit<
    ChildProfile,
    'id' | 'parent_id' | 'created_at' | 'updated_at'
  >
) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: child, error } = await supabase
    .from('child_profiles')
    .insert({
      ...childData,
      parent_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create child profile: ${error.message}`)
  }

  return child
}

/**
 * Update a child profile (RLS will ensure user is the parent)
 */
export const updateChildProfile = async (
  childId: string,
  updates: Partial<
    Omit<ChildProfile, 'id' | 'parent_id' | 'created_at' | 'updated_at'>
  >
) => {
  const supabase = createBrowserSupabaseClient()

  const { data: child, error } = await supabase
    .from('child_profiles')
    .update(updates)
    .eq('id', childId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update child profile: ${error.message}`)
  }

  return child
}

/**
 * Create a new book (RLS will ensure user owns the child profile)
 */
export const createBook = async (
  bookData: Omit<Book, 'id' | 'created_at' | 'updated_at' | 'completed_at'>
) => {
  const supabase = createBrowserSupabaseClient()

  const { data: book, error } = await supabase
    .from('books')
    .insert(bookData)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create book: ${error.message}`)
  }

  return book
}

/**
 * Update a book (RLS will ensure user owns the child profile)
 */
export const updateBook = async (
  bookId: string,
  updates: Partial<Omit<Book, 'id' | 'created_at' | 'updated_at'>>
) => {
  const supabase = createBrowserSupabaseClient()

  const { data: book, error } = await supabase
    .from('books')
    .update(updates)
    .eq('id', bookId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update book: ${error.message}`)
  }

  return book
}

/**
 * Create user feedback (RLS will ensure user owns the feedback)
 */
export const createUserFeedback = async (
  feedbackData: Omit<
    UserFeedback,
    'id' | 'user_id' | 'created_at' | 'updated_at'
  >
) => {
  const supabase = createBrowserSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('User not authenticated')
  }

  const { data: feedback, error } = await supabase
    .from('user_feedback')
    .insert({
      ...feedbackData,
      user_id: user.id,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create user feedback: ${error.message}`)
  }

  return feedback
}

/**
 * Update user feedback (RLS will ensure user owns the feedback)
 */
export const updateUserFeedback = async (
  feedbackId: string,
  updates: Partial<
    Omit<UserFeedback, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  >
) => {
  const supabase = createBrowserSupabaseClient()

  const { data: feedback, error } = await supabase
    .from('user_feedback')
    .update(updates)
    .eq('id', feedbackId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to update user feedback: ${error.message}`)
  }

  return feedback
}
