import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { coppaService } from '@/lib/services/coppa'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const complianceStatus = await coppaService.getComplianceStatus(user.id)

    if (!complianceStatus) {
      return NextResponse.json(
        { error: 'Failed to get compliance status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: complianceStatus,
    })
  } catch (error) {
    console.error('Error getting compliance status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
