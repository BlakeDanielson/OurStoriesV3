/**
 * Image Preview Utilities
 * Handles thumbnail generation, file reading, and preview management
 */

export interface ImagePreview {
  file: File
  url: string
  thumbnail?: string
  dimensions?: {
    width: number
    height: number
  }
  isLoading: boolean
  error?: string
}

export interface ThumbnailOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
}

/**
 * Generate a thumbnail from an image file
 */
export async function generateThumbnail(
  file: File,
  options: ThumbnailOptions = {}
): Promise<string> {
  const {
    maxWidth = 200,
    maxHeight = 200,
    quality = 0.8,
    format = 'jpeg',
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    img.onload = () => {
      // Calculate thumbnail dimensions while maintaining aspect ratio
      const { width: thumbWidth, height: thumbHeight } =
        calculateThumbnailDimensions(img.width, img.height, maxWidth, maxHeight)

      canvas.width = thumbWidth
      canvas.height = thumbHeight

      // Draw the resized image
      ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

      // Convert to data URL
      const mimeType =
        format === 'png'
          ? 'image/png'
          : format === 'webp'
            ? 'image/webp'
            : 'image/jpeg'

      const thumbnailUrl = canvas.toDataURL(mimeType, quality)
      resolve(thumbnailUrl)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for thumbnail generation'))
    }

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(file)
    img.src = objectUrl

    // Clean up object URL after image loads
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)

      // Calculate thumbnail dimensions
      const { width: thumbWidth, height: thumbHeight } =
        calculateThumbnailDimensions(img.width, img.height, maxWidth, maxHeight)

      canvas.width = thumbWidth
      canvas.height = thumbHeight
      ctx.drawImage(img, 0, 0, thumbWidth, thumbHeight)

      const mimeType =
        format === 'png'
          ? 'image/png'
          : format === 'webp'
            ? 'image/webp'
            : 'image/jpeg'

      const thumbnailUrl = canvas.toDataURL(mimeType, quality)
      resolve(thumbnailUrl)
    }
  })
}

/**
 * Calculate thumbnail dimensions while maintaining aspect ratio
 */
export function calculateThumbnailDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  // Calculate scaling factor
  const widthRatio = maxWidth / originalWidth
  const heightRatio = maxHeight / originalHeight
  const scalingFactor = Math.min(widthRatio, heightRatio, 1) // Don't upscale

  width = Math.round(originalWidth * scalingFactor)
  height = Math.round(originalHeight * scalingFactor)

  return { width, height }
}

/**
 * Get image dimensions from a file
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
      })
      URL.revokeObjectURL(img.src)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
      URL.revokeObjectURL(img.src)
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Create an image preview object from a file
 */
export async function createImagePreview(
  file: File,
  generateThumb: boolean = true,
  thumbnailOptions?: ThumbnailOptions
): Promise<ImagePreview> {
  const preview: ImagePreview = {
    file,
    url: URL.createObjectURL(file),
    isLoading: true,
  }

  try {
    // Get image dimensions
    if (file.type.startsWith('image/')) {
      preview.dimensions = await getImageDimensions(file)
    }

    // Generate thumbnail if requested
    if (generateThumb && file.type.startsWith('image/')) {
      preview.thumbnail = await generateThumbnail(file, thumbnailOptions)
    }

    preview.isLoading = false
  } catch (error) {
    preview.error =
      error instanceof Error ? error.message : 'Failed to process image'
    preview.isLoading = false
  }

  return preview
}

/**
 * Create multiple image previews from a file list
 */
export async function createImagePreviews(
  files: File[],
  generateThumbs: boolean = true,
  thumbnailOptions?: ThumbnailOptions
): Promise<ImagePreview[]> {
  const previews = await Promise.all(
    files.map(file =>
      createImagePreview(file, generateThumbs, thumbnailOptions)
    )
  )

  return previews
}

/**
 * Clean up preview URLs to prevent memory leaks
 */
export function cleanupPreviews(previews: ImagePreview[]): void {
  previews.forEach(preview => {
    if (preview.url) {
      URL.revokeObjectURL(preview.url)
    }
  })
}

/**
 * Check if a file is a supported image type
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2)
}

/**
 * Validate image file before preview generation
 */
export function validateImageFile(file: File): {
  isValid: boolean
  error?: string
} {
  // Check if it's an image
  if (!isImageFile(file)) {
    return { isValid: false, error: 'File is not an image' }
  }

  // Check file size (max 50MB for preview)
  const maxSize = 50 * 1024 * 1024 // 50MB
  if (file.size > maxSize) {
    return { isValid: false, error: 'File too large for preview' }
  }

  // Check for supported formats
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/svg+xml',
  ]

  if (!supportedTypes.includes(file.type)) {
    return { isValid: false, error: 'Unsupported image format' }
  }

  return { isValid: true }
}
