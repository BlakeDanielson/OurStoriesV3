import {
  BatchImageGenerationRequest,
  BatchImageGenerationResponse,
  BatchQueue,
  BatchProgress,
  BatchProcessingOptions,
  BatchStatus,
} from '../types/batch-image-generation'
import fs from 'fs'
import path from 'path'

export class BatchQueueManager {
  private batchQueue: Map<string, BatchQueue> = new Map()
  private activeBatches: Map<string, BatchImageGenerationResponse> = new Map()
  private batchResults: Map<string, any[]> = new Map()
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map()
  private options: BatchProcessingOptions
  private latestProgress: Map<string, BatchProgress> = new Map()
  private persistenceDir: string

  constructor(options: BatchProcessingOptions) {
    this.options = options
    this.persistenceDir = path.join(
      process.cwd(),
      '.next',
      'cache',
      'batch-storage'
    )
    this.ensurePersistenceDir()
    this.loadPersistedBatches()
  }

  private ensurePersistenceDir(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) {
        fs.mkdirSync(this.persistenceDir, { recursive: true })
      }
    } catch (error) {
      console.warn('Failed to create persistence directory:', error)
    }
  }

  private loadPersistedBatches(): void {
    try {
      if (!fs.existsSync(this.persistenceDir)) return

      const files = fs.readdirSync(this.persistenceDir)
      for (const file of files) {
        if (file.endsWith('.json')) {
          const batchId = file.replace('.json', '')
          const filePath = path.join(this.persistenceDir, file)
          const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

          // Restore the batch response with proper date objects
          const batchResponse: BatchImageGenerationResponse = {
            ...data,
            startTime: new Date(data.startTime),
            endTime: data.endTime ? new Date(data.endTime) : undefined,
          }

          this.activeBatches.set(batchId, batchResponse)

          // Also create a queue item for completed batches so they show up in history
          const queueItem: BatchQueue = {
            id: batchId,
            batch: {
              id: batchId,
              requests: [], // We don't need the original requests for completed batches
              priority: 'medium',
              maxConcurrency: 3,
              failureStrategy: 'continue-on-error',
            },
            status: batchResponse.status,
            priority: this.calculatePriority('medium'),
            createdAt: batchResponse.startTime,
            startedAt: batchResponse.startTime,
          }

          this.batchQueue.set(batchId, queueItem)
          console.log(`🔄 Restored persisted batch: ${batchId}`)
        }
      }
    } catch (error) {
      console.warn('Failed to load persisted batches:', error)
    }
  }

  private persistBatch(batchId: string): void {
    try {
      const batchResponse = this.activeBatches.get(batchId)
      if (
        !batchResponse ||
        (batchResponse.status !== 'completed' &&
          batchResponse.status !== 'failed')
      ) {
        return
      }

      const filePath = path.join(this.persistenceDir, `${batchId}.json`)
      fs.writeFileSync(filePath, JSON.stringify(batchResponse, null, 2))
      console.log(`💾 Persisted batch: ${batchId}`)
    } catch (error) {
      console.warn(`Failed to persist batch ${batchId}:`, error)
    }
  }

  private removePersistentBatch(batchId: string): void {
    try {
      const filePath = path.join(this.persistenceDir, `${batchId}.json`)
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath)
        console.log(`🗑️ Removed persistent batch: ${batchId}`)
      }
    } catch (error) {
      console.warn(`Failed to remove persistent batch ${batchId}:`, error)
    }
  }

  scheduleBatch(batch: BatchImageGenerationRequest): string {
    const priority = this.calculatePriority(batch.priority || 'medium')
    const queueItem: BatchQueue = {
      id: batch.id,
      batch,
      status: 'queued',
      priority,
      createdAt: new Date(),
    }

    this.batchQueue.set(batch.id, queueItem)

    // Initialize batch response
    const batchResponse: BatchImageGenerationResponse = {
      batchId: batch.id,
      status: 'queued',
      totalRequests: batch.requests.length,
      completedRequests: 0,
      failedRequests: 0,
      results: [],
      startTime: new Date(),
      totalCost: 0,
      errors: [],
      metrics: {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageGenerationTime: 0,
        totalCost: 0,
        providerUsage: { replicate: 0, runpod: 0, modal: 0 },
        batchesProcessed: 0,
        averageBatchSize: 0,
        averageBatchDuration: 0,
        concurrencyUtilization: 0,
        providerDistribution: { replicate: 0, runpod: 0, modal: 0 },
        failureRate: 0,
        retryRate: 0,
      },
    }

    this.activeBatches.set(batch.id, batchResponse)
    this.batchResults.set(batch.id, [])

    return batch.id
  }

  getBatch(batchId: string): BatchQueue | undefined {
    return this.batchQueue.get(batchId)
  }

  getBatchResponse(batchId: string): BatchImageGenerationResponse | undefined {
    return this.activeBatches.get(batchId)
  }

  updateBatchStatus(batchId: string, status: BatchStatus): void {
    const queueItem = this.batchQueue.get(batchId)
    const batchResponse = this.activeBatches.get(batchId)

    if (queueItem) {
      queueItem.status = status
      if (status === 'processing' && !queueItem.startedAt) {
        queueItem.startedAt = new Date()
      }
    }

    if (batchResponse) {
      batchResponse.status = status

      // Persist completed or failed batches
      if (status === 'completed' || status === 'failed') {
        this.persistBatch(batchId)
      }
    }
  }

  updateBatchProgress(batchId: string, progress: BatchProgress): void {
    const batchResponse = this.activeBatches.get(batchId)
    const queueItem = this.batchQueue.get(batchId)

    if (batchResponse) {
      batchResponse.completedRequests = progress.completedCount
      batchResponse.status = progress.status as BatchStatus

      // Store the latest progress for getBatchProgress
      this.latestProgress.set(batchId, progress)

      // Also update the queue item status to keep them in sync
      if (queueItem) {
        queueItem.status = progress.status as BatchStatus
      }

      // Persist completed or failed batches
      if (progress.status === 'completed' || progress.status === 'failed') {
        this.persistBatch(batchId)
      }
    }
  }

  async getBatchProgress(batchId: string): Promise<BatchProgress | null> {
    // Get the batch response first to check the actual status
    const batchResponse = this.activeBatches.get(batchId)
    if (!batchResponse) return null

    // Return real progress if available, but use the batch response status as the source of truth
    const realProgress = this.latestProgress.get(batchId)
    if (realProgress) {
      // Use the batch response status as the authoritative source
      return {
        ...realProgress,
        status: batchResponse.status,
        statusMessage: this.getStatusMessage(
          batchResponse.status,
          realProgress.progress
        ),
      }
    }

    // Fallback to simulated progress for backwards compatibility
    const progress =
      (batchResponse.completedRequests / batchResponse.totalRequests) * 100
    const currentlyProcessing = this.getCurrentlyProcessingRequests(batchId)

    return {
      batchId,
      status: batchResponse.status,
      progress: Math.round(progress),
      completedCount: batchResponse.completedRequests,
      totalCount: batchResponse.totalRequests,
      currentlyProcessing,
      estimatedTimeRemaining:
        this.calculateEstimatedTimeRemaining(batchResponse),
      averageTimePerImage: batchResponse.averageTimePerImage,
      statusMessage: this.getStatusMessage(batchResponse.status, progress),
    }
  }

  private getCurrentlyProcessingRequests(batchId: string): string[] {
    const results = this.batchResults.get(batchId) || []
    return results
      .filter(result => result.status === 'processing')
      .map(result => result.requestId)
  }

  private calculateEstimatedTimeRemaining(
    batchResponse: BatchImageGenerationResponse
  ): number {
    if (batchResponse.completedRequests === 0) return 0

    const elapsed = Date.now() - batchResponse.startTime.getTime()
    const averageTimePerImage = elapsed / batchResponse.completedRequests
    const remainingImages =
      batchResponse.totalRequests - batchResponse.completedRequests

    return Math.round(averageTimePerImage * remainingImages)
  }

  private getStatusMessage(status: BatchStatus, progress: number): string {
    switch (status) {
      case 'queued':
        return 'Waiting in queue...'
      case 'starting':
        return 'Initializing batch processing...'
      case 'processing':
        return `Processing images... ${progress}% complete`
      case 'completed':
        return 'Batch completed successfully'
      case 'failed':
        return 'Batch processing failed'
      case 'cancelled':
        return 'Batch was cancelled'
      case 'paused':
        return 'Batch processing paused'
      default:
        return 'Unknown status'
    }
  }

  startProgressTracking(
    batchId: string,
    onProgress: (progress: BatchProgress) => void
  ): void {
    // Don't start simulated progress if real progress is already being tracked
    if (this.latestProgress.has(batchId)) {
      return
    }

    const batchResponse = this.activeBatches.get(batchId)
    if (!batchResponse) return

    const interval = setInterval(() => {
      // Stop simulated progress if real progress is now available
      if (this.latestProgress.has(batchId)) {
        clearInterval(interval)
        this.progressIntervals.delete(batchId)
        return
      }

      if (batchResponse.status === 'processing') {
        const elapsed = Date.now() - batchResponse.startTime.getTime()
        const estimatedTotal = batchResponse.totalRequests * 30000 // 30s per image estimate

        // Simulate some completed requests based on time
        const simulatedCompleted = Math.floor(elapsed / 30000) // One every 30 seconds
        const actualCompleted = Math.min(
          simulatedCompleted,
          batchResponse.totalRequests
        )

        batchResponse.completedRequests = actualCompleted

        // Calculate progress - show 100% when completed, otherwise cap at 95% to indicate processing
        const isCompleted = actualCompleted >= batchResponse.totalRequests
        const progressPercent = isCompleted
          ? 100
          : Math.min(95, (elapsed / estimatedTotal) * 100)

        const progress: BatchProgress = {
          batchId,
          status: isCompleted ? 'completed' : 'processing',
          progress: progressPercent,
          completedCount: actualCompleted,
          totalCount: batchResponse.totalRequests,
          currentlyProcessing: isCompleted ? [] : [`req-${actualCompleted}`],
          estimatedTimeRemaining: Math.max(0, estimatedTotal - elapsed),
          statusMessage: isCompleted
            ? 'Batch completed successfully'
            : `Processing ${actualCompleted}/${batchResponse.totalRequests} images`,
        }

        // Update batch status if completed
        if (isCompleted) {
          batchResponse.status = 'completed'
          batchResponse.endTime = new Date()
          batchResponse.totalDuration = elapsed
          clearInterval(interval)
          this.progressIntervals.delete(batchId)
        }

        onProgress(progress)
      }
    }, this.options.progressUpdateInterval || 2000)

    this.progressIntervals.set(batchId, interval)
  }

  stopProgressTracking(batchId: string): void {
    const interval = this.progressIntervals.get(batchId)
    if (interval) {
      clearInterval(interval)
      this.progressIntervals.delete(batchId)
    }
  }

  private calculatePriority(priority: 'low' | 'medium' | 'high'): number {
    return this.options.priorityWeights![priority]
  }

  async getQueueStatus(): Promise<BatchQueue[]> {
    return Array.from(this.batchQueue.values()).sort(
      (a, b) => b.priority - a.priority
    )
  }

  getQueueLength(): number {
    return this.batchQueue.size
  }

  async getActiveBatchCount(): Promise<number> {
    return Array.from(this.activeBatches.values()).filter(
      batch => batch.status === 'processing'
    ).length
  }

  getNextBatchToProcess(): BatchQueue | null {
    const queuedBatches = Array.from(this.batchQueue.values())
      .filter(item => item.status === 'queued')
      .sort((a, b) => b.priority - a.priority)

    return queuedBatches.length > 0 ? queuedBatches[0] : null
  }

  canProcessMoreBatches(): boolean {
    const activeBatchCount = Array.from(this.activeBatches.values()).filter(
      batch => batch.status === 'processing'
    ).length

    return activeBatchCount < this.options.maxConcurrentBatches!
  }

  cancelBatch(batchId: string): boolean {
    const batchResponse = this.activeBatches.get(batchId)
    if (!batchResponse) return false

    batchResponse.status = 'cancelled'
    this.stopProgressTracking(batchId)
    return true
  }

  pauseBatch(batchId: string): boolean {
    const batchResponse = this.activeBatches.get(batchId)
    if (!batchResponse || batchResponse.status !== 'processing') return false

    batchResponse.status = 'paused'
    return true
  }

  resumeBatch(batchId: string): boolean {
    const batchResponse = this.activeBatches.get(batchId)
    if (!batchResponse || batchResponse.status !== 'paused') return false

    batchResponse.status = 'processing'
    return true
  }

  removeBatch(batchId: string): void {
    this.batchQueue.delete(batchId)
    this.activeBatches.delete(batchId)
    this.batchResults.delete(batchId)
    this.latestProgress.delete(batchId)
    this.stopProgressTracking(batchId)
    this.removePersistentBatch(batchId)
  }

  cleanupCompletedBatches(): void {
    // Clean up batches that have been completed for more than 7 days (much longer retention)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000

    Array.from(this.activeBatches.entries()).forEach(
      ([batchId, batchResponse]) => {
        if (
          (batchResponse.status === 'completed' ||
            batchResponse.status === 'failed') &&
          batchResponse.endTime &&
          batchResponse.endTime.getTime() < sevenDaysAgo
        ) {
          console.log(`Cleaning up old completed batch: ${batchId}`)
          this.removeBatch(batchId)
        }
      }
    )
  }
}
