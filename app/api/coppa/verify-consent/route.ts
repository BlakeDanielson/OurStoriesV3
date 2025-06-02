import { NextRequest, NextResponse } from 'next/server'
import { coppaService } from '@/lib/services/coppa'
import { withCSRFProtection } from '@/lib/csrf/middleware'

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()
    const { consentToken, approved } = body

    if (!consentToken || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Consent token and approval status are required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent for audit trail
    const clientIP =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    const success = await coppaService.verifyParentalConsent(
      consentToken,
      approved,
      clientIP,
      userAgent
    )

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to verify consent. Token may be invalid or expired.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: approved
        ? 'Parental consent granted successfully'
        : 'Parental consent denied',
      approved,
    })
  } catch (error) {
    console.error('Error in consent verification:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(postHandler)
