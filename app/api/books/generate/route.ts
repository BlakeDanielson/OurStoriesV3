import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { z } from 'zod'
import { AI } from '@/lib/ai'
import { ImageGenerationService } from '@/lib/ai/image-generation'
import type { ImageStyle } from '@/lib/ai/types/image-generation'

// Request validation schema
const GenerateBookRequestSchema = z.object({
  childProfileId: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  theme: z.string().optional().default('adventure'),
  storyArc: z.string().optional().default('hero-journey'),
  illustrationStyle: z.string().optional().default('cartoon'),
  storyLength: z.enum(['short', 'medium', 'long']).optional().default('medium'),
  customPrompt: z.string().optional(),
})

type GenerateBookRequest = z.infer<typeof GenerateBookRequestSchema>

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = GenerateBookRequestSchema.parse(body)

    // Verify user owns the child profile
    const { data: childProfile, error: childError } = await supabase
      .from('child_profiles')
      .select('*')
      .eq('id', validatedData.childProfileId)
      .eq('parent_id', user.id)
      .single()

    if (childError || !childProfile) {
      return NextResponse.json(
        { error: 'Child profile not found or unauthorized' },
        { status: 404 }
      )
    }

    // Create initial book record
    const { data: book, error: bookError } = await supabase
      .from('books')
      .insert({
        child_profile_id: validatedData.childProfileId,
        title: validatedData.title,
        description: validatedData.description,
        status: 'generating',
        genre: validatedData.theme,
        themes: [validatedData.theme],
        ai_prompt: validatedData.customPrompt,
        generation_settings: {
          theme: validatedData.theme,
          storyArc: validatedData.storyArc,
          illustrationStyle: validatedData.illustrationStyle,
          storyLength: validatedData.storyLength,
        },
        metadata: {
          generationStarted: new Date().toISOString(),
          progress: 0,
          currentStage: 'initializing',
        },
      })
      .select()
      .single()

    if (bookError || !book) {
      console.error('Failed to create book:', bookError)
      return NextResponse.json(
        { error: 'Failed to create book record' },
        { status: 500 }
      )
    }

    // Start the generation process asynchronously
    generateBookAsync(book.id, childProfile, validatedData, supabase).catch(
      (error: Error) => {
        console.error('Book generation failed:', error)
        // Update book status to failed
        supabase
          .from('books')
          .update({
            status: 'failed',
            metadata: {
              ...book.metadata,
              error: error.message,
              failedAt: new Date().toISOString(),
            },
          })
          .eq('id', book.id)
          .then(() => console.log('Book status updated to failed'))
      }
    )

    return NextResponse.json({
      success: true,
      bookId: book.id,
      message: 'Book generation started',
      estimatedTime: '2-3 minutes',
    })
  } catch (error) {
    console.error('Book generation request failed:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Async function to handle the complete book generation process
async function generateBookAsync(
  bookId: string,
  childProfile: any,
  settings: GenerateBookRequest,
  supabase: any
) {
  try {
    // Update progress: Starting outline generation
    await updateBookProgress(supabase, bookId, 10, 'generating_outline')

    // Step 1: Generate story outline
    const outline = await generateStoryOutline(childProfile, settings)

    // Update progress: Outline complete
    await updateBookProgress(supabase, bookId, 25, 'outline_complete')

    // Step 2: Generate page content
    const pages = await generatePageContent(outline, childProfile, settings)

    // Update progress: Content generation complete
    await updateBookProgress(supabase, bookId, 50, 'content_complete')

    // Step 3: Generate images for all pages in parallel
    const pagesWithImages = await generatePageImages(pages, settings)

    // Update progress: Images complete
    await updateBookProgress(supabase, bookId, 80, 'images_complete')

    // Step 4: Save all pages to database
    await saveBookPages(supabase, bookId, pagesWithImages)

    // Step 5: Finalize book
    await finalizeBook(supabase, bookId, pagesWithImages.length)

    // Update progress: Complete
    await updateBookProgress(supabase, bookId, 100, 'completed')
  } catch (error) {
    console.error('Book generation process failed:', error)
    throw error
  }
}

// Helper function to update book progress
async function updateBookProgress(
  supabase: any,
  bookId: string,
  progress: number,
  stage: string
) {
  await supabase
    .from('books')
    .update({
      metadata: {
        progress,
        currentStage: stage,
        lastUpdated: new Date().toISOString(),
      },
    })
    .eq('id', bookId)
}

// Generate story outline using AI
async function generateStoryOutline(
  childProfile: any,
  settings: GenerateBookRequest
) {
  const aiService = AI.utils.createCompleteService({
    ageGroup: 'elementary',
    safetyLevel: 'strict',
    enableEnhancedSafety: true,
    enableLanguageControls: true,
  })

  const promptContext = {
    child: {
      name: childProfile.name,
      age: childProfile.age || 8,
      personalityTraits: [],
      hobbies: childProfile.interests || [],
      interests: childProfile.interests || [],
    },
    story: {
      theme: settings.theme,
      storyArc: settings.storyArc,
      illustrationStyle: settings.illustrationStyle,
      storyLength: settings.storyLength,
    },
    safetyLevel: 'strict' as const,
  }

  const result =
    await aiService.textGeneration.generateStoryOutline(promptContext)

  // Parse the outline from the generated content
  const outlineText = result.content
  const parsedOutline = aiService.textGeneration.parseStoryOutline(outlineText)

  return parsedOutline
}

// Generate content for each page
async function generatePageContent(
  outline: any,
  childProfile: any,
  settings: GenerateBookRequest
) {
  const aiService = AI.utils.createCompleteService({
    ageGroup: 'elementary',
    safetyLevel: 'strict',
    enableEnhancedSafety: true,
    enableLanguageControls: true,
  })

  const pages = []

  const promptContext = {
    child: {
      name: childProfile.name,
      age: childProfile.age || 8,
      personalityTraits: [],
      hobbies: childProfile.interests || [],
      interests: childProfile.interests || [],
    },
    story: {
      theme: settings.theme,
      storyArc: settings.storyArc,
      illustrationStyle: settings.illustrationStyle,
      storyLength: settings.storyLength,
    },
    safetyLevel: 'strict' as const,
  }

  // Generate content for each chapter/page in the outline
  for (let i = 0; i < outline.chapters.length; i++) {
    const chapter = outline.chapters[i]

    const pageResult = await aiService.textGeneration.generateStory(
      promptContext,
      `Generate page ${i + 1} content for: ${chapter.title}. ${chapter.summary}`
    )

    pages.push({
      pageNumber: i + 1,
      title: chapter.title,
      content: pageResult.content,
      imagePrompt: `${settings.illustrationStyle} illustration of ${chapter.summary} featuring ${childProfile.name}`,
    })
  }

  return pages
}

// Generate images for all pages
async function generatePageImages(pages: any[], settings: GenerateBookRequest) {
  // Create image generation service with proper configuration
  const imageService = new ImageGenerationService({
    replicate: {
      apiKey: process.env.REPLICATE_API_KEY || '',
      baseUrl: 'https://api.replicate.com/v1',
      models: {
        flux1: 'black-forest-labs/flux-schnell',
        'flux-kontext-pro': 'kontext-tech/flux-kontext-pro',
        'imagen-4': 'google/imagen-4',
        'minimax-image-01': 'minimax/minimax-image-01',
        'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
      },
      rateLimit: {
        requestsPerMinute: 60,
        concurrent: 5,
      },
    },
    runpod: {
      apiKey: process.env.RUNPOD_API_KEY || '',
      baseUrl: process.env.RUNPOD_ENDPOINT || '',
      models: {
        flux1: 'flux-schnell',
        'flux-kontext-pro': 'flux-kontext-pro',
        'imagen-4': 'imagen-4',
        'minimax-image-01': 'minimax-image-01',
        'flux-1.1-pro-ultra': 'flux-1.1-pro-ultra',
      },
      rateLimit: {
        requestsPerMinute: 30,
        concurrent: 3,
      },
    },
  })

  // Generate images in parallel for better performance
  const imagePromises = pages.map(async page => {
    try {
      const imageResult = await imageService.generateImageWithFailover({
        prompt: page.imagePrompt,
        model: 'flux1',
        width: 1024,
        height: 1024,
        style: settings.illustrationStyle as ImageStyle,
      })

      return {
        ...page,
        imageUrl: imageResult.imageUrl,
        imageMetadata: imageResult.metadata,
      }
    } catch (error) {
      console.error(
        `Failed to generate image for page ${page.pageNumber}:`,
        error
      )
      return {
        ...page,
        imageUrl: null,
        imageError: (error as Error).message,
      }
    }
  })

  return Promise.all(imagePromises)
}

// Save all pages to database
async function saveBookPages(supabase: any, bookId: string, pages: any[]) {
  const pageInserts = pages.map(page => ({
    book_id: bookId,
    page_number: page.pageNumber,
    content: page.content,
    image_url: page.imageUrl,
    image_prompt: page.imagePrompt,
    page_type: 'story',
    ai_metadata: {
      title: page.title,
      imageMetadata: page.imageMetadata,
      imageError: page.imageError,
    },
  }))

  const { error } = await supabase.from('book_pages').insert(pageInserts)

  if (error) {
    throw new Error(`Failed to save book pages: ${error.message}`)
  }
}

// Finalize book and update status
async function finalizeBook(supabase: any, bookId: string, totalPages: number) {
  const { error } = await supabase
    .from('books')
    .update({
      status: 'completed',
      total_pages: totalPages,
      completed_at: new Date().toISOString(),
      metadata: {
        progress: 100,
        currentStage: 'completed',
        completedAt: new Date().toISOString(),
      },
    })
    .eq('id', bookId)

  if (error) {
    throw new Error(`Failed to finalize book: ${error.message}`)
  }
}
