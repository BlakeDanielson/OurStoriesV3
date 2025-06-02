'use client'

import React, { useState, useEffect } from 'react'
import { MessageSquare, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Textarea } from './textarea'
import { FeedbackRating } from './feedback-rating'
import { FeedbackType, ContentType } from '@/lib/types/feedback'

interface FeedbackFormProps {
  contentType: ContentType
  contentId: string
  bookId: string
  pageNumber?: number
  currentFeedback?: FeedbackType | null
  currentComment?: string
  onSubmit: (feedbackType: FeedbackType, comment?: string) => Promise<void>
  disabled?: boolean
  showCounts?: boolean
  thumbsUpCount?: number
  thumbsDownCount?: number
  className?: string
}

export function FeedbackForm({
  contentType,
  contentId,
  bookId,
  pageNumber,
  currentFeedback,
  currentComment = '',
  onSubmit,
  disabled = false,
  showCounts = false,
  thumbsUpCount = 0,
  thumbsDownCount = 0,
  className,
}: FeedbackFormProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(
    currentFeedback || null
  )
  const [comment, setComment] = useState(currentComment)
  const [showCommentField, setShowCommentField] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Show comment field if there's existing feedback or if user just selected feedback
  useEffect(() => {
    if (selectedFeedback || currentComment) {
      setShowCommentField(true)
    }
  }, [selectedFeedback, currentComment])

  const handleFeedbackChange = async (feedbackType: FeedbackType) => {
    setSelectedFeedback(feedbackType)
    setShowCommentField(true)

    // Auto-submit if no comment is provided and this is a new feedback
    if (!currentComment && comment.trim() === '') {
      await handleSubmit(feedbackType, '')
    }
  }

  const handleSubmit = async (
    feedbackType: FeedbackType,
    commentText: string
  ) => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmit(feedbackType, commentText.trim() || undefined)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    if (!selectedFeedback) return
    await handleSubmit(selectedFeedback, comment)
  }

  const handleCommentCancel = () => {
    if (!currentFeedback) {
      setSelectedFeedback(null)
      setShowCommentField(false)
    }
    setComment(currentComment)
  }

  const maxLength = 500
  const remainingChars = maxLength - comment.length

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center justify-between">
        <FeedbackRating
          currentFeedback={selectedFeedback}
          onFeedbackChange={handleFeedbackChange}
          disabled={disabled || isSubmitting}
          showCounts={showCounts}
          thumbsUpCount={thumbsUpCount}
          thumbsDownCount={thumbsDownCount}
        />

        {!showCommentField && selectedFeedback && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCommentField(true)}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            <MessageSquare className="h-3 w-3 mr-1" />
            Add comment
          </Button>
        )}
      </div>

      {showCommentField && (
        <div className="space-y-2 p-3 bg-gray-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <label
              htmlFor="feedback-comment"
              className="text-sm font-medium text-gray-700"
            >
              Tell us more (optional)
            </label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCommentCancel}
              className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          <Textarea
            id="feedback-comment"
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder={`Share your thoughts about this ${contentType}...`}
            maxLength={maxLength}
            rows={3}
            disabled={disabled || isSubmitting}
            className="resize-none text-sm"
          />

          <div className="flex items-center justify-between">
            <span
              className={cn(
                'text-xs',
                remainingChars < 50 ? 'text-orange-500' : 'text-gray-400'
              )}
            >
              {remainingChars} characters remaining
            </span>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCommentCancel}
                disabled={isSubmitting}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCommentSubmit}
                disabled={!selectedFeedback || isSubmitting}
                className="text-xs"
              >
                {isSubmitting ? 'Saving...' : 'Save Feedback'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
