'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Download,
  Eye,
  Calendar,
  Clock,
  DollarSign,
  Images,
  Sparkles,
} from 'lucide-react'
import Image from 'next/image'

interface BatchResult {
  requestId: string
  index: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  response?: {
    imageUrl: string
    metadata?: {
      prompt: string
      model: string
    }
  }
  cost?: number
  duration?: number
}

interface CompletedBatch {
  id: string
  timestamp: number
  totalRequests: number
  completedRequests: number
  failedRequests: number
  results: BatchResult[]
  totalDuration?: number
  totalCost: number
  prompts: string[]
  imageCount: number
}

// Helper function to validate image URL
const isValidImageUrl = (url: string | undefined): url is string => {
  if (!url || typeof url !== 'string') return false
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

export function BatchGallery() {
  const [completedBatches, setCompletedBatches] = useState<CompletedBatch[]>([])
  const [selectedBatch, setSelectedBatch] = useState<CompletedBatch | null>(
    null
  )
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCompletedBatches()
  }, [])

  const loadCompletedBatches = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/images/batch-generate?action=history')
      const data = await response.json()

      if (response.ok && data.batches) {
        setCompletedBatches(data.batches)
      }
    } catch (error) {
      console.error('Error loading batch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`
  }

  const formatDuration = (duration?: number) => {
    if (!duration) return 'Unknown'
    const seconds = Math.round(duration / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`
  }

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading image:', error)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            Batch Gallery
          </CardTitle>
          <CardDescription>Loading completed batches...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (completedBatches.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Images className="h-5 w-5" />
            Batch Gallery
          </CardTitle>
          <CardDescription>
            No completed batches yet. Generate some batch images to see them
            here!
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Images className="h-5 w-5" />
                Batch Gallery
              </CardTitle>
              <CardDescription>
                {completedBatches.length} completed batch
                {completedBatches.length !== 1 ? 'es' : ''} •{' '}
                {completedBatches.reduce(
                  (sum, batch) => sum + batch.imageCount,
                  0
                )}{' '}
                total images
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadCompletedBatches}>
              Refresh
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {completedBatches.map((batch, index) => {
          const isLunaStory = batch.prompts.some(
            prompt =>
              prompt.toLowerCase().includes('luna') &&
              prompt.toLowerCase().includes('crystal')
          )

          return (
            <Card key={batch.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      Batch #{completedBatches.length - index}
                    </Badge>
                    {isLunaStory && (
                      <Badge variant="secondary" className="text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Luna's Story
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(batch.timestamp)}
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCost(batch.totalCost)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDuration(batch.totalDuration)}
                    </span>
                    <span className="text-green-600">
                      ✓ {batch.completedRequests}
                    </span>
                    {batch.failedRequests > 0 && (
                      <span className="text-red-600">
                        ✗ {batch.failedRequests}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Prompts:</p>
                  {batch.prompts.slice(0, 2).map((prompt, idx) => (
                    <p
                      key={idx}
                      className="text-xs text-muted-foreground line-clamp-1 mb-1"
                    >
                      • {prompt}
                    </p>
                  ))}
                  {batch.prompts.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      ... and {batch.prompts.length - 2} more
                    </p>
                  )}
                </div>

                {/* Preview images */}
                <div className="grid grid-cols-2 gap-2 mb-3">
                  {batch.results
                    .filter(
                      result =>
                        result.status === 'completed' &&
                        result.response?.imageUrl &&
                        isValidImageUrl(result.response.imageUrl)
                    )
                    .slice(0, 4)
                    .map((result, idx) => (
                      <div
                        key={idx}
                        className="relative aspect-square rounded-md overflow-hidden bg-muted"
                      >
                        <Image
                          src={result.response!.imageUrl}
                          alt={
                            result.response!.metadata?.prompt ||
                            'Generated image'
                          }
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                          onError={e => {
                            console.error(
                              'Image failed to load:',
                              result.response!.imageUrl
                            )
                            // Hide the image on error
                            e.currentTarget.style.display = 'none'
                          }}
                        />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate">
                          {result.response!.metadata?.model || 'Unknown model'}
                        </div>
                      </div>
                    ))}
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setSelectedBatch(batch)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Gallery ({batch.imageCount} images)
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Images className="h-5 w-5" />
                        Batch #{completedBatches.length - index} Gallery
                        {isLunaStory && (
                          <Badge variant="secondary" className="ml-2">
                            <Sparkles className="h-3 w-3 mr-1" />
                            Luna's Story
                          </Badge>
                        )}
                      </DialogTitle>
                    </DialogHeader>

                    {selectedBatch && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Generated:</span>
                            <p className="text-muted-foreground">
                              {formatDate(selectedBatch.timestamp)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <p className="text-muted-foreground">
                              {formatDuration(selectedBatch.totalDuration)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span>
                            <p className="text-muted-foreground">
                              {formatCost(selectedBatch.totalCost)}
                            </p>
                          </div>
                          <div>
                            <span className="font-medium">Success Rate:</span>
                            <p className="text-muted-foreground">
                              {Math.round(
                                (selectedBatch.completedRequests /
                                  selectedBatch.totalRequests) *
                                  100
                              )}
                              %
                            </p>
                          </div>
                        </div>

                        {/* Image Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {selectedBatch.results
                            .filter(
                              result =>
                                result.status === 'completed' &&
                                result.response?.imageUrl &&
                                isValidImageUrl(result.response.imageUrl)
                            )
                            .map((result, idx) => (
                              <div key={idx} className="space-y-2">
                                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                                  <Image
                                    src={result.response!.imageUrl}
                                    alt={
                                      result.response!.metadata?.prompt ||
                                      'Generated image'
                                    }
                                    fill
                                    className="object-cover"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onError={e => {
                                      console.error(
                                        'Image failed to load:',
                                        result.response!.imageUrl
                                      )
                                      // Hide the image on error
                                      e.currentTarget.style.display = 'none'
                                    }}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium line-clamp-2">
                                    {result.response!.metadata?.prompt ||
                                      'No prompt available'}
                                  </p>
                                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                                    <span>
                                      {result.response!.metadata?.model ||
                                        'Unknown model'}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        downloadImage(
                                          result.response!.imageUrl,
                                          `batch-${selectedBatch.id}-image-${idx + 1}.png`
                                        )
                                      }
                                    >
                                      <Download className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
