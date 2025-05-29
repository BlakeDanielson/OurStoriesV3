'use client'

import React, { useCallback, useState, useRef } from 'react'
import { Upload, Image as ImageIcon, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ImagePreview } from '@/components/upload/ImagePreview'
import { useImagePreviews } from '@/lib/hooks/useImagePreviews'
import { validateImageFile } from '@/lib/utils/image-preview'
import { cn } from '@/lib/utils'

export interface DragDropImageUploadProps {
  onFilesSelected?: (files: File[]) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
  className?: string
  disabled?: boolean
  showPreviews?: boolean
  previewGridCols?: 2 | 3 | 4 | 5 | 6
  previewThumbnailSize?: 'sm' | 'md' | 'lg'
  allowRemove?: boolean
  allowReorder?: boolean
  placeholder?: {
    title?: string
    subtitle?: string
    icon?: React.ReactNode
  }
}

export function DragDropImageUpload({
  onFilesSelected,
  maxFiles = 10,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className,
  disabled = false,
  showPreviews = true,
  previewGridCols = 3,
  previewThumbnailSize = 'md',
  allowRemove = true,
  allowReorder = false,
  placeholder = {},
}: DragDropImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    previews,
    isLoading,
    error: previewError,
    addFiles,
    removePreview,
    clearPreviews,
    getValidFiles,
  } = useImagePreviews({
    generateThumbnails: showPreviews,
    maxFiles,
    thumbnailOptions: {
      maxWidth:
        previewThumbnailSize === 'sm'
          ? 150
          : previewThumbnailSize === 'md'
            ? 200
            : 300,
      maxHeight:
        previewThumbnailSize === 'sm'
          ? 150
          : previewThumbnailSize === 'md'
            ? 200
            : 300,
      quality: 0.8,
    },
  })

  // Notify parent when files change
  React.useEffect(() => {
    const validFiles = getValidFiles()
    if (onFilesSelected && validFiles.length > 0) {
      onFilesSelected(validFiles)
    }
  }, [previews, onFilesSelected, getValidFiles])

  const validateFiles = useCallback(
    (files: File[]): { valid: File[]; errors: string[] } => {
      const valid: File[] = []
      const errors: string[] = []

      for (const file of files) {
        // Check file type
        if (!acceptedTypes.includes(file.type)) {
          errors.push(
            `${file.name}: Unsupported file type. Accepted: ${acceptedTypes.join(', ')}`
          )
          continue
        }

        // Check file size
        if (file.size > maxFileSize) {
          const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
          errors.push(
            `${file.name}: File too large. Maximum size: ${maxSizeMB}MB`
          )
          continue
        }

        // Additional image validation
        const validation = validateImageFile(file)
        if (!validation.isValid) {
          errors.push(`${file.name}: ${validation.error}`)
          continue
        }

        valid.push(file)
      }

      // Check total file count
      if (previews.length + valid.length > maxFiles) {
        const allowedCount = maxFiles - previews.length
        errors.push(
          `Cannot add ${valid.length} files. Only ${allowedCount} more files allowed (max ${maxFiles} total).`
        )
        return { valid: valid.slice(0, allowedCount), errors }
      }

      return { valid, errors }
    },
    [acceptedTypes, maxFileSize, maxFiles, previews.length]
  )

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return

      setUploadError(null)

      const { valid, errors } = validateFiles(files)

      if (errors.length > 0) {
        setUploadError(errors.join('\n'))
      }

      if (valid.length > 0) {
        await addFiles(valid)
      }
    },
    [disabled, validateFiles, addFiles]
  )

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY

    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragOver(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      handleFiles(files)
    },
    [disabled, handleFiles]
  )

  const handleFileSelect = useCallback(() => {
    if (disabled) return
    fileInputRef.current?.click()
  }, [disabled])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || [])
      if (files.length > 0) {
        handleFiles(files)
      }
      // Reset input
      e.target.value = ''
    },
    [handleFiles]
  )

  const {
    title = 'Drop images here or click to upload',
    subtitle = `Supports ${acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} up to ${Math.round(maxFileSize / (1024 * 1024))}MB`,
    icon = <Upload className="h-12 w-12 text-gray-400" />,
  } = placeholder

  const hasFiles = previews.length > 0
  const error = uploadError || previewError

  return (
    <div className={cn('space-y-4', className)}>
      {/* Drop Zone */}
      <Card
        className={cn(
          'relative transition-all duration-200 cursor-pointer',
          isDragOver && 'border-blue-500 bg-blue-50',
          disabled && 'opacity-50 cursor-not-allowed',
          hasFiles && 'border-dashed'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleFileSelect}
      >
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            {/* Icon */}
            <div className="flex justify-center">{icon}</div>

            {/* Text */}
            <div>
              <h3 className="text-lg font-medium text-gray-900">{title}</h3>
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            </div>

            {/* File count info */}
            {hasFiles && (
              <div className="text-sm text-gray-600">
                {previews.length} of {maxFiles} files selected
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-center space-x-2">
              <Button
                type="button"
                variant="outline"
                disabled={disabled}
                onClick={e => {
                  e.stopPropagation()
                  handleFileSelect()
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                {hasFiles ? 'Add More' : 'Select Files'}
              </Button>

              {hasFiles && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={disabled}
                  onClick={e => {
                    e.stopPropagation()
                    clearPreviews()
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              )}
            </div>

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-center">
                <div className="inline-flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600">
                    Processing images...
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Drag overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-blue-500 bg-opacity-10 border-2 border-blue-500 border-dashed rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Upload className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="text-blue-700 font-medium">Drop files here</p>
            </div>
          </div>
        )}
      </Card>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <X className="h-5 w-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" />
            <div>
              <h4 className="text-red-800 font-medium">Upload Error</h4>
              <pre className="text-red-700 text-sm mt-1 whitespace-pre-wrap">
                {error}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Image Previews */}
      {showPreviews && hasFiles && (
        <ImagePreview
          files={getValidFiles()}
          maxFiles={maxFiles}
          gridCols={previewGridCols}
          thumbnailSize={previewThumbnailSize}
          allowRemove={allowRemove}
          allowReorder={allowReorder}
          className="border-t pt-4"
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  )
}
