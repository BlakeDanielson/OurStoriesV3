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
    const { dateOfBirth } = body

    if (!dateOfBirth) {
      return NextResponse.json(
        { error: 'Date of birth is required' },
        { status: 400 }
      )
    }

    const birthDate = new Date(dateOfBirth)

    // Validate date
    if (isNaN(birthDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    // Check if date is in the future
    if (birthDate > new Date()) {
      return NextResponse.json(
        { error: 'Date of birth cannot be in the future' },
        { status: 400 }
      )
    }

    // Check if age is reasonable (not older than 120 years)
    const age = new Date().getFullYear() - birthDate.getFullYear()
    if (age > 120) {
      return NextResponse.json(
        { error: 'Invalid date of birth' },
        { status: 400 }
      )
    }

    const success = await coppaService.updateDateOfBirth(user.id, birthDate)

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update date of birth' },
        { status: 500 }
      )
    }

    // Get updated compliance status
    const complianceStatus = await coppaService.getComplianceStatus(user.id)

    return NextResponse.json({
      success: true,
      message: 'Date of birth updated successfully',
      complianceStatus,
    })
  } catch (error) {
    console.error('Error updating date of birth:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export const POST = withCSRFProtection(postHandler)
