import { getAuthClient } from '@/lib/auth/supabase'
import type {
  UploadedFile,
  CreateUploadedFileData,
  UpdateUploadedFileData,
  UploadedFileFilters,
  UploadedFileWithAssociations,
} from '@/lib/types/uploaded-files'

// Re-export types for convenience
export type {
  UploadedFile,
  CreateUploadedFileData,
  UpdateUploadedFileData,
  UploadedFileFilters,
  UploadedFileWithAssociations,
} from '@/lib/types/uploaded-files'

/**
 * Create a new uploaded file record in the database
 */
export async function createUploadedFile(
  data: CreateUploadedFileData
): Promise<UploadedFile> {
  const supabase = getAuthClient()

  const { data: uploadedFile, error } = await supabase
    .from('uploaded_files')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating uploaded file:', error)
    throw new Error(`Failed to create uploaded file: ${error.message}`)
  }

  return uploadedFile
}

/**
 * Get uploaded files for the current user with optional filters
 */
export async function getUploadedFiles(
  filters: UploadedFileFilters = {}
): Promise<UploadedFile[]> {
  const supabase = getAuthClient()

  let query = supabase
    .from('uploaded_files')
    .select('*')
    .eq('is_active', filters.is_active ?? true)
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.upload_type) {
    query = query.eq('upload_type', filters.upload_type)
  }

  if (filters.validation_type) {
    query = query.eq('validation_type', filters.validation_type)
  }

  if (filters.associated_entity_type) {
    query = query.eq('associated_entity_type', filters.associated_entity_type)
  }

  if (filters.associated_entity_id) {
    query = query.eq('associated_entity_id', filters.associated_entity_id)
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after)
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before)
  }

  const { data: uploadedFiles, error } = await query

  if (error) {
    console.error('Error fetching uploaded files:', error)
    throw new Error(`Failed to fetch uploaded files: ${error.message}`)
  }

  return uploadedFiles || []
}

/**
 * Get a single uploaded file by ID
 */
export async function getUploadedFileById(
  id: string
): Promise<UploadedFile | null> {
  const supabase = getAuthClient()

  const { data: uploadedFile, error } = await supabase
    .from('uploaded_files')
    .select('*')
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned
      return null
    }
    console.error('Error fetching uploaded file:', error)
    throw new Error(`Failed to fetch uploaded file: ${error.message}`)
  }

  return uploadedFile
}

/**
 * Get uploaded files with associated entity data
 */
export async function getUploadedFilesWithAssociations(
  filters: UploadedFileFilters = {}
): Promise<UploadedFileWithAssociations[]> {
  const supabase = getAuthClient()

  let query = supabase
    .from('uploaded_files')
    .select(
      `
      *,
      user:users!uploaded_files_user_id_fkey(id, email, full_name)
    `
    )
    .eq('is_active', filters.is_active ?? true)
    .order('created_at', { ascending: false })

  // Apply filters (same as getUploadedFiles)
  if (filters.upload_type) {
    query = query.eq('upload_type', filters.upload_type)
  }

  if (filters.validation_type) {
    query = query.eq('validation_type', filters.validation_type)
  }

  if (filters.associated_entity_type) {
    query = query.eq('associated_entity_type', filters.associated_entity_type)
  }

  if (filters.associated_entity_id) {
    query = query.eq('associated_entity_id', filters.associated_entity_id)
  }

  if (filters.created_after) {
    query = query.gte('created_at', filters.created_after)
  }

  if (filters.created_before) {
    query = query.lte('created_at', filters.created_before)
  }

  const { data: uploadedFiles, error } = await query

  if (error) {
    console.error('Error fetching uploaded files with associations:', error)
    throw new Error(
      `Failed to fetch uploaded files with associations: ${error.message}`
    )
  }

  return uploadedFiles || []
}

/**
 * Update an uploaded file record
 */
export async function updateUploadedFile(
  id: string,
  data: UpdateUploadedFileData
): Promise<UploadedFile> {
  const supabase = getAuthClient()

  const { data: uploadedFile, error } = await supabase
    .from('uploaded_files')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating uploaded file:', error)
    throw new Error(`Failed to update uploaded file: ${error.message}`)
  }

  return uploadedFile
}

/**
 * Soft delete an uploaded file (set is_active to false)
 */
export async function deleteUploadedFile(id: string): Promise<void> {
  const supabase = getAuthClient()

  const { error } = await supabase
    .from('uploaded_files')
    .update({ is_active: false })
    .eq('id', id)

  if (error) {
    console.error('Error deleting uploaded file:', error)
    throw new Error(`Failed to delete uploaded file: ${error.message}`)
  }
}

/**
 * Hard delete an uploaded file (permanently remove from database)
 */
export async function hardDeleteUploadedFile(id: string): Promise<void> {
  const supabase = getAuthClient()

  const { error } = await supabase.from('uploaded_files').delete().eq('id', id)

  if (error) {
    console.error('Error hard deleting uploaded file:', error)
    throw new Error(`Failed to hard delete uploaded file: ${error.message}`)
  }
}

/**
 * Associate a file with an entity (user, child_profile, book, book_page)
 */
export async function associateFileWithEntity(
  fileId: string,
  entityType: 'user' | 'child_profile' | 'book' | 'book_page',
  entityId: string
): Promise<UploadedFile> {
  return updateUploadedFile(fileId, {
    associated_entity_type: entityType,
    associated_entity_id: entityId,
  })
}

/**
 * Get files associated with a specific entity
 */
export async function getFilesForEntity(
  entityType: 'user' | 'child_profile' | 'book' | 'book_page',
  entityId: string,
  uploadType?: 'general' | 'child_photo' | 'avatar'
): Promise<UploadedFile[]> {
  const filters: UploadedFileFilters = {
    associated_entity_type: entityType,
    associated_entity_id: entityId,
  }

  if (uploadType) {
    filters.upload_type = uploadType
  }

  return getUploadedFiles(filters)
}

/**
 * Get upload statistics
 */
export async function getUploadStatistics(): Promise<{
  totalFiles: number
  totalSize: number
  filesByType: Record<string, number>
  recentUploads: number
}> {
  const supabase = getAuthClient()

  // Get all active files for the current user
  const { data: files, error } = await supabase
    .from('uploaded_files')
    .select('file_size, upload_type, created_at')
    .eq('is_active', true)

  if (error) {
    console.error('Error fetching upload statistics:', error)
    throw new Error(`Failed to fetch upload statistics: ${error.message}`)
  }

  const totalFiles = files?.length || 0
  const totalSize =
    files?.reduce((sum, file) => sum + (file.file_size || 0), 0) || 0

  const filesByType: Record<string, number> = {}
  files?.forEach(file => {
    filesByType[file.upload_type] = (filesByType[file.upload_type] || 0) + 1
  })

  // Count files uploaded in the last 7 days
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentUploads =
    files?.filter(file => new Date(file.created_at!) > weekAgo).length || 0

  return {
    totalFiles,
    totalSize,
    filesByType,
    recentUploads,
  }
}
