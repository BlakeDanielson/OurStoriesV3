import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServerStorageOperations } from '@/lib/storage'
import { protectApiRoute } from '@/lib/auth/middleware'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user using the new auth utilities
    const { user, response: authResponse } = await protectApiRoute(request)

    if (authResponse) {
      return authResponse // Return unauthorized response if authentication failed
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string
    const bookId = formData.get('bookId') as string
    const pageNumber = formData.get('pageNumber') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!type || !['cover', 'page', 'avatar'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type' },
        { status: 400 }
      )
    }

    // Initialize storage operations and Supabase client
    const storage = createServerStorageOperations()
    const supabase = createServerSupabaseClient()

    let result

    switch (type) {
      case 'cover':
        if (!bookId) {
          return NextResponse.json(
            { error: 'Book ID required for cover upload' },
            { status: 400 }
          )
        }

        // Verify user owns the book
        const { data: book, error: bookError } = await supabase
          .from('books')
          .select('id, child_profile_id, child_profiles!inner(parent_id)')
          .eq('id', bookId)
          .single()

        if (bookError || !book || book.child_profiles.parent_id !== user.id) {
          return NextResponse.json(
            { error: 'Book not found or access denied' },
            { status: 403 }
          )
        }

        result = await storage.uploadBookCover(bookId, file)

        // Update book record with cover URL
        if (result.data) {
          await supabase
            .from('books')
            .update({ cover_image_url: result.data.url })
            .eq('id', bookId)
        }
        break

      case 'page':
        if (!bookId || !pageNumber) {
          return NextResponse.json(
            { error: 'Book ID and page number required for page upload' },
            { status: 400 }
          )
        }

        // Verify user owns the book
        const { data: pageBook, error: pageBookError } = await supabase
          .from('books')
          .select('id, child_profile_id, child_profiles!inner(parent_id)')
          .eq('id', bookId)
          .single()

        if (
          pageBookError ||
          !pageBook ||
          pageBook.child_profiles.parent_id !== user.id
        ) {
          return NextResponse.json(
            { error: 'Book not found or access denied' },
            { status: 403 }
          )
        }

        result = await storage.uploadBookPageImage(
          bookId,
          parseInt(pageNumber),
          file
        )

        // Update book page record with image URL
        if (result.data) {
          await supabase
            .from('book_pages')
            .update({ image_url: result.data.url })
            .eq('book_id', bookId)
            .eq('page_number', parseInt(pageNumber))
        }
        break

      case 'avatar':
        result = await storage.uploadAvatar(user.id, file)

        // Update user record with avatar URL
        if (result.data) {
          await supabase
            .from('users')
            .update({ avatar_url: result.data.url })
            .eq('id', user.id)
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid upload type' },
          { status: 400 }
        )
    }

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
