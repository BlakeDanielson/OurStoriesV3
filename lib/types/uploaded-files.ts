import type { Tables } from './database'

// Use the database-generated types as the base
export type UploadedFile = Tables<'uploaded_files'>

export interface CreateUploadedFileData {
  user_id: string
  file_url: string
  file_name: string
  file_size?: number | null
  file_type?: string | null
  upload_type: 'general' | 'child_photo' | 'avatar'
  validation_type: string
  uploadthing_key?: string | null
  uploadthing_file_id?: string | null
  metadata?: Record<string, any> | null
  associated_entity_type?:
    | 'user'
    | 'child_profile'
    | 'book'
    | 'book_page'
    | null
  associated_entity_id?: string | null
}

export interface UpdateUploadedFileData {
  file_name?: string
  metadata?: Record<string, any> | null
  associated_entity_type?:
    | 'user'
    | 'child_profile'
    | 'book'
    | 'book_page'
    | null
  associated_entity_id?: string | null
  is_active?: boolean
}

export interface UploadedFileFilters {
  upload_type?: 'general' | 'child_photo' | 'avatar'
  validation_type?: string
  associated_entity_type?: 'user' | 'child_profile' | 'book' | 'book_page'
  associated_entity_id?: string
  is_active?: boolean
  created_after?: string
  created_before?: string
}

export interface UploadedFileWithAssociations extends UploadedFile {
  // Optional associated entity data
  user?: {
    id: string
    email: string
    full_name: string | null
  }
}
