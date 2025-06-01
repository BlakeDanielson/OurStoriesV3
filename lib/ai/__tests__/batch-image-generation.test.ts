import { BatchImageGenerationService } from '../batch-image-generation'
import { ImageGenerationService } from '../image-generation'
import {
  BatchImageGenerationRequest,
  BatchImageGenerationResponse,
  BatchProgress,
  BatchProcessingOptions,
  ProviderCapacity,
  BatchEventListener,
} from '../types/batch-image-generation'
import {
  ProviderConfig,
  ImageGenerationRequest,
} from '../types/image-generation'

// Mock the base ImageGenerationService
jest.mock('../image-generation')

describe('BatchImageGenerationService', () => {
  let batchService: BatchImageGenerationService
  let mockImageService: jest.Mocked<ImageGenerationService>
  let mockConfig: ProviderConfig
  let mockOptions: BatchProcessingOptions

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks()
    jest.useFakeTimers()

    // Mock configuration
    mockConfig = {
      replicate: {
        apiKey: 'test-replicate-key',
        baseUrl: 'https://api.replicate.com/v1',
        models: {
          flux1: 'black-forest-labs/flux-schnell',
          'flux-kontext-pro': 'black-forest-labs/flux-kontext-pro',
        },
        rateLimit: { requestsPerMinute: 60, concurrent: 5 },
      },
      runpod: {
        apiKey: 'test-runpod-key',
        baseUrl: 'https://api.runpod.ai/v2',
        models: {
          flux1: 'flux-1-schnell',
          'flux-kontext-pro': 'flux-kontext-pro',
        },
        rateLimit: { requestsPerMinute: 100, concurrent: 10 },
      },
    }

    mockOptions = {
      maxConcurrentBatches: 3,
      maxConcurrentImagesPerBatch: 5,
      defaultFailureStrategy: 'continue-on-error',
      maxRetries: 2,
      retryDelay: 1000,
      progressUpdateInterval: 500,
      enableLoadBalancing: true,
      priorityWeights: { low: 1, medium: 2, high: 3 },
    }

    // Create mock ImageGenerationService
    mockImageService = new ImageGenerationService(
      mockConfig
    ) as jest.Mocked<ImageGenerationService>

    // Mock ImageGenerationService methods
    mockImageService.generateImage = jest.fn()
    mockImageService.testConnection = jest.fn().mockResolvedValue(true)
    mockImageService.calculateGenerationCost = jest.fn().mockReturnValue(0.035)
    mockImageService.getProviderHealth = jest.fn().mockReturnValue({
      isHealthy: true,
      lastChecked: new Date(),
      consecutiveFailures: 0,
      averageResponseTime: 2000,
    })

    // Create BatchImageGenerationService
    batchService = new BatchImageGenerationService(
      mockImageService,
      mockOptions
    )
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('Batch Queue Management', () => {
    test('should schedule a batch and return batch ID', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'batch-001',
        requests: [
          { prompt: 'A beautiful sunset', model: 'flux1' },
          { prompt: 'A mountain landscape', model: 'flux1' },
        ],
        priority: 'high',
        maxConcurrency: 2,
      }

      const batchId = await batchService.scheduleBatch(batchRequest)

      expect(batchId).toBe('batch-001')
      expect(batchService.getQueueLength()).toBe(1)
    })

    test('should prioritize high priority batches', async () => {
      const lowPriorityBatch: BatchImageGenerationRequest = {
        id: 'batch-low',
        requests: [{ prompt: 'Low priority image', model: 'flux1' }],
        priority: 'low',
      }

      const highPriorityBatch: BatchImageGenerationRequest = {
        id: 'batch-high',
        requests: [{ prompt: 'High priority image', model: 'flux1' }],
        priority: 'high',
      }

      await batchService.scheduleBatch(lowPriorityBatch)
      await batchService.scheduleBatch(highPriorityBatch)

      const queueStatus = await batchService.getQueueStatus()
      expect(queueStatus[0].id).toBe('batch-high')
      expect(queueStatus[1].id).toBe('batch-low')
    })

    test('should respect maximum concurrent batches limit', async () => {
      // Schedule more batches than the limit
      for (let i = 0; i < 5; i++) {
        await batchService.scheduleBatch({
          id: `batch-${i}`,
          requests: [{ prompt: `Image ${i}`, model: 'flux1' }],
        })
      }

      const activeBatches = await batchService.getActiveBatchCount()
      expect(activeBatches).toBeLessThanOrEqual(
        mockOptions.maxConcurrentBatches!
      )
    })
  })

  describe('Parallel Processing', () => {
    test('should process multiple images in parallel within concurrency limits', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'parallel-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Image 2', model: 'flux1' },
          { prompt: 'Image 3', model: 'flux1' },
          { prompt: 'Image 4', model: 'flux1' },
          { prompt: 'Image 5', model: 'flux1' },
        ],
        maxConcurrency: 3,
      }

      // Mock successful image generation
      mockImageService.generateImage.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        provider: 'replicate',
        model: 'flux1',
        generationTime: 2000,
      })

      const batchId = await batchService.scheduleBatch(batchRequest)
      const result = await batchService.processBatch(batchId)

      expect(result.completedRequests).toBe(5)
      expect(result.failedRequests).toBe(0)
      expect(mockImageService.generateImage).toHaveBeenCalledTimes(5)
    })

    test('should distribute load across multiple providers', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'load-balance-batch',
        requests: Array.from({ length: 10 }, (_, i) => ({
          prompt: `Image ${i}`,
          model: 'flux1',
        })),
        maxConcurrency: 5,
      }

      // Mock provider capacity
      jest.spyOn(batchService, 'getProviderCapacity').mockResolvedValue([
        {
          provider: 'replicate',
          maxConcurrent: 5,
          currentLoad: 2,
          availableSlots: 3,
          averageResponseTime: 2000,
          isHealthy: true,
          queueLength: 0,
        },
        {
          provider: 'runpod',
          maxConcurrent: 10,
          currentLoad: 1,
          availableSlots: 9,
          averageResponseTime: 1500,
          isHealthy: true,
          queueLength: 0,
        },
      ])

      mockImageService.generateImage.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        provider: 'runpod', // Should prefer RunPod due to better capacity
        model: 'flux1',
        generationTime: 1500,
      })

      const batchId = await batchService.scheduleBatch(batchRequest)
      await batchService.processBatch(batchId)

      // Verify load balancing occurred
      const calls = mockImageService.generateImage.mock.calls
      const providers = calls.map(call => call[1]) // Second argument is provider
      expect(providers.filter(p => p === 'runpod').length).toBeGreaterThan(
        providers.filter(p => p === 'replicate').length
      )
    })
  })

  describe('Progress Tracking', () => {
    test('should provide accurate progress updates', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'progress-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Image 2', model: 'flux1' },
          { prompt: 'Image 3', model: 'flux1' },
        ],
      }

      const progressUpdates: BatchProgress[] = []
      const listener: BatchEventListener = {
        onBatchProgress: progress => progressUpdates.push(progress),
      }

      batchService.addEventListener(listener)

      // Mock delayed image generation
      mockImageService.generateImage.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  id: 'test-id',
                  status: 'completed',
                  imageUrl: 'https://example.com/image.jpg',
                  provider: 'replicate',
                  model: 'flux1',
                  generationTime: 2000,
                }),
              1000
            )
          )
      )

      const batchId = await batchService.scheduleBatch(batchRequest)
      const processingPromise = batchService.processBatch(batchId)

      // Advance timers to trigger progress updates
      jest.advanceTimersByTime(1500)
      await Promise.resolve() // Allow promises to resolve

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[0].batchId).toBe('progress-batch')
      expect(progressUpdates[0].totalCount).toBe(3)

      await processingPromise
    })

    test('should calculate estimated time remaining', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'eta-batch',
        requests: Array.from({ length: 6 }, (_, i) => ({
          prompt: `Image ${i}`,
          model: 'flux1',
        })),
      }

      mockImageService.generateImage.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        provider: 'replicate',
        model: 'flux1',
        generationTime: 2000,
      })

      const batchId = await batchService.scheduleBatch(batchRequest)

      // Start processing and check progress after some completions
      const processingPromise = batchService.processBatch(batchId)

      // Simulate some time passing
      jest.advanceTimersByTime(4000)

      const progress = await batchService.getBatchProgress(batchId)

      expect(progress).toBeDefined()
      if (progress && progress.completedCount > 0) {
        expect(progress.estimatedTimeRemaining).toBeGreaterThan(0)
        expect(progress.averageTimePerImage).toBeGreaterThan(0)
      }

      await processingPromise
    })
  })

  describe('Error Handling and Retry Logic', () => {
    test('should retry failed requests according to strategy', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'retry-batch',
        requests: [{ prompt: 'Failing image', model: 'flux1' }],
        failureStrategy: 'continue-on-error',
      }

      // Mock first two calls to fail, third to succeed
      mockImageService.generateImage
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Rate limit'))
        .mockResolvedValueOnce({
          id: 'test-id',
          status: 'completed',
          imageUrl: 'https://example.com/image.jpg',
          provider: 'replicate',
          model: 'flux1',
          generationTime: 2000,
        })

      const batchId = await batchService.scheduleBatch(batchRequest)
      const result = await batchService.processBatch(batchId)

      expect(mockImageService.generateImage).toHaveBeenCalledTimes(3) // 2 retries + 1 success
      expect(result.completedRequests).toBe(1)
      expect(result.failedRequests).toBe(0)
    })

    test('should fail fast when strategy is fail-fast', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'fail-fast-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Failing image', model: 'flux1' },
          { prompt: 'Image 3', model: 'flux1' },
        ],
        failureStrategy: 'fail-fast',
      }

      mockImageService.generateImage
        .mockResolvedValueOnce({
          id: 'test-id-1',
          status: 'completed',
          imageUrl: 'https://example.com/image1.jpg',
          provider: 'replicate',
          model: 'flux1',
          generationTime: 2000,
        })
        .mockRejectedValueOnce(new Error('Fatal error'))
        .mockResolvedValueOnce({
          id: 'test-id-3',
          status: 'completed',
          imageUrl: 'https://example.com/image3.jpg',
          provider: 'replicate',
          model: 'flux1',
          generationTime: 2000,
        })

      const batchId = await batchService.scheduleBatch(batchRequest)
      const result = await batchService.processBatch(batchId)

      expect(result.status).toBe('failed')
      expect(result.completedRequests).toBeLessThan(3) // Should stop on first failure
    })

    test('should continue on error when strategy is continue-on-error', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'continue-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Failing image', model: 'flux1' },
          { prompt: 'Image 3', model: 'flux1' },
        ],
        failureStrategy: 'continue-on-error',
      }

      mockImageService.generateImage
        .mockResolvedValueOnce({
          id: 'test-id-1',
          status: 'completed',
          imageUrl: 'https://example.com/image1.jpg',
          provider: 'replicate',
          model: 'flux1',
          generationTime: 2000,
        })
        .mockRejectedValue(new Error('Persistent error')) // Fails for second image
        .mockResolvedValueOnce({
          id: 'test-id-3',
          status: 'completed',
          imageUrl: 'https://example.com/image3.jpg',
          provider: 'replicate',
          model: 'flux1',
          generationTime: 2000,
        })

      const batchId = await batchService.scheduleBatch(batchRequest)
      const result = await batchService.processBatch(batchId)

      expect(result.completedRequests).toBe(2) // Should complete images 1 and 3
      expect(result.failedRequests).toBe(1) // Should record failure for image 2
      expect(result.status).toBe('completed') // Overall batch should complete
    })
  })

  describe('Provider Capacity Management', () => {
    test('should accurately report provider capacity', async () => {
      const capacity = await batchService.getProviderCapacity()

      expect(capacity).toHaveLength(2) // replicate and runpod
      expect(capacity[0]).toMatchObject({
        provider: expect.any(String),
        maxConcurrent: expect.any(Number),
        currentLoad: expect.any(Number),
        availableSlots: expect.any(Number),
        averageResponseTime: expect.any(Number),
        isHealthy: expect.any(Boolean),
        queueLength: expect.any(Number),
      })
    })

    test('should select optimal provider based on capacity', async () => {
      // Mock different provider capacities
      jest.spyOn(batchService, 'getProviderCapacity').mockResolvedValue([
        {
          provider: 'replicate',
          maxConcurrent: 5,
          currentLoad: 5, // At capacity
          availableSlots: 0,
          averageResponseTime: 2000,
          isHealthy: true,
          queueLength: 10,
        },
        {
          provider: 'runpod',
          maxConcurrent: 10,
          currentLoad: 2, // Plenty of capacity
          availableSlots: 8,
          averageResponseTime: 1500,
          isHealthy: true,
          queueLength: 0,
        },
      ])

      const optimalProvider = await batchService.selectOptimalProvider('flux1')
      expect(optimalProvider).toBe('runpod')
    })
  })

  describe('Batch Control Operations', () => {
    test('should cancel a batch in progress', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'cancel-batch',
        requests: Array.from({ length: 5 }, (_, i) => ({
          prompt: `Image ${i}`,
          model: 'flux1',
        })),
      }

      // Mock slow image generation
      mockImageService.generateImage.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  id: 'test-id',
                  status: 'completed',
                  imageUrl: 'https://example.com/image.jpg',
                  provider: 'replicate',
                  model: 'flux1',
                  generationTime: 5000,
                }),
              5000
            )
          )
      )

      const batchId = await batchService.scheduleBatch(batchRequest)
      const processingPromise = batchService.processBatch(batchId)

      // Cancel after a short delay
      setTimeout(() => batchService.cancelBatch(batchId), 1000)
      jest.advanceTimersByTime(1000)

      const cancelled = await batchService.cancelBatch(batchId)
      expect(cancelled).toBe(true)

      const progress = await batchService.getBatchProgress(batchId)
      expect(progress?.status).toBe('cancelled')
    })

    test('should pause and resume a batch', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'pause-batch',
        requests: Array.from({ length: 3 }, (_, i) => ({
          prompt: `Image ${i}`,
          model: 'flux1',
        })),
      }

      const batchId = await batchService.scheduleBatch(batchRequest)

      // Pause the batch
      const paused = await batchService.pauseBatch(batchId)
      expect(paused).toBe(true)

      let progress = await batchService.getBatchProgress(batchId)
      expect(progress?.status).toBe('paused')

      // Resume the batch
      const resumed = await batchService.resumeBatch(batchId)
      expect(resumed).toBe(true)

      progress = await batchService.getBatchProgress(batchId)
      expect(progress?.status).toBe('processing')
    })
  })

  describe('Cost Calculation', () => {
    test('should calculate total batch cost accurately', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'cost-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Image 2', model: 'flux-kontext-pro' },
        ],
      }

      mockImageService.generateImage.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        provider: 'replicate',
        model: 'flux1',
        generationTime: 2000,
      })

      // Mock different costs for different models
      mockImageService.calculateGenerationCost
        .mockReturnValueOnce(0.035) // FLUX.1
        .mockReturnValueOnce(0.055) // FLUX-Kontext-Pro

      const batchId = await batchService.scheduleBatch(batchRequest)
      const result = await batchService.processBatch(batchId)

      expect(result.totalCost).toBe(0.09) // 0.035 + 0.055
    })
  })

  describe('Event System', () => {
    test('should emit batch lifecycle events', async () => {
      const events: string[] = []
      const listener: BatchEventListener = {
        onBatchStarted: batchId => events.push(`started:${batchId}`),
        onBatchProgress: progress =>
          events.push(`progress:${progress.progress}`),
        onBatchCompleted: response =>
          events.push(`completed:${response.batchId}`),
        onImageCompleted: (batchId, result) =>
          events.push(`image:${result.index}`),
      }

      batchService.addEventListener(listener)

      const batchRequest: BatchImageGenerationRequest = {
        id: 'event-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Image 2', model: 'flux1' },
        ],
      }

      mockImageService.generateImage.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        provider: 'replicate',
        model: 'flux1',
        generationTime: 2000,
      })

      const batchId = await batchService.scheduleBatch(batchRequest)
      await batchService.processBatch(batchId)

      expect(events).toContain('started:event-batch')
      expect(events).toContain('completed:event-batch')
      expect(events.filter(e => e.startsWith('image:')).length).toBe(2)
    })
  })

  describe('Performance Metrics', () => {
    test('should track batch processing metrics', async () => {
      const batchRequest: BatchImageGenerationRequest = {
        id: 'metrics-batch',
        requests: [
          { prompt: 'Image 1', model: 'flux1' },
          { prompt: 'Image 2', model: 'flux1' },
        ],
      }

      mockImageService.generateImage.mockResolvedValue({
        id: 'test-id',
        status: 'completed',
        imageUrl: 'https://example.com/image.jpg',
        provider: 'replicate',
        model: 'flux1',
        generationTime: 2000,
      })

      const batchId = await batchService.scheduleBatch(batchRequest)
      await batchService.processBatch(batchId)

      const metrics = batchService.getMetrics()
      expect(metrics.batchesProcessed).toBe(1)
      expect(metrics.averageBatchSize).toBe(2)
      expect(metrics.averageBatchDuration).toBeGreaterThan(0)
      expect(metrics.concurrencyUtilization).toBeGreaterThan(0)
    })
  })
})
