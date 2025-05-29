'use client'

import React, { useState, useRef, useCallback } from 'react'
import {
  Upload,
  X,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'
import { Button } from './button'
import { Progress } from './progress'
import { Alert, AlertDescription } from './alert'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  onUpload: (
    file: File
  ) => Promise<{ success: boolean; url?: string; error?: string }>
  onSuccess?: (url: string) => void
  onError?: (error: string) => void
  accept?: string
  maxSize?: number // in MB
  className?: string
  disabled?: boolean
  placeholder?: string
  showPreview?: boolean
}

export function ImageUpload({
  onUpload,
  onSuccess,
  onError,
  accept = 'image/jpeg,image/png,image/webp',
  maxSize = 10,
  className,
  disabled = false,
  placeholder = 'Click to upload or drag and drop',
  showPreview = true,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith('image/')) {
        return 'Please select an image file'
      }

      const allowedTypes = accept.split(',').map(type => type.trim())
      if (!allowedTypes.includes(file.type)) {
        return `File type not supported. Allowed: ${allowedTypes.join(', ')}`
      }

      if (file.size > maxSize * 1024 * 1024) {
        return `File size must be less than ${maxSize}MB`
      }

      return null
    },
    [accept, maxSize]
  )

  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null)
      setSuccess(false)

      const validationError = validateFile(file)
      if (validationError) {
        setError(validationError)
        onError?.(validationError)
        return
      }

      // Show preview
      if (showPreview) {
        const reader = new FileReader()
        reader.onload = e => {
          setPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }

      // Upload file
      setIsUploading(true)
      setUploadProgress(0)

      try {
        // Simulate progress for better UX
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => Math.min(prev + 10, 90))
        }, 100)

        const result = await onUpload(file)

        clearInterval(progressInterval)
        setUploadProgress(100)

        if (result.success && result.url) {
          setSuccess(true)
          onSuccess?.(result.url)
        } else {
          const errorMsg = result.error || 'Upload failed'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Upload failed'
        setError(errorMsg)
        onError?.(errorMsg)
      } finally {
        setIsUploading(false)
        setTimeout(() => setUploadProgress(0), 1000)
      }
    },
    [onUpload, onSuccess, onError, validateFile, showPreview]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled]
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [disabled, handleFileSelect]
  )

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFileSelect(files[0])
      }
    },
    [handleFileSelect]
  )

  const handleClick = useCallback(() => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }, [disabled, isUploading])

  const clearPreview = useCallback(() => {
    setPreview(null)
    setError(null)
    setSuccess(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  return (
    <div className={cn('w-full', className)}>
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging && 'border-primary bg-primary/10',
          disabled && 'opacity-50 cursor-not-allowed',
          error && 'border-destructive',
          success && 'border-green-500'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded-lg"
            />
            <Button
              variant="outline"
              size="sm"
              className="absolute top-2 right-2"
              onClick={e => {
                e.stopPropagation()
                clearPreview()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
              {isUploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
              ) : success ? (
                <CheckCircle className="h-12 w-12 text-green-500" />
              ) : error ? (
                <AlertCircle className="h-12 w-12 text-destructive" />
              ) : (
                <ImageIcon className="h-12 w-12" />
              )}
            </div>

            <div className="text-sm text-muted-foreground mb-2">
              {isUploading ? 'Uploading...' : placeholder}
            </div>

            <div className="text-xs text-muted-foreground">
              {accept
                .split(',')
                .map(type => type.replace('image/', ''))
                .join(', ')
                .toUpperCase()}{' '}
              up to {maxSize}MB
            </div>
          </div>
        )}

        {isUploading && (
          <div className="mt-4">
            <Progress value={uploadProgress} className="w-full" />
            <div className="text-xs text-center mt-1 text-muted-foreground">
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>

      {error && (
        <Alert variant="destructive" className="mt-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mt-4 border-green-500 text-green-700">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>Image uploaded successfully!</AlertDescription>
        </Alert>
      )}
    </div>
  )
}

export default ImageUpload
