import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { AI } from '@/lib/ai'
import { ImageGenerationService } from '@/lib/ai/image-generation'
import type { ImageStyle } from '@/lib/ai/types/image-generation'
import { setTestBook, updateTestBook } from '@/lib/test-storage'

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
    // Parse and validate request body
    const body = await request.json()
    const validatedData = GenerateBookRequestSchema.parse(body)

    // Generate a test book ID
    const bookId = `test-book-${Date.now()}`

    // Create initial book record in memory
    const book = {
      id: bookId,
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
    }

    setTestBook(bookId, book)
    console.log(`📚 Created initial book ${bookId} in storage`)

    // Start the generation process asynchronously
    generateBookAsync(bookId, validatedData).catch((error: Error) => {
      console.error('Book generation failed:', error)
      // Update book status to failed
      updateTestBook(bookId, {
        status: 'failed',
        metadata: {
          ...book.metadata,
          error: error.message,
          failedAt: new Date().toISOString(),
        },
      })
    })

    return NextResponse.json({
      success: true,
      bookId: bookId,
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
  settings: GenerateBookRequest
) {
  try {
    // Update progress: Starting outline generation
    updateBookProgress(bookId, 10, 'generating_outline')

    // Step 1: Generate story outline
    const outline = await generateStoryOutline(settings)

    // Update progress: Outline complete
    updateBookProgress(bookId, 25, 'outline_complete')

    // Step 2: Generate page content
    updateBookProgress(bookId, 30, 'generating_story_content')
    const pages = await generatePageContent(outline, settings)

    // Update progress: Content generation complete
    updateBookProgress(bookId, 60, 'story_content_complete')

    // Step 3: Generate images for all pages in parallel
    const pagesWithImages = await generatePageImages(pages, settings)

    // Update progress: Images complete
    updateBookProgress(bookId, 80, 'images_complete')

    // Step 4: Save all pages to memory
    saveBookPages(bookId, pagesWithImages)

    // Step 5: Finalize book
    finalizeBook(bookId, pagesWithImages.length)

    // Update progress: Complete
    updateBookProgress(bookId, 100, 'completed')
  } catch (error) {
    console.error('Book generation process failed:', error)
    throw error
  }
}

// Helper function to update book progress
function updateBookProgress(bookId: string, progress: number, stage: string) {
  console.log(`📊 Updating progress for ${bookId}: ${progress}% - ${stage}`)
  const result = updateTestBook(bookId, {
    metadata: {
      progress,
      currentStage: stage,
      lastUpdated: new Date().toISOString(),
    },
  })
  console.log(`📊 Update result:`, result ? 'success' : 'failed')
}

// Generate story outline using AI
async function generateStoryOutline(settings: GenerateBookRequest) {
  const aiService = AI.utils.createCompleteService({
    ageGroup: 'elementary',
    safetyLevel: 'strict',
    enableEnhancedSafety: true,
    enableLanguageControls: true,
  })

  const promptContext = {
    child: {
      name: 'Test Child',
      age: 8,
      personalityTraits: ['curious', 'brave'],
      hobbies: ['reading', 'exploring'],
      interests: ['adventure', 'friendship'],
    },
    story: {
      theme: settings.theme || 'adventure',
      storyArc: settings.storyArc || 'hero-journey',
      illustrationStyle: settings.illustrationStyle || 'cartoon',
      storyLength: settings.storyLength || 'medium',
    },
    safetyLevel: 'strict' as const,
  }

  const result =
    await aiService.textGeneration.generateStoryOutline(promptContext)
  return result.content
}

// Generate page content from outline
async function generatePageContent(
  outline: any,
  settings: GenerateBookRequest
) {
  const pageCount =
    settings.storyLength === 'short'
      ? 5
      : settings.storyLength === 'medium'
        ? 8
        : 12

  // Parse outline into chapters/scenes
  const outlineLines = outline
    .split('\n')
    .filter((line: string) => line.trim().length > 0)
  const scenes = outlineLines.slice(0, pageCount)

  const aiService = AI.utils.createCompleteService({
    ageGroup: 'elementary',
    safetyLevel: 'strict',
    enableEnhancedSafety: true,
    enableLanguageControls: true,
  })

  const promptContext = {
    child: {
      name: 'Test Child',
      age: 8,
      personalityTraits: ['curious', 'brave'],
      hobbies: ['reading', 'exploring'],
      interests: ['adventure', 'friendship'],
    },
    story: {
      theme: settings.theme || 'adventure',
      storyArc: settings.storyArc || 'hero-journey',
      illustrationStyle: settings.illustrationStyle || 'cartoon',
      storyLength: settings.storyLength || 'medium',
      title: settings.title,
      description: settings.description,
      customPrompt: settings.customPrompt,
    },
    safetyLevel: 'strict' as const,
  }

  // Generate story content for each page
  const pagePromises = scenes.map(async (scene: string, index: number) => {
    try {
      // Create a specific prompt for this page
      const pagePrompt = {
        ...promptContext,
        pageContext: {
          pageNumber: index + 1,
          totalPages: pageCount,
          sceneDescription: scene.trim(),
          previousPages: scenes.slice(0, index).join('\n'),
          isFirstPage: index === 0,
          isLastPage: index === pageCount - 1,
        },
      }

      // Generate the actual story text for this page
      const result = await aiService.textGeneration.generateStory(pagePrompt)

      return {
        page_number: index + 1,
        content: result.content,
        ai_metadata: {
          title: `Page ${index + 1}`,
          summary: scene.trim(),
          sceneDescription: scene.trim(),
          wordCount: result.content.split(' ').length,
          generatedAt: new Date().toISOString(),
        },
      }
    } catch (error) {
      console.error(`Failed to generate content for page ${index + 1}:`, error)

      // Fallback to a simple story structure if AI generation fails
      const fallbackContent = generateFallbackPageContent(
        scene.trim(),
        index + 1,
        pageCount,
        settings
      )

      return {
        page_number: index + 1,
        content: fallbackContent,
        ai_metadata: {
          title: `Page ${index + 1}`,
          summary: scene.trim(),
          sceneDescription: scene.trim(),
          wordCount: fallbackContent.split(' ').length,
          generatedAt: new Date().toISOString(),
          fallback: true,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  })

  const pages = await Promise.all(pagePromises)
  return pages
}

// Fallback function to generate basic story content if AI fails
function generateFallbackPageContent(
  scene: string,
  pageNumber: number,
  totalPages: number,
  settings: GenerateBookRequest
): string {
  const { title, theme } = settings

  // Create a simple story structure based on the scene
  if (pageNumber === 1) {
    return `Once upon a time, there was a wonderful ${theme} waiting to begin. ${scene} This is where our story starts, in a magical place where anything can happen.`
  } else if (pageNumber === totalPages) {
    return `${scene} And so our ${theme} comes to a happy ending. Everyone learned something special, and they all lived happily ever after. The end.`
  } else {
    const midStoryPhrases = [
      `As the ${theme} continued, ${scene.toLowerCase()}`,
      `Next in our story, ${scene.toLowerCase()}`,
      `Then something exciting happened: ${scene.toLowerCase()}`,
      `The adventure grew more interesting when ${scene.toLowerCase()}`,
    ]
    const randomPhrase =
      midStoryPhrases[Math.floor(Math.random() * midStoryPhrases.length)]
    return `${randomPhrase} This was an important part of the journey, and everyone was learning so much along the way.`
  }
}

// Generate images for pages
async function generatePageImages(pages: any[], settings: GenerateBookRequest) {
  const imageService = new ImageGenerationService({
    replicate: {
      apiKey: process.env.REPLICATE_API_KEY || '',
      baseUrl: 'https://api.replicate.com/v1',
      models: {
        flux1: 'black-forest-labs/flux-schnell',
        'flux-kontext-pro': 'black-forest-labs/flux-pro',
        'imagen-4': 'google/imagen-4',
        'minimax-image-01': 'minimax/image-01',
        'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
      },
      rateLimit: {
        requestsPerMinute: 10,
        concurrent: 2,
      },
    },
    runpod: {
      apiKey: process.env.RUNPOD_API_KEY || '',
      baseUrl: 'https://api.runpod.ai/v2',
      models: {
        flux1: 'flux-schnell',
        'flux-kontext-pro': 'flux-pro',
        'imagen-4': 'imagen-4',
        'minimax-image-01': 'minimax-image-01',
        'flux-1.1-pro-ultra': 'flux-1.1-pro-ultra',
      },
      rateLimit: {
        requestsPerMinute: 10,
        concurrent: 2,
      },
    },
  })

  // Check if we have any API keys available
  const hasReplicateKey = !!process.env.REPLICATE_API_KEY
  const hasRunpodKey = !!process.env.RUNPOD_API_KEY

  if (!hasReplicateKey && !hasRunpodKey) {
    console.warn(
      'No image generation API keys found. Skipping image generation.'
    )
    // Return pages without images
    return pages.map(page => ({
      ...page,
      image_url: null,
      image_prompt: null,
      ai_metadata: {
        ...page.ai_metadata,
        imageGenerated: false,
        imageError: 'No API keys configured for image generation',
      },
    }))
  }

  const imagePromises = pages.map(async page => {
    try {
      const imageRequest = {
        prompt: `${settings.illustrationStyle || 'cartoon'} style illustration for children's book: ${page.ai_metadata.summary}`,
        style: settings.illustrationStyle as ImageStyle,
        width: 512,
        height: 512,
        model: 'flux1' as const,
      }

      // Try Replicate first if available, then RunPod
      const provider = hasReplicateKey ? 'replicate' : 'runpod'
      const result = await imageService.generateImage(imageRequest, provider)

      return {
        ...page,
        image_url: result.imageUrl,
        image_prompt: imageRequest.prompt,
        ai_metadata: {
          ...page.ai_metadata,
          imageGenerated: true,
          imageError: null,
        },
      }
    } catch (error) {
      console.error(
        `Failed to generate image for page ${page.page_number}:`,
        error
      )
      return {
        ...page,
        image_url: null,
        image_prompt: null,
        ai_metadata: {
          ...page.ai_metadata,
          imageGenerated: false,
          imageError: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  })

  return Promise.all(imagePromises)
}

// Save book pages to memory
function saveBookPages(bookId: string, pages: any[]) {
  console.log(`💾 Saving ${pages.length} pages for book ${bookId}`)
  const result = updateTestBook(bookId, {
    book_pages: pages,
  })
  console.log(`💾 Save pages result:`, result ? 'success' : 'failed')
}

// Finalize book
function finalizeBook(bookId: string, totalPages: number) {
  console.log(`✅ Finalizing book ${bookId} with ${totalPages} pages`)
  const result = updateTestBook(bookId, {
    status: 'completed',
    total_pages: totalPages,
    completed_at: new Date().toISOString(),
  })
  console.log(`✅ Finalize result:`, result ? 'success' : 'failed')
}
