import { createBrowserClient } from '@supabase/ssr'
import { Database } from '../types/database'
import { authConfig } from './config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Enhanced browser client with auth configuration
export const createAuthBrowserClient = () => {
  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: authConfig,
    global: {
      headers: {
        'X-Client-Info': 'ourstories-web',
      },
    },
  })
}

// Singleton instance for client-side use
let authClientInstance: ReturnType<typeof createAuthBrowserClient> | null = null

export const getAuthClient = () => {
  // Client-side: use singleton
  if (!authClientInstance) {
    authClientInstance = createAuthBrowserClient()
  }

  return authClientInstance
}

// Helper to check if we're on the client side
export const isClient = () => typeof window !== 'undefined'

// Helper to get the current session
export const getCurrentSession = async () => {
  const supabase = getAuthClient()
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('Error getting session:', error)
    return null
  }

  return session
}

// Helper to get the current user
export const getCurrentUser = async () => {
  const supabase = getAuthClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('Error getting user:', error)
    return null
  }

  return user
}

// Helper to refresh the session
export const refreshSession = async () => {
  const supabase = getAuthClient()
  const { data, error } = await supabase.auth.refreshSession()

  if (error) {
    console.error('Error refreshing session:', error)
    return null
  }

  return data.session
}
