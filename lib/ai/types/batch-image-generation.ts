import {
  ImageGenerationRequest,
  ImageGenerationResponse,
  ImageGenerationProvider,
  GenerationMetrics,
} from './image-generation'

export interface BatchImageGenerationRequest {
  id: string
  requests: ImageGenerationRequest[]
  priority?: 'low' | 'medium' | 'high'
  maxConcurrency?: number
  preferredProvider?: ImageGenerationProvider
  failureStrategy?: 'fail-fast' | 'continue-on-error' | 'retry-failed'
  metadata?: Record<string, any>
}

export interface BatchImageGenerationResponse {
  batchId: string
  status: BatchStatus
  totalRequests: number
  completedRequests: number
  failedRequests: number
  results: BatchImageResult[]
  startTime: Date
  endTime?: Date
  totalDuration?: number
  averageTimePerImage?: number
  totalCost: number
  errors: BatchError[]
  metrics: BatchMetrics
}

export interface BatchImageResult {
  requestId: string
  index: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  response?: ImageGenerationResponse
  error?: string
  provider?: ImageGenerationProvider
  startTime?: Date
  endTime?: Date
  duration?: number
  cost?: number
  retryCount?: number
}

export interface BatchProgress {
  batchId: string
  status: BatchStatus
  progress: number // 0-100
  completedCount: number
  totalCount: number
  currentlyProcessing: string[] // request IDs
  estimatedTimeRemaining?: number
  averageTimePerImage?: number
  statusMessage: string
}

export interface BatchError {
  requestId: string
  index: number
  error: string
  provider?: ImageGenerationProvider
  timestamp: Date
  retryCount: number
  isFatal: boolean
}

export interface BatchMetrics extends GenerationMetrics {
  batchesProcessed: number
  averageBatchSize: number
  averageBatchDuration: number
  concurrencyUtilization: number
  providerDistribution: Record<ImageGenerationProvider, number>
  failureRate: number
  retryRate: number
}

export interface BatchQueue {
  id: string
  batch: BatchImageGenerationRequest
  status: BatchStatus
  priority: number
  createdAt: Date
  startedAt?: Date
  estimatedCompletion?: Date
}

export interface BatchProcessingOptions {
  maxConcurrentBatches?: number
  maxConcurrentImagesPerBatch?: number
  defaultFailureStrategy?: 'fail-fast' | 'continue-on-error' | 'retry-failed'
  maxRetries?: number
  retryDelay?: number
  progressUpdateInterval?: number
  enableLoadBalancing?: boolean
  priorityWeights?: {
    low: number
    medium: number
    high: number
  }
}

export interface ProviderCapacity {
  provider: ImageGenerationProvider
  maxConcurrent: number
  currentLoad: number
  availableSlots: number
  averageResponseTime: number
  isHealthy: boolean
  queueLength: number
}

export type BatchStatus =
  | 'queued'
  | 'starting'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'paused'

export interface BatchScheduler {
  scheduleBatch(batch: BatchImageGenerationRequest): Promise<string>
  getBatchStatus(batchId: string): Promise<BatchProgress | null>
  cancelBatch(batchId: string): Promise<boolean>
  pauseBatch(batchId: string): Promise<boolean>
  resumeBatch(batchId: string): Promise<boolean>
  getQueueStatus(): Promise<BatchQueue[]>
  getProviderCapacity(): Promise<ProviderCapacity[]>
}

export interface BatchEventListener {
  onBatchStarted?(batchId: string): void
  onBatchProgress?(progress: BatchProgress): void
  onBatchCompleted?(response: BatchImageGenerationResponse): void
  onBatchFailed?(batchId: string, error: string): void
  onImageCompleted?(batchId: string, result: BatchImageResult): void
  onImageFailed?(batchId: string, error: BatchError): void
}
