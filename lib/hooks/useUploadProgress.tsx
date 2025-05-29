import { useState, useCallback, useRef } from 'react'
import {
  UploadProgressData,
  BatchUploadProgress,
  createUploadProgressData,
  updateUploadProgress,
  calculateBatchProgress,
  generateFileId,
} from '@/lib/utils/upload-progress'

export interface UseUploadProgressOptions {
  onProgressUpdate?: (
    fileProgress: UploadProgressData[],
    batchProgress: BatchUploadProgress
  ) => void
  onFileComplete?: (fileProgress: UploadProgressData) => void
  onFileError?: (fileProgress: UploadProgressData, error: string) => void
  onBatchComplete?: (batchProgress: BatchUploadProgress) => void
  onBatchError?: (batchProgress: BatchUploadProgress) => void
}

export interface UseUploadProgressReturn {
  fileProgress: UploadProgressData[]
  batchProgress: BatchUploadProgress
  initializeFiles: (files: File[]) => void
  updateFileProgress: (fileId: string, uploadedBytes: number) => void
  setFileStatus: (
    fileId: string,
    status: UploadProgressData['status'],
    error?: string
  ) => void
  setFileError: (fileId: string, error: string) => void
  retryFile: (fileId: string) => void
  cancelFile: (fileId: string) => void
  clearProgress: () => void
  getFileProgress: (fileId: string) => UploadProgressData | undefined
  isUploading: boolean
  hasErrors: boolean
  canRetry: boolean
}

export function useUploadProgress(
  options: UseUploadProgressOptions = {}
): UseUploadProgressReturn {
  const [fileProgress, setFileProgress] = useState<UploadProgressData[]>([])
  const batchProgressRef = useRef<BatchUploadProgress>({
    totalFiles: 0,
    completedFiles: 0,
    failedFiles: 0,
    totalBytes: 0,
    uploadedBytes: 0,
    overallProgress: 0,
    averageSpeed: 0,
    eta: 0,
    status: 'idle',
  })

  const {
    onProgressUpdate,
    onFileComplete,
    onFileError,
    onBatchComplete,
    onBatchError,
  } = options

  // Calculate and update batch progress
  const updateBatchProgress = useCallback(
    (newFileProgress: UploadProgressData[]) => {
      const newBatchProgress = calculateBatchProgress(newFileProgress)
      batchProgressRef.current = newBatchProgress

      // Trigger callbacks
      if (onProgressUpdate) {
        onProgressUpdate(newFileProgress, newBatchProgress)
      }

      // Check for batch completion
      if (newBatchProgress.status === 'completed' && onBatchComplete) {
        onBatchComplete(newBatchProgress)
      }

      // Check for batch errors
      if (newBatchProgress.status === 'failed' && onBatchError) {
        onBatchError(newBatchProgress)
      }

      return newBatchProgress
    },
    [onProgressUpdate, onBatchComplete, onBatchError]
  )

  // Initialize files for tracking
  const initializeFiles = useCallback(
    (files: File[]) => {
      const newFileProgress = files.map(file => {
        const fileId = generateFileId(file)
        return createUploadProgressData(fileId, file.name, file.size)
      })

      setFileProgress(newFileProgress)
      updateBatchProgress(newFileProgress)
    },
    [updateBatchProgress]
  )

  // Update progress for a specific file
  const updateFileProgress = useCallback(
    (fileId: string, uploadedBytes: number) => {
      setFileProgress(prev => {
        const newProgress = prev.map(progress => {
          if (progress.fileId === fileId) {
            const updated = updateUploadProgress(progress, uploadedBytes)

            // Trigger file completion callback
            if (
              updated.status === 'completed' &&
              progress.status !== 'completed' &&
              onFileComplete
            ) {
              onFileComplete(updated)
            }

            return updated
          }
          return progress
        })

        updateBatchProgress(newProgress)
        return newProgress
      })
    },
    [updateBatchProgress, onFileComplete]
  )

  // Set file status
  const setFileStatus = useCallback(
    (fileId: string, status: UploadProgressData['status'], error?: string) => {
      setFileProgress(prev => {
        const newProgress = prev.map(progress => {
          if (progress.fileId === fileId) {
            const updated = {
              ...progress,
              status,
              error,
              endTime:
                status === 'completed' ||
                status === 'failed' ||
                status === 'cancelled'
                  ? Date.now()
                  : progress.endTime,
            }

            // Trigger callbacks based on status
            if (status === 'completed' && onFileComplete) {
              onFileComplete(updated)
            } else if (status === 'failed' && onFileError) {
              onFileError(updated, error || 'Upload failed')
            }

            return updated
          }
          return progress
        })

        updateBatchProgress(newProgress)
        return newProgress
      })
    },
    [updateBatchProgress, onFileComplete, onFileError]
  )

  // Set file error
  const setFileError = useCallback(
    (fileId: string, error: string) => {
      setFileStatus(fileId, 'failed', error)
    },
    [setFileStatus]
  )

  // Retry a failed file
  const retryFile = useCallback(
    (fileId: string) => {
      setFileProgress(prev => {
        const newProgress = prev.map(progress => {
          if (progress.fileId === fileId && progress.status === 'failed') {
            return {
              ...progress,
              status: 'pending' as const,
              uploadedBytes: 0,
              progress: 0,
              error: undefined,
              startTime: undefined,
              endTime: undefined,
              speed: undefined,
              eta: undefined,
            }
          }
          return progress
        })

        updateBatchProgress(newProgress)
        return newProgress
      })
    },
    [updateBatchProgress]
  )

  // Cancel a file upload
  const cancelFile = useCallback(
    (fileId: string) => {
      setFileStatus(fileId, 'cancelled')
    },
    [setFileStatus]
  )

  // Clear all progress
  const clearProgress = useCallback(() => {
    setFileProgress([])
    batchProgressRef.current = {
      totalFiles: 0,
      completedFiles: 0,
      failedFiles: 0,
      totalBytes: 0,
      uploadedBytes: 0,
      overallProgress: 0,
      averageSpeed: 0,
      eta: 0,
      status: 'idle',
    }
  }, [])

  // Get progress for a specific file
  const getFileProgress = useCallback(
    (fileId: string) => {
      return fileProgress.find(progress => progress.fileId === fileId)
    },
    [fileProgress]
  )

  // Computed properties
  const isUploading = fileProgress.some(
    progress => progress.status === 'uploading'
  )
  const hasErrors = fileProgress.some(progress => progress.status === 'failed')
  const canRetry = fileProgress.some(progress => progress.status === 'failed')

  return {
    fileProgress,
    batchProgress: batchProgressRef.current,
    initializeFiles,
    updateFileProgress,
    setFileStatus,
    setFileError,
    retryFile,
    cancelFile,
    clearProgress,
    getFileProgress,
    isUploading,
    hasErrors,
    canRetry,
  }
}
