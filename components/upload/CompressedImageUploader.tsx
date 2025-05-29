'use client'

import { useState, useCallback, useRef } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Upload,
  Image as ImageIcon,
  Zap,
  FileImage,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface CompressedImageUploaderProps {
  endpoint: 'imageUploader' | 'childPhotoUploader' | 'avatarUploader'
  onUploadComplete?: (files: any[]) => void
  onValidationError?: (errors: string[]) => void
  onCompressionComplete?: (results: CompressionResult[]) => void
  className?: string
  variant?: 'button' | 'dropzone'
  validationOptions?: FileValidationOptions
  compressionOptions?: CompressionOptions
  showValidationDetails?: boolean
  showCompressionDetails?: boolean
  enableCompression?: boolean
  disabled?: boolean
}

interface FileProcessingState {
  file: File
  validation: ValidationResult
  compression?: CompressionResult
  isValidating: boolean
  isCompressing: boolean
  finalFile: File
}

export function CompressedImageUploader({
  endpoint,
  onUploadComplete,
  onValidationError,
  onCompressionComplete,
  className = '',
  variant = 'dropzone',
  validationOptions,
  compressionOptions,
  showValidationDetails = true,
  showCompressionDetails = true,
  enableCompression = true,
  disabled = false,
}: CompressedImageUploaderProps) {
  const [processingStates, setProcessingStates] = useState<
    FileProcessingState[]
  >([])
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [compressionProgress, setCompressionProgress] = useState<{
    completed: number
    total: number
    currentFile: string
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: res => {
      setProcessingStates([])
      setCompressionProgress(null)
      setUploadStatus(`✅ ${res.length} file(s) uploaded successfully!`)

      if (onUploadComplete) {
        onUploadComplete(res)
      }

      setTimeout(() => setUploadStatus(''), 3000)
    },
    onUploadError: error => {
      setUploadStatus(`❌ Upload failed: ${error.message}`)
      setTimeout(() => setUploadStatus(''), 5000)
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

  const processFiles = useCallback(
    async (files: File[]) => {
      const validationOptions = getEndpointValidationOptions()
      const compressionOptions = getEndpointCompressionOptions()
      const states: FileProcessingState[] = []

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
        } catch (error) {
          setProcessingStates(prev =>
            prev.map((state, index) =>
              index === i
                ? {
                    ...state,
                    validation: {
                      isValid: false,
                      errors: [
                        'Validation failed: ' + (error as Error).message,
                      ],
                      warnings: [],
                    },
                    isValidating: false,
                  }
                : state
            )
          )
        }
      }

      // Wait a moment for state to update
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

        // Mark all files as compressing
        setProcessingStates(prev =>
          prev.map(state => ({ ...state, isCompressing: true }))
        )

        try {
          const compressionResults = await compressImages(
            files,
            compressionOptions,
            progress => {
              setCompressionProgress(progress)
            }
          )

          // Update states with compression results
          setProcessingStates(prev =>
            prev.map((state, index) => ({
              ...state,
              compression: compressionResults[index],
              isCompressing: false,
              finalFile: compressionResults[index].compressedFile,
            }))
          )

          if (onCompressionComplete) {
            onCompressionComplete(compressionResults)
          }

          setCompressionProgress(null)
        } catch (error) {
          console.error('Compression failed:', error)
          setUploadStatus('⚠️ Compression failed, uploading original files...')

          // Mark compression as complete with original files
          setProcessingStates(prev =>
            prev.map(state => ({
              ...state,
              isCompressing: false,
              finalFile: state.file,
            }))
          )
        }
      } else {
        // No compression, use original files
        setProcessingStates(prev =>
          prev.map(state => ({
            ...state,
            finalFile: state.file,
          }))
        )
      }

      // Step 3: Start upload
      setUploadStatus('📤 Uploading...')
      try {
        const finalFiles = processingStates.map(state => state.finalFile)
        await startUpload(finalFiles)
      } catch (error) {
        setUploadStatus(`❌ Upload failed: ${(error as Error).message}`)
        setTimeout(() => setUploadStatus(''), 5000)
      }
    },
    [
      getEndpointValidationOptions,
      getEndpointCompressionOptions,
      enableCompression,
      onValidationError,
      onCompressionComplete,
      processingStates,
      startUpload,
    ]
  )

  const handleFileSelection = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return
      await processFiles(files)
    },
    [processFiles]
  )

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files || [])
    handleFileSelection(files)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = Array.from(event.dataTransfer.files)
    handleFileSelection(files)
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const renderProcessingSummary = () => {
    if (processingStates.length === 0) return null

    const allErrors = processingStates.flatMap(state => state.validation.errors)
    const allWarnings = processingStates.flatMap(
      state => state.validation.warnings
    )
    const isValidating = processingStates.some(state => state.isValidating)
    const isCompressing = processingStates.some(state => state.isCompressing)
    const allValid = processingStates.every(
      state => !state.isValidating && state.validation.isValid
    )

    if (isValidating) {
      return (
        <Alert className="mt-4">
          <Info className="h-4 w-4" />
          <AlertDescription>Validating files...</AlertDescription>
        </Alert>
      )
    }

    if (isCompressing) {
      return (
        <Alert className="mt-4">
          <Zap className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div>Compressing images...</div>
              {compressionProgress && (
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">
                    {compressionProgress.currentFile &&
                      `Processing: ${compressionProgress.currentFile}`}
                  </div>
                  <Progress
                    value={
                      (compressionProgress.completed /
                        compressionProgress.total) *
                      100
                    }
                    className="h-2"
                  />
                  <div className="text-xs text-muted-foreground">
                    {compressionProgress.completed} of{' '}
                    {compressionProgress.total} files
                  </div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )
    }

    if (allValid && allWarnings.length === 0) {
      return (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All files processed successfully!
          </AlertDescription>
        </Alert>
      )
    }

    return (
      <div className="mt-4 space-y-2">
        {allErrors.length > 0 && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="font-medium mb-1">Validation Errors:</div>
              <ul className="list-disc list-inside space-y-1">
                {allErrors.map((error, index) => (
                  <li key={index} className="text-sm">
                    {error}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {allWarnings.length > 0 && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <div className="font-medium mb-1">Warnings:</div>
              <ul className="list-disc list-inside space-y-1">
                {allWarnings.map((warning, index) => (
                  <li key={index} className="text-sm">
                    {warning}
                  </li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </div>
    )
  }

  const renderFileProcessingDetails = () => {
    if (
      (!showValidationDetails && !showCompressionDetails) ||
      processingStates.length === 0
    )
      return null

    return (
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-medium">File Processing Details:</h4>
        {processingStates.map((state, index) => (
          <div key={index} className="border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
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
          </div>
        ))}

        {/* Compression summary */}
        {showCompressionDetails &&
          enableCompression &&
          processingStates.length > 1 &&
          processingStates.every(state => state.compression) && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium mb-2 text-blue-800">
                Compression Summary:
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
            </div>
          )}
      </div>
    )
  }

  const renderOptions = () => {
    const validationOptions = getEndpointValidationOptions()
    const compressionOptions = getEndpointCompressionOptions()

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Upload Configuration:</h4>
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
            <span className="font-medium">Compression:</span>{' '}
            {enableCompression ? 'Enabled' : 'Disabled'}
          </div>
        </div>
      </div>
    )
  }

  if (variant === 'button') {
    return (
      <div className={className}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={endpoint === 'imageUploader'}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />
        <Button
          onClick={openFileDialog}
          disabled={disabled || isUploading}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? 'Uploading...' : 'Choose Files'}
        </Button>
        {uploadStatus && <p className="text-sm mt-2">{uploadStatus}</p>}
        {renderProcessingSummary()}
        {renderFileProcessingDetails()}
        {renderOptions()}
      </div>
    )
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={endpoint === 'imageUploader'}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
        className={cn(
          'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
          isDragOver
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50',
          disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
        )}
      >
        <div className="flex items-center justify-center mb-4">
          <FileImage className="h-12 w-12 text-muted-foreground" />
          {enableCompression && <Zap className="h-6 w-6 text-blue-500 ml-2" />}
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium">
            {isUploading
              ? 'Uploading...'
              : 'Drop files here or click to browse'}
          </p>
          <p className="text-sm text-muted-foreground">
            {endpoint === 'imageUploader'
              ? 'Select multiple images'
              : 'Select an image'}
            {enableCompression && ' • Automatic compression enabled'}
          </p>
        </div>
      </div>
      {uploadStatus && (
        <p className="text-sm mt-2 text-center">{uploadStatus}</p>
      )}
      {renderProcessingSummary()}
      {renderFileProcessingDetails()}
      {renderOptions()}
    </div>
  )
}
