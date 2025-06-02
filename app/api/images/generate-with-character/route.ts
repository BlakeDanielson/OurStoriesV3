import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { ImageGenerationService } from '@/lib/ai/image-generation'
import {
  ImageGenerationRequest,
  CharacterReference,
  ImageGenerationResponse,
  ProviderConfig,
  ImageModel,
  ImageStyle,
} from '@/lib/ai/types/image-generation'

interface CharacterImageGenerationRequest {
  // Story context
  prompt: string
  storyContext?: string
  sceneDescription?: string

  // Character references
  childProfileId: string
  useCharacterReference: boolean
  characterName?: string
  characterRole?: string // 'protagonist' | 'main_character' | 'supporting'

  // Image generation settings
  model?: string
  width?: number
  height?: number
  style?: string
  negativePrompt?: string
  seed?: number
  steps?: number
  guidanceScale?: number

  // Character consistency settings
  preserveFacialFeatures?: boolean
  characterConsistency?: number // 0.1 to 1.0
  faceWeight?: number // 0.1 to 1.0, how strongly to influence facial features

  // OpenAI Image Edit settings
  useImageEdit?: boolean // Whether to use image edit for OpenAI models

  // Optional metadata
  bookId?: string
  pageNumber?: number
  userId?: string
}

interface CharacterImageGenerationResponse {
  success: boolean
  result?: {
    imageId: string
    imageUrl: string
    prompt: string
    enhancedPrompt?: string
    characterUsed: boolean
    characterSimilarityScore?: number
    generationTime: number
    cost?: number
    metadata: {
      model: string
      width: number
      height: number
      style?: string
      seed?: number
      characterReference?: {
        photoId: string
        photoUrl: string
        characterName: string
        faceRegion?: {
          x: number
          y: number
          width: number
          height: number
        }
        influenceScore: number
      }
      generatedAt: string
    }
  }
  error?: string
  details?: string
}

// Helper function to get the primary photo for a child
async function getPrimaryChildPhoto(
  supabase: any,
  childProfileId: string,
  userId: string
) {
  const { data: photos, error } = await supabase
    .from('child_photos')
    .select('*')
    .eq('child_profile_id', childProfileId)
    .eq('user_id', userId)
    .eq('is_primary', true)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching primary photo:', error)
    return null
  }

  return photos && photos.length > 0 ? photos[0] : null
}

// Helper function to get any photo for a child if no primary exists
async function getAnyChildPhoto(
  supabase: any,
  childProfileId: string,
  userId: string
) {
  const { data: photos, error } = await supabase
    .from('child_photos')
    .select('*')
    .eq('child_profile_id', childProfileId)
    .eq('user_id', userId)
    .eq('face_detected', true) // Prefer photos with detected faces
    .order('face_confidence', { ascending: false })
    .limit(1)

  if (error) {
    console.error('Error fetching child photo:', error)
    return null
  }

  return photos && photos.length > 0 ? photos[0] : null
}

// Helper function to enhance prompt with character information
function enhancePromptWithCharacter(
  originalPrompt: string,
  characterName: string,
  characterRole: string = 'main character',
  storyContext?: string
): string {
  let enhancedPrompt = originalPrompt

  // Add character name if not already present
  if (!enhancedPrompt.toLowerCase().includes(characterName.toLowerCase())) {
    enhancedPrompt = enhancedPrompt.replace(
      /\b(a child|a kid|a boy|a girl|the child|the kid|the boy|the girl)\b/gi,
      characterName
    )
  }

  // Add character role context
  if (characterRole && !enhancedPrompt.toLowerCase().includes(characterRole)) {
    enhancedPrompt = `${enhancedPrompt}, featuring ${characterName} as the ${characterRole}`
  }

  // Add story context if provided
  if (storyContext) {
    enhancedPrompt = `${enhancedPrompt}. Story context: ${storyContext}`
  }

  return enhancedPrompt
}

// Mock face detection function for testing
async function detectFace(imageUrl: string): Promise<{
  faceDetected: boolean
  faceRegion?: { x: number; y: number; width: number; height: number }
  confidence?: number
}> {
  // Mock implementation - in production, use actual face detection
  return {
    faceDetected: true,
    faceRegion: { x: 0.3, y: 0.2, width: 0.4, height: 0.5 },
    confidence: 0.95,
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: CharacterImageGenerationRequest = await request.json()

    // Check for force real API parameter
    const { searchParams } = new URL(request.url)
    const forceRealAPI = searchParams.get('forceRealAPI') === 'true'

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!body.childProfileId) {
      return NextResponse.json(
        { success: false, error: 'Child profile ID is required' },
        { status: 400 }
      )
    }

    // Initialize Supabase client
    const supabase = createServerSupabaseClient()

    // Special handling for test character consistency - bypass auth
    const isTestMode = body.childProfileId === 'test-character-consistency'
    let user: any = null
    let childProfile: any = null

    if (!isTestMode) {
      // Get current user for normal operation
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser()
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }
      user = authUser

      // Verify the child profile belongs to the user
      const { data: profile, error: profileError } = await supabase
        .from('child_profiles')
        .select('*')
        .eq('id', body.childProfileId)
        .eq('user_id', user.id)
        .single()

      if (profileError || !profile) {
        return NextResponse.json(
          { success: false, error: 'Child profile not found or access denied' },
          { status: 404 }
        )
      }
      childProfile = profile
    } else {
      // Mock child profile for test mode
      childProfile = {
        id: 'test-character-consistency',
        name: 'Test Character',
        user_id: 'test-user',
      }
    }

    // Get character reference photo if requested
    let characterReference: CharacterReference | null = null
    let childPhoto: any = null

    if (body.useCharacterReference) {
      if (isTestMode) {
        // For test mode, create a mock character reference
        characterReference = {
          url: 'data:image/jpeg;base64,mock-test-image', // Mock base64 image
          type: 'character',
          characterName: body.characterName || childProfile.name,
          childProfileId: body.childProfileId,
          weight: body.faceWeight || 0.7,
          description: `Test photo of ${body.characterName || childProfile.name} for character reference`,
          faceRegion: {
            x: 0.3,
            y: 0.2,
            width: 0.4,
            height: 0.5,
          },
        }
      } else {
        // Try to get primary photo first
        childPhoto = await supabase
          .from('child_photos')
          .select('*')
          .eq('child_profile_id', body.childProfileId)
          .eq('is_primary', true)
          .single()

        // If no primary photo, get the most recent one
        if (!childPhoto.data) {
          childPhoto = await supabase
            .from('child_photos')
            .select('*')
            .eq('child_profile_id', body.childProfileId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()
        }

        if (childPhoto.data) {
          characterReference = {
            url: childPhoto.data.optimized_url || childPhoto.data.original_url,
            type: 'character',
            characterName: body.characterName || childProfile.name,
            childProfileId: body.childProfileId,
            weight: body.faceWeight || 0.7,
            description: `Photo of ${body.characterName || childProfile.name} for character reference`,
            faceRegion: childPhoto.data.face_region,
          }
        }
      }
    }

    // Enhance prompt with character information
    let enhancedPrompt = body.prompt
    if (characterReference) {
      const characterDesc = `featuring ${characterReference.characterName || 'the child'} as the ${body.characterRole || 'main character'}`
      enhancedPrompt = `${body.prompt}, ${characterDesc}`
    }

    // Prepare image generation request
    const modelName = (
      body.model === 'flux-dev'
        ? 'flux1'
        : body.model === 'flux-schnell'
          ? 'flux1'
          : body.model === 'gpt-image-1'
            ? 'gpt-image-1'
            : body.model === 'dall-e-3'
              ? 'dall-e-3'
              : body.model === 'dall-e-2'
                ? 'dall-e-2'
                : body.model || 'flux1'
    ) as ImageModel

    const imageRequest: ImageGenerationRequest = {
      prompt: enhancedPrompt,
      model: modelName,
      width: body.width || 1024,
      height: body.height || 1024,
      style: (body.style || 'watercolor') as ImageStyle,
      steps: body.steps || 20,
      guidanceScale: body.guidanceScale || 7.5,
      seed: body.seed,
      characterReferences: characterReference
        ? [characterReference]
        : undefined,
      preserveFacialFeatures: body.preserveFacialFeatures ?? true,
      characterConsistency: body.characterConsistency || 0.8,
      // OpenAI-specific parameters
      openaiQuality: 'auto',
      openaiStyle: 'vivid',
      openaiBackground: 'auto',
      openaiModeration: 'auto',
      openaiOutputFormat: 'png',
      // OpenAI Image Edit parameters - use image edit for better character consistency
      useImageEdit:
        body.useImageEdit &&
        characterReference &&
        (modelName.startsWith('gpt-') || modelName.startsWith('dall-e-'))
          ? true
          : undefined,
      editImages:
        body.useImageEdit &&
        characterReference &&
        (modelName.startsWith('gpt-') || modelName.startsWith('dall-e-'))
          ? [characterReference.url]
          : undefined,
    }

    // Configure image generation service
    const config: ProviderConfig = {
      replicate: {
        apiKey: process.env.REPLICATE_API_KEY || '',
        baseUrl: 'https://api.replicate.com/v1',
        models: {
          flux1:
            'black-forest-labs/flux-schnell:131d9e185621b4b4d349fd262e363420a6f74081d8c27966c9c5bcf120fa3985',
          'flux-1.1-pro': 'black-forest-labs/flux-1.1-pro',
          'flux-kontext-pro': 'black-forest-labs/flux-kontext-pro',
          'imagen-4': 'google-deepmind/imagen-4',
          'minimax-image-01': 'minimax/minimax-image-01',
          'flux-1.1-pro-ultra': 'black-forest-labs/flux-1.1-pro-ultra',
          'gpt-image-1': '', // Not used for Replicate
          'dall-e-3': '', // Not used for Replicate
          'dall-e-2': '', // Not used for Replicate
        },
        rateLimit: {
          requestsPerMinute: 60,
          concurrent: 5,
        },
      },
      runpod: {
        apiKey: '',
        baseUrl: '',
        models: {
          flux1: '',
          'flux-1.1-pro': '',
          'flux-kontext-pro': '',
          'imagen-4': '',
          'minimax-image-01': '',
          'flux-1.1-pro-ultra': '',
          'gpt-image-1': '',
          'dall-e-3': '',
          'dall-e-2': '',
        },
        rateLimit: {
          requestsPerMinute: 0,
          concurrent: 0,
        },
      },
      openai: {
        apiKey: process.env.OPENAI_API_KEY || '',
        baseUrl: 'https://api.openai.com/v1',
        models: {
          flux1: '', // Not used for OpenAI
          'flux-1.1-pro': '', // Not used for OpenAI
          'flux-kontext-pro': '', // Not used for OpenAI
          'imagen-4': '', // Not used for OpenAI
          'minimax-image-01': '', // Not used for OpenAI
          'flux-1.1-pro-ultra': '', // Not used for OpenAI
          'gpt-image-1': 'gpt-image-1',
          'dall-e-3': 'dall-e-3',
          'dall-e-2': 'dall-e-2',
        },
        rateLimit: {
          requestsPerMinute: 60,
          concurrent: 5,
        },
      },
    }

    // Generate the image
    const startTime = Date.now()
    let generationResult: ImageGenerationResponse

    // Check if we should use test mode or real API
    const useTestMode = isTestMode && !forceRealAPI // Only use test mode for test-character-consistency unless forced to use real API

    if (useTestMode) {
      // For test mode, return mock generation result
      const generationTime = Date.now() - startTime
      generationResult = {
        id: `test-image-${Date.now()}`,
        imageUrl: `https://picsum.photos/1024/1024?random=${Date.now()}`, // Random placeholder image
        status: 'succeeded',
        model: imageRequest.model,
        provider:
          imageRequest.model.startsWith('gpt-') ||
          imageRequest.model.startsWith('dall-e-')
            ? 'openai'
            : 'replicate',
        characterSimilarityScore: 0.85 + Math.random() * 0.1, // Mock similarity score 85-95%
        cost: 0.02, // Mock cost
        metadata: {
          prompt: enhancedPrompt,
          width: imageRequest.width,
          height: imageRequest.height,
          style: imageRequest.style,
          seed: Math.floor(Math.random() * 1000000),
          steps: body.steps || 20,
          guidanceScale: body.guidanceScale || 7.5,
        },
      }
    } else {
      // Initialize image generation service for real generation
      const imageService = new ImageGenerationService(config)

      // Determine which provider to use based on the model
      const provider =
        imageRequest.model.startsWith('gpt-') ||
        imageRequest.model.startsWith('dall-e-')
          ? 'openai'
          : 'replicate'

      generationResult = await imageService.generateImage(
        imageRequest,
        provider
      )
    }

    const generationTime = Date.now() - startTime

    if (generationResult.status === 'failed') {
      return NextResponse.json(
        {
          success: false,
          error: 'Image generation failed',
          details: generationResult.error,
        },
        { status: 500 }
      )
    }

    // Save generation record to database (skip for test mode)
    let generationRecord: any = null
    if (!isTestMode) {
      const { data: record, error: dbError } = await supabase
        .from('image_generations')
        .insert({
          user_id: user.id,
          child_profile_id: body.childProfileId,
          book_id: body.bookId,
          page_number: body.pageNumber,
          original_prompt: body.prompt,
          enhanced_prompt: enhancedPrompt,
          image_url: generationResult.imageUrl,
          model: body.model || 'flux-dev',
          width: body.width || 1024,
          height: body.height || 1024,
          style: body.style || 'watercolor',
          seed: generationResult.metadata.seed,
          character_reference_used: !!characterReference,
          character_photo_id: childPhoto?.id,
          character_similarity_score: generationResult.characterSimilarityScore,
          generation_time_ms: generationTime,
          cost: generationResult.cost,
          provider: generationResult.provider,
          status: generationResult.status,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (dbError) {
        console.error('Database error saving generation record:', dbError)
        // Don't fail the request, just log the error
      }
      generationRecord = record
    }

    // Format response
    const response: CharacterImageGenerationResponse = {
      success: true,
      result: {
        imageId: generationResult.id,
        imageUrl: generationResult.imageUrl!,
        prompt: body.prompt,
        enhancedPrompt: enhancedPrompt,
        characterUsed: !!characterReference,
        characterSimilarityScore: generationResult.characterSimilarityScore,
        generationTime,
        cost: generationResult.cost,
        metadata: {
          model: generationResult.model,
          width: imageRequest.width,
          height: imageRequest.height,
          style: imageRequest.style,
          seed: generationResult.metadata.seed,
          characterReference: characterReference
            ? {
                photoId: isTestMode
                  ? 'test-photo-id'
                  : childPhoto?.id || 'unknown',
                photoUrl: characterReference.url,
                characterName: characterReference.characterName || 'the child',
                faceRegion: characterReference.faceRegion,
                influenceScore: body.faceWeight || 0.7,
              }
            : undefined,
          generatedAt: new Date().toISOString(),
        },
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Character image generation error:', error)
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url)
    const childProfileId = searchParams.get('childProfileId')
    const bookId = searchParams.get('bookId')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Initialize Supabase client
    const supabase = createServerSupabaseClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Build query
    let query = supabase
      .from('image_generations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (childProfileId) {
      query = query.eq('child_profile_id', childProfileId)
    }

    if (bookId) {
      query = query.eq('book_id', bookId)
    }

    const { data: generations, error: generationsError } = await query

    if (generationsError) {
      console.error('Generations fetch error:', generationsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch generations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      generations: generations || [],
      count: generations?.length || 0,
    })
  } catch (error) {
    console.error('Image generations fetch error:', error)
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
