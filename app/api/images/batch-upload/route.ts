import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServerStorageOperations } from '@/lib/storage'

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const bookId = formData.get('bookId') as string

    if (!bookId) {
      return NextResponse.json({ error: 'Book ID required' }, { status: 400 })
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

    // Collect all files from form data
    const uploads: Array<{
      type: 'cover' | 'page'
      bookId: string
      pageNumber?: number
      file: File
    }> = []

    // Process all form entries
    const formEntries = Array.from(formData.entries())
    for (const [key, value] of formEntries) {
      if (key.startsWith('file_') && value instanceof File) {
        const parts = key.split('_')
        if (parts.length >= 3) {
          const type = parts[1] as 'cover' | 'page'
          const pageNumber =
            parts[2] !== 'cover' ? parseInt(parts[2]) : undefined

          uploads.push({
            type,
            bookId,
            pageNumber,
            file: value,
          })
        }
      }
    }

    if (uploads.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    // Initialize storage operations
    const storage = createServerStorageOperations()

    // Perform batch upload
    const batchResult = await storage.batchUploadImages(uploads)

    // Update database records for successful uploads
    const dbUpdates = []

    for (let i = 0; i < uploads.length; i++) {
      const upload = uploads[i]
      const result = batchResult.results[i]

      if (result.success && result.data) {
        if (upload.type === 'cover') {
          dbUpdates.push(
            supabase
              .from('books')
              .update({ cover_image_url: result.data.url })
              .eq('id', bookId)
          )
        } else if (upload.type === 'page' && upload.pageNumber) {
          dbUpdates.push(
            supabase
              .from('book_pages')
              .update({ image_url: result.data.url })
              .eq('book_id', bookId)
              .eq('page_number', upload.pageNumber)
          )
        }
      }
    }

    // Execute all database updates
    if (dbUpdates.length > 0) {
      await Promise.allSettled(dbUpdates)
    }

    return NextResponse.json({
      success: true,
      data: {
        totalUploaded: batchResult.totalSuccess,
        totalFailed: batchResult.totalFailed,
        results: batchResult.results.map((result, index) => ({
          file:
            uploads[index].type === 'cover'
              ? 'cover'
              : `page_${uploads[index].pageNumber}`,
          success: result.success,
          url: result.data?.url,
          error: result.error,
        })),
      },
    })
  } catch (error) {
    console.error('Batch upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
