'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ImageGallery } from '@/components/ui/image-gallery'
import { BatchGallery } from './components/BatchGallery'

interface BatchStatus {
  batchId: string
  status: string
  progress: number
  completedCount: number
  totalCount: number
  currentlyProcessing: string[]
  estimatedTimeRemaining: number
  averageTimePerImage?: number
  statusMessage: string
}

interface QueueStatus {
  queue: any[]
  queueLength: number
  activeBatches: number
}

interface Metrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageGenerationTime: number
  totalCost: number
  batchesProcessed: number
  averageBatchSize: number
  failureRate: number
}

interface BatchResponse {
  batchId: string
  status: string
  totalRequests: number
  completedRequests: number
  failedRequests: number
  results: any[]
  errors: any[]
  startTime: string
  endTime?: string
  totalDuration?: number
  averageTimePerImage?: number
  totalCost: number
}

export default function BatchTestPage() {
  const [prompts, setPrompts] = useState(
    'A cute cartoon cat\nA mountain landscape\nA futuristic city'
  )
  const [model, setModel] = useState('flux1')
  const [batchId, setBatchId] = useState('')
  const [batchStatus, setBatchStatus] = useState<BatchStatus | null>(null)
  const [batchResponse, setBatchResponse] = useState<BatchResponse | null>(null)
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Detect if this is Luna's story based on prompts
  const isLunaStory =
    prompts.toLowerCase().includes('luna') &&
    prompts.toLowerCase().includes('crystal')

  // Auto-refresh status every 2 seconds when monitoring a batch
  useEffect(() => {
    if (batchId && batchStatus?.status === 'processing') {
      const interval = setInterval(() => {
        checkBatchStatus()
      }, 2000)
      return () => clearInterval(interval)
    }
    // Stop polling when batch is completed or failed
    if (
      batchStatus?.status === 'completed' ||
      batchStatus?.status === 'failed'
    ) {
      console.log(
        `🛑 Stopping polling for batch ${batchId} - status: ${batchStatus.status}`
      )
    }
  }, [batchId, batchStatus?.status])

  const scheduleBatch = async () => {
    setLoading(true)
    setError('')

    try {
      const promptArray = prompts.split('\n').filter(p => p.trim())

      const response = await fetch('/api/images/batch-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompts: promptArray,
          model,
          options: {
            width: 1024,
            height: 1024,
            priority: 'medium',
            maxConcurrency: 3,
            failureStrategy: 'continue-on-error',
          },
        }),
      })

      const data = await response.json()

      if (data.batchId && data.status === 'scheduled') {
        setBatchId(data.batchId)
        setError('')
        // Start monitoring immediately
        setTimeout(checkBatchStatus, 1000)
      } else {
        setError(data.error || 'Failed to schedule batch')
      }
    } catch (err) {
      setError(
        'Network error: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    } finally {
      setLoading(false)
    }
  }

  const checkBatchStatus = async () => {
    if (!batchId) return

    try {
      const response = await fetch(
        `/api/images/batch-generate?batchId=${batchId}`
      )
      const data = await response.json()

      if (response.ok) {
        setBatchStatus(data)

        // If batch is completed, fetch the full batch response with results
        if (data.status === 'completed' || data.status === 'failed') {
          // Only update batch response if we don't already have results or if this response has more complete data
          const hasExistingResults =
            batchResponse?.results && batchResponse.results.length > 0
          const hasNewResults = data.results && data.results.length > 0

          if (!hasExistingResults || hasNewResults) {
            console.log(`📥 Updating batch response for ${batchId}:`, {
              hasExistingResults,
              hasNewResults,
              newResultsCount: data.results?.length || 0,
            })

            // The API now returns the full response with results when completed
            setBatchResponse({
              batchId: data.batchId,
              status: data.status,
              totalRequests: data.totalCount,
              completedRequests: data.completedCount,
              failedRequests: data.totalCount - data.completedCount,
              results: data.results || [], // Use actual results from API
              errors: data.errors || [],
              startTime: data.startTime || new Date().toISOString(),
              endTime: data.endTime,
              totalDuration: data.totalDuration,
              averageTimePerImage: data.averageTimePerImage,
              totalCost: data.totalCost || 0,
            })
          } else {
            console.log(
              `🔒 Preserving existing batch response for ${batchId} - already has ${batchResponse.results.length} results`
            )
          }
        }

        setError('')
      } else {
        setError(data.error || 'Failed to get batch status')
      }
    } catch (err) {
      setError(
        'Failed to check status: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    }
  }

  const getQueueStatus = async () => {
    try {
      const response = await fetch('/api/images/batch-generate?action=queue')
      const data = await response.json()
      setQueueStatus(data)
    } catch (err) {
      setError(
        'Failed to get queue status: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    }
  }

  const getMetrics = async () => {
    try {
      const response = await fetch('/api/images/batch-generate?action=metrics')
      const data = await response.json()
      setMetrics(data.metrics)
    } catch (err) {
      setError(
        'Failed to get metrics: ' +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    }
  }

  const controlBatch = async (action: 'cancel' | 'pause' | 'resume') => {
    if (!batchId) return

    try {
      const response = await fetch(
        `/api/images/batch-generate?batchId=${batchId}&action=${action}`
      )
      const data = await response.json()

      if (data.success) {
        checkBatchStatus() // Refresh status
      } else {
        setError(`Failed to ${action} batch`)
      }
    } catch (err) {
      setError(
        `Failed to ${action} batch: ` +
          (err instanceof Error ? err.message : 'Unknown error')
      )
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500'
      case 'processing':
        return 'bg-blue-500'
      case 'failed':
        return 'bg-red-500'
      case 'cancelled':
        return 'bg-gray-500'
      case 'paused':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-400'
    }
  }

  // Use real image results from the batch response
  const imageResults =
    batchResponse?.results?.map((result, index) => ({
      requestId: result.requestId || `req-${index}`,
      index: result.index || index,
      status:
        result.status === 'completed'
          ? ('completed' as const)
          : result.status === 'failed'
            ? ('failed' as const)
            : ('processing' as const),
      response:
        result.status === 'completed' && result.response
          ? {
              imageUrl: result.response.imageUrl,
              prompt: result.response.metadata?.prompt || `Image ${index + 1}`,
              model: result.response.model || model,
              width: result.response.metadata?.width || 1024,
              height: result.response.metadata?.height || 1024,
            }
          : undefined,
      error: result.error,
      cost: result.response?.cost || 0,
      duration: result.response?.generationTime || 0,
      provider: result.response?.provider || 'replicate',
    })) || []

  // If batch shows as completed but no results, show a warning and retry button
  const hasCompletedBatchWithoutResults =
    batchResponse?.status === 'completed' &&
    (!batchResponse.results || batchResponse.results.length === 0)

  const handleForceRefresh = async () => {
    if (!batchId) return

    try {
      console.log('🔄 Force refreshing batch status...')
      const response = await fetch(
        `/api/images/batch-generate?batchId=${batchId}&action=force-complete`,
        {
          method: 'GET',
        }
      )

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Force refresh result:', result)
        // Trigger a re-fetch of the batch status
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error)
    }
  }

  // Debug logging to see the actual structure
  if (batchId && batchResponse?.results && batchResponse.results.length > 0) {
    console.log('🔍 Batch response structure:', {
      firstResult: batchResponse.results[0],
      totalResults: batchResponse.results.length,
      batchStatus: batchResponse.status,
      completedRequests: batchResponse.completedRequests,
      failedRequests: batchResponse.failedRequests,
    })

    // Log each result to see the structure
    batchResponse.results.forEach((result, index) => {
      console.log(`🔍 Result ${index}:`, {
        requestId: result.requestId,
        status: result.status,
        hasResponse: !!result.response,
        hasImageUrl: !!result.response?.imageUrl,
        imageUrl: result.response?.imageUrl,
        error: result.error,
      })
    })
  } else if (batchId && batchStatus?.status === 'processing') {
    // Only log "no results" when we're actively processing a batch
    console.log('🔍 Batch still processing:', {
      batchId,
      batchStatus: batchStatus?.status,
      progress: batchStatus?.progress,
      completedCount: batchStatus?.completedCount,
      totalCount: batchStatus?.totalCount,
    })
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Batch Image Generation Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Schedule Batch */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule New Batch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Prompts (one per line)
            </label>
            <Textarea
              value={prompts}
              onChange={e => setPrompts(e.target.value)}
              rows={4}
              placeholder="Enter prompts, one per line"
            />
            {isLunaStory && (
              <p className="text-sm text-blue-600 mt-1">
                ✨ Luna's story detected! Gallery will show in story mode.
              </p>
            )}
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label
              htmlFor="model"
              className="block text-sm font-medium text-gray-700"
            >
              Model
            </label>
            <select
              id="model"
              value={model}
              onChange={e => setModel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="flux1">FLUX.1 Schnell (Fast)</option>
              <option value="flux-kontext-pro">
                FLUX Kontext Pro (Image Editing)
              </option>
              <option value="imagen-4">Imagen 4 (Google)</option>
              <option value="minimax-image-01">MiniMax Image 01</option>
              <option value="flux-1.1-pro-ultra">FLUX 1.1 Pro Ultra</option>
            </select>

            {/* Warning for image editing models */}
            {model === 'flux-kontext-pro' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-2">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Image Editing Model Selected
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      FLUX Kontext Pro is an image editing model that requires
                      an input image to edit. For batch text-to-image
                      generation, use FLUX.1 Schnell or other text-to-image
                      models instead.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <Button
            onClick={scheduleBatch}
            disabled={loading || !prompts.trim()}
            className="w-full"
          >
            {loading ? 'Scheduling...' : 'Schedule Batch'}
          </Button>
        </CardContent>
      </Card>

      {/* Batch Status */}
      {batchId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Batch Status
              <Badge className={getStatusColor(batchStatus?.status || '')}>
                {batchStatus?.status || 'Unknown'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <strong>Batch ID:</strong> {batchId}
            </div>

            {batchStatus && (
              <>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>
                      Progress: {batchStatus.completedCount}/
                      {batchStatus.totalCount}
                    </span>
                    <span>{batchStatus.progress}%</span>
                  </div>
                  <Progress value={batchStatus.progress} className="w-full" />
                </div>

                <div>
                  <strong>Status:</strong> {batchStatus.statusMessage}
                </div>

                {batchStatus.estimatedTimeRemaining > 0 && (
                  <div>
                    <strong>Est. Time Remaining:</strong>{' '}
                    {Math.round(batchStatus.estimatedTimeRemaining / 1000)}s
                  </div>
                )}

                {batchStatus.averageTimePerImage && (
                  <div>
                    <strong>Avg Time per Image:</strong>{' '}
                    {Math.round(batchStatus.averageTimePerImage / 1000)}s
                  </div>
                )}

                {batchStatus.currentlyProcessing.length > 0 && (
                  <div>
                    <strong>Currently Processing:</strong>{' '}
                    {batchStatus.currentlyProcessing.join(', ')}
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2">
              <Button onClick={checkBatchStatus} variant="outline" size="sm">
                Refresh Status
              </Button>
              <Button
                onClick={() => controlBatch('pause')}
                variant="outline"
                size="sm"
              >
                Pause
              </Button>
              <Button
                onClick={() => controlBatch('resume')}
                variant="outline"
                size="sm"
              >
                Resume
              </Button>
              <Button
                onClick={() => controlBatch('cancel')}
                variant="destructive"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Image Gallery */}
      {imageResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Generated Images</CardTitle>
          </CardHeader>
          <CardContent>
            <ImageGallery
              images={imageResults}
              title={
                isLunaStory ? "Luna's Magical Adventure" : 'Generated Images'
              }
              storyMode={isLunaStory}
              showMetadata={true}
            />
          </CardContent>
        </Card>
      )}

      {/* Batch Gallery */}
      <BatchGallery />

      {/* Queue Status */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={getQueueStatus} className="mb-4">
            Refresh Queue
          </Button>

          {queueStatus && (
            <div className="space-y-2">
              <div>
                <strong>Queue Length:</strong> {queueStatus.queueLength || 0}
              </div>
              <div>
                <strong>Active Batches:</strong>{' '}
                {queueStatus.activeBatches || 0}
              </div>

              {queueStatus &&
              queueStatus.queue &&
              queueStatus.queue.length > 0 ? (
                <div>
                  <strong>Queued Batches:</strong>
                  <ul className="list-disc list-inside mt-2">
                    {queueStatus.queue.map((batch, index) => (
                      <li key={index}>
                        {batch.id} - {batch.status} (Priority: {batch.priority})
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-gray-500 italic">No batches in queue</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* System Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>System Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={getMetrics} className="mb-4">
            Refresh Metrics
          </Button>

          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-2xl font-bold">
                  {metrics.batchesProcessed}
                </div>
                <div className="text-sm text-gray-600">Batches Processed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics.totalRequests}
                </div>
                <div className="text-sm text-gray-600">Total Requests</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics.successfulRequests}
                </div>
                <div className="text-sm text-gray-600">Successful</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {(metrics.failureRate * 100).toFixed(1)}%
                </div>
                <div className="text-sm text-gray-600">Failure Rate</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  ${metrics.totalCost.toFixed(3)}
                </div>
                <div className="text-sm text-gray-600">Total Cost</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {metrics.averageBatchSize.toFixed(1)}
                </div>
                <div className="text-sm text-gray-600">Avg Batch Size</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch completed but no results warning */}
      {hasCompletedBatchWithoutResults && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Batch completed but no images found
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                The batch shows as completed but no image results were found.
                This might be a timing issue.
              </p>
              <div className="mt-3">
                <button
                  onClick={handleForceRefresh}
                  className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm font-medium transition-colors"
                >
                  Force Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
