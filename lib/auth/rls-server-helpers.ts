import { createServerSupabaseClient } from '../supabase-server'
import { Database } from '../types/database'

type Tables = Database['public']['Tables']
type User = Tables['users']['Row']
type ChildProfile = Tables['child_profiles']['Row']
type Book = Tables['books']['Row']

/**
 * Server-side RLS Helper Functions for API routes
 *
 * These functions provide safe, RLS-compliant database operations
 * for use in server-side API routes and server components.
 */

export const serverHelpers = {
  async getCurrentUserProfile(userId: string) {
    const supabase = createServerSupabaseClient()

    const { data: profile, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`)
    }

    return profile
  },

  async getUserChildren(userId: string) {
    const supabase = createServerSupabaseClient()

    const { data: children, error } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch children: ${error.message}`)
    }

    return children || []
  },

  async getUserBooks(userId: string, childId?: string) {
    const supabase = createServerSupabaseClient()

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
      .eq('child_profiles.parent_id', userId)

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
  },
}
