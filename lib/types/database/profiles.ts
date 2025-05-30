import type { Json } from './common'

// Child Profiles table types
export interface ChildProfilesTable {
  Row: {
    age: number | null
    avatar_url: string | null
    created_at: string | null
    favorite_characters: string[] | null
    id: string
    interests: string[] | null
    name: string
    parent_id: string
    preferences: Json | null
    reading_level: string | null
    updated_at: string | null
  }
  Insert: {
    age?: number | null
    avatar_url?: string | null
    created_at?: string | null
    favorite_characters?: string[] | null
    id?: string
    interests?: string[] | null
    name: string
    parent_id: string
    preferences?: Json | null
    reading_level?: string | null
    updated_at?: string | null
  }
  Update: {
    age?: number | null
    avatar_url?: string | null
    created_at?: string | null
    favorite_characters?: string[] | null
    id?: string
    interests?: string[] | null
    name?: string
    parent_id?: string
    preferences?: Json | null
    reading_level?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: 'child_profiles_parent_id_fkey'
      columns: ['parent_id']
      isOneToOne: false
      referencedRelation: 'users'
      referencedColumns: ['id']
    },
  ]
}

// Profiles-related database structure
export interface ProfilesTables {
  child_profiles: ChildProfilesTable
}

// Convenience type exports
export type ChildProfile = ChildProfilesTable['Row']
export type ChildProfileInsert = ChildProfilesTable['Insert']
export type ChildProfileUpdate = ChildProfilesTable['Update']
