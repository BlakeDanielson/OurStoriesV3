import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookId = params.id

    // Get book with child profile to verify ownership
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select(
        `
        *,
        child_profiles!inner(parent_id)
      `
      )
      .eq('id', bookId)
      .eq('child_profiles.parent_id', user.id)
      .single()

    if (bookError || !book) {
      return NextResponse.json(
        { error: 'Book not found or unauthorized' },
        { status: 404 }
      )
    }

    // Calculate estimated time remaining
    const estimatedTimeRemaining = calculateEstimatedTimeRemaining(book)

    // Get current processing step description
    const currentStepDescription = getCurrentStepDescription(
      book.metadata?.currentStage || 'initializing'
    )

    return NextResponse.json({
      bookId: book.id,
      status: book.status,
      progress: book.metadata?.progress || 0,
      currentStage: book.metadata?.currentStage || 'initializing',
      currentStepDescription,
      estimatedTimeRemaining,
      lastUpdated: book.metadata?.lastUpdated || book.updated_at,
      error: book.metadata?.error || null,
      completedAt: book.completed_at,
      totalPages: book.total_pages,
    })
  } catch (error) {
    console.error('Status check failed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function calculateEstimatedTimeRemaining(book: any): string {
  const progress = book.metadata?.progress || 0
  const status = book.status

  if (status === 'completed') {
    return '0 seconds'
  }

  if (status === 'failed') {
    return 'N/A'
  }

  // Estimate based on progress (assuming 2-3 minute total time)
  const totalEstimatedSeconds = 150 // 2.5 minutes average
  const remainingProgress = 100 - progress
  const remainingSeconds = Math.round(
    (remainingProgress / 100) * totalEstimatedSeconds
  )

  if (remainingSeconds < 60) {
    return `${remainingSeconds} seconds`
  } else {
    const minutes = Math.floor(remainingSeconds / 60)
    const seconds = remainingSeconds % 60
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes} minutes`
  }
}

function getCurrentStepDescription(stage: string): string {
  const stageDescriptions: Record<string, string> = {
    initializing: 'Setting up generation process...',
    generating_outline: 'Creating story outline and structure...',
    outline_complete: 'Story outline completed, generating content...',
    content_complete: 'Story content generated, creating illustrations...',
    images_complete: 'Illustrations completed, finalizing book...',
    completed: 'Book generation completed successfully!',
    failed: 'Generation failed. Please try again.',
  }

  return stageDescriptions[stage] || 'Processing...'
}
