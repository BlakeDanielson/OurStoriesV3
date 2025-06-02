import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication and admin role
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const feedbackType = searchParams.get('feedback_type')
    const contentType = searchParams.get('content_type')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')

    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('content_feedback')
      .select(
        `
        *,
        users!content_feedback_user_id_fkey(email, full_name),
        books!content_feedback_book_id_fkey(title)
      `
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (feedbackType && ['thumbs_up', 'thumbs_down'].includes(feedbackType)) {
      query = query.eq('feedback_type', feedbackType)
    }

    if (contentType && ['book', 'page'].includes(contentType)) {
      query = query.eq('content_type', contentType)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: feedback, error } = await query

    if (error) {
      console.error('Error fetching admin feedback:', error)
      return NextResponse.json(
        { error: 'Failed to fetch feedback' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabase
      .from('content_feedback')
      .select('*', { count: 'exact', head: true })

    // Apply same filters to count query
    if (feedbackType && ['thumbs_up', 'thumbs_down'].includes(feedbackType)) {
      countQuery = countQuery.eq('feedback_type', feedbackType)
    }

    if (contentType && ['book', 'page'].includes(contentType)) {
      countQuery = countQuery.eq('content_type', contentType)
    }

    if (startDate) {
      countQuery = countQuery.gte('created_at', startDate)
    }

    if (endDate) {
      countQuery = countQuery.lte('created_at', endDate)
    }

    const { count } = await countQuery

    // Get summary statistics
    const { data: stats } = await supabase.rpc('get_feedback_admin_stats')

    return NextResponse.json({
      feedback,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      stats: stats?.[0] || {
        total_feedback: 0,
        thumbs_up_count: 0,
        thumbs_down_count: 0,
        positive_percentage: 0,
        book_feedback_count: 0,
        page_feedback_count: 0,
      },
    })
  } catch (error) {
    console.error('Error in admin feedback API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
