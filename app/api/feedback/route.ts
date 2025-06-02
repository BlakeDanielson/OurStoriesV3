import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import {
  CreateFeedbackRequest,
  UpdateFeedbackRequest,
} from '@/lib/types/feedback'
import { createProtectedApiRoute } from '@/lib/rate-limiting/api-wrapper'

async function handlePOST(request: NextRequest) {
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

    const body: CreateFeedbackRequest = await request.json()

    // Validate required fields
    if (
      !body.content_type ||
      !body.content_id ||
      !body.book_id ||
      !body.feedback_type
    ) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: content_type, content_id, book_id, feedback_type',
        },
        { status: 400 }
      )
    }

    // Validate feedback_type
    if (!['thumbs_up', 'thumbs_down'].includes(body.feedback_type)) {
      return NextResponse.json(
        { error: 'Invalid feedback_type. Must be thumbs_up or thumbs_down' },
        { status: 400 }
      )
    }

    // Validate content_type
    if (!['book', 'page'].includes(body.content_type)) {
      return NextResponse.json(
        { error: 'Invalid content_type. Must be book or page' },
        { status: 400 }
      )
    }

    // For page feedback, page_number is required
    if (body.content_type === 'page' && !body.page_number) {
      return NextResponse.json(
        { error: 'page_number is required for page feedback' },
        { status: 400 }
      )
    }

    // Check if feedback already exists for this user and content
    const { data: existingFeedback } = await supabase
      .from('content_feedback')
      .select('id')
      .eq('user_id', user.id)
      .eq('content_type', body.content_type)
      .eq('content_id', body.content_id)
      .single()

    if (existingFeedback) {
      // Update existing feedback
      const { data, error } = await supabase
        .from('content_feedback')
        .update({
          feedback_type: body.feedback_type,
          comment: body.comment || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingFeedback.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating feedback:', error)
        return NextResponse.json(
          { error: 'Failed to update feedback' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        data,
        message: 'Feedback updated successfully',
      })
    } else {
      // Create new feedback
      const { data, error } = await supabase
        .from('content_feedback')
        .insert({
          user_id: user.id,
          content_type: body.content_type,
          content_id: body.content_id,
          book_id: body.book_id,
          page_number: body.page_number || null,
          feedback_type: body.feedback_type,
          comment: body.comment || null,
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating feedback:', error)
        return NextResponse.json(
          { error: 'Failed to create feedback' },
          { status: 500 }
        )
      }

      return NextResponse.json(
        { data, message: 'Feedback created successfully' },
        { status: 201 }
      )
    }
  } catch (error) {
    console.error('Error in feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleGET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const contentType = searchParams.get('content_type')
    const contentId = searchParams.get('content_id')
    const bookId = searchParams.get('book_id')
    const pageNumber = searchParams.get('page_number')

    if (!contentType || !contentId) {
      return NextResponse.json(
        { error: 'Missing required parameters: content_type, content_id' },
        { status: 400 }
      )
    }

    // Get user's feedback for this content
    const {
      data: { user },
    } = await supabase.auth.getUser()
    let userFeedback = null

    if (user) {
      const { data } = await supabase
        .from('content_feedback')
        .select('id, feedback_type, comment, created_at')
        .eq('user_id', user.id)
        .eq('content_type', contentType)
        .eq('content_id', contentId)
        .single()

      userFeedback = data
    }

    // Get feedback summary
    let summary
    if (contentType === 'book' && bookId) {
      const { data } = await supabase.rpc('get_book_feedback_summary', {
        book_id_param: bookId,
      })
      summary = data?.[0] || {
        thumbs_up_count: 0,
        thumbs_down_count: 0,
        total_feedback_count: 0,
        positive_percentage: 0,
      }
    } else if (contentType === 'page' && bookId && pageNumber) {
      const { data } = await supabase.rpc('get_page_feedback_summary', {
        book_id_param: bookId,
        page_number_param: parseInt(pageNumber),
      })
      summary = data?.[0] || {
        thumbs_up_count: 0,
        thumbs_down_count: 0,
        total_feedback_count: 0,
        positive_percentage: 0,
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid parameters for feedback summary' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      userFeedback,
      summary,
    })
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleDELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const feedbackId = searchParams.get('id')

    if (!feedbackId) {
      return NextResponse.json(
        { error: 'Missing feedback ID' },
        { status: 400 }
      )
    }

    // Delete feedback (RLS will ensure user can only delete their own)
    const { error } = await supabase
      .from('content_feedback')
      .delete()
      .eq('id', feedbackId)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting feedback:', error)
      return NextResponse.json(
        { error: 'Failed to delete feedback' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Feedback deleted successfully' })
  } catch (error) {
    console.error('Error in delete feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Apply rate limiting to all methods
export const POST = createProtectedApiRoute(handlePOST, { requireAuth: true })
export const GET = createProtectedApiRoute(handleGET, { requireAuth: false }) // Allow anonymous access for public feedback
export const DELETE = createProtectedApiRoute(handleDELETE, {
  requireAuth: true,
})
