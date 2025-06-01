import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check auth status
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Not authenticated',
          details: authError?.message,
        },
        { status: 401 }
      )
    }

    // Check if user profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        message: 'User profile already exists',
        profile: existingProfile,
      })
    }

    // Create user profile
    const { data: newProfile, error: createError } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email!,
        full_name:
          user.user_metadata?.full_name || user.user_metadata?.name || null,
        avatar_url: user.user_metadata?.avatar_url || null,
        role: 'parent',
      })
      .select()
      .single()

    if (createError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create user profile',
          details: createError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'User profile created successfully',
      profile: newProfile,
    })
  } catch (error) {
    console.error('Create user profile error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
