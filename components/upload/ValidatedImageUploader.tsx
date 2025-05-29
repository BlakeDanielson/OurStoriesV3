'use client'

import { useState, useCallback, useRef } from 'react'
import { useUploadThing } from '@/lib/uploadthing-client'
import {
  validateFile,
  getValidationOptions,
  type ValidationResult,
  type FileValidationOptions,
} from '@/lib/validations'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CheckCircle,
  AlertCircle,
  XCircle,
  Info,
  Upload,
  Image as ImageIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValidatedImageUploaderProps {
  endpoint: 'imageUploader' | 'childPhotoUploader' | 'avatarUploader'
  onUploadComplete?: (files: any[]) => void
  onValidationError?: (errors: string[]) => void
  className?: string
  variant?: 'button' | 'dropzone'
  validationOptions?: FileValidationOptions
  showValidationDetails?: boolean
  disabled?: boolean
}

interface FileValidationState {
  file: File
  validation: ValidationResult
  isValidating: boolean
}

export function ValidatedImageUploader({
  endpoint,
  onUploadComplete,
  onValidationError,
  className = '',
  variant = 'dropzone',
  validationOptions,
  showValidationDetails = true,
  disabled = false,
}: ValidatedImageUploaderProps) {
  const [validationStates, setValidationStates] = useState<
    FileValidationState[]
  >([])
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { startUpload, isUploading } = useUploadThing(endpoint, {
    onClientUploadComplete: res => {
      setValidationStates([])
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

  const validateFiles = useCallback(
    async (files: File[]) => {
      const options = getEndpointValidationOptions()
      const states: FileValidationState[] = []

      // Initialize validation states
      for (const file of files) {
        states.push({
          file,
          validation: { isValid: true, errors: [], warnings: [] },
          isValidating: true,
        })
      }

      setValidationStates(states)

      // Validate each file
      for (let i = 0; i < files.length; i++) {
        try {
          const validation = await validateFile(files[i], options)
          setValidationStates(prev =>
            prev.map((state, index) =>
              index === i
                ? { ...state, validation, isValidating: false }
                : state
            )
          )
        } catch (error) {
          setValidationStates(prev =>
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
    },
    [getEndpointValidationOptions]
  )

  const handleFileSelection = useCallback(
    async (files: File[]) => {
      if (files.length === 0) return

      setUploadStatus('🔍 Validating files...')
      await validateFiles(files)

      // Wait for validation to complete
      setTimeout(async () => {
        const currentStates = validationStates.filter(
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

        // All files are valid, start upload
        setUploadStatus('📤 Uploading...')
        try {
          await startUpload(files)
        } catch (error) {
          setUploadStatus(`❌ Upload failed: ${(error as Error).message}`)
          setTimeout(() => setUploadStatus(''), 5000)
        }
      }, 100)
    },
    [validateFiles, validationStates, onValidationError, startUpload]
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

  const renderValidationSummary = () => {
    if (validationStates.length === 0) return null

    const allErrors = validationStates.flatMap(state => state.validation.errors)
    const allWarnings = validationStates.flatMap(
      state => state.validation.warnings
    )
    const isValidating = validationStates.some(state => state.isValidating)
    const allValid = validationStates.every(
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

    if (allValid && allWarnings.length === 0) {
      return (
        <Alert className="mt-4 border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            All files passed validation!
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

  const renderFileValidationDetails = () => {
    if (!showValidationDetails || validationStates.length === 0) return null

    return (
      <div className="mt-4 space-y-3">
        <h4 className="text-sm font-medium">File Validation Details:</h4>
        {validationStates.map((state, index) => (
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
                ) : state.validation.isValid ? (
                  <Badge
                    variant="outline"
                    className="text-xs text-green-600 border-green-200"
                  >
                    ✓ Valid
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    ✗ Invalid
                  </Badge>
                )}
              </div>
            </div>

            {!state.isValidating &&
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
          </div>
        ))}
      </div>
    )
  }

  const renderValidationOptions = () => {
    const options = getEndpointValidationOptions()

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium mb-2">Upload Requirements:</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-gray-600">
          {options.allowedTypes && (
            <div>
              <span className="font-medium">Allowed types:</span>{' '}
              {options.allowedTypes.join(', ')}
            </div>
          )}
          {options.maxSize && (
            <div>
              <span className="font-medium">Max size:</span>{' '}
              {(options.maxSize / 1024 / 1024).toFixed(1)} MB
            </div>
          )}
          {options.maxWidth && options.maxHeight && (
            <div>
              <span className="font-medium">Max dimensions:</span>{' '}
              {options.maxWidth} × {options.maxHeight} px
            </div>
          )}
          {options.aspectRatio && (
            <div>
              <span className="font-medium">Aspect ratio:</span>{' '}
              {options.aspectRatio === 1
                ? 'Square (1:1)'
                : `${options.aspectRatio}:1`}
            </div>
          )}
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
        {renderValidationSummary()}
        {renderFileValidationDetails()}
        {renderValidationOptions()}
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
        <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
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
          </p>
        </div>
      </div>
      {uploadStatus && (
        <p className="text-sm mt-2 text-center">{uploadStatus}</p>
      )}
      {renderValidationSummary()}
      {renderFileValidationDetails()}
      {renderValidationOptions()}
    </div>
  )
}
