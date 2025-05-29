import React, { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AlertCircle,
  Check,
  HelpCircle,
  ImagePlus,
  Trash2,
  Upload,
  X,
  Zap,
  Eye,
} from 'lucide-react'
import {
  optimizeImage,
  type OptimizationResult,
} from '@/lib/utils/imageOptimization'
import { ExamplePhotosGallery } from './ExamplePhotosGallery'

interface UseMultipleImageUploadProps {
  maxFiles?: number
  maxFileSize?: number // in MB
  onUpload?: (urls: string[]) => void
  allowedTypes?: string[]
  enableOptimization?: boolean
}

function useMultipleImageUpload({
  maxFiles = 5,
  maxFileSize = 4,
  onUpload,
  allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
  enableOptimization = true,
}: UseMultipleImageUploadProps = {}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [fileProgresses, setFileProgresses] = useState<Record<string, number>>(
    {}
  )
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [faceDetected, setFaceDetected] = useState<Record<string, boolean>>({})
  const [optimizationResults, setOptimizationResults] = useState<
    Record<string, OptimizationResult>
  >({})
  const [isDragging, setIsDragging] = useState(false)

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return 'File type not supported. Please upload an image (JPG, PNG, GIF).'
    }

    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size exceeds ${maxFileSize}MB limit.`
    }

    return null
  }

  const simulateFaceDetection = (imageUrl: string, fileName: string) => {
    // This is a simulation - in a real app, you would use a face detection API
    setTimeout(() => {
      // Random result for demo purposes - 70% chance of face detection success
      const hasFace = Math.random() > 0.3
      setFaceDetected(prev => ({ ...prev, [fileName]: hasFace }))

      if (!hasFace) {
        setErrors(prev => ({
          ...prev,
          [fileName]:
            'No face detected in the image. Please upload a photo with a clearly visible face.',
        }))
      }
    }, 1500)
  }

  const processFile = async (file: File) => {
    const fileName = file.name

    try {
      // Start with 0% progress
      setFileProgresses(prev => ({ ...prev, [fileName]: 0 }))

      let processedFile = file

      // Optimize image if enabled
      if (enableOptimization) {
        setFileProgresses(prev => ({ ...prev, [fileName]: 20 }))

        const optimizationResult = await optimizeImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.8,
          maxSizeKB: 500,
        })

        processedFile = optimizationResult.optimizedFile
        setOptimizationResults(prev => ({
          ...prev,
          [fileName]: optimizationResult,
        }))

        setFileProgresses(prev => ({ ...prev, [fileName]: 50 }))
      }

      // Create object URL for preview
      const url = URL.createObjectURL(processedFile)
      setFileUrls(prev => ({ ...prev, [fileName]: url }))

      // Simulate upload progress
      let progress = enableOptimization ? 50 : 0
      const interval = setInterval(() => {
        progress += Math.random() * 10
        if (progress >= 100) {
          progress = 100
          clearInterval(interval)

          // Simulate face detection after upload completes
          simulateFaceDetection(url, fileName)
        }
        setFileProgresses(prev => ({
          ...prev,
          [fileName]: Math.min(progress, 100),
        }))
      }, 300)
    } catch (error) {
      console.error(`Failed to process ${fileName}:`, error)
      setErrors(prev => ({
        ...prev,
        [fileName]: 'Failed to process image. Please try again.',
      }))
    }
  }

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files) return

      const newValidFiles: File[] = []
      const newErrors: Record<string, string> = {}

      Array.from(files).forEach(file => {
        const error = validateFile(file)

        if (error) {
          newErrors[file.name] = error
        } else if (uploadedFiles.length + newValidFiles.length >= maxFiles) {
          newErrors[file.name] = `Maximum ${maxFiles} files allowed.`
        } else if (uploadedFiles.some(f => f.name === file.name)) {
          newErrors[file.name] = 'File with this name already exists.'
        } else {
          newValidFiles.push(file)
        }
      })

      if (newValidFiles.length > 0) {
        setUploadedFiles(prev => [...prev, ...newValidFiles])

        // Process each file (optimization + upload simulation)
        newValidFiles.forEach(processFile)
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...newErrors }))
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [uploadedFiles, maxFiles, maxFileSize, allowedTypes, enableOptimization]
  )

  const handleThumbnailClick = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleRemove = useCallback(
    (fileName: string) => {
      setUploadedFiles(prev => prev.filter(file => file.name !== fileName))

      // Clean up URL object
      if (fileUrls[fileName]) {
        URL.revokeObjectURL(fileUrls[fileName])
        setFileUrls(prev => {
          const newUrls = { ...prev }
          delete newUrls[fileName]
          return newUrls
        })
      }

      // Clean up other state
      setFileProgresses(prev => {
        const newProgresses = { ...prev }
        delete newProgresses[fileName]
        return newProgresses
      })

      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fileName]
        return newErrors
      })

      setFaceDetected(prev => {
        const newDetections = { ...prev }
        delete newDetections[fileName]
        return newDetections
      })

      setOptimizationResults(prev => {
        const newResults = { ...prev }
        delete newResults[fileName]
        return newResults
      })
    },
    [fileUrls]
  )

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      handleFileSelect(e.dataTransfer.files)
    },
    [handleFileSelect]
  )

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(fileUrls).forEach(url => {
        URL.revokeObjectURL(url)
      })
    }
  }, [fileUrls])

  return {
    fileInputRef,
    uploadedFiles,
    fileProgresses,
    fileUrls,
    errors,
    faceDetected,
    optimizationResults,
    isDragging,
    handleThumbnailClick,
    handleFileSelect,
    handleRemove,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  }
}

interface UploadedPhotoItemProps {
  fileName: string
  fileUrl: string
  progress: number
  error?: string
  faceDetected?: boolean
  optimizationResult?: OptimizationResult
  onRemove: (fileName: string) => void
}

function UploadedPhotoItem({
  fileName,
  fileUrl,
  progress,
  error,
  faceDetected,
  optimizationResult,
  onRemove,
}: UploadedPhotoItemProps) {
  return (
    <div className="relative border rounded-lg overflow-hidden">
      <div className="group relative h-40 overflow-hidden">
        <img
          src={fileUrl}
          alt={fileName}
          className={cn(
            'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
            error && 'opacity-70'
          )}
        />

        {/* Progress overlay */}
        {progress < 100 && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <div className="w-3/4 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs text-white mt-2">
              {Math.round(progress)}%
            </span>
            {progress < 50 && optimizationResult && (
              <span className="text-xs text-white mt-1 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Optimizing...
              </span>
            )}
          </div>
        )}

        {/* Optimization indicator */}
        {optimizationResult && progress === 100 && (
          <div className="absolute top-2 left-2">
            <div className="bg-blue-500 rounded-full p-1">
              <Zap className="h-4 w-4 text-white" />
            </div>
          </div>
        )}

        {/* Face detection status */}
        {progress === 100 && faceDetected !== undefined && (
          <div className="absolute top-2 right-2">
            {faceDetected ? (
              <div className="bg-green-500 rounded-full p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
            ) : (
              <div className="bg-destructive rounded-full p-1">
                <X className="h-4 w-4 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Hover controls */}
        <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100 flex items-center justify-center">
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(fileName)}
            className="h-9 w-9 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File name and info */}
      <div className="p-2">
        <div className="flex items-center justify-between">
          <span className="text-sm truncate max-w-[180px]">{fileName}</span>
        </div>

        {/* Optimization info */}
        {optimizationResult && (
          <div className="mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-500" />
              <span>
                {(
                  (1 -
                    optimizationResult.optimizedSize /
                      optimizationResult.originalSize) *
                  100
                ).toFixed(0)}
                % smaller
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-1 flex items-start gap-1 text-xs text-destructive">
            <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface PhotoUploadProps {
  maxFiles?: number
  maxFileSize?: number
  onUpload?: (urls: string[]) => void
  enableOptimization?: boolean
}

export function PhotoUploadInterface({
  maxFiles = 5,
  maxFileSize = 4,
  onUpload,
  enableOptimization = true,
}: PhotoUploadProps) {
  const [showExamples, setShowExamples] = useState(false)

  const {
    fileInputRef,
    uploadedFiles,
    fileProgresses,
    fileUrls,
    errors,
    faceDetected,
    optimizationResults,
    isDragging,
    handleThumbnailClick,
    handleFileSelect,
    handleRemove,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    handleDrop,
  } = useMultipleImageUpload({
    maxFiles,
    maxFileSize,
    onUpload,
    enableOptimization,
  })

  return (
    <div className="w-full space-y-6">
      <Card className="w-full max-w-3xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium flex items-center gap-2">
                Photo Upload
                {enableOptimization && (
                  <div className="flex items-center gap-1 text-sm text-blue-600">
                    <Zap className="h-4 w-4" />
                    <span>Auto-optimize</span>
                  </div>
                )}
              </h3>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <div className="space-y-1">
                      <p className="font-medium">Upload Guidelines</p>
                      <ul className="text-xs space-y-1 list-disc pl-4">
                        <li>Upload up to {maxFiles} photos</li>
                        <li>Maximum file size: {maxFileSize}MB</li>
                        <li>Supported formats: JPG, PNG, GIF</li>
                        <li>Photos must contain a clearly visible face</li>
                        <li>Good lighting and clear focus recommended</li>
                        {enableOptimization && (
                          <li>
                            Images will be automatically optimized for web
                          </li>
                        )}
                      </ul>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              Upload photos with a clearly visible face. We'll verify each photo
              automatically.
              {enableOptimization &&
                ' Images will be optimized for faster loading.'}
            </p>
          </div>

          <Input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={e => handleFileSelect(e.target.files)}
            multiple
          />

          {/* Dropzone */}
          <div
            onClick={handleThumbnailClick}
            onDragOver={handleDragOver}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 p-6 transition-colors hover:bg-muted',
              isDragging && 'border-primary/50 bg-primary/5',
              uploadedFiles.length >= maxFiles &&
                'opacity-50 cursor-not-allowed'
            )}
          >
            <div className="rounded-full bg-background p-3 shadow-sm">
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium">
                {uploadedFiles.length >= maxFiles
                  ? `Maximum ${maxFiles} photos reached`
                  : 'Click to select photos'}
              </p>
              <p className="text-xs text-muted-foreground">
                {uploadedFiles.length >= maxFiles
                  ? 'Remove some photos to upload more'
                  : 'or drag and drop files here'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {uploadedFiles.length} of {maxFiles} photos uploaded
              </p>
            </div>
          </div>

          {/* Photo grid */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-4">
              {uploadedFiles.map(file => (
                <UploadedPhotoItem
                  key={file.name}
                  fileName={file.name}
                  fileUrl={fileUrls[file.name]}
                  progress={fileProgresses[file.name] || 0}
                  error={errors[file.name]}
                  faceDetected={faceDetected[file.name]}
                  optimizationResult={optimizationResults[file.name]}
                  onRemove={handleRemove}
                />
              ))}
            </div>
          )}

          {/* Guidelines */}
          <div className="bg-muted/50 rounded-lg p-4 mt-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium">Photo Guidelines</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowExamples(!showExamples)}
                className="text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                {showExamples ? 'Hide' : 'View'} Examples
              </Button>
            </div>
            <ul className="text-xs space-y-1 text-muted-foreground">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-green-500" />
                Clear, well-lit photos with your face clearly visible
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-green-500" />
                Neutral background preferred
              </li>
              {enableOptimization && (
                <li className="flex items-center gap-2">
                  <Zap className="h-3.5 w-3.5 text-blue-500" />
                  Images automatically optimized for web delivery
                </li>
              )}
              <li className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-destructive" />
                No sunglasses or heavy filters
              </li>
              <li className="flex items-center gap-2">
                <X className="h-3.5 w-3.5 text-destructive" />
                No group photos or photos without faces
              </li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Example Photos Gallery */}
      {showExamples && (
        <Card className="w-full max-w-5xl p-6">
          <ExamplePhotosGallery />
        </Card>
      )}
    </div>
  )
}
