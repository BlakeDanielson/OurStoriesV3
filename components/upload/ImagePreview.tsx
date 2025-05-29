'use client'

import React, { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import {
  X,
  Eye,
  Download,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Move,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useImagePreviews } from '@/lib/hooks/useImagePreviews'
import { ImagePreview as ImagePreviewType } from '@/lib/utils/image-preview'
import { formatFileSize } from '@/lib/utils/image-preview'
import { cn } from '@/lib/utils'

export interface ImagePreviewProps {
  files?: File[]
  onFilesChange?: (files: File[]) => void
  maxFiles?: number
  className?: string
  showThumbnails?: boolean
  allowRemove?: boolean
  allowReorder?: boolean
  gridCols?: 2 | 3 | 4 | 5 | 6
  thumbnailSize?: 'sm' | 'md' | 'lg'
}

export function ImagePreview({
  files = [],
  onFilesChange,
  maxFiles,
  className,
  showThumbnails = true,
  allowRemove = true,
  allowReorder = false,
  gridCols = 3,
  thumbnailSize = 'md',
}: ImagePreviewProps) {
  const [selectedPreview, setSelectedPreview] =
    useState<ImagePreviewType | null>(null)
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { previews, isLoading, error, addFiles, removePreview, clearPreviews } =
    useImagePreviews({
      generateThumbnails: showThumbnails,
      maxFiles,
      thumbnailOptions: {
        maxWidth:
          thumbnailSize === 'sm' ? 150 : thumbnailSize === 'md' ? 200 : 300,
        maxHeight:
          thumbnailSize === 'sm' ? 150 : thumbnailSize === 'md' ? 200 : 300,
        quality: 0.8,
      },
    })

  // Initialize previews from files prop
  React.useEffect(() => {
    if (files.length > 0 && previews.length === 0) {
      addFiles(files)
    }
  }, [files, addFiles, previews.length])

  // Notify parent of file changes
  React.useEffect(() => {
    const currentFiles = previews
      .filter(p => !p.error && !p.isLoading)
      .map(p => p.file)

    if (onFilesChange && currentFiles.length !== files.length) {
      onFilesChange(currentFiles)
    }
  }, [previews, onFilesChange, files.length])

  const handleRemove = useCallback(
    (index: number) => {
      removePreview(index)
    },
    [removePreview]
  )

  const handleFileSelect = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || [])
      if (selectedFiles.length > 0) {
        addFiles(selectedFiles)
      }
      // Reset input
      event.target.value = ''
    },
    [addFiles]
  )

  // Drag and drop handlers
  const handleDragStart = useCallback(
    (index: number) => {
      if (allowReorder) {
        setDraggedIndex(index)
      }
    },
    [allowReorder]
  )

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent, dropIndex: number) => {
      event.preventDefault()

      if (draggedIndex !== null && draggedIndex !== dropIndex && allowReorder) {
        // Reorder logic would go here
        // For now, we'll just reset the dragged index
        setDraggedIndex(null)
      }
    },
    [draggedIndex, allowReorder]
  )

  const getThumbnailSize = () => {
    switch (thumbnailSize) {
      case 'sm':
        return 'w-24 h-24'
      case 'lg':
        return 'w-48 h-48'
      default:
        return 'w-32 h-32'
    }
  }

  const getGridCols = () => {
    switch (gridCols) {
      case 2:
        return 'grid-cols-2'
      case 3:
        return 'grid-cols-3'
      case 4:
        return 'grid-cols-4'
      case 5:
        return 'grid-cols-5'
      case 6:
        return 'grid-cols-6'
      default:
        return 'grid-cols-3'
    }
  }

  if (previews.length === 0 && !isLoading) {
    return (
      <div
        className={cn(
          'border-2 border-dashed border-gray-300 rounded-lg p-8 text-center',
          className
        )}
      >
        <div className="space-y-4">
          <div className="text-gray-500">
            <Eye className="mx-auto h-12 w-12 mb-2" />
            <p>No images to preview</p>
            <p className="text-sm">Add some files to see previews here</p>
          </div>
          <Button onClick={handleFileSelect} variant="outline">
            Select Images
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Processing images...</span>
          </div>
        </div>
      )}

      {/* Preview Grid */}
      {previews.length > 0 && (
        <div className={cn('grid gap-4', getGridCols())}>
          {previews.map((preview, index) => (
            <PreviewCard
              key={`${preview.file.name}-${index}`}
              preview={preview}
              index={index}
              thumbnailSize={getThumbnailSize()}
              allowRemove={allowRemove}
              allowReorder={allowReorder}
              onRemove={() => handleRemove(index)}
              onView={() => setSelectedPreview(preview)}
              onDragStart={() => handleDragStart(index)}
              onDragOver={handleDragOver}
              onDrop={e => handleDrop(e, index)}
              isDragged={draggedIndex === index}
            />
          ))}
        </div>
      )}

      {/* Actions */}
      {previews.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            {previews.length} image{previews.length !== 1 ? 's' : ''} selected
            {maxFiles && ` (max ${maxFiles})`}
          </div>
          <div className="space-x-2">
            <Button onClick={handleFileSelect} variant="outline" size="sm">
              Add More
            </Button>
            <Button onClick={clearPreviews} variant="outline" size="sm">
              Clear All
            </Button>
          </div>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Full-size preview modal */}
      <ImagePreviewModal
        preview={selectedPreview}
        onClose={() => setSelectedPreview(null)}
      />
    </div>
  )
}

interface PreviewCardProps {
  preview: ImagePreviewType
  index: number
  thumbnailSize: string
  allowRemove: boolean
  allowReorder: boolean
  onRemove: () => void
  onView: () => void
  onDragStart: () => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
  isDragged: boolean
}

function PreviewCard({
  preview,
  index,
  thumbnailSize,
  allowRemove,
  allowReorder,
  onRemove,
  onView,
  onDragStart,
  onDragOver,
  onDrop,
  isDragged,
}: PreviewCardProps) {
  const imageUrl = preview.thumbnail || preview.url

  return (
    <Card
      className={cn(
        'relative group transition-all duration-200',
        isDragged && 'opacity-50 scale-95',
        allowReorder && 'cursor-move'
      )}
      draggable={allowReorder}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <CardContent className="p-2">
        <div
          className={cn(
            'relative overflow-hidden rounded-lg bg-gray-100',
            thumbnailSize
          )}
        >
          {preview.isLoading ? (
            <Skeleton className="w-full h-full" />
          ) : preview.error ? (
            <div className="w-full h-full flex items-center justify-center bg-red-50">
              <div className="text-center p-2">
                <X className="h-6 w-6 text-red-500 mx-auto mb-1" />
                <p className="text-xs text-red-600">Error</p>
              </div>
            </div>
          ) : (
            <>
              <Image
                src={imageUrl}
                alt={preview.file.name}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />

              {/* Overlay with actions */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 space-x-1">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={onView}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {allowRemove && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={onRemove}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* File info badge */}
              <div className="absolute bottom-1 left-1 right-1">
                <Badge variant="secondary" className="text-xs truncate">
                  {formatFileSize(preview.file.size)}
                </Badge>
              </div>

              {/* Dimensions badge */}
              {preview.dimensions && (
                <div className="absolute top-1 right-1">
                  <Badge variant="outline" className="text-xs">
                    {preview.dimensions.width}×{preview.dimensions.height}
                  </Badge>
                </div>
              )}
            </>
          )}
        </div>

        {/* File name */}
        <p
          className="text-xs text-gray-600 mt-2 truncate"
          title={preview.file.name}
        >
          {preview.file.name}
        </p>
      </CardContent>
    </Card>
  )
}

interface ImagePreviewModalProps {
  preview: ImagePreviewType | null
  onClose: () => void
}

function ImagePreviewModal({ preview, onClose }: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  if (!preview) return null

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = preview.url
    link.download = preview.file.name
    link.click()
  }

  const resetTransforms = () => {
    setZoom(1)
    setRotation(0)
  }

  return (
    <Dialog open={!!preview} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{preview.file.name}</span>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(0.25, z - 0.25))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(3, z + 0.25))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRotation(r => r + 90)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={resetTransforms}>
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="relative overflow-auto max-h-[70vh] p-6">
          <div className="flex justify-center">
            <Image
              src={preview.url}
              alt={preview.file.name}
              width={preview.dimensions?.width || 800}
              height={preview.dimensions?.height || 600}
              className="max-w-full h-auto transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
                transformOrigin: 'center',
              }}
            />
          </div>
        </div>

        <div className="p-6 pt-0 border-t bg-gray-50">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="font-medium">Size:</span>
              <p className="text-gray-600">
                {formatFileSize(preview.file.size)}
              </p>
            </div>
            <div>
              <span className="font-medium">Type:</span>
              <p className="text-gray-600">{preview.file.type}</p>
            </div>
            {preview.dimensions && (
              <div>
                <span className="font-medium">Dimensions:</span>
                <p className="text-gray-600">
                  {preview.dimensions.width} × {preview.dimensions.height}
                </p>
              </div>
            )}
            <div>
              <span className="font-medium">Modified:</span>
              <p className="text-gray-600">
                {new Date(preview.file.lastModified).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
