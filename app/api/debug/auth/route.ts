import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check auth status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      return NextResponse.json({
        authenticated: false,
        authError: authError.message,
        user: null,
        userProfile: null,
        childProfiles: null,
      })
    }

    if (!user) {
      return NextResponse.json({
        authenticated: false,
        authError: null,
        user: null,
        userProfile: null,
        childProfiles: null,
      })
    }

    // Check if user exists in users table
    const { data: userProfile, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    // Try to get child profiles
    const { data: childProfiles, error: childError } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('parent_id', user.id)

    return NextResponse.json({
      authenticated: true,
      authError: null,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      userProfile: userProfile || null,
      userError: userError?.message || null,
      childProfiles: childProfiles || [],
      childError: childError?.message || null,
      debug: {
        userExists: !!userProfile,
        childProfilesCount: childProfiles?.length || 0,
      },
    })
  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
