import {
  shouldCompressFile,
  getCompressionOptions,
  formatCompressionStats,
  getCompressionSummary,
  type CompressionResult,
} from '../image-compression'

// Mock File constructor for testing
const createMockFile = (name: string, size: number, type: string): File => {
  const file = new File([''], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('Image Compression Utils', () => {
  describe('shouldCompressFile', () => {
    it('should compress large image files', () => {
      const largeImage = createMockFile(
        'large.jpg',
        5 * 1024 * 1024,
        'image/jpeg'
      ) // 5MB
      const options = { maxSizeMB: 2 }

      expect(shouldCompressFile(largeImage, options)).toBe(true)
    })

    it('should not compress small image files', () => {
      const smallImage = createMockFile(
        'small.jpg',
        1 * 1024 * 1024,
        'image/jpeg'
      ) // 1MB
      const options = { maxSizeMB: 2 }

      expect(shouldCompressFile(smallImage, options)).toBe(false)
    })

    it('should not compress GIF files', () => {
      const gifFile = createMockFile(
        'animated.gif',
        5 * 1024 * 1024,
        'image/gif'
      ) // 5MB
      const options = { maxSizeMB: 2 }

      expect(shouldCompressFile(gifFile, options)).toBe(false)
    })

    it('should not compress non-image files', () => {
      const textFile = createMockFile(
        'document.txt',
        5 * 1024 * 1024,
        'text/plain'
      ) // 5MB
      const options = { maxSizeMB: 2 }

      expect(shouldCompressFile(textFile, options)).toBe(false)
    })
  })

  describe('getCompressionOptions', () => {
    it('should return correct options for childPhoto', () => {
      const options = getCompressionOptions('childPhoto')

      expect(options.maxSizeMB).toBe(2)
      expect(options.maxWidthOrHeight).toBe(2000)
      expect(options.initialQuality).toBe(0.8)
    })

    it('should return correct options for avatar', () => {
      const options = getCompressionOptions('avatar')

      expect(options.maxSizeMB).toBe(1)
      expect(options.maxWidthOrHeight).toBe(1000)
      expect(options.initialQuality).toBe(0.85)
    })

    it('should return correct options for general', () => {
      const options = getCompressionOptions('general')

      expect(options.maxSizeMB).toBe(3)
      expect(options.maxWidthOrHeight).toBe(2500)
      expect(options.initialQuality).toBe(0.8)
    })
  })

  describe('formatCompressionStats', () => {
    it('should format compression stats correctly', () => {
      const originalFile = createMockFile(
        'test.jpg',
        5 * 1024 * 1024,
        'image/jpeg'
      )
      const compressedFile = createMockFile(
        'test.jpg',
        2 * 1024 * 1024,
        'image/jpeg'
      )

      const result: CompressionResult = {
        originalFile,
        compressedFile,
        originalSize: 5 * 1024 * 1024,
        compressedSize: 2 * 1024 * 1024,
        compressionRatio: 2.5,
        timeTaken: 1000,
      }

      const stats = formatCompressionStats(result)
      expect(stats).toBe('5.00 MB → 2.00 MB (60.0% smaller)')
    })

    it('should handle no compression case', () => {
      const originalFile = createMockFile(
        'test.jpg',
        1 * 1024 * 1024,
        'image/jpeg'
      )

      const result: CompressionResult = {
        originalFile,
        compressedFile: originalFile,
        originalSize: 1 * 1024 * 1024,
        compressedSize: 1 * 1024 * 1024,
        compressionRatio: 1,
        timeTaken: 0,
      }

      const stats = formatCompressionStats(result)
      expect(stats).toBe('No compression needed (1.00 MB)')
    })
  })

  describe('getCompressionSummary', () => {
    it('should calculate compression summary correctly', () => {
      const file1 = createMockFile('test1.jpg', 5 * 1024 * 1024, 'image/jpeg')
      const file2 = createMockFile('test2.jpg', 3 * 1024 * 1024, 'image/jpeg')

      const results: CompressionResult[] = [
        {
          originalFile: file1,
          compressedFile: createMockFile(
            'test1.jpg',
            2 * 1024 * 1024,
            'image/jpeg'
          ),
          originalSize: 5 * 1024 * 1024,
          compressedSize: 2 * 1024 * 1024,
          compressionRatio: 2.5,
          timeTaken: 1000,
        },
        {
          originalFile: file2,
          compressedFile: file2, // No compression
          originalSize: 3 * 1024 * 1024,
          compressedSize: 3 * 1024 * 1024,
          compressionRatio: 1,
          timeTaken: 0,
        },
      ]

      const summary = getCompressionSummary(results)

      expect(summary.totalOriginalSize).toBe(8 * 1024 * 1024)
      expect(summary.totalCompressedSize).toBe(5 * 1024 * 1024)
      expect(summary.totalSavings).toBe(3 * 1024 * 1024)
      expect(summary.filesCompressed).toBe(1)
      expect(summary.totalFiles).toBe(2)
      expect(summary.averageCompressionRatio).toBe(1.75)
    })
  })
})
