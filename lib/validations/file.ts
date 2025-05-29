export interface FileValidationOptions {
  maxSize?: number // in bytes
  minSize?: number // in bytes
  allowedTypes?: readonly string[] // MIME types
  allowedExtensions?: readonly string[]
  maxWidth?: number // for images
  maxHeight?: number // for images
  minWidth?: number // for images
  minHeight?: number // for images
  aspectRatio?: number // width/height ratio
  aspectRatioTolerance?: number // tolerance for aspect ratio (default: 0.1)
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

export interface ImageDimensions {
  width: number
  height: number
  aspectRatio: number
}

// Default validation options for different upload types
export const DEFAULT_VALIDATION_OPTIONS = {
  childPhoto: {
    maxSize: 8 * 1024 * 1024, // 8MB
    minSize: 1024, // 1KB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxWidth: 4000,
    maxHeight: 4000,
    minWidth: 100,
    minHeight: 100,
  },
  avatar: {
    maxSize: 4 * 1024 * 1024, // 4MB
    minSize: 1024, // 1KB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    maxWidth: 2000,
    maxHeight: 2000,
    minWidth: 50,
    minHeight: 50,
    aspectRatio: 1, // Square images preferred
    aspectRatioTolerance: 0.2,
  },
  general: {
    maxSize: 8 * 1024 * 1024, // 8MB
    minSize: 1024, // 1KB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxWidth: 5000,
    maxHeight: 5000,
    minWidth: 50,
    minHeight: 50,
  },
} as const

/**
 * Validates file size
 */
export function validateFileSize(
  file: File,
  options: FileValidationOptions
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  if (options.maxSize && file.size > options.maxSize) {
    errors.push(
      `File size (${formatFileSize(file.size)}) exceeds maximum allowed size (${formatFileSize(options.maxSize)})`
    )
  }

  if (options.minSize && file.size < options.minSize) {
    errors.push(
      `File size (${formatFileSize(file.size)}) is below minimum required size (${formatFileSize(options.minSize)})`
    )
  }

  // Warning for very large files
  if (file.size > 5 * 1024 * 1024) {
    // 5MB
    warnings.push(
      'Large file detected. Consider compressing the image for faster upload.'
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates file type and extension
 */
export function validateFileType(
  file: File,
  options: FileValidationOptions
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check MIME type
  if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
    errors.push(
      `File type "${file.type}" is not allowed. Allowed types: ${options.allowedTypes.join(', ')}`
    )
  }

  // Check file extension
  if (options.allowedExtensions) {
    const fileExtension = getFileExtension(file.name)
    if (!options.allowedExtensions.includes(fileExtension)) {
      errors.push(
        `File extension "${fileExtension}" is not allowed. Allowed extensions: ${options.allowedExtensions.join(', ')}`
      )
    }
  }

  // Check for potential security issues
  if (
    file.name.includes('..') ||
    file.name.includes('/') ||
    file.name.includes('\\')
  ) {
    errors.push('Invalid file name. File names cannot contain path separators.')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validates image dimensions
 */
export async function validateImageDimensions(
  file: File,
  options: FileValidationOptions
): Promise<ValidationResult> {
  const errors: string[] = []
  const warnings: string[] = []

  try {
    const dimensions = await getImageDimensions(file)

    if (options.maxWidth && dimensions.width > options.maxWidth) {
      errors.push(
        `Image width (${dimensions.width}px) exceeds maximum allowed width (${options.maxWidth}px)`
      )
    }

    if (options.maxHeight && dimensions.height > options.maxHeight) {
      errors.push(
        `Image height (${dimensions.height}px) exceeds maximum allowed height (${options.maxHeight}px)`
      )
    }

    if (options.minWidth && dimensions.width < options.minWidth) {
      errors.push(
        `Image width (${dimensions.width}px) is below minimum required width (${options.minWidth}px)`
      )
    }

    if (options.minHeight && dimensions.height < options.minHeight) {
      errors.push(
        `Image height (${dimensions.height}px) is below minimum required height (${options.minHeight}px)`
      )
    }

    // Check aspect ratio if specified
    if (options.aspectRatio) {
      const tolerance = options.aspectRatioTolerance || 0.1
      const expectedRatio = options.aspectRatio
      const actualRatio = dimensions.aspectRatio
      const difference = Math.abs(actualRatio - expectedRatio)

      if (difference > tolerance) {
        if (expectedRatio === 1) {
          errors.push(
            `Image should be square (1:1 aspect ratio). Current ratio is ${actualRatio.toFixed(2)}:1`
          )
        } else {
          errors.push(
            `Image aspect ratio (${actualRatio.toFixed(2)}:1) doesn't match required ratio (${expectedRatio}:1)`
          )
        }
      }
    }

    // Warnings for very large images
    if (dimensions.width > 3000 || dimensions.height > 3000) {
      warnings.push(
        'Very large image detected. Consider resizing for better performance.'
      )
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    }
  } catch (error) {
    return {
      isValid: false,
      errors: [
        'Failed to read image dimensions. The file may be corrupted or not a valid image.',
      ],
      warnings: [],
    }
  }
}

/**
 * Comprehensive file validation
 */
export async function validateFile(
  file: File,
  options: FileValidationOptions
): Promise<ValidationResult> {
  const results: ValidationResult[] = []

  // Basic file validation
  results.push(validateFileSize(file, options))
  results.push(validateFileType(file, options))

  // Image-specific validation for image files
  if (file.type.startsWith('image/')) {
    results.push(await validateImageDimensions(file, options))
  }

  // Combine all results
  const allErrors = results.flatMap(r => r.errors)
  const allWarnings = results.flatMap(r => r.warnings)

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
    warnings: allWarnings,
  }
}

/**
 * Validates multiple files
 */
export async function validateFiles(
  files: File[],
  options: FileValidationOptions
): Promise<ValidationResult[]> {
  return Promise.all(files.map(file => validateFile(file, options)))
}

/**
 * Gets image dimensions from a file
 */
export function getImageDimensions(file: File): Promise<ImageDimensions> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        aspectRatio: img.naturalWidth / img.naturalHeight,
      })
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }

    img.src = url
  })
}

/**
 * Utility functions
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function getFileExtension(filename: string): string {
  return filename.toLowerCase().substring(filename.lastIndexOf('.'))
}

/**
 * Checks if a file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Gets validation options for a specific upload type
 */
export function getValidationOptions(
  uploadType: keyof typeof DEFAULT_VALIDATION_OPTIONS
): FileValidationOptions {
  return DEFAULT_VALIDATION_OPTIONS[uploadType]
}
