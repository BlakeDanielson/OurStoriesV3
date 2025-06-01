import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerationService } from '@/lib/ai/image-generation'
import { BatchImageGenerationService } from '@/lib/ai/batch-image-generation'
import { BatchImageGenerationRequest } from '@/lib/ai/types/batch-image-generation'
import { ImageGenerationRequest } from '@/lib/ai/types/image-generation'

// Model configuration matching test-replicate page
const modelInfo = {
  flux1: {
    name: 'FLUX.1 Schnell',
    description: 'Fast, high-quality generation (30s timeout)',
    timeout: 30,
  },
  'flux-kontext-pro': {
    name: 'FLUX Kontext Pro',
    description: 'Text-based image editing (60s timeout)',
    timeout: 60,
  },
  'imagen-4': {
    name: 'Google Imagen 4',
    description: 'Premium Google model (90s timeout)',
    timeout: 90,
  },
  'minimax-image-01': {
    name: 'MiniMax Image-01',
    description: 'Character reference support (120s timeout)',
    timeout: 120,
  },
  'flux-1.1-pro-ultra': {
    name: 'FLUX 1.1 Pro Ultra',
    description: 'Ultra high-resolution (90s timeout)',
    timeout: 90,
  },
}

// Singleton batch service instance to persist across requests
let batchServiceInstance: BatchImageGenerationService | null = null

function getBatchService(): BatchImageGenerationService {
  if (!batchServiceInstance) {
    const imageService = new ImageGenerationService({
      replicate: {
        apiKey: process.env.REPLICATE_API_KEY!,
        baseUrl: 'https://api.replicate.com/v1',
        models: {
          flux1:
            '131d9e185621b4b4d349fd262e363420a6f74081d8c27966c9c5bcf120fa3985', // FLUX Schnell latest version
          'flux-kontext-pro': 'black-forest-labs/flux-kontext-pro',
          'imagen-4': 'google/imagen-4',
          'minimax-image-01': 'minimax/image-01',
          'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
        },
        rateLimit: { requestsPerMinute: 60, concurrent: 5 },
      },
      runpod: {
        apiKey: process.env.RUNPOD_API_KEY || 'dummy',
        baseUrl: 'https://api.runpod.ai/v2',
        models: {
          flux1: 'flux-1-schnell',
          'flux-kontext-pro': 'flux-kontext-pro',
          'imagen-4': 'imagen-4',
          'minimax-image-01': 'minimax-image-01',
          'flux-1.1-pro-ultra': 'flux-1.1-pro-ultra',
        },
        rateLimit: { requestsPerMinute: 100, concurrent: 10 },
      },
    })

    batchServiceInstance = new BatchImageGenerationService(imageService, {
      maxConcurrentBatches: 5,
      maxConcurrentImagesPerBatch: 20,
      defaultFailureStrategy: 'continue-on-error',
      enableLoadBalancing: true,
      maxRetries: 3,
      progressUpdateInterval: 2000,
    })
  }

  return batchServiceInstance
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompts, model = 'flux1', options = {} } = body

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prompts array is required',
        },
        { status: 400 }
      )
    }

    if (prompts.length > 20) {
      return NextResponse.json(
        {
          success: false,
          error: 'Maximum 20 prompts per batch',
        },
        { status: 400 }
      )
    }

    // Validate model
    if (!modelInfo[model as keyof typeof modelInfo]) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid model: ${model}. Available models: ${Object.keys(modelInfo).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Create image generation requests
    const requests: ImageGenerationRequest[] = prompts.map(
      (prompt: string, index: number) => ({
        id: `req-${Date.now()}-${index}`,
        prompt: prompt.trim(),
        model: model as keyof typeof modelInfo,
        width: options.width || 1024,
        height: options.height || 1024,
        style: options.style || '',
        negativePrompt: options.negativePrompt || '',
        seed: options.seed,
        steps: options.steps,
        guidance: options.guidance,
      })
    )

    // Create batch request
    const batchRequest: BatchImageGenerationRequest = {
      id: `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requests,
      priority: options.priority || 'medium',
      maxConcurrency: Math.min(options.maxConcurrency || 3, 5), // Respect provider limits
      preferredProvider: options.preferredProvider || 'replicate',
      failureStrategy: options.failureStrategy || 'continue-on-error',
      metadata: {
        userAgent: request.headers.get('user-agent'),
        timestamp: new Date().toISOString(),
        modelInfo: modelInfo[model as keyof typeof modelInfo],
      },
    }

    // Schedule the batch
    const batchId = await getBatchService().scheduleBatch(batchRequest)

    // Process the batch immediately (no setTimeout to avoid race conditions)
    // The batch service will handle the processing asynchronously
    getBatchService()
      .processBatch(batchId)
      .catch(error => {
        console.error(`Batch processing failed for ${batchId}:`, error)
      })

    return NextResponse.json({
      batchId,
      status: 'scheduled',
      message: 'Batch scheduled successfully and processing has started',
      totalRequests: prompts.length,
    })
  } catch (error) {
    console.error('Batch generation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get('batchId')
    const action = searchParams.get('action')

    if (action === 'queue') {
      const queue = await getBatchService().getQueueStatus()
      const queueLength = getBatchService().getQueueLength()
      const activeBatches = await getBatchService().getActiveBatchCount()

      const queueStatus = {
        queue,
        queueLength,
        activeBatches,
      }

      return NextResponse.json(queueStatus)
    }

    if (action === 'metrics') {
      const metrics = await getBatchService().getMetrics()
      return NextResponse.json({ metrics })
    }

    if (action === 'history') {
      // Get all completed batches for the gallery
      try {
        const batchService = getBatchService()
        const allBatches = await batchService.getQueueStatus()

        // Get completed batch responses with full data
        const completedBatches = []
        for (const batch of allBatches) {
          if (batch.status === 'completed') {
            const batchResponse = await batchService.getBatchResponse(batch.id)
            if (
              batchResponse &&
              batchResponse.results &&
              batchResponse.results.length > 0
            ) {
              completedBatches.push({
                id: batch.id,
                timestamp: batch.createdAt.getTime(),
                status: batchResponse.status,
                totalRequests: batchResponse.totalRequests,
                completedRequests: batchResponse.completedRequests,
                failedRequests: batchResponse.failedRequests,
                results: batchResponse.results,
                startTime: batchResponse.startTime,
                endTime: batchResponse.endTime,
                totalDuration: batchResponse.totalDuration,
                totalCost: batchResponse.totalCost,
                // Extract prompts from results for preview
                prompts: batchResponse.results
                  .map(
                    result =>
                      result.response?.metadata?.prompt || 'Unknown prompt'
                  )
                  .slice(0, 3), // First 3 prompts for preview
                imageCount: batchResponse.results.filter(
                  result =>
                    result.status === 'completed' && result.response?.imageUrl
                ).length,
              })
            }
          }
        }

        // Sort by timestamp (newest first)
        completedBatches.sort((a, b) => b.timestamp - a.timestamp)

        return NextResponse.json({ batches: completedBatches })
      } catch (error) {
        console.error('Error fetching batch history:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch batch history',
          },
          { status: 500 }
        )
      }
    }

    if (action === 'force-complete' && batchId) {
      // Force completion of stuck batches by restarting progress tracking
      try {
        await getBatchService().processBatch(batchId)
        return NextResponse.json({
          success: true,
          message: `Restarted progress tracking for batch ${batchId}`,
        })
      } catch (error) {
        return NextResponse.json(
          {
            success: false,
            error:
              error instanceof Error
                ? error.message
                : 'Failed to restart batch',
          },
          { status: 400 }
        )
      }
    }

    if (batchId) {
      console.log(`🔍 Fetching batch progress for: ${batchId}`)
      const batchProgress = await getBatchService().getBatchProgress(batchId)

      if (!batchProgress) {
        console.log(`❌ Batch not found: ${batchId}`)
        return NextResponse.json(
          {
            success: false,
            error: 'Batch not found',
          },
          { status: 404 }
        )
      }

      console.log(`📊 Batch ${batchId} status: ${batchProgress.status}`)

      // If batch is completed, also include the full results
      if (
        batchProgress.status === 'completed' ||
        batchProgress.status === 'failed'
      ) {
        console.log(`🎯 Fetching full results for completed batch: ${batchId}`)
        const batchService = getBatchService()
        const fullBatchResponse = await batchService.getBatchResponse(batchId)

        if (fullBatchResponse) {
          console.log(
            `✅ Found full batch response with ${fullBatchResponse.results?.length || 0} results`
          )
          return NextResponse.json({
            ...batchProgress,
            results: fullBatchResponse.results,
            errors: fullBatchResponse.errors,
            totalCost: fullBatchResponse.totalCost,
            startTime: fullBatchResponse.startTime,
            endTime: fullBatchResponse.endTime,
            totalDuration: fullBatchResponse.totalDuration,
          })
        } else {
          console.log(`❌ No full batch response found for: ${batchId}`)
        }
      }

      return NextResponse.json(batchProgress)
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Missing batchId or action parameter',
      },
      { status: 400 }
    )
  } catch (error) {
    console.error('Batch status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
