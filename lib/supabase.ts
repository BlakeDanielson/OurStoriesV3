import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'
import { Database } from './types/database'
import { getBrowserCookieOptions } from './utils/security'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Browser client for client components
export const createBrowserSupabaseClient = () =>
  createBrowserClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        if (typeof document !== 'undefined') {
          const value = document.cookie
            .split('; ')
            .find(row => row.startsWith(`${name}=`))
            ?.split('=')[1]
          return value
        }
        return undefined
      },
      set(name: string, value: string, options: any) {
        if (typeof document !== 'undefined') {
          const secureOptions = { ...getBrowserCookieOptions(), ...options }
          const cookieString = `${name}=${value}; path=${secureOptions.path}; max-age=${secureOptions.maxAge}; samesite=${secureOptions.sameSite}${secureOptions.secure ? '; secure' : ''}`
          document.cookie = cookieString
        }
      },
      remove(name: string, options: any) {
        if (typeof document !== 'undefined') {
          const secureOptions = { ...getBrowserCookieOptions(), ...options }
          const cookieString = `${name}=; path=${secureOptions.path}; max-age=0; samesite=${secureOptions.sameSite}${secureOptions.secure ? '; secure' : ''}`
          document.cookie = cookieString
        }
      },
    },
  })

// Admin client with service role key (for server-side operations)
export const createAdminSupabaseClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is required for admin operations'
    )
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export default supabase
