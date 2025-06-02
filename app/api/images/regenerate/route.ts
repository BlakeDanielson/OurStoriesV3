import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerationService } from '@/lib/ai/image-generation'
import { ProviderConfig } from '@/lib/ai/types/image-generation'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createServerStorageOperations } from '@/lib/storage'
import { protectApiRoute } from '@/lib/auth/middleware'

// Configure the image generation service
const config: ProviderConfig = {
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY!,
    baseUrl: 'https://api.replicate.com/v1',
    models: {
      flux1: '131d9e185621b4b4d349fd262e363420a6f74081d8c27966c9c5bcf120fa3985', // FLUX Schnell latest version
      'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
      'flux-kontext-pro': 'black-forest-labs/flux-kontext-pro',
      'imagen-4': 'google/imagen-4',
      'minimax-image-01': 'minimax/image-01',
      'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
    },
    rateLimit: { requestsPerMinute: 60, concurrent: 5 },
  },
  runpod: {
    apiKey: process.env.RUNPOD_API_KEY || 'dummy',
    baseUrl: 'https://api.runpod.ai/v2',
    models: {
      flux1: 'flux-1-schnell',
      'flux-1.1-pro': 'flux-1.1-pro',
      'flux-kontext-pro': 'flux-kontext-pro',
      'imagen-4': 'imagen-4',
      'minimax-image-01': 'minimax-image-01',
      'flux-1.1-pro-ultra': 'flux-1.1-pro-ultra',
    },
    rateLimit: { requestsPerMinute: 100, concurrent: 10 },
  },
}

const imageService = new ImageGenerationService(config)

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const { user, response: authResponse } = await protectApiRoute(request)
    if (authResponse) {
      return authResponse
    }

    const body = await request.json()

    // Validate required fields
    if (!body.originalPrompt) {
      return NextResponse.json(
        { error: 'Original prompt is required' },
        { status: 400 }
      )
    }

    // Optional: Validate page ID for database updates
    const pageId = body.pageId
    const bookId = body.bookId
    const pageNumber = body.pageNumber

    // Test connection first
    const isConnected = await imageService.testConnection('replicate')
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Replicate API. Check your API key.' },
        { status: 500 }
      )
    }

    // Build the regeneration prompt
    let finalPrompt = body.originalPrompt
    if (body.modificationPrompt && body.modificationPrompt.trim()) {
      // Combine original prompt with modification request
      finalPrompt = `${body.originalPrompt}. ${body.modificationPrompt.trim()}`
    }

    // Generate new image with the same or modified prompt
    const result = await imageService.generateImage(
      {
        prompt: finalPrompt,
        model: body.model || 'flux1', // Use same model as original or default
        width: body.width || 1024,
        height: body.height || 1024,
        style: body.style,
        qualityEnhancers: body.qualityEnhancers,
        negativePrompt: body.negativePrompt,
        seed: body.seed, // Use different seed for variation unless specified
        steps: body.steps,
        guidanceScale: body.guidanceScale,
      },
      'replicate'
    )

    // If we have database identifiers, update the database
    let dbUpdateResult = null
    if (pageId || (bookId && pageNumber !== undefined)) {
      try {
        const supabase = createServerSupabaseClient()

        // Verify user has access to this page/book
        let accessQuery
        if (pageId) {
          accessQuery = supabase
            .from('book_pages')
            .select(
              `
              id,
              book_id,
              page_number,
              image_url,
              ai_metadata,
              books!inner(
                child_profile_id,
                child_profiles!inner(parent_id)
              )
            `
            )
            .eq('id', pageId)
            .single()
        } else {
          accessQuery = supabase
            .from('book_pages')
            .select(
              `
              id,
              book_id,
              page_number,
              image_url,
              ai_metadata,
              books!inner(
                child_profile_id,
                child_profiles!inner(parent_id)
              )
            `
            )
            .eq('book_id', bookId)
            .eq('page_number', pageNumber)
            .single()
        }

        const { data: pageData, error: pageError } = await accessQuery

        if (pageError || !pageData) {
          console.warn('Page not found or access denied:', pageError)
        } else if (
          (pageData.books as any)?.child_profiles?.parent_id !== user.id
        ) {
          return NextResponse.json(
            { error: 'Access denied to this page' },
            { status: 403 }
          )
        } else {
          // Store old image URL for cleanup
          const oldImageUrl = pageData.image_url

          // Update the page with new image data
          const updateData = {
            image_url: result.imageUrl,
            image_prompt: finalPrompt,
            ai_metadata: {
              ...((pageData.ai_metadata as Record<string, any>) || {}),
              regeneration: {
                originalPrompt: body.originalPrompt,
                modificationPrompt: body.modificationPrompt,
                finalPrompt,
                model: body.model || 'flux1',
                regeneratedAt: new Date().toISOString(),
                cost: imageService.calculateGenerationCost(result),
                duration: result.generationTime || 0,
                provider: 'replicate',
              },
            },
            updated_at: new Date().toISOString(),
          }

          const { data: updatedPage, error: updateError } = await supabase
            .from('book_pages')
            .update(updateData)
            .eq('id', pageData.id)
            .select()
            .single()

          if (updateError) {
            console.error('Database update error:', updateError)
            dbUpdateResult = { error: updateError.message }
          } else {
            dbUpdateResult = { success: true, page: updatedPage }

            // Optional: Clean up old image from storage if it exists and is different
            if (
              oldImageUrl &&
              oldImageUrl !== result.imageUrl &&
              oldImageUrl.includes('supabase')
            ) {
              try {
                const storage = createServerStorageOperations()
                // Extract file path from URL for deletion
                const urlParts = oldImageUrl.split('/')
                const fileName = urlParts[urlParts.length - 1]
                await storage.deleteFile('book-images', fileName)
              } catch (cleanupError) {
                console.warn('Failed to cleanup old image:', cleanupError)
              }
            }
          }
        }
      } catch (dbError) {
        console.error('Database operation error:', dbError)
        dbUpdateResult = { error: 'Database update failed' }
      }
    }

    return NextResponse.json({
      success: true,
      result,
      cost: imageService.calculateGenerationCost(result),
      originalPrompt: body.originalPrompt,
      modificationPrompt: body.modificationPrompt,
      finalPrompt,
      dbUpdate: dbUpdateResult,
    })
  } catch (error) {
    console.error('Image regeneration error:', error)

    if (error instanceof Error) {
      if (error.message.includes('Authentication failed')) {
        return NextResponse.json(
          { error: 'Invalid Replicate API key' },
          { status: 401 }
        )
      }

      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(
      { error: 'Unknown error occurred during regeneration' },
      { status: 500 }
    )
  }
}
