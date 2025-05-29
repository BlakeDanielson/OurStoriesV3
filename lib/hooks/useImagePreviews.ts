import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ImagePreview,
  ThumbnailOptions,
  createImagePreviews,
  cleanupPreviews,
  validateImageFile,
} from '@/lib/utils/image-preview'

export interface UseImagePreviewsOptions {
  generateThumbnails?: boolean
  thumbnailOptions?: ThumbnailOptions
  maxFiles?: number
  autoCleanup?: boolean
}

export interface UseImagePreviewsReturn {
  previews: ImagePreview[]
  isLoading: boolean
  error: string | null
  addFiles: (files: File[]) => Promise<void>
  removePreview: (index: number) => void
  clearPreviews: () => void
  updatePreview: (index: number, updates: Partial<ImagePreview>) => void
  getValidFiles: () => File[]
  hasErrors: boolean
}

export function useImagePreviews(
  options: UseImagePreviewsOptions = {}
): UseImagePreviewsReturn {
  const {
    generateThumbnails = true,
    thumbnailOptions,
    maxFiles,
    autoCleanup = true,
  } = options

  const [previews, setPreviews] = useState<ImagePreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Keep track of previews for cleanup
  const previewsRef = useRef<ImagePreview[]>([])
  previewsRef.current = previews

  // Cleanup function
  const cleanup = useCallback(() => {
    if (previewsRef.current.length > 0) {
      cleanupPreviews(previewsRef.current)
    }
  }, [])

  // Auto cleanup on unmount
  useEffect(() => {
    if (autoCleanup) {
      return cleanup
    }
  }, [cleanup, autoCleanup])

  // Add files and generate previews
  const addFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      setIsLoading(true)
      setError(null)

      try {
        // Validate files first
        const validationResults = files.map(file => ({
          file,
          validation: validateImageFile(file),
        }))

        const invalidFiles = validationResults.filter(
          result => !result.validation.isValid
        )
        if (invalidFiles.length > 0) {
          const errorMessages = invalidFiles.map(
            result => `${result.file.name}: ${result.validation.error}`
          )
          throw new Error(`Invalid files:\n${errorMessages.join('\n')}`)
        }

        const validFiles = validationResults.map(result => result.file)

        // Check max files limit
        if (maxFiles && previews.length + validFiles.length > maxFiles) {
          throw new Error(
            `Cannot add ${validFiles.length} files. Maximum ${maxFiles} files allowed.`
          )
        }

        // Generate previews
        const newPreviews = await createImagePreviews(
          validFiles,
          generateThumbnails,
          thumbnailOptions
        )

        setPreviews(prev => [...prev, ...newPreviews])
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Failed to process files'
        setError(errorMessage)
        console.error('Error adding files:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [previews.length, maxFiles, generateThumbnails, thumbnailOptions]
  )

  // Remove a specific preview
  const removePreview = useCallback((index: number) => {
    setPreviews(prev => {
      const newPreviews = [...prev]
      const removedPreview = newPreviews.splice(index, 1)[0]

      // Cleanup the removed preview
      if (removedPreview?.url) {
        URL.revokeObjectURL(removedPreview.url)
      }

      return newPreviews
    })

    // Clear error if it was related to this file
    setError(null)
  }, [])

  // Clear all previews
  const clearPreviews = useCallback(() => {
    cleanup()
    setPreviews([])
    setError(null)
  }, [cleanup])

  // Update a specific preview
  const updatePreview = useCallback(
    (index: number, updates: Partial<ImagePreview>) => {
      setPreviews(prev => {
        const newPreviews = [...prev]
        if (newPreviews[index]) {
          newPreviews[index] = { ...newPreviews[index], ...updates }
        }
        return newPreviews
      })
    },
    []
  )

  // Get valid files (no errors)
  const getValidFiles = useCallback(() => {
    return previews
      .filter(preview => !preview.error && !preview.isLoading)
      .map(preview => preview.file)
  }, [previews])

  // Check if any previews have errors
  const hasErrors = previews.some(preview => preview.error)

  return {
    previews,
    isLoading,
    error,
    addFiles,
    removePreview,
    clearPreviews,
    updatePreview,
    getValidFiles,
    hasErrors,
  }
}
