import type { Json } from './common'

// Auth-related enums
export type UserRole = 'parent' | 'child' | 'admin'

// Users table types
export interface UsersTable {
  Row: {
    avatar_url: string | null
    created_at: string | null
    email: string
    full_name: string | null
    id: string
    role: UserRole | null
    updated_at: string | null
  }
  Insert: {
    avatar_url?: string | null
    created_at?: string | null
    email: string
    full_name?: string | null
    id: string
    role?: UserRole | null
    updated_at?: string | null
  }
  Update: {
    avatar_url?: string | null
    created_at?: string | null
    email?: string
    full_name?: string | null
    id?: string
    role?: UserRole | null
    updated_at?: string | null
  }
  Relationships: []
}

// Auth-related database structure
export interface AuthTables {
  users: UsersTable
}

export interface AuthEnums {
  user_role: UserRole
}

// Convenience type exports
export type User = UsersTable['Row']
export type UserInsert = UsersTable['Insert']
export type UserUpdate = UsersTable['Update']

// Constants for auth enums
export const AuthConstants = {
  user_role: ['parent', 'child', 'admin'] as const,
} as const
