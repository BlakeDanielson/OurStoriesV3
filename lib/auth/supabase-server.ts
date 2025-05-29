import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { Database } from '../types/database'
import { authConfig } from './config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Enhanced server client with auth configuration
export const createAuthServerClient = () => {
  const cookieStore = cookies()

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: authConfig,
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (error) {
          // Handle cookie setting errors gracefully
          console.warn('Failed to set cookie:', name, error)
        }
      },
      remove(name: string, options: any) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch (error) {
          // Handle cookie removal errors gracefully
          console.warn('Failed to remove cookie:', name, error)
        }
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'ourstories-server',
      },
    },
  })
}

// Enhanced middleware client with auth configuration
export const createAuthMiddlewareClient = (
  request: NextRequest,
  response: NextResponse
) => {
  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: authConfig,
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        try {
          response.cookies.set({ name, value, ...options })
        } catch (error) {
          console.warn('Failed to set cookie in middleware:', name, error)
        }
      },
      remove(name: string, options: any) {
        try {
          response.cookies.set({ name, value: '', ...options })
        } catch (error) {
          console.warn('Failed to remove cookie in middleware:', name, error)
        }
      },
    },
    global: {
      headers: {
        'X-Client-Info': 'ourstories-middleware',
      },
    },
  })
}
