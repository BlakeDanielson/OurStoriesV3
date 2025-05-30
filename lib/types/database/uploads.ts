import type { Json } from './common'

// Uploaded Files table types
export interface UploadedFilesTable {
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

// Uploads-related database structure
export interface UploadsTables {
  uploaded_files: UploadedFilesTable
}

// Convenience type exports
export type UploadedFile = UploadedFilesTable['Row']
export type UploadedFileInsert = UploadedFilesTable['Insert']
export type UploadedFileUpdate = UploadedFilesTable['Update']
