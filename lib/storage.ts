import {
  createBrowserSupabaseClient,
  createAdminSupabaseClient,
} from './supabase'
import { createServerSupabaseClient } from './supabase-server'
import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from './types/database'

// Storage bucket names
export const STORAGE_BUCKETS = {
  BOOK_COVERS: 'book-covers',
  BOOK_IMAGES: 'book-images',
  BOOK_AUDIO: 'book-audio',
  AVATARS: 'avatars',
} as const

// File naming conventions
export const generateFileName = (
  type: 'cover' | 'page' | 'audio' | 'avatar',
  bookId?: string,
  pageNumber?: number,
  userId?: string,
  childId?: string
): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)

  switch (type) {
    case 'cover':
      return `${bookId}/cover_${timestamp}_${random}.webp`
    case 'page':
      return `${bookId}/page_${pageNumber}_${timestamp}_${random}.webp`
    case 'audio':
      return `${bookId}/audio_page_${pageNumber}_${timestamp}_${random}.mp3`
    case 'avatar':
      return `${userId || childId}/avatar_${timestamp}_${random}.webp`
    default:
      return `misc/${timestamp}_${random}`
  }
}

// File validation
export const validateFile = (
  file: File,
  type: 'image' | 'audio'
): { valid: boolean; error?: string } => {
  const maxSizes = {
    image: 10 * 1024 * 1024, // 10MB
    audio: 50 * 1024 * 1024, // 50MB
  }

  const allowedTypes = {
    image: ['image/jpeg', 'image/png', 'image/webp'],
    audio: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
  }

  if (file.size > maxSizes[type]) {
    return {
      valid: false,
      error: `File size exceeds ${type === 'image' ? '10MB' : '50MB'} limit`,
    }
  }

  if (!allowedTypes[type].includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${allowedTypes[type].join(', ')}`,
    }
  }

  return { valid: true }
}

// Storage operations class
export class StorageOperations {
  private supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  // Upload book cover image
  async uploadBookCover(
    bookId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ data?: { path: string; url: string }; error?: string }> {
    const validation = validateFile(file, 'image')
    if (!validation.valid) {
      return { error: validation.error }
    }

    const fileName = generateFileName('cover', bookId)

    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.BOOK_COVERS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        return { error: error.message }
      }

      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.BOOK_COVERS)
        .getPublicUrl(fileName)

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
        },
      }
    } catch (error) {
      return {
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Upload book page image
  async uploadBookPageImage(
    bookId: string,
    pageNumber: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ data?: { path: string; url: string }; error?: string }> {
    const validation = validateFile(file, 'image')
    if (!validation.valid) {
      return { error: validation.error }
    }

    const fileName = generateFileName('page', bookId, pageNumber)

    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.BOOK_IMAGES)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        return { error: error.message }
      }

      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.BOOK_IMAGES)
        .getPublicUrl(fileName)

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
        },
      }
    } catch (error) {
      return {
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Upload audio file
  async uploadBookAudio(
    bookId: string,
    pageNumber: number,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<{ data?: { path: string; url: string }; error?: string }> {
    const validation = validateFile(file, 'audio')
    if (!validation.valid) {
      return { error: validation.error }
    }

    const fileName = generateFileName('audio', bookId, pageNumber)

    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.BOOK_AUDIO)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        return { error: error.message }
      }

      // Note: Audio files are private, so we don't get public URL
      return {
        data: {
          path: data.path,
          url: data.path, // Will be accessed through signed URLs
        },
      }
    } catch (error) {
      return {
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Upload avatar image
  async uploadAvatar(
    userId: string,
    file: File,
    isChild: boolean = false
  ): Promise<{ data?: { path: string; url: string }; error?: string }> {
    const validation = validateFile(file, 'image')
    if (!validation.valid) {
      return { error: validation.error }
    }

    const fileName = generateFileName('avatar', undefined, undefined, userId)

    try {
      const { data, error } = await this.supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (error) {
        return { error: error.message }
      }

      const { data: urlData } = this.supabase.storage
        .from(STORAGE_BUCKETS.AVATARS)
        .getPublicUrl(fileName)

      return {
        data: {
          path: data.path,
          url: urlData.publicUrl,
        },
      }
    } catch (error) {
      return {
        error: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Batch upload multiple images
  async batchUploadImages(
    uploads: Array<{
      type: 'cover' | 'page'
      bookId: string
      pageNumber?: number
      file: File
    }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<{
    results: Array<{
      success: boolean
      data?: { path: string; url: string }
      error?: string
    }>
    totalSuccess: number
    totalFailed: number
  }> {
    const results = []
    let totalSuccess = 0
    let totalFailed = 0

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i]

      let result
      if (upload.type === 'cover') {
        result = await this.uploadBookCover(upload.bookId, upload.file)
      } else {
        result = await this.uploadBookPageImage(
          upload.bookId,
          upload.pageNumber!,
          upload.file
        )
      }

      if (result.error) {
        results.push({ success: false, error: result.error })
        totalFailed++
      } else {
        results.push({ success: true, data: result.data })
        totalSuccess++
      }

      onProgress?.(i + 1, uploads.length)
    }

    return { results, totalSuccess, totalFailed }
  }

  // Get signed URL for private files (audio)
  async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<{ data?: { signedUrl: string }; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn)

      if (error) {
        return { error: error.message }
      }

      return { data: { signedUrl: data.signedUrl } }
    } catch (error) {
      return {
        error: `Failed to create signed URL: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // Delete file
  async deleteFile(
    bucket: string,
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.storage.from(bucket).remove([path])

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return {
        success: false,
        error: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  // List files in a folder
  async listFiles(
    bucket: string,
    folder?: string
  ): Promise<{ data?: any[]; error?: string }> {
    try {
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .list(folder)

      if (error) {
        return { error: error.message }
      }

      return { data }
    } catch (error) {
      return {
        error: `List failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }
}

// Factory functions for different contexts
export const createBrowserStorageOperations = () => {
  const supabase = createBrowserSupabaseClient()
  return new StorageOperations(supabase)
}

export const createServerStorageOperations = () => {
  const supabase = createServerSupabaseClient()
  return new StorageOperations(supabase)
}

export const createAdminStorageOperations = () => {
  const supabase = createAdminSupabaseClient()
  return new StorageOperations(supabase)
}

// Helper function to convert File to base64 for AI services
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      const result = reader.result as string
      // Remove data:image/jpeg;base64, prefix
      const base64 = result.split(',')[1]
      resolve(base64)
    }
    reader.onerror = error => reject(error)
  })
}

// Helper function to create optimized image blob
export const optimizeImage = async (
  file: File,
  maxWidth: number = 1024,
  maxHeight: number = 1024,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to optimize image'))
          }
        },
        'image/webp',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

export default StorageOperations
