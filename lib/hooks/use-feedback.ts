'use client'

import { useState, useEffect } from 'react'
import {
  FeedbackType,
  ContentType,
  FeedbackSummary,
  UserFeedback,
} from '@/lib/types/feedback'

interface UseFeedbackProps {
  contentType: ContentType
  contentId: string
  bookId: string
  pageNumber?: number
}

interface UseFeedbackReturn {
  userFeedback: UserFeedback | null
  summary: FeedbackSummary | null
  isLoading: boolean
  error: string | null
  submitFeedback: (
    feedbackType: FeedbackType,
    comment?: string
  ) => Promise<void>
  deleteFeedback: () => Promise<void>
}

export function useFeedback({
  contentType,
  contentId,
  bookId,
  pageNumber,
}: UseFeedbackProps): UseFeedbackReturn {
  const [userFeedback, setUserFeedback] = useState<UserFeedback | null>(null)
  const [summary, setSummary] = useState<FeedbackSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch feedback data
  const fetchFeedback = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams({
        content_type: contentType,
        content_id: contentId,
        book_id: bookId,
      })

      if (pageNumber !== undefined) {
        params.append('page_number', pageNumber.toString())
      }

      const response = await fetch(`/api/feedback?${params}`)

      if (!response.ok) {
        throw new Error('Failed to fetch feedback')
      }

      const data = await response.json()
      setUserFeedback(data.userFeedback)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Submit feedback
  const submitFeedback = async (
    feedbackType: FeedbackType,
    comment?: string
  ) => {
    try {
      setError(null)

      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          book_id: bookId,
          page_number: pageNumber,
          feedback_type: feedbackType,
          comment: comment,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      const result = await response.json()

      // Update local state
      setUserFeedback({
        id: result.data.id,
        feedback_type: result.data.feedback_type,
        comment: result.data.comment,
        created_at: result.data.created_at,
      })

      // Refresh summary
      await fetchFeedback()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err // Re-throw so component can handle it
    }
  }

  // Delete feedback
  const deleteFeedback = async () => {
    if (!userFeedback) return

    try {
      setError(null)

      const response = await fetch(`/api/feedback?id=${userFeedback.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete feedback')
      }

      // Update local state
      setUserFeedback(null)

      // Refresh summary
      await fetchFeedback()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      throw err // Re-throw so component can handle it
    }
  }

  // Fetch feedback on mount and when dependencies change
  useEffect(() => {
    fetchFeedback()
  }, [contentType, contentId, bookId, pageNumber])

  return {
    userFeedback,
    summary,
    isLoading,
    error,
    submitFeedback,
    deleteFeedback,
  }
}
