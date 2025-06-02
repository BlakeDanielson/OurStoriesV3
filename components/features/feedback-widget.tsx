'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FeedbackForm } from '@/components/ui/feedback-form'
import { useFeedback } from '@/lib/hooks/use-feedback'
import { ContentType } from '@/lib/types/feedback'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface FeedbackWidgetProps {
  contentType: ContentType
  contentId: string
  bookId: string
  pageNumber?: number
  showCounts?: boolean
  className?: string
  title?: string
}

export function FeedbackWidget({
  contentType,
  contentId,
  bookId,
  pageNumber,
  showCounts = false,
  className,
  title,
}: FeedbackWidgetProps) {
  const {
    userFeedback,
    summary,
    isLoading,
    error,
    submitFeedback,
    deleteFeedback,
  } = useFeedback({
    contentType,
    contentId,
    bookId,
    pageNumber,
  })

  const handleSubmit = async (feedbackType: any, comment?: string) => {
    try {
      await submitFeedback(feedbackType, comment)
    } catch (err) {
      // Error is already handled by the hook
      console.error('Failed to submit feedback:', err)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('animate-pulse', className)}>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
          {showCounts && (
            <>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('space-y-2', className)}>
      {title && <h4 className="text-sm font-medium text-gray-700">{title}</h4>}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-sm">{error}</AlertDescription>
        </Alert>
      )}

      <FeedbackForm
        contentType={contentType}
        contentId={contentId}
        bookId={bookId}
        pageNumber={pageNumber}
        currentFeedback={userFeedback?.feedback_type}
        currentComment={userFeedback?.comment}
        onSubmit={handleSubmit}
        showCounts={showCounts}
        thumbsUpCount={summary?.thumbs_up_count || 0}
        thumbsDownCount={summary?.thumbs_down_count || 0}
        disabled={isLoading}
      />

      {showCounts && summary && summary.total_feedback_count > 0 && (
        <div className="text-xs text-gray-500">
          {summary.total_feedback_count} feedback
          {summary.total_feedback_count !== 1 ? 's' : ''}
          {summary.positive_percentage > 0 && (
            <span className="ml-1">
              ({summary.positive_percentage}% positive)
            </span>
          )}
        </div>
      )}
    </div>
  )
}
