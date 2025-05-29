export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'png' | 'webp'
  maxSizeKB?: number
}

export interface OptimizationResult {
  originalFile: File
  optimizedFile: File
  originalSize: number
  optimizedSize: number
  compressionRatio: number
  timeTaken: number
}

/**
 * Optimizes an image file by resizing, compressing, and optionally converting format
 */
export async function optimizeImage(
  file: File,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const startTime = performance.now()

  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maxSizeKB = 500,
  } = options

  return new Promise((resolve, reject) => {
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        )

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with specified quality and format
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to create optimized image blob'))
              return
            }

            // Check if we need further compression
            const finalBlob = blob
            const currentQuality = quality

            // If still too large, reduce quality iteratively
            const targetSize = maxSizeKB * 1024
            if (blob.size > targetSize && currentQuality > 0.1) {
              // Recursive compression if needed
              compressToTargetSize(canvas, format, targetSize, currentQuality)
                .then(compressedBlob => {
                  const optimizedFile = new File(
                    [compressedBlob],
                    `optimized_${file.name}`,
                    {
                      type: compressedBlob.type,
                      lastModified: Date.now(),
                    }
                  )

                  const endTime = performance.now()
                  const result: OptimizationResult = {
                    originalFile: file,
                    optimizedFile,
                    originalSize: file.size,
                    optimizedSize: compressedBlob.size,
                    compressionRatio: file.size / compressedBlob.size,
                    timeTaken: Math.round(endTime - startTime),
                  }

                  resolve(result)
                })
                .catch(reject)
            } else {
              const optimizedFile = new File(
                [finalBlob],
                `optimized_${file.name}`,
                {
                  type: finalBlob.type,
                  lastModified: Date.now(),
                }
              )

              const endTime = performance.now()
              const result: OptimizationResult = {
                originalFile: file,
                optimizedFile,
                originalSize: file.size,
                optimizedSize: finalBlob.size,
                compressionRatio: file.size / finalBlob.size,
                timeTaken: Math.round(endTime - startTime),
              }

              resolve(result)
            }
          },
          `image/${format}`,
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
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
 * Compress image to target file size by reducing quality iteratively
 */
async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  format: string,
  targetSize: number,
  initialQuality: number
): Promise<Blob> {
  let quality = initialQuality
  let blob: Blob | null = null

  // Try up to 10 iterations to reach target size
  for (let i = 0; i < 10 && quality > 0.1; i++) {
    blob = await new Promise<Blob | null>(resolve => {
      canvas.toBlob(resolve, `image/${format}`, quality)
    })

    if (!blob) {
      throw new Error('Failed to create compressed blob')
    }

    if (blob.size <= targetSize) {
      break
    }

    // Reduce quality for next iteration
    quality *= 0.8
  }

  if (!blob) {
    throw new Error('Failed to compress image to target size')
  }

  return blob
}

/**
 * Batch optimize multiple images
 */
export async function optimizeImages(
  files: File[],
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult[]> {
  const results: OptimizationResult[] = []

  for (const file of files) {
    try {
      const result = await optimizeImage(file, options)
      results.push(result)
    } catch (error) {
      console.error(`Failed to optimize ${file.name}:`, error)
      // Create a "no optimization" result for failed files
      results.push({
        originalFile: file,
        optimizedFile: file,
        originalSize: file.size,
        optimizedSize: file.size,
        compressionRatio: 1,
        timeTaken: 0,
      })
    }
  }

  return results
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(
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
      reject(new Error('Failed to load image for dimension calculation'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Check if a file is an image
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
