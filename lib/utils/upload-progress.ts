export interface UploadProgressData {
  fileId: string
  fileName: string
  fileSize: number
  uploadedBytes: number
  progress: number // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled'
  error?: string
  startTime?: number
  endTime?: number
  speed?: number // bytes per second
  eta?: number // estimated time remaining in seconds
}

export interface BatchUploadProgress {
  totalFiles: number
  completedFiles: number
  failedFiles: number
  totalBytes: number
  uploadedBytes: number
  overallProgress: number // 0-100
  averageSpeed: number // bytes per second
  eta: number // estimated time remaining in seconds
  status: 'idle' | 'uploading' | 'completed' | 'failed' | 'paused'
}

/**
 * Calculate upload progress percentage
 */
export function calculateProgress(
  uploadedBytes: number,
  totalBytes: number
): number {
  if (totalBytes === 0) return 0
  return Math.min(Math.round((uploadedBytes / totalBytes) * 100), 100)
}

/**
 * Calculate upload speed in bytes per second
 */
export function calculateUploadSpeed(
  uploadedBytes: number,
  startTime: number
): number {
  const elapsedTime = (Date.now() - startTime) / 1000 // seconds
  if (elapsedTime === 0) return 0
  return uploadedBytes / elapsedTime
}

/**
 * Calculate estimated time remaining in seconds
 */
export function calculateETA(remainingBytes: number, speed: number): number {
  if (speed === 0) return Infinity
  return remainingBytes / speed
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Format upload speed in human readable format
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`
}

/**
 * Format time duration in human readable format
 */
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--'

  if (seconds < 60) {
    return `${Math.round(seconds)}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.round(seconds % 60)
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }
}

/**
 * Create initial upload progress data for a file
 */
export function createUploadProgressData(
  fileId: string,
  fileName: string,
  fileSize: number
): UploadProgressData {
  return {
    fileId,
    fileName,
    fileSize,
    uploadedBytes: 0,
    progress: 0,
    status: 'pending',
    startTime: undefined,
    endTime: undefined,
    speed: undefined,
    eta: undefined,
  }
}

/**
 * Update upload progress data with new uploaded bytes
 */
export function updateUploadProgress(
  progressData: UploadProgressData,
  uploadedBytes: number
): UploadProgressData {
  const now = Date.now()
  const startTime = progressData.startTime || now

  // Calculate progress
  const progress = calculateProgress(uploadedBytes, progressData.fileSize)

  // Calculate speed and ETA
  const speed = calculateUploadSpeed(uploadedBytes, startTime)
  const remainingBytes = progressData.fileSize - uploadedBytes
  const eta = calculateETA(remainingBytes, speed)

  // Determine status
  let status = progressData.status
  if (
    uploadedBytes > 0 &&
    uploadedBytes < progressData.fileSize &&
    status === 'pending'
  ) {
    status = 'uploading'
  } else if (uploadedBytes >= progressData.fileSize) {
    status = 'completed'
  }

  return {
    ...progressData,
    uploadedBytes,
    progress,
    status,
    startTime,
    speed,
    eta,
    endTime: status === 'completed' ? now : undefined,
  }
}

/**
 * Calculate batch upload progress from individual file progress
 */
export function calculateBatchProgress(
  fileProgressList: UploadProgressData[]
): BatchUploadProgress {
  const totalFiles = fileProgressList.length
  const completedFiles = fileProgressList.filter(
    f => f.status === 'completed'
  ).length
  const failedFiles = fileProgressList.filter(f => f.status === 'failed').length

  const totalBytes = fileProgressList.reduce((sum, f) => sum + f.fileSize, 0)
  const uploadedBytes = fileProgressList.reduce(
    (sum, f) => sum + f.uploadedBytes,
    0
  )

  const overallProgress = calculateProgress(uploadedBytes, totalBytes)

  // Calculate average speed from active uploads
  const activeUploads = fileProgressList.filter(
    f => f.status === 'uploading' && f.speed !== undefined
  )
  const averageSpeed =
    activeUploads.length > 0
      ? activeUploads.reduce((sum, f) => sum + (f.speed || 0), 0) /
        activeUploads.length
      : 0

  // Calculate ETA for remaining bytes
  const remainingBytes = totalBytes - uploadedBytes
  const eta = calculateETA(remainingBytes, averageSpeed)

  // Determine overall status
  let status: BatchUploadProgress['status'] = 'idle'
  if (fileProgressList.some(f => f.status === 'uploading')) {
    status = 'uploading'
  } else if (completedFiles === totalFiles && totalFiles > 0) {
    status = 'completed'
  } else if (
    failedFiles > 0 &&
    !fileProgressList.some(f => f.status === 'uploading')
  ) {
    status = 'failed'
  }

  return {
    totalFiles,
    completedFiles,
    failedFiles,
    totalBytes,
    uploadedBytes,
    overallProgress,
    averageSpeed,
    eta,
    status,
  }
}

/**
 * Generate a unique file ID for tracking
 */
export function generateFileId(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

/**
 * Get status color for UI display
 */
export function getStatusColor(status: UploadProgressData['status']): string {
  switch (status) {
    case 'pending':
      return 'text-gray-500'
    case 'uploading':
      return 'text-blue-600'
    case 'completed':
      return 'text-green-600'
    case 'failed':
      return 'text-red-600'
    case 'cancelled':
      return 'text-orange-600'
    default:
      return 'text-gray-500'
  }
}

/**
 * Get status icon for UI display
 */
export function getStatusIcon(status: UploadProgressData['status']): string {
  switch (status) {
    case 'pending':
      return '⏳'
    case 'uploading':
      return '⬆️'
    case 'completed':
      return '✅'
    case 'failed':
      return '❌'
    case 'cancelled':
      return '🚫'
    default:
      return '⏳'
  }
}
