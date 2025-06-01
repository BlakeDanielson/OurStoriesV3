import { NextRequest, NextResponse } from 'next/server'
import { getTestBook } from '@/lib/test-storage'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookId = params.id

    // Get book from shared storage
    const book = getTestBook(bookId)

    if (!book) {
      return NextResponse.json({ error: 'Book not found' }, { status: 404 })
    }

    // Calculate estimated time remaining
    const progress = book.metadata?.progress || 0
    const estimatedTimeRemaining = calculateEstimatedTimeRemaining(progress)

    // Get current step description
    const currentStepDescription = getCurrentStepDescription(
      book.metadata?.currentStage || 'initializing'
    )

    const response = {
      bookId: book.id,
      status: book.status,
      progress: progress,
      currentStage: book.metadata?.currentStage || 'initializing',
      currentStepDescription,
      estimatedTimeRemaining,
      lastUpdated:
        book.metadata?.lastUpdated || book.metadata?.generationStarted,
      error: book.metadata?.error,
      completedAt: book.completed_at,
      totalPages: book.total_pages,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateEstimatedTimeRemaining(progress: number): string {
  if (progress >= 100) return '0 seconds'

  // Assume total generation time is about 3-4 minutes (200 seconds) due to enhanced story generation
  const totalEstimatedTime = 200
  const remainingProgress = 100 - progress
  const remainingTime = Math.round(
    (remainingProgress / 100) * totalEstimatedTime
  )

  if (remainingTime < 60) {
    return `${remainingTime} seconds`
  } else {
    const minutes = Math.floor(remainingTime / 60)
    const seconds = remainingTime % 60
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} minutes`
  }
}

function getCurrentStepDescription(stage: string): string {
  const descriptions: Record<string, string> = {
    initializing: 'Setting up your story...',
    generating_outline: 'Creating the story outline...',
    outline_complete: 'Outline complete, preparing story content...',
    generating_story_content: 'Writing detailed story content for each page...',
    story_content_complete:
      'Story content complete, generating beautiful illustrations...',
    content_complete: 'Generating beautiful illustrations...',
    images_complete: 'Finalizing your book...',
    completed: 'Your book is ready!',
    failed: 'Generation failed',
  }

  return descriptions[stage] || 'Processing...'
}
