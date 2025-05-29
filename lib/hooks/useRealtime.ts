'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  realtimeSubscriptions,
  BookStatusUpdate,
  BookPageAdded,
  ReadingProgressUpdate,
  BookStatusCallback,
  BookPageCallback,
  ReadingProgressCallback,
} from '../realtime'
import { Book, BookPage, UserFeedback } from '../types/database'

// Hook for subscribing to book status changes
export function useBookStatus(callback?: BookStatusCallback) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<BookStatusUpdate | null>(null)

  const handleStatusUpdate = useCallback(
    (update: BookStatusUpdate) => {
      setLastUpdate(update)
      callback?.(update)
    },
    [callback]
  )

  useEffect(() => {
    const unsubscribe =
      realtimeSubscriptions.subscribeToBookStatus(handleStatusUpdate)
    setIsConnected(realtimeSubscriptions.getConnectionStatus())

    return unsubscribe
  }, [handleStatusUpdate])

  return {
    isConnected,
    lastUpdate,
    connectionStatus: realtimeSubscriptions.getConnectionStatus(),
  }
}

// Hook for subscribing to book pages being added
export function useBookPages(bookId: string, callback?: BookPageCallback) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastPageAdded, setLastPageAdded] = useState<BookPageAdded | null>(null)
  const [pages, setPages] = useState<BookPage[]>([])

  const handlePageAdded = useCallback(
    (update: BookPageAdded) => {
      setLastPageAdded(update)
      setPages(prev =>
        [...prev, update.page].sort((a, b) => a.page_number - b.page_number)
      )
      callback?.(update)
    },
    [callback]
  )

  useEffect(() => {
    if (!bookId) return

    const unsubscribe = realtimeSubscriptions.subscribeToBookPages(
      bookId,
      handlePageAdded
    )
    setIsConnected(realtimeSubscriptions.getConnectionStatus())

    return unsubscribe
  }, [bookId, handlePageAdded])

  const resetPages = useCallback(() => {
    setPages([])
    setLastPageAdded(null)
  }, [])

  return {
    isConnected,
    lastPageAdded,
    pages,
    resetPages,
    connectionStatus: realtimeSubscriptions.getConnectionStatus(),
  }
}

// Hook for subscribing to reading progress updates
export function useReadingProgress(
  bookId: string,
  callback?: ReadingProgressCallback
) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastProgressUpdate, setLastProgressUpdate] =
    useState<ReadingProgressUpdate | null>(null)
  const [progress, setProgress] = useState<UserFeedback | null>(null)

  const handleProgressUpdate = useCallback(
    (update: ReadingProgressUpdate) => {
      setLastProgressUpdate(update)
      setProgress(update.progress)
      callback?.(update)
    },
    [callback]
  )

  useEffect(() => {
    if (!bookId) return

    const unsubscribe = realtimeSubscriptions.subscribeToReadingProgress(
      bookId,
      handleProgressUpdate
    )
    setIsConnected(realtimeSubscriptions.getConnectionStatus())

    return unsubscribe
  }, [bookId, handleProgressUpdate])

  return {
    isConnected,
    lastProgressUpdate,
    progress,
    connectionStatus: realtimeSubscriptions.getConnectionStatus(),
  }
}

// Hook for subscribing to all user books (useful for dashboard)
export function useUserBooks(callback?: BookStatusCallback) {
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<BookStatusUpdate | null>(null)
  const [bookUpdates, setBookUpdates] = useState<BookStatusUpdate[]>([])

  const handleBookUpdate = useCallback(
    (update: BookStatusUpdate) => {
      setLastUpdate(update)
      setBookUpdates(prev => {
        // Replace existing update for same book or add new one
        const filtered = prev.filter(u => u.bookId !== update.bookId)
        return [...filtered, update].slice(-10) // Keep last 10 updates
      })
      callback?.(update)
    },
    [callback]
  )

  useEffect(() => {
    const unsubscribe =
      realtimeSubscriptions.subscribeToUserBooks(handleBookUpdate)
    setIsConnected(realtimeSubscriptions.getConnectionStatus())

    return unsubscribe
  }, [handleBookUpdate])

  const clearUpdates = useCallback(() => {
    setBookUpdates([])
    setLastUpdate(null)
  }, [])

  return {
    isConnected,
    lastUpdate,
    bookUpdates,
    clearUpdates,
    connectionStatus: realtimeSubscriptions.getConnectionStatus(),
  }
}

// Combined hook for book generation (status + pages)
export function useBookGeneration(
  bookId: string,
  onStatusChange?: BookStatusCallback,
  onPageAdded?: BookPageCallback
) {
  const [isConnected, setIsConnected] = useState(false)
  const [generationState, setGenerationState] = useState<{
    status: BookStatusUpdate | null
    pages: BookPage[]
    isGenerating: boolean
    isComplete: boolean
  }>({
    status: null,
    pages: [],
    isGenerating: false,
    isComplete: false,
  })

  const handleStatusChange = useCallback(
    (update: BookStatusUpdate) => {
      setGenerationState(prev => ({
        ...prev,
        status: update,
        isGenerating: update.status === 'generating',
        isComplete: update.status === 'completed',
      }))
      onStatusChange?.(update)
    },
    [onStatusChange]
  )

  const handlePageAdded = useCallback(
    (update: BookPageAdded) => {
      setGenerationState(prev => ({
        ...prev,
        pages: [...prev.pages, update.page].sort(
          (a, b) => a.page_number - b.page_number
        ),
      }))
      onPageAdded?.(update)
    },
    [onPageAdded]
  )

  useEffect(() => {
    if (!bookId) return

    const unsubscribeStatus =
      realtimeSubscriptions.subscribeToBookStatus(handleStatusChange)
    const unsubscribePages = realtimeSubscriptions.subscribeToBookPages(
      bookId,
      handlePageAdded
    )
    setIsConnected(realtimeSubscriptions.getConnectionStatus())

    return () => {
      unsubscribeStatus()
      unsubscribePages()
    }
  }, [bookId, handleStatusChange, handlePageAdded])

  const resetGeneration = useCallback(() => {
    setGenerationState({
      status: null,
      pages: [],
      isGenerating: false,
      isComplete: false,
    })
  }, [])

  return {
    isConnected,
    generationState,
    resetGeneration,
    connectionStatus: realtimeSubscriptions.getConnectionStatus(),
  }
}

// Hook for managing real-time connection
export function useRealtimeConnection() {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(realtimeSubscriptions.getConnectionStatus())
    }

    // Check connection status periodically
    const interval = setInterval(checkConnection, 5000)
    checkConnection() // Initial check

    return () => clearInterval(interval)
  }, [])

  const refreshAuth = useCallback(async () => {
    return await realtimeSubscriptions.refreshAuth()
  }, [])

  const disconnect = useCallback(() => {
    realtimeSubscriptions.unsubscribeAll()
    setIsConnected(false)
  }, [])

  return {
    isConnected,
    refreshAuth,
    disconnect,
    connectionStatus: realtimeSubscriptions.getConnectionStatus(),
  }
}
