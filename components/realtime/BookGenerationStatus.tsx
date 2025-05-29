'use client'

import { useEffect, useState } from 'react'
import { useBookGeneration } from '@/lib/hooks/useRealtime'
import { BookStatus } from '@/lib/types/database'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'

interface BookGenerationStatusProps {
  bookId: string
  bookTitle: string
  expectedPages?: number
  onComplete?: () => void
}

export function BookGenerationStatus({
  bookId,
  bookTitle,
  expectedPages = 10,
  onComplete,
}: BookGenerationStatusProps) {
  const { isConnected, generationState, connectionStatus } = useBookGeneration(
    bookId,
    statusUpdate => {
      console.log('Book status updated:', statusUpdate)
      if (statusUpdate.status === 'completed' && onComplete) {
        onComplete()
      }
    },
    pageUpdate => {
      console.log('New page added:', pageUpdate.page.page_number)
    }
  )

  const getStatusIcon = (status: BookStatus) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />
      case 'generating':
        return <Loader2 className="h-4 w-4 animate-spin" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getStatusColor = (status: BookStatus) => {
    switch (status) {
      case 'draft':
        return 'secondary'
      case 'generating':
        return 'default'
      case 'completed':
        return 'success'
      case 'failed':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStatusText = (status: BookStatus) => {
    switch (status) {
      case 'draft':
        return 'Draft'
      case 'generating':
        return 'Generating...'
      case 'completed':
        return 'Complete'
      case 'failed':
        return 'Failed'
      default:
        return 'Unknown'
    }
  }

  const currentStatus = generationState.status?.status || 'draft'
  const currentPages = generationState.pages.length
  const totalPages = generationState.status?.totalPages || expectedPages
  const progress = totalPages > 0 ? (currentPages / totalPages) * 100 : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{bookTitle}</CardTitle>
          <div className="flex items-center gap-2">
            <Badge
              variant={getStatusColor(currentStatus) as any}
              className="flex items-center gap-1"
            >
              {getStatusIcon(currentStatus)}
              {getStatusText(currentStatus)}
            </Badge>
            {!isConnected && (
              <Badge variant="outline" className="text-xs">
                Offline
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          {generationState.isGenerating && (
            <>
              Generating your personalized story... This may take a few minutes.
            </>
          )}
          {generationState.isComplete && (
            <>
              Your story is ready! All {totalPages} pages have been generated.
            </>
          )}
          {currentStatus === 'draft' && (
            <>Story is being prepared for generation.</>
          )}
          {currentStatus === 'failed' && (
            <>Something went wrong during generation. Please try again.</>
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        {(generationState.isGenerating || generationState.isComplete) && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Pages Generated</span>
              <span>
                {currentPages} of {totalPages}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Real-time Page Updates */}
        {generationState.pages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Generated Pages</h4>
            <div className="grid grid-cols-5 gap-2">
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNumber = i + 1
                const isGenerated = generationState.pages.some(
                  p => p.page_number === pageNumber
                )
                return (
                  <div
                    key={pageNumber}
                    className={`
                      h-8 w-8 rounded border-2 flex items-center justify-center text-xs font-medium
                      ${
                        isGenerated
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-gray-50 border-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {pageNumber}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Real-time updates: {isConnected ? 'Connected' : 'Disconnected'}
          </span>
          {generationState.status?.completedAt && (
            <span>
              Completed:{' '}
              {new Date(
                generationState.status.completedAt
              ).toLocaleTimeString()}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
