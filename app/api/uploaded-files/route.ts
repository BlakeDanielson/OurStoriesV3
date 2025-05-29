import { NextRequest, NextResponse } from 'next/server'
import { getAuthClient } from '@/lib/auth/supabase'
import {
  getUploadedFiles,
  getUploadedFilesWithAssociations,
  updateUploadedFile,
  deleteUploadedFile,
  getUploadStatistics,
  type UploadedFileFilters,
} from '@/lib/services/uploaded-files'

// GET /api/uploaded-files - Get uploaded files for the current user
export async function GET(request: NextRequest) {
  try {
    const supabase = getAuthClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)

    // Parse query parameters for filtering
    const filters: UploadedFileFilters = {}

    if (searchParams.get('upload_type')) {
      filters.upload_type = searchParams.get('upload_type') as any
    }

    if (searchParams.get('validation_type')) {
      filters.validation_type = searchParams.get('validation_type')!
    }

    if (searchParams.get('associated_entity_type')) {
      filters.associated_entity_type = searchParams.get(
        'associated_entity_type'
      ) as any
    }

    if (searchParams.get('associated_entity_id')) {
      filters.associated_entity_id = searchParams.get('associated_entity_id')!
    }

    if (searchParams.get('is_active')) {
      filters.is_active = searchParams.get('is_active') === 'true'
    }

    if (searchParams.get('created_after')) {
      filters.created_after = searchParams.get('created_after')!
    }

    if (searchParams.get('created_before')) {
      filters.created_before = searchParams.get('created_before')!
    }

    // Check if we should include associations
    const includeAssociations =
      searchParams.get('include_associations') === 'true'

    // Check if we want statistics instead
    const getStats = searchParams.get('statistics') === 'true'

    if (getStats) {
      const statistics = await getUploadStatistics()
      return NextResponse.json({ data: statistics })
    }

    const files = includeAssociations
      ? await getUploadedFilesWithAssociations(filters)
      : await getUploadedFiles(filters)

    return NextResponse.json({ data: files })
  } catch (error) {
    console.error('Error fetching uploaded files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch uploaded files' },
      { status: 500 }
    )
  }
}

// PATCH /api/uploaded-files - Update an uploaded file
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getAuthClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    const updatedFile = await updateUploadedFile(id, updateData)

    return NextResponse.json({ data: updatedFile })
  } catch (error) {
    console.error('Error updating uploaded file:', error)
    return NextResponse.json(
      { error: 'Failed to update uploaded file' },
      { status: 500 }
    )
  }
}

// DELETE /api/uploaded-files - Delete an uploaded file
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getAuthClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    await deleteUploadedFile(id)

    return NextResponse.json({ message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting uploaded file:', error)
    return NextResponse.json(
      { error: 'Failed to delete uploaded file' },
      { status: 500 }
    )
  }
}
