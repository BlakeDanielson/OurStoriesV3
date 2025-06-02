import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { coppaService } from '@/lib/services/coppa'
import { withCSRFProtection } from '@/lib/csrf/middleware'

async function postHandler(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { parentEmail } = body

    if (!parentEmail) {
      return NextResponse.json(
        { error: 'Parent email is required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for audit trail
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const consentToken = await coppaService.requestParentalConsent(
      user.id,
      parentEmail,
      clientIP,
      userAgent
    )

    if (!consentToken) {
      return NextResponse.json(
        { error: 'Failed to create consent request' },
        { status: 500 }
      )
    }

    // In a real application, you would send an email to the parent here
    // For now, we'll return the token for testing purposes
    return NextResponse.json({
      success: true,
      message: 'Parental consent request created successfully',
      consentToken:
        process.env.NODE_ENV === 'development' ? consentToken : undefined,
    })
  } catch (error) {
    console.error('Error in consent request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(postHandler)
