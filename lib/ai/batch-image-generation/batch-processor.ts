import { ImageGenerationService } from '../image-generation'
import {
  BatchImageGenerationRequest,
  BatchImageGenerationResponse,
  BatchImageResult,
  BatchProgress,
  BatchError,
  BatchProcessingOptions,
  BatchEventListener,
} from '../types/batch-image-generation'
import {
  ImageGenerationProvider,
  ImageGenerationRequest,
  ImageModel,
} from '../types/image-generation'

export class BatchProcessor {
  private imageService: ImageGenerationService
  private options: BatchProcessingOptions
  private eventListeners: BatchEventListener[] = []

  constructor(
    imageService: ImageGenerationService,
    options: BatchProcessingOptions
  ) {
    this.imageService = imageService
    this.options = options
  }

  addEventListener(listener: BatchEventListener): void {
    this.eventListeners.push(listener)
  }

  removeEventListener(listener: BatchEventListener): void {
    const index = this.eventListeners.indexOf(listener)
    if (index > -1) {
      this.eventListeners.splice(index, 1)
    }
  }

  private emitEvent(eventType: keyof BatchEventListener, ...args: any[]): void {
    this.eventListeners.forEach(listener => {
      const handler = listener[eventType] as any
      if (handler && typeof handler === 'function') {
        handler.apply(listener, args)
      }
    })
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }

  async processBatch(
    batch: BatchImageGenerationRequest,
    onProgress?: (progress: BatchProgress) => void
  ): Promise<BatchImageGenerationResponse> {
    const startTime = new Date()
    const results: BatchImageResult[] = []
    const errors: BatchError[] = []
    let completedCount = 0
    let failedCount = 0

    // Emit batch started event
    this.emitEvent('onBatchStarted', batch.id)

    // Check if we're in development mode (no API keys available)
    const isDevelopmentMode =
      !process.env.REPLICATE_API_KEY && !process.env.RUNPOD_API_KEY

    if (isDevelopmentMode) {
      console.log(
        '🧪 Development mode: No API keys found, using simulated image generation'
      )
    } else {
      console.log('🚀 Production mode: Using real image generation APIs')
    }

    try {
      // Process requests with concurrency control
      const concurrency = Math.min(
        batch.maxConcurrency || 3,
        batch.requests.length
      )
      const chunks = this.chunkArray(batch.requests, concurrency)

      for (const chunk of chunks) {
        // Process chunk in parallel
        const chunkPromises = chunk.map(async (request: any) => {
          try {
            let response: any

            if (isDevelopmentMode) {
              // Simulate image generation in development mode
              console.log(
                `🧪 Development mode: Simulating image generation for "${request.prompt}"`
              )

              // Simulate processing time
              await new Promise(resolve =>
                setTimeout(resolve, 1000 + Math.random() * 2000)
              )

              response = {
                id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                status: 'completed',
                imageUrl: `https://picsum.photos/1024/1024?random=${Math.random()}`,
                provider: 'development',
                model: request.model,
                generationTime: 1000 + Math.random() * 2000,
                cost: 0.035,
              }
            } else {
              // Select optimal provider for this request
              const provider = await this.selectOptimalProvider(request.model)

              console.log(
                `🔧 Using provider: ${provider} for model: ${request.model}`
              )

              // Actually call the image generation service
              response = await this.imageService.generateImage(
                {
                  prompt: request.prompt,
                  model: request.model,
                  width: request.width || 1024,
                  height: request.height || 1024,
                  style: request.style,
                  negativePrompt: request.negativePrompt,
                  seed: request.seed,
                  steps: request.steps,
                  guidanceScale: request.guidance,
                },
                provider
              )
            }

            const result: BatchImageResult = {
              requestId: request.id,
              index: batch.requests.indexOf(request),
              status: 'completed',
              response: {
                id: response.id,
                status: response.status,
                imageUrl: response.imageUrl,
                provider: response.provider,
                model: response.model,
                generationTime: response.generationTime,
                metadata: {
                  prompt: request.prompt,
                  width: request.width || 1024,
                  height: request.height || 1024,
                  style: request.style,
                  negativePrompt: request.negativePrompt,
                  seed: request.seed,
                  steps: request.steps,
                  guidanceScale: request.guidance,
                },
                cost: response.cost,
              },
              cost: response.cost,
              duration: response.generationTime,
              provider: response.provider,
            }

            results.push(result)
            completedCount++

            // Emit progress update
            if (onProgress) {
              const progress = Math.round(
                ((completedCount + failedCount) / batch.requests.length) * 100
              )
              onProgress({
                batchId: batch.id,
                status: 'processing',
                progress,
                completedCount,
                totalCount: batch.requests.length,
                currentlyProcessing: [],
                estimatedTimeRemaining: 0,
                statusMessage: `Completed ${completedCount}/${batch.requests.length} images${isDevelopmentMode ? ' (development mode)' : ''}`,
              })
            }

            return result
          } catch (error) {
            console.error(
              `❌ Batch processing error for request "${request.prompt}":`,
              {
                error: error instanceof Error ? error.message : error,
                stack: error instanceof Error ? error.stack : undefined,
                requestId: request.id,
                model: request.model,
              }
            )

            const batchError: BatchError = {
              requestId: request.id,
              index: batch.requests.indexOf(request),
              error: error instanceof Error ? error.message : 'Unknown error',
              timestamp: new Date(),
              retryCount: 0,
              isFatal: false,
            }

            const result: BatchImageResult = {
              requestId: request.id,
              index: batch.requests.indexOf(request),
              status: 'failed',
              error: batchError.error,
            }

            errors.push(batchError)
            results.push(result)
            failedCount++

            // Handle failure strategy
            if (batch.failureStrategy === 'fail-fast') {
              throw error
            }

            // Emit progress update
            if (onProgress) {
              const progress = Math.round(
                ((completedCount + failedCount) / batch.requests.length) * 100
              )
              onProgress({
                batchId: batch.id,
                status: 'processing',
                progress,
                completedCount,
                totalCount: batch.requests.length,
                currentlyProcessing: [],
                estimatedTimeRemaining: 0,
                statusMessage: `Completed ${completedCount}/${batch.requests.length} images (${failedCount} failed)${isDevelopmentMode ? ' (development mode)' : ''}`,
              })
            }

            return result
          }
        })

        // Wait for chunk to complete
        await Promise.all(chunkPromises)
      }

      const endTime = new Date()
      const totalDuration = endTime.getTime() - startTime.getTime()
      const averageTimePerImage = totalDuration / batch.requests.length

      const response: BatchImageGenerationResponse = {
        batchId: batch.id,
        status: failedCount === batch.requests.length ? 'failed' : 'completed',
        totalRequests: batch.requests.length,
        completedRequests: completedCount,
        failedRequests: failedCount,
        results,
        startTime,
        endTime,
        totalDuration,
        averageTimePerImage,
        totalCost: results.reduce((sum, result) => sum + (result.cost || 0), 0),
        errors,
        metrics: {
          totalRequests: batch.requests.length,
          successfulRequests: completedCount,
          failedRequests: failedCount,
          averageGenerationTime: averageTimePerImage,
          totalCost: results.reduce(
            (sum, result) => sum + (result.cost || 0),
            0
          ),
          providerUsage: {
            replicate: 0,
            runpod: 0,
            modal: 0,
          },
          batchesProcessed: 1,
          averageBatchSize: batch.requests.length,
          averageBatchDuration: totalDuration,
          concurrencyUtilization: 0,
          providerDistribution: {
            replicate: 0,
            runpod: 0,
            modal: 0,
          },
          failureRate: failedCount / batch.requests.length,
          retryRate: 0,
        },
      }

      console.log(`📊 Batch ${batch.id} final status:`, {
        status: response.status,
        totalRequests: batch.requests.length,
        completedRequests: completedCount,
        failedRequests: failedCount,
        reason:
          failedCount === batch.requests.length
            ? 'All requests failed'
            : 'At least one request succeeded',
      })

      // Send final progress update with completed status
      if (onProgress) {
        onProgress({
          batchId: batch.id,
          status: response.status,
          progress: 100,
          completedCount,
          totalCount: batch.requests.length,
          currentlyProcessing: [],
          estimatedTimeRemaining: 0,
          statusMessage:
            response.status === 'completed'
              ? 'Batch completed successfully'
              : 'Batch processing failed',
        })
      }

      // Emit batch completed event
      this.emitEvent('onBatchCompleted', response)

      return response
    } catch (error) {
      const endTime = new Date()
      const response: BatchImageGenerationResponse = {
        batchId: batch.id,
        status: 'failed',
        totalRequests: batch.requests.length,
        completedRequests: completedCount,
        failedRequests: batch.requests.length - completedCount,
        results,
        startTime,
        endTime,
        totalDuration: endTime.getTime() - startTime.getTime(),
        averageTimePerImage: 0,
        totalCost: results.reduce((sum, result) => sum + (result.cost || 0), 0),
        errors: [
          ...errors,
          {
            requestId: 'batch',
            index: -1,
            error:
              error instanceof Error
                ? error.message
                : 'Batch processing failed',
            timestamp: new Date(),
            retryCount: 0,
            isFatal: true,
          },
        ],
        metrics: {
          totalRequests: batch.requests.length,
          successfulRequests: completedCount,
          failedRequests: batch.requests.length - completedCount,
          averageGenerationTime: 0,
          totalCost: results.reduce(
            (sum, result) => sum + (result.cost || 0),
            0
          ),
          providerUsage: {
            replicate: 0,
            runpod: 0,
            modal: 0,
          },
          batchesProcessed: 1,
          averageBatchSize: batch.requests.length,
          averageBatchDuration: endTime.getTime() - startTime.getTime(),
          concurrencyUtilization: 0,
          providerDistribution: {
            replicate: 0,
            runpod: 0,
            modal: 0,
          },
          failureRate: 1,
          retryRate: 0,
        },
      }

      // Emit batch failed event
      this.emitEvent(
        'onBatchFailed',
        batch.id,
        error instanceof Error ? error.message : 'Unknown error'
      )

      return response
    }
  }

  async selectOptimalProvider(
    model: ImageModel
  ): Promise<ImageGenerationProvider> {
    // Always use Replicate for now since RunPod is having JSON parsing issues
    return 'replicate'

    // Original load balancing logic (disabled)
    /*
    if (!this.options.enableLoadBalancing) {
      return 'replicate' // Default provider
    }

    // Mock capacity-based selection for testing
    // In real implementation, this would query actual provider status
    const providers: ImageGenerationProvider[] = ['replicate', 'runpod']
    const capacities = [
      { provider: 'replicate' as const, availableSlots: 3, averageResponseTime: 2000 },
      { provider: 'runpod' as const, availableSlots: 8, averageResponseTime: 1500 }
    ]

    // Select provider with best capacity
    const bestProvider = capacities.reduce((best, current) => {
      const bestScore = (best.availableSlots / 10) * 100 + Math.max(0, 100 - (best.averageResponseTime / 100))
      const currentScore = (current.availableSlots / 10) * 100 + Math.max(0, 100 - (current.averageResponseTime / 100))
      return currentScore > bestScore ? current : best
    })

    return bestProvider.provider
    */
  }
}
