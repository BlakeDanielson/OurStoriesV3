import imageCompression from 'browser-image-compression'

export interface CompressionOptions {
  maxSizeMB?: number
  maxWidthOrHeight?: number
  useWebWorker?: boolean
  maxIteration?: number
  initialQuality?: number
  alwaysKeepResolution?: boolean
  exifOrientation?: number
  fileType?: string
  preserveExif?: boolean
  onProgress?: (progress: number) => void
}

export interface CompressionResult {
  originalFile: File
  compressedFile: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  timeTaken: number
}

// Default compression options for different upload types
export const DEFAULT_COMPRESSION_OPTIONS = {
  childPhoto: {
    maxSizeMB: 2, // Compress to max 2MB
    maxWidthOrHeight: 2000, // Max dimension 2000px
    useWebWorker: true,
    maxIteration: 10,
    initialQuality: 0.8,
    preserveExif: false,
  },
  avatar: {
    maxSizeMB: 1, // Compress to max 1MB
    maxWidthOrHeight: 1000, // Max dimension 1000px
    useWebWorker: true,
    maxIteration: 10,
    initialQuality: 0.85,
    preserveExif: false,
  },
  general: {
    maxSizeMB: 3, // Compress to max 3MB
    maxWidthOrHeight: 2500, // Max dimension 2500px
    useWebWorker: true,
    maxIteration: 10,
    initialQuality: 0.8,
    preserveExif: false,
  },
} as const

/**
 * Get compression options based on upload type
 */
export function getCompressionOptions(
  uploadType: keyof typeof DEFAULT_COMPRESSION_OPTIONS
): CompressionOptions {
  return DEFAULT_COMPRESSION_OPTIONS[uploadType]
}

/**
 * Check if a file should be compressed
 */
export function shouldCompressFile(
  file: File,
  options: CompressionOptions
): boolean {
  // Only compress image files
  if (!file.type.startsWith('image/')) {
    return false
  }

  // Don't compress if file is already small enough
  if (options.maxSizeMB && file.size <= options.maxSizeMB * 1024 * 1024) {
    return false
  }

  // Don't compress GIFs (they might be animated)
  if (file.type === 'image/gif') {
    return false
  }

  return true
}

/**
 * Compress a single image file
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const startTime = Date.now()
  const originalSize = file.size

  try {
    // If compression is not needed, return original file
    if (!shouldCompressFile(file, options)) {
      return {
        originalFile: file,
        compressedFile: file,
        originalSize,
        compressedSize: originalSize,
        compressionRatio: 1,
        timeTaken: Date.now() - startTime,
      }
    }

    // Perform compression
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB || 2,
      maxWidthOrHeight: options.maxWidthOrHeight || 2000,
      useWebWorker: options.useWebWorker !== false,
      maxIteration: options.maxIteration || 10,
      initialQuality: options.initialQuality || 0.8,
      alwaysKeepResolution: options.alwaysKeepResolution || false,
      exifOrientation: options.exifOrientation,
      fileType: options.fileType,
      preserveExif: options.preserveExif || false,
      onProgress: options.onProgress,
    })

    const compressedSize = compressedFile.size
    const compressionRatio = originalSize / compressedSize
    const timeTaken = Date.now() - startTime

    return {
      originalFile: file,
      compressedFile,
      originalSize,
      compressedSize,
      compressionRatio,
      timeTaken,
    }
  } catch (error) {
    console.error('Image compression failed:', error)
    // Return original file if compression fails
    return {
      originalFile: file,
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      timeTaken: Date.now() - startTime,
    }
  }
}

/**
 * Compress multiple image files
 */
export async function compressImages(
  files: File[],
  options: CompressionOptions = {},
  onProgress?: (progress: {
    completed: number
    total: number
    currentFile: string
  }) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    // Report progress
    if (onProgress) {
      onProgress({
        completed: i,
        total: files.length,
        currentFile: file.name,
      })
    }

    try {
      const result = await compressImage(file, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to compress ${file.name}:`, error)
      // Add original file as fallback
      results.push({
        originalFile: file,
        compressedFile: file,
        originalSize: file.size,
        compressedSize: file.size,
        compressionRatio: 1,
        timeTaken: 0,
      })
    }
  }

  // Report completion
  if (onProgress) {
    onProgress({
      completed: files.length,
      total: files.length,
      currentFile: '',
    })
  }

  return results
}

/**
 * Format compression statistics for display
 */
export function formatCompressionStats(result: CompressionResult): string {
  const originalSizeMB = (result.originalSize / 1024 / 1024).toFixed(2)
  const compressedSizeMB = (result.compressedSize / 1024 / 1024).toFixed(2)
  const savings = (
    (1 - result.compressedSize / result.originalSize) *
    100
  ).toFixed(1)

  if (result.compressionRatio === 1) {
    return `No compression needed (${originalSizeMB} MB)`
  }

  return `${originalSizeMB} MB → ${compressedSizeMB} MB (${savings}% smaller)`
}

/**
 * Get compression summary for multiple files
 */
export function getCompressionSummary(results: CompressionResult[]): {
  totalOriginalSize: number
  totalCompressedSize: number
  totalSavings: number
  averageCompressionRatio: number
  filesCompressed: number
  totalFiles: number
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0)
  const totalCompressedSize = results.reduce(
    (sum, r) => sum + r.compressedSize,
    0
  )
  const totalSavings = totalOriginalSize - totalCompressedSize
  const averageCompressionRatio =
    results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length
  const filesCompressed = results.filter(r => r.compressionRatio > 1).length

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    averageCompressionRatio,
    filesCompressed,
    totalFiles: results.length,
  }
}
