export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      book_pages: {
        Row: {
          ai_metadata: Json | null
          audio_url: string | null
          book_id: string
          content: string
          created_at: string | null
          id: string
          image_prompt: string | null
          image_url: string | null
          page_number: number
          page_type: string | null
          updated_at: string | null
        }
        Insert: {
          ai_metadata?: Json | null
          audio_url?: string | null
          book_id: string
          content: string
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          page_number: number
          page_type?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_metadata?: Json | null
          audio_url?: string | null
          book_id?: string
          content?: string
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          page_number?: number
          page_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'book_pages_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
        ]
      }
      books: {
        Row: {
          ai_prompt: string | null
          child_profile_id: string
          completed_at: string | null
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          estimated_reading_time: number | null
          generation_settings: Json | null
          genre: string | null
          id: string
          metadata: Json | null
          status: Database['public']['Enums']['book_status'] | null
          themes: string[] | null
          title: string
          total_pages: number | null
          updated_at: string | null
        }
        Insert: {
          ai_prompt?: string | null
          child_profile_id: string
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          estimated_reading_time?: number | null
          generation_settings?: Json | null
          genre?: string | null
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['book_status'] | null
          themes?: string[] | null
          title: string
          total_pages?: number | null
          updated_at?: string | null
        }
        Update: {
          ai_prompt?: string | null
          child_profile_id?: string
          completed_at?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          estimated_reading_time?: number | null
          generation_settings?: Json | null
          genre?: string | null
          id?: string
          metadata?: Json | null
          status?: Database['public']['Enums']['book_status'] | null
          themes?: string[] | null
          title?: string
          total_pages?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'books_child_profile_id_fkey'
            columns: ['child_profile_id']
            isOneToOne: false
            referencedRelation: 'child_profiles'
            referencedColumns: ['id']
          },
        ]
      }
      child_profiles: {
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
      uploaded_files: {
        Row: {
          associated_entity_id: string | null
          associated_entity_type: string | null
          created_at: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean
          metadata: Json | null
          updated_at: string | null
          upload_type: string
          uploadthing_file_id: string | null
          uploadthing_key: string | null
          user_id: string
          validation_type: string
        }
        Insert: {
          associated_entity_id?: string | null
          associated_entity_type?: string | null
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string | null
          upload_type: string
          uploadthing_file_id?: string | null
          uploadthing_key?: string | null
          user_id: string
          validation_type: string
        }
        Update: {
          associated_entity_id?: string | null
          associated_entity_type?: string | null
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean
          metadata?: Json | null
          updated_at?: string | null
          upload_type?: string
          uploadthing_file_id?: string | null
          uploadthing_key?: string | null
          user_id?: string
          validation_type?: string
        }
        Relationships: [
          {
            foreignKeyName: 'uploaded_files_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_feedback: {
        Row: {
          book_id: string
          child_profile_id: string | null
          comment: string | null
          created_at: string | null
          favorite_pages: number[] | null
          id: string
          rating: number | null
          reading_progress: Json | null
          reading_status: Database['public']['Enums']['reading_status'] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          book_id: string
          child_profile_id?: string | null
          comment?: string | null
          created_at?: string | null
          favorite_pages?: number[] | null
          id?: string
          rating?: number | null
          reading_progress?: Json | null
          reading_status?: Database['public']['Enums']['reading_status'] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          book_id?: string
          child_profile_id?: string | null
          comment?: string | null
          created_at?: string | null
          favorite_pages?: number[] | null
          id?: string
          rating?: number | null
          reading_progress?: Json | null
          reading_status?: Database['public']['Enums']['reading_status'] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_feedback_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_feedback_child_profile_id_fkey'
            columns: ['child_profile_id']
            isOneToOne: false
            referencedRelation: 'child_profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_feedback_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          role: Database['public']['Enums']['user_role'] | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          role?: Database['public']['Enums']['user_role'] | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          role?: Database['public']['Enums']['user_role'] | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_books_with_progress: {
        Args: { user_id: string; child_profile_id?: string }
        Returns: {
          id: string
          title: string
          description: string
          status: Database['public']['Enums']['book_status']
          cover_image_url: string
          total_pages: number
          estimated_reading_time: number
          genre: string
          themes: string[]
          child_name: string
          child_id: string
          reading_status: Database['public']['Enums']['reading_status']
          rating: number
          reading_progress: Json
          created_at: string
          completed_at: string
        }[]
      }
      get_children_with_book_counts: {
        Args: { parent_user_id: string }
        Returns: {
          id: string
          name: string
          age: number
          interests: string[]
          favorite_characters: string[]
          reading_level: string
          avatar_url: string
          book_count: number
          completed_books: number
          created_at: string
        }[]
      }
      get_reading_statistics: {
        Args: { user_id: string }
        Returns: {
          total_books: number
          completed_books: number
          in_progress_books: number
          total_children: number
          favorite_genres: string[]
          total_reading_time: number
          books_this_month: number
        }[]
      }
      search_books: {
        Args: {
          user_id: string
          search_term: string
          genre_filter?: string
          child_filter?: string
          status_filter?: Database['public']['Enums']['book_status']
        }
        Returns: {
          id: string
          title: string
          description: string
          status: Database['public']['Enums']['book_status']
          cover_image_url: string
          genre: string
          child_name: string
          created_at: string
        }[]
      }
      update_book_status: {
        Args: {
          book_id: string
          new_status: Database['public']['Enums']['book_status']
          total_pages_count?: number
        }
        Returns: boolean
      }
    }
    Enums: {
      book_status: 'draft' | 'generating' | 'completed' | 'failed'
      reading_status: 'not_started' | 'in_progress' | 'completed'
      user_role: 'parent' | 'child' | 'admin'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      book_status: ['draft', 'generating', 'completed', 'failed'],
      reading_status: ['not_started', 'in_progress', 'completed'],
      user_role: ['parent', 'child', 'admin'],
    },
  },
} as const

// Convenience type exports
export type User = Tables<'users'>
export type ChildProfile = Tables<'child_profiles'>
export type Book = Tables<'books'>
export type BookPage = Tables<'book_pages'>
export type UserFeedback = Tables<'user_feedback'>
export type UploadedFile = Tables<'uploaded_files'>

export type BookStatus = Database['public']['Enums']['book_status']
export type ReadingStatus = Database['public']['Enums']['reading_status']
export type UserRole = Database['public']['Enums']['user_role']
