'use client'

import React, { useState, useCallback, useRef } from 'react'
import { useUploadThing } from '@/lib/uploadthing-client'
import {
  validateFile,
  getValidationOptions,
  type ValidationResult,
  type FileValidationOptions,
} from '@/lib/validations'
import {
  compressImage,
  compressImages,
  getCompressionOptions,
  formatCompressionStats,
  getCompressionSummary,
  type CompressionOptions,
  type CompressionResult,
} from '@/lib/utils/image-compression'
import { DragDropImageUpload } from '@/components/upload/DragDropImageUpload'
import { ImagePreview } from '@/components/upload/ImagePreview'
import { UploadProgressIndicator } from '@/components/upload/UploadProgressIndicator'
import { UploadQueue } from '@/components/upload/UploadQueue'
import { ErrorBoundary } from '@/components/upload/ErrorBoundary'
import { ErrorList } from '@/components/upload/ErrorList'
import { useImagePreviews } from '@/lib/hooks/useImagePreviews'
import { useUploadProgress } from '@/lib/hooks/useUploadProgress'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { generateFileId } from '@/lib/utils/upload-progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Upload,
  Image as ImageIcon,
  Zap,
  FileImage,
  Eye,
  Settings,
  List,
  AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedImageUploaderProps {
  endpoint: 'imageUploader' | 'childPhotoUploader' | 'avatarUploader'
  onUploadComplete?: (files: any[]) => void
  onValidationError?: (errors: string[]) => void
  onCompressionComplete?: (results: CompressionResult[]) => void
  className?: string
  variant?: 'button' | 'dropzone' | 'enhanced'
  validationOptions?: FileValidationOptions
  compressionOptions?: CompressionOptions
  showValidationDetails?: boolean
  showCompressionDetails?: boolean
  enableCompression?: boolean
  enablePreviews?: boolean
  enableProgressIndicators?: boolean
  enableUploadQueue?: boolean
  enableErrorHandling?: boolean
  disabled?: boolean
  maxFiles?: number
  previewGridCols?: 2 | 3 | 4 | 5 | 6
  previewThumbnailSize?: 'sm' | 'md' | 'lg'
  allowPreviewRemove?: boolean
  allowPreviewReorder?: boolean
}

interface FileProcessingState {
  file: File
  validation: ValidationResult
  compression?: CompressionResult
  isValidating: boolean
  isCompressing: boolean
  finalFile: File
}

export function EnhancedImageUploader({
  endpoint,
  onUploadComplete,
  onValidationError,
  onCompressionComplete,
  className = '',
  variant = 'enhanced',
  validationOptions,
  compressionOptions,
  showValidationDetails = true,
  showCompressionDetails = true,
  enableCompression = true,
  enablePreviews = true,
  enableProgressIndicators = true,
  enableUploadQueue = true,
  enableErrorHandling = true,
  disabled = false,
  maxFiles,
  previewGridCols = 3,
  previewThumbnailSize = 'md',
  allowPreviewRemove = true,
  allowPreviewReorder = false,
}: EnhancedImageUploaderProps) {
  const [processingStates, setProcessingStates] = useState<
    FileProcessingState[]
  >([])
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [activeTab, setActiveTab] = useState<string>('upload')
  const [compressionProgress, setCompressionProgress] = useState<{
    completed: number
    total: number
    currentFile: string
  } | null>(null)

  // Error handling
  const {
    errors,
    hasErrors,
    hasRetryableErrors,
    addError,
    removeError,
    clearErrors,
    retryError,
    retryAllErrors,
    getErrorsForFile,
    isRetrying: isErrorRetrying,
    onlineStatus,
  } = useErrorHandler({
    enableAutoRetry: true,
    enableLogging: true,
    onError: error => {
      console.log('Upload error occurred:', error.userMessage)
      // Switch to errors tab if we have errors
      if (enableErrorHandling) {
        setActiveTab('errors')
      }
    },
    onRecovery: error => {
      console.log('Error recovered:', error.userMessage)
    },
  })

  // Upload progress tracking
  const {
    fileProgress,
    batchProgress,
    initializeFiles,
    updateFileProgress,
    setFileStatus,
    setFileError,
    retryFile,
    cancelFile,
    clearProgress,
    getFileProgress,
    isUploading: isProgressUploading,
    hasErrors: hasProgressErrors,
    canRetry,
  } = useUploadProgress({
    onFileComplete: fileProgress => {
      console.log('File completed:', fileProgress.fileName)
    },
    onFileError: (fileProgress, error) => {
      console.error('File error:', fileProgress.fileName, error)
      // Add to error handler
      addError(error, 'upload', fileProgress.fileId, fileProgress.fileName)
    },
    onBatchComplete: batchProgress => {
      console.log('Batch completed:', batchProgress)
      if (!hasErrors) {
        setActiveTab('queue')
      }
    },
  })

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: res => {
      setProcessingStates([])
      setSelectedFiles([])
      setCompressionProgress(null)
      setUploadStatus(`✅ ${res.length} file(s) uploaded successfully!`)

      // Mark all files as completed in progress tracking
      fileProgress.forEach(progress => {
        if (progress.status === 'uploading') {
          setFileStatus(progress.fileId, 'completed')
        }
      })

      if (onUploadComplete) {
        onUploadComplete(res)
      }

      setTimeout(() => setUploadStatus(''), 3000)
    },
    onUploadError: error => {
      const errorMessage = `Upload failed: ${error.message}`
      setUploadStatus(`❌ ${errorMessage}`)

      // Add to error handler
      addError(error, 'upload')

      // Mark uploading files as failed
      fileProgress.forEach(progress => {
        if (progress.status === 'uploading') {
          setFileError(progress.fileId, error.message)
        }
      })

      setTimeout(() => setUploadStatus(''), 5000)
    },
    onUploadProgress: progress => {
      // Update progress for currently uploading files
      const uploadingFiles = fileProgress.filter(f => f.status === 'uploading')
      if (uploadingFiles.length > 0) {
        const progressPerFile = progress / uploadingFiles.length
        uploadingFiles.forEach(file => {
          const uploadedBytes = Math.round(
            (file.fileSize * progressPerFile) / 100
          )
          updateFileProgress(file.fileId, uploadedBytes)
        })
      }
    },
    onUploadBegin: fileName => {
      // Mark the file as uploading
      const fileId = fileProgress.find(f => f.fileName === fileName)?.fileId
      if (fileId) {
        setFileStatus(fileId, 'uploading')
      }
    },
  })

  // Get validation options based on endpoint
  const getEndpointValidationOptions =
    useCallback((): FileValidationOptions => {
      if (validationOptions) return validationOptions

      switch (endpoint) {
        case 'childPhotoUploader':
          return getValidationOptions('childPhoto')
        case 'avatarUploader':
          return getValidationOptions('avatar')
        default:
          return getValidationOptions('general')
      }
    }, [endpoint, validationOptions])

  // Get compression options based on endpoint
  const getEndpointCompressionOptions = useCallback((): CompressionOptions => {
    if (compressionOptions) return compressionOptions

    switch (endpoint) {
      case 'childPhotoUploader':
        return getCompressionOptions('childPhoto')
      case 'avatarUploader':
        return getCompressionOptions('avatar')
      default:
        return getCompressionOptions('general')
    }
  }, [endpoint, compressionOptions])

  // Get max files based on endpoint
  const getMaxFiles = useCallback((): number => {
    if (maxFiles) return maxFiles

    switch (endpoint) {
      case 'avatarUploader':
        return 1
      case 'childPhotoUploader':
        return 5
      default:
        return 10
    }
  }, [endpoint, maxFiles])

  const processFiles = useCallback(
    async (files: File[]) => {
      const validationOptions = getEndpointValidationOptions()
      const compressionOptions = getEndpointCompressionOptions()
      const states: FileProcessingState[] = []

      // Clear previous errors
      clearErrors()

      // Initialize processing states
      for (const file of files) {
        states.push({
          file,
          validation: { isValid: true, errors: [], warnings: [] },
          isValidating: true,
          isCompressing: false,
          finalFile: file,
        })
      }

      setProcessingStates(states)

      // Initialize progress tracking
      if (enableProgressIndicators) {
        initializeFiles(files)
      }

      // Step 1: Validate files
      setUploadStatus('🔍 Validating files...')
      for (let i = 0; i < files.length; i++) {
        try {
          const validation = await validateFile(files[i], validationOptions)
          setProcessingStates(prev =>
            prev.map((state, index) =>
              index === i
                ? { ...state, validation, isValidating: false }
                : state
            )
          )

          // Add validation errors to error handler
          if (!validation.isValid) {
            validation.errors.forEach(error => {
              addError(
                error,
                'validation',
                generateFileId(files[i]),
                files[i].name
              )
            })
          }
        } catch (error) {
          const errorMessage = 'Validation failed: ' + (error as Error).message
          setProcessingStates(prev =>
            prev.map((state, index) =>
              index === i
                ? {
                    ...state,
                    validation: {
                      isValid: false,
                      errors: [errorMessage],
                      warnings: [],
                    },
                    isValidating: false,
                  }
                : state
            )
          )

          // Add to error handler
          addError(
            error as Error,
            'validation',
            generateFileId(files[i]),
            files[i].name
          )
        }
      }

      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Check if all files passed validation
      const currentStates = processingStates.filter(
        state => !state.isValidating
      )
      const allValid = currentStates.every(state => state.validation.isValid)

      if (!allValid) {
        const allErrors = currentStates.flatMap(
          state => state.validation.errors
        )
        setUploadStatus('❌ Validation failed')

        if (onValidationError) {
          onValidationError(allErrors)
        }
        return
      }

      // Step 2: Compress files (if enabled)
      if (enableCompression) {
        setUploadStatus('🗜️ Compressing images...')

        setCompressionProgress({
          completed: 0,
          total: files.length,
          currentFile: files[0]?.name || '',
        })

        try {
          const compressionResults = await compressImages(
            files,
            compressionOptions,
            progress => {
              setCompressionProgress({
                completed: progress.completed,
                total: progress.total,
                currentFile: progress.currentFile,
              })
            }
          )

          // Update states with compression results
          setProcessingStates(prev =>
            prev.map((state, index) => ({
              ...state,
              compression: compressionResults[index],
              finalFile:
                compressionResults[index]?.compressedFile || state.file,
              isCompressing: false,
            }))
          )

          if (onCompressionComplete) {
            onCompressionComplete(compressionResults)
          }

          setCompressionProgress(null)
        } catch (error) {
          const errorMessage = `Compression failed: ${(error as Error).message}`
          setUploadStatus(`❌ ${errorMessage}`)
          setCompressionProgress(null)

          // Add to error handler
          addError(error as Error, 'compression')
          return
        }
      }

      setUploadStatus('✅ Files ready for upload')
    },
    [
      getEndpointValidationOptions,
      getEndpointCompressionOptions,
      enableCompression,
      enableProgressIndicators,
      onValidationError,
      onCompressionComplete,
      processingStates,
      initializeFiles,
      clearErrors,
      addError,
    ]
  )

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      setSelectedFiles(files)
      processFiles(files)

      // Switch to processing tab if we have files
      if (files.length > 0) {
        if (enableProgressIndicators || enableUploadQueue) {
          setActiveTab('progress')
        } else {
          setActiveTab('processing')
        }
      }
    },
    [processFiles, enableProgressIndicators, enableUploadQueue]
  )

  const handleUpload = useCallback(async () => {
    const filesToUpload = processingStates
      .filter(state => state.validation.isValid)
      .map(state => state.finalFile)

    if (filesToUpload.length === 0) {
      const errorMessage = 'No valid files to upload'
      setUploadStatus(`❌ ${errorMessage}`)
      addError(errorMessage, 'validation')
      return
    }

    try {
      await startUpload(filesToUpload)
    } catch (error) {
      const errorMessage = `Upload failed: ${(error as Error).message}`
      setUploadStatus(`❌ ${errorMessage}`)
      addError(error as Error, 'upload')
    }
  }, [processingStates, startUpload, addError])

  // Progress indicator handlers
  const handleRetryFile = useCallback(
    (fileId: string) => {
      retryFile(fileId)
      // Find the corresponding file and retry upload
      const fileProgress = getFileProgress(fileId)
      if (fileProgress) {
        const file = processingStates.find(
          state => generateFileId(state.finalFile) === fileId
        )?.finalFile
        if (file) {
          startUpload([file])
        }
      }
    },
    [retryFile, getFileProgress, processingStates, startUpload]
  )

  const handleCancelFile = useCallback(
    (fileId: string) => {
      cancelFile(fileId)
    },
    [cancelFile]
  )

  const handleRemoveFile = useCallback(
    (fileId: string) => {
      // Remove from processing states and progress tracking
      setProcessingStates(prev =>
        prev.filter(state => generateFileId(state.finalFile) !== fileId)
      )
      cancelFile(fileId)
    },
    [cancelFile]
  )

  // Error handling handlers
  const handleRetryError = useCallback(
    async (errorId: string) => {
      await retryError(errorId, async () => {
        // Custom retry logic based on error type
        const error = errors.find(e => e.id === errorId)
        if (error?.fileId) {
          // Retry file-specific operations
          const file = processingStates.find(
            state => generateFileId(state.finalFile) === error.fileId
          )?.finalFile
          if (file) {
            if (error.category === 'upload') {
              await startUpload([file])
            } else if (error.category === 'validation') {
              // Re-validate file
              const validationOptions = getEndpointValidationOptions()
              await validateFile(file, validationOptions)
            }
          }
        }
      })
    },
    [
      retryError,
      errors,
      processingStates,
      startUpload,
      getEndpointValidationOptions,
    ]
  )

  const handleRetryAllErrors = useCallback(async () => {
    await retryAllErrors(async error => {
      // Custom retry logic for each error
      if (error.fileId) {
        const file = processingStates.find(
          state => generateFileId(state.finalFile) === error.fileId
        )?.finalFile
        if (file && error.category === 'upload') {
          await startUpload([file])
        }
      }
    })
  }, [retryAllErrors, processingStates, startUpload])

  const renderProcessingSummary = () => {
    if (processingStates.length === 0) return null

    const validFiles = processingStates.filter(
      state => state.validation.isValid
    ).length
    const invalidFiles = processingStates.length - validFiles
    const compressedFiles = processingStates.filter(
      state => state.compression
    ).length

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">Processing Summary</h4>
          <div className="flex items-center gap-2">
            {validFiles > 0 && (
              <Badge
                variant="outline"
                className="text-green-600 border-green-200"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                {validFiles} valid
              </Badge>
            )}
            {invalidFiles > 0 && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                {invalidFiles} invalid
              </Badge>
            )}
            {enableCompression && compressedFiles > 0 && (
              <Badge
                variant="outline"
                className="text-blue-600 border-blue-200"
              >
                <Zap className="h-3 w-3 mr-1" />
                {compressedFiles} compressed
              </Badge>
            )}
          </div>
        </div>

        {compressionProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Compressing: {compressionProgress.currentFile}</span>
              <span>
                {compressionProgress.completed} / {compressionProgress.total}
              </span>
            </div>
            <Progress
              value={
                (compressionProgress.completed / compressionProgress.total) *
                100
              }
              className="h-2"
            />
          </div>
        )}

        {uploadStatus && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{uploadStatus}</AlertDescription>
          </Alert>
        )}

        {validFiles > 0 && !isUploading && !isProgressUploading && (
          <Button onClick={handleUpload} className="w-full" disabled={disabled}>
            <Upload className="h-4 w-4 mr-2" />
            Upload {validFiles} file{validFiles !== 1 ? 's' : ''}
          </Button>
        )}
      </div>
    )
  }

  const renderFileProcessingDetails = () => {
    if (processingStates.length === 0) return null

    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium">File Details</h4>
        {processingStates.map((state, index) => (
          <Card key={index} className="p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium truncate">
                {state.file.name}
              </span>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {(state.file.size / 1024 / 1024).toFixed(2)} MB
                </Badge>
                {state.isValidating ? (
                  <Badge variant="outline" className="text-xs">
                    Validating...
                  </Badge>
                ) : state.isCompressing ? (
                  <Badge variant="outline" className="text-xs">
                    Compressing...
                  </Badge>
                ) : state.validation.isValid ? (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-200"
                  >
                    ✓ Ready
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    ✗ Invalid
                  </Badge>
                )}
              </div>
            </div>

            {/* Validation details */}
            {showValidationDetails &&
              !state.isValidating &&
              (state.validation.errors.length > 0 ||
                state.validation.warnings.length > 0) && (
                <div className="space-y-1">
                  {state.validation.errors.map((error, errorIndex) => (
                    <div
                      key={errorIndex}
                      className="text-xs text-red-600 flex items-center gap-1"
                    >
                      <XCircle className="h-3 w-3" />
                      {error}
                    </div>
                  ))}
                  {state.validation.warnings.map((warning, warningIndex) => (
                    <div
                      key={warningIndex}
                      className="text-xs text-yellow-600 flex items-center gap-1"
                    >
                      <AlertCircle className="h-3 w-3" />
                      {warning}
                    </div>
                  ))}
                </div>
              )}

            {/* Compression details */}
            {showCompressionDetails &&
              enableCompression &&
              state.compression && (
                <div className="text-xs text-blue-600 flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  {formatCompressionStats(state.compression)}
                </div>
              )}
          </Card>
        ))}

        {/* Compression summary */}
        {showCompressionDetails &&
          enableCompression &&
          processingStates.length > 1 &&
          processingStates.every(state => state.compression) && (
            <Card className="p-3 bg-blue-50">
              <h5 className="text-sm font-medium mb-2 text-blue-800">
                Compression Summary
              </h5>
              {(() => {
                const compressionResults = processingStates.map(
                  state => state.compression!
                )
                const summary = getCompressionSummary(compressionResults)
                const totalSavingsMB = (
                  summary.totalSavings /
                  1024 /
                  1024
                ).toFixed(2)
                const savingsPercent = (
                  (summary.totalSavings / summary.totalOriginalSize) *
                  100
                ).toFixed(1)

                return (
                  <div className="text-xs text-blue-700 space-y-1">
                    <div>
                      Files compressed: {summary.filesCompressed} of{' '}
                      {summary.totalFiles}
                    </div>
                    <div>
                      Total space saved: {totalSavingsMB} MB ({savingsPercent}%)
                    </div>
                    <div>
                      Average compression ratio:{' '}
                      {summary.averageCompressionRatio.toFixed(2)}:1
                    </div>
                  </div>
                )
              })()}
            </Card>
          )}
      </div>
    )
  }

  const renderConfiguration = () => {
    const validationOptions = getEndpointValidationOptions()
    const compressionOptions = getEndpointCompressionOptions()

    return (
      <Card className="p-3 bg-gray-50">
        <h4 className="text-sm font-medium mb-2">Upload Configuration</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          {validationOptions.allowedTypes && (
            <div>
              <span className="font-medium">Allowed types:</span>{' '}
              {validationOptions.allowedTypes.join(', ')}
            </div>
          )}
          {validationOptions.maxSize && (
            <div>
              <span className="font-medium">Max size:</span>{' '}
              {(validationOptions.maxSize / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
          {validationOptions.maxWidth && validationOptions.maxHeight && (
            <div>
              <span className="font-medium">Max dimensions:</span>{' '}
              {validationOptions.maxWidth} × {validationOptions.maxHeight} px
            </div>
          )}
          {enableCompression && compressionOptions.maxSizeMB && (
            <div>
              <span className="font-medium">Compression target:</span>{' '}
              {compressionOptions.maxSizeMB} MB
            </div>
          )}
          {enableCompression && compressionOptions.maxWidthOrHeight && (
            <div>
              <span className="font-medium">Compression max dimension:</span>{' '}
              {compressionOptions.maxWidthOrHeight} px
            </div>
          )}
          <div>
            <span className="font-medium">Max files:</span> {getMaxFiles()}
          </div>
          <div>
            <span className="font-medium">Compression:</span>{' '}
            {enableCompression ? 'Enabled' : 'Disabled'}
          </div>
          <div>
            <span className="font-medium">Previews:</span>{' '}
            {enablePreviews ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </Card>
    )
  }

  const renderTabs = () => {
    const tabs = [
      { id: 'upload', label: 'Upload', icon: Upload },
      { id: 'processing', label: 'Processing', icon: Settings },
    ]

    if (enableProgressIndicators) {
      tabs.push({ id: 'progress', label: 'Progress', icon: Zap })
    }

    if (enableUploadQueue) {
      tabs.push({ id: 'queue', label: 'Queue', icon: List })
    }

    if (enablePreviews) {
      tabs.push({ id: 'preview', label: 'Preview', icon: Eye })
    }

    if (enableErrorHandling) {
      tabs.push({
        id: 'errors',
        label: `Errors${hasErrors ? ` (${errors.length})` : ''}`,
        icon: AlertTriangle,
      })
    }

    return (
      <ErrorBoundary showErrorDetails={true} enableReporting={true}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
            {tabs.map(({ id, label, icon: Icon }) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  'flex items-center gap-2',
                  id === 'errors' && hasErrors && 'text-red-600'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="upload" className="space-y-4">
            <DragDropImageUpload
              onFilesSelected={handleFilesSelected}
              maxFiles={getMaxFiles()}
              disabled={disabled}
              className="min-h-[200px]"
            />
          </TabsContent>

          <TabsContent value="processing" className="space-y-4">
            {renderProcessingSummary()}
          </TabsContent>

          {enableProgressIndicators && (
            <TabsContent value="progress" className="space-y-4">
              <UploadProgressIndicator
                fileProgress={fileProgress}
                batchProgress={batchProgress}
                onRetryFile={handleRetryFile}
                onCancelFile={handleCancelFile}
                showIndividualFiles={true}
                showBatchSummary={true}
                showSpeedAndETA={true}
              />
            </TabsContent>
          )}

          {enableUploadQueue && (
            <TabsContent value="queue" className="space-y-4">
              <UploadQueue
                fileProgress={fileProgress}
                batchProgress={batchProgress}
                onRetryFile={handleRetryFile}
                onCancelFile={handleCancelFile}
                onRemoveFile={handleRemoveFile}
                showActions={true}
                maxHeight="500px"
              />
            </TabsContent>
          )}

          {enablePreviews && (
            <TabsContent value="preview" className="space-y-4">
              <ImagePreview
                files={selectedFiles}
                gridCols={previewGridCols}
                thumbnailSize={previewThumbnailSize}
                allowRemove={allowPreviewRemove}
                allowReorder={allowPreviewReorder}
                onFilesChange={setSelectedFiles}
              />
            </TabsContent>
          )}

          {enableErrorHandling && (
            <TabsContent value="errors" className="space-y-4">
              <ErrorList
                errors={errors}
                onRetryError={handleRetryError}
                onRetryAllErrors={handleRetryAllErrors}
                onDismissError={removeError}
                onClearAllErrors={clearErrors}
                showTechnicalDetails={true}
                isRetrying={isErrorRetrying}
                onlineStatus={onlineStatus}
                enableFiltering={true}
                enableBatchOperations={true}
                maxHeight="500px"
              />
            </TabsContent>
          )}
        </Tabs>
      </ErrorBoundary>
    )
  }

  if (variant === 'button') {
    return (
      <ErrorBoundary>
        <div className={cn('space-y-4', className)}>
          <Button
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Images
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={e => {
              const files = Array.from(e.target.files || [])
              handleFilesSelected(files)
            }}
          />
          {enableErrorHandling && hasErrors && (
            <ErrorList
              errors={errors}
              onRetryError={handleRetryError}
              onDismissError={removeError}
              compact={true}
              maxHeight="200px"
            />
          )}
        </div>
      </ErrorBoundary>
    )
  }

  if (variant === 'dropzone') {
    return (
      <ErrorBoundary>
        <div className={cn('space-y-4', className)}>
          <DragDropImageUpload
            onFilesSelected={handleFilesSelected}
            maxFiles={getMaxFiles()}
            disabled={disabled}
          />
          {enableProgressIndicators && fileProgress.length > 0 && (
            <UploadProgressIndicator
              fileProgress={fileProgress}
              batchProgress={batchProgress}
              onRetryFile={handleRetryFile}
              onCancelFile={handleCancelFile}
              compact={true}
            />
          )}
          {enableErrorHandling && hasErrors && (
            <ErrorList
              errors={errors}
              onRetryError={handleRetryError}
              onDismissError={removeError}
              compact={true}
              maxHeight="200px"
            />
          )}
        </div>
      </ErrorBoundary>
    )
  }

  return <div className={cn('space-y-6', className)}>{renderTabs()}</div>
}
