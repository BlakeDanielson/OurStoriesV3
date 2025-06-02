'use client'

import React, { useState } from 'react'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { FeedbackType } from '@/lib/types/feedback'

interface FeedbackRatingProps {
  currentFeedback?: FeedbackType | null
  onFeedbackChange: (feedbackType: FeedbackType) => void
  disabled?: boolean
  size?: 'sm' | 'md' | 'lg'
  showCounts?: boolean
  thumbsUpCount?: number
  thumbsDownCount?: number
  className?: string
}

export function FeedbackRating({
  currentFeedback,
  onFeedbackChange,
  disabled = false,
  size = 'md',
  showCounts = false,
  thumbsUpCount = 0,
  thumbsDownCount = 0,
  className,
}: FeedbackRatingProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (feedbackType: FeedbackType) => {
    if (disabled || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onFeedbackChange(feedbackType)
    } finally {
      setIsSubmitting(false)
    }
  }

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  }

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            sizeClasses[size],
            'p-0 rounded-full transition-all duration-200',
            currentFeedback === 'thumbs_up'
              ? 'bg-green-100 text-green-600 hover:bg-green-200'
              : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
          )}
          onClick={() => handleFeedback('thumbs_up')}
          disabled={disabled || isSubmitting}
          aria-label={`Give thumbs up${showCounts ? ` (${thumbsUpCount} positive)` : ''}`}
        >
          <ThumbsUp className={iconSizeClasses[size]} />
        </Button>
        {showCounts && (
          <span className="text-xs text-gray-500 min-w-[1rem] text-center">
            {thumbsUpCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            sizeClasses[size],
            'p-0 rounded-full transition-all duration-200',
            currentFeedback === 'thumbs_down'
              ? 'bg-red-100 text-red-600 hover:bg-red-200'
              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
          )}
          onClick={() => handleFeedback('thumbs_down')}
          disabled={disabled || isSubmitting}
          aria-label={`Give thumbs down${showCounts ? ` (${thumbsDownCount} negative)` : ''}`}
        >
          <ThumbsDown className={iconSizeClasses[size]} />
        </Button>
        {showCounts && (
          <span className="text-xs text-gray-500 min-w-[1rem] text-center">
            {thumbsDownCount}
          </span>
        )}
      </div>
    </div>
  )
}
