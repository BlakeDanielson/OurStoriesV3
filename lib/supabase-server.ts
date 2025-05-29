import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from './types/database'
import { getSecureCookieOptions } from './utils/security'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Server client for server components
export const createServerSupabaseClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        const secureOptions = { ...getSecureCookieOptions(), ...options }
        cookieStore.set({ name, value, ...secureOptions })
      },
      remove(name: string, options: any) {
        const secureOptions = { ...getSecureCookieOptions(), ...options }
        cookieStore.set({ name, value: '', ...secureOptions })
      },
    },
  })
}

// Middleware client for middleware.ts
export const createMiddlewareSupabaseClient = (
  request: NextRequest,
  response: NextResponse
) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        const secureOptions = { ...getSecureCookieOptions(), ...options }
        response.cookies.set({ name, value, ...secureOptions })
      },
      remove(name: string, options: any) {
        const secureOptions = { ...getSecureCookieOptions(), ...options }
        response.cookies.set({ name, value: '', ...secureOptions })
      },
    },
  })
}
