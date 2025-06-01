import { ImageGenerationService } from './image-generation'
import { BatchProcessor } from './batch-image-generation/batch-processor'
import { BatchQueueManager } from './batch-image-generation/batch-queue-manager'
import {
  BatchImageGenerationRequest,
  BatchImageGenerationResponse,
  BatchImageResult,
  BatchProgress,
  BatchError,
  BatchMetrics,
  BatchQueue,
  BatchProcessingOptions,
  ProviderCapacity,
  BatchScheduler,
  BatchEventListener,
  BatchStatus,
} from './types/batch-image-generation'
import {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageModel,
} from './types/image-generation'

export class BatchImageGenerationService implements BatchScheduler {
  private processor: BatchProcessor
  private queueManager: BatchQueueManager
  private options: BatchProcessingOptions
  private batchQueue: Map<string, BatchQueue> = new Map()
  private activeBatches: Map<string, BatchImageGenerationResponse> = new Map()
  private batchResults: Map<string, BatchImageResult[]> = new Map()
  private eventListeners: BatchEventListener[] = []
  private metrics: BatchMetrics
  private progressIntervals: Map<string, NodeJS.Timeout> = new Map()

  constructor(
    imageService: ImageGenerationService,
    options: BatchProcessingOptions = {}
  ) {
    this.options = {
      maxConcurrentBatches: 3,
      maxConcurrentImagesPerBatch: 5,
      defaultFailureStrategy: 'continue-on-error',
      maxRetries: 2,
      retryDelay: 1000,
      progressUpdateInterval: 500,
      enableLoadBalancing: true,
      priorityWeights: { low: 1, medium: 2, high: 3 },
      ...options,
    }

    this.processor = new BatchProcessor(imageService, this.options)
    this.queueManager = new BatchQueueManager(this.options)

    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageGenerationTime: 0,
      totalCost: 0,
      providerUsage: {
        replicate: 0,
        runpod: 0,
        modal: 0,
      },
      batchesProcessed: 0,
      averageBatchSize: 0,
      averageBatchDuration: 0,
      concurrencyUtilization: 0,
      providerDistribution: {
        replicate: 0,
        runpod: 0,
        modal: 0,
      },
      failureRate: 0,
      retryRate: 0,
    }

    // Start background processing
    this.startBackgroundProcessing()

    // Start periodic cleanup
    this.startPeriodicCleanup()
  }

  async scheduleBatch(batch: BatchImageGenerationRequest): Promise<string> {
    const batchId = this.queueManager.scheduleBatch(batch)
    this.processNextBatch()
    return batchId
  }

  async processBatch(batchId: string): Promise<BatchImageGenerationResponse> {
    const queueItem = this.queueManager.getBatch(batchId)
    if (!queueItem) {
      throw new Error(`Batch ${batchId} not found`)
    }

    const batchResponse = this.queueManager.getBatchResponse(batchId)!

    // Check if batch is already being processed or completed
    if (
      batchResponse.status === 'processing' ||
      batchResponse.status === 'completed'
    ) {
      console.log(
        `Batch ${batchId} is already ${batchResponse.status}, skipping duplicate processing`
      )
      return batchResponse
    }

    // Update status to processing
    this.queueManager.updateBatchStatus(batchId, 'processing')

    try {
      // Process the batch using the real processor
      console.log(
        `Starting batch processing for ${batchId} with ${queueItem.batch.requests.length} images`
      )

      // Call the actual processor to generate real images
      const processingResult = await this.processor.processBatch(
        queueItem.batch,
        progress => {
          // Update the queue manager with real progress
          this.queueManager.updateBatchProgress(batchId, progress)
          console.log(`Batch ${batchId} progress: ${progress.progress}%`)
        }
      )

      // Update the batch response with real results
      batchResponse.results = processingResult.results
      batchResponse.errors = processingResult.errors
      batchResponse.completedRequests = processingResult.completedRequests
      batchResponse.failedRequests = processingResult.failedRequests
      batchResponse.totalCost = processingResult.totalCost
      batchResponse.endTime = processingResult.endTime
      batchResponse.status = processingResult.status

      // Stop progress tracking and mark as completed
      this.queueManager.stopProgressTracking(batchId)
      this.queueManager.updateBatchStatus(batchId, processingResult.status)

      console.log(
        `Batch ${batchId} completed with status: ${processingResult.status}`
      )
      return batchResponse
    } catch (error) {
      console.error(`Batch ${batchId} failed:`, error)
      this.queueManager.stopProgressTracking(batchId)
      this.queueManager.updateBatchStatus(batchId, 'failed')
      throw error
    }
  }

  private async processNextBatch(): Promise<void> {
    if (!this.queueManager.canProcessMoreBatches()) {
      return
    }

    const nextBatch = this.queueManager.getNextBatchToProcess()
    if (nextBatch) {
      this.processBatch(nextBatch.id).catch(console.error)
    }
  }

  private startBackgroundProcessing(): void {
    // Process queue every 1 second
    setInterval(() => {
      this.processNextBatch()
    }, 1000)

    // Disable cleanup for now to prevent premature batch deletion
    // Clean up completed batches every 30 minutes (separate from processing)
    // setInterval(() => {
    //   this.queueManager.cleanupCompletedBatches()
    // }, 30 * 60 * 1000)
  }

  private startPeriodicCleanup(): void {
    // Disable cleanup for now to prevent premature batch deletion
    // Clean up completed batches every 30 minutes
    // setInterval(() => {
    //   this.queueManager.cleanupCompletedBatches()
    // }, 30 * 60 * 1000)
  }

  private updateMetrics(batchResponse: BatchImageGenerationResponse): void {
    this.metrics.batchesProcessed++
    this.metrics.totalRequests += batchResponse.totalRequests
    this.metrics.successfulRequests += batchResponse.completedRequests
    this.metrics.failedRequests += batchResponse.failedRequests
    this.metrics.totalCost += batchResponse.totalCost

    // Update averages
    this.metrics.averageBatchSize =
      this.metrics.totalRequests / this.metrics.batchesProcessed
    this.metrics.averageBatchDuration =
      (this.metrics.averageBatchDuration * (this.metrics.batchesProcessed - 1) +
        (batchResponse.totalDuration || 0)) /
      this.metrics.batchesProcessed

    this.metrics.failureRate =
      this.metrics.failedRequests / this.metrics.totalRequests
  }

  private emitProgressEvent(progress: BatchProgress): void {
    // Emit progress event to any listeners
  }

  // Provider capacity management
  async getProviderCapacity(): Promise<ProviderCapacity[]> {
    const providers: ImageGenerationProvider[] = ['replicate', 'runpod']
    const capacities: ProviderCapacity[] = []

    for (const provider of providers) {
      const capacity: ProviderCapacity = {
        provider,
        maxConcurrent: provider === 'replicate' ? 5 : 10,
        currentLoad: Math.floor(Math.random() * 3), // Mock current load
        availableSlots: 0,
        averageResponseTime: provider === 'replicate' ? 2000 : 1500,
        isHealthy: true,
        queueLength: 0,
      }

      capacity.availableSlots = capacity.maxConcurrent - capacity.currentLoad
      capacities.push(capacity)
    }

    return capacities
  }

  async selectOptimalProvider(
    model: ImageModel
  ): Promise<ImageGenerationProvider> {
    return this.processor.selectOptimalProvider(model)
  }

  // Event system delegation
  addEventListener(listener: BatchEventListener): void {
    this.processor.addEventListener(listener)
  }

  removeEventListener(listener: BatchEventListener): void {
    this.processor.removeEventListener(listener)
  }

  // Public API methods - delegate to queue manager
  async getBatchStatus(batchId: string): Promise<BatchProgress | null> {
    return this.queueManager.getBatchProgress(batchId)
  }

  async getBatchProgress(batchId: string): Promise<BatchProgress | null> {
    return this.queueManager.getBatchProgress(batchId)
  }

  async getBatchResponse(
    batchId: string
  ): Promise<BatchImageGenerationResponse | null> {
    return this.queueManager.getBatchResponse(batchId) || null
  }

  async cancelBatch(batchId: string): Promise<boolean> {
    return this.queueManager.cancelBatch(batchId)
  }

  async pauseBatch(batchId: string): Promise<boolean> {
    return this.queueManager.pauseBatch(batchId)
  }

  async resumeBatch(batchId: string): Promise<boolean> {
    return this.queueManager.resumeBatch(batchId)
  }

  async getQueueStatus(): Promise<BatchQueue[]> {
    return this.queueManager.getQueueStatus()
  }

  getQueueLength(): number {
    return this.queueManager.getQueueLength()
  }

  async getActiveBatchCount(): Promise<number> {
    return this.queueManager.getActiveBatchCount()
  }

  getMetrics(): BatchMetrics {
    return { ...this.metrics }
  }
}
