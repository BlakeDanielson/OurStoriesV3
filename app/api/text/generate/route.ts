import { NextRequest, NextResponse } from 'next/server'
import {
  EnhancedAITextGenerationService,
  createEnhancedServiceFromEnv,
  EnhancedGenerationOptions,
  QualityValidationError,
} from '@/lib/ai/enhanced-text-generation'
import {
  PromptContext,
  ChildProfile,
  StoryConfiguration,
} from '@/lib/ai/prompt-templates'
import { AIServiceError, RateLimitError } from '@/lib/ai/text-generation'

// Initialize the enhanced text generation service
let textService: EnhancedAITextGenerationService | null = null

function getTextService(): EnhancedAITextGenerationService {
  if (!textService) {
    textService = createEnhancedServiceFromEnv()
  }
  return textService
}

// Request validation schemas
interface TextGenerationRequest {
  // Required fields
  prompt: string
  contentType:
    | 'story_outline'
    | 'story_content'
    | 'story_revision'
    | 'page_content'

  // Child profile for personalization
  childProfile?: {
    id: string
    name: string
    age: number
    interests: string[]
    readingLevel?: string
    favoriteCharacters?: string[]
    learningGoals?: string[]
    personalityTraits?: string[]
    hobbies?: string[]
  }

  // Story configuration
  storyConfig?: {
    theme: string
    storyArc: string
    illustrationStyle: string
    storyLength: 'short' | 'medium' | 'long'
    educationalFocus?: string
    customInstructions?: string
  }

  // Generation options
  options?: {
    includeUsageStats?: boolean
    customSystemPrompt?: string
    qualityThreshold?: number
    skipQualityValidation?: boolean
    userId?: string
    bookId?: string
    pageNumber?: number
  }

  // For revisions
  originalContent?: string
  revisionInstructions?: string
  improvementAreas?: string[]

  // For story outlines
  outline?: string
}

interface TextGenerationResponse {
  success: boolean
  result?: {
    content: string
    contentType: string
    qualityScore?: number
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
      estimatedCost: number
    }
    metadata: {
      provider: string
      model: string
      generatedAt: string
      processingTimeMs: number
      safetyCheckPassed: boolean
      attemptCount: number
      fallbackUsed: boolean
      contentId?: string
    }
    qualityValidation?: {
      passesThreshold: boolean
      overallScore: number
      feedback: string[]
      recommendations: string[]
    }
  }
  error?: string
  details?: string
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: TextGenerationRequest = await request.json()

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json(
        { success: false, error: 'Prompt is required' },
        { status: 400 }
      )
    }

    if (!body.contentType) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      )
    }

    // Get the text generation service
    const service = getTextService()

    // Build prompt context
    const context: PromptContext = {
      child: body.childProfile
        ? ({
            name: body.childProfile.name,
            age: body.childProfile.age,
            interests: body.childProfile.interests,
            readingLevel: body.childProfile.readingLevel as
              | 'beginner'
              | 'intermediate'
              | 'advanced'
              | undefined,
            personalityTraits: body.childProfile.personalityTraits || [],
            hobbies: body.childProfile.hobbies || [],
          } as ChildProfile)
        : {
            name: 'Child',
            personalityTraits: [],
            hobbies: [],
            interests: [],
          },

      story: body.storyConfig
        ? ({
            theme: body.storyConfig.theme,
            storyArc: body.storyConfig.storyArc,
            illustrationStyle: body.storyConfig.illustrationStyle,
            storyLength: body.storyConfig.storyLength,
            educationalFocus: body.storyConfig.educationalFocus,
          } as StoryConfiguration)
        : {
            theme: 'adventure',
            storyArc: 'hero-journey',
            illustrationStyle: 'watercolor',
            storyLength: 'short' as const,
          },

      customInstructions: body.prompt,
      safetyLevel: 'strict',
    }

    // Build generation options
    const options: EnhancedGenerationOptions = {
      includeUsageStats: body.options?.includeUsageStats ?? true,
      customSystemPrompt: body.options?.customSystemPrompt,
      qualityThreshold: body.options?.qualityThreshold,
      skipQualityValidation: body.options?.skipQualityValidation ?? true,
      userId: body.options?.userId,
      childProfileId: body.childProfile?.id,
      bookId: body.options?.bookId,
      storeContent: false,
    }

    // Generate content based on type
    let result
    switch (body.contentType) {
      case 'story_outline':
        result = await service.generateStoryOutline(context, options)
        break

      case 'story_content':
        result = await service.generateStory(context, body.outline, options)
        break

      case 'story_revision':
        if (!body.originalContent || !body.revisionInstructions) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Original content and revision instructions are required for revisions',
            },
            { status: 400 }
          )
        }
        result = await service.reviseStory(
          context,
          body.originalContent,
          body.revisionInstructions,
          body.improvementAreas || [],
          options
        )
        break

      case 'page_content':
        // For individual page content, use story generation with page context
        result = await service.generateStory(context, body.outline, options)
        break

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid content type' },
          { status: 400 }
        )
    }

    // Format response
    const response: TextGenerationResponse = {
      success: true,
      result: {
        content: result.content,
        contentType: body.contentType,
        qualityScore: result.qualityScore,
        usage: result.usage,
        metadata: {
          provider: result.metadata.provider,
          model: result.metadata.model,
          generatedAt: result.metadata.generatedAt.toISOString(),
          processingTimeMs: result.metadata.processingTimeMs,
          safetyCheckPassed: result.metadata.safetyCheckPassed,
          attemptCount: result.metadata.attemptCount,
          fallbackUsed: result.metadata.fallbackUsed,
          contentId: result.contentId,
        },
        qualityValidation: result.qualityValidation
          ? {
              passesThreshold: result.qualityValidation.passesThreshold,
              overallScore: result.qualityValidation.qualityScore.overall,
              feedback: result.qualityValidation.feedback,
              recommendations: result.qualityValidation.recommendations,
            }
          : undefined,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Text generation error:', error)

    // Handle specific error types
    if (error instanceof QualityValidationError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Content quality validation failed',
          details: error.message,
        },
        { status: 422 }
      )
    }

    if (error instanceof RateLimitError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          details: error.message,
        },
        { status: 429 }
      )
    }

    if (error instanceof AIServiceError) {
      if (error.code === 'CONTENT_SAFETY_VIOLATION') {
        return NextResponse.json(
          {
            success: false,
            error: 'Content safety violation',
            details: error.message,
          },
          { status: 400 }
        )
      }

      if (error.code === 'AUTHENTICATION_ERROR') {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication failed',
            details: 'Invalid API key',
          },
          { status: 401 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: 'AI service error',
          details: error.message,
        },
        { status: 500 }
      )
    }

    // Generic error handling
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

export async function GET(): Promise<NextResponse> {
  try {
    // Health check endpoint
    const service = getTextService()
    const healthCheck = await service.performHealthCheck()

    return NextResponse.json({
      status: 'healthy',
      service: 'text-generation',
      timestamp: new Date().toISOString(),
      healthCheck,
      capabilities: {
        contentTypes: [
          'story_outline',
          'story_content',
          'story_revision',
          'page_content',
        ],
        features: [
          'quality_validation',
          'content_safety',
          'retry_logic',
          'usage_tracking',
          'personalization',
        ],
      },
    })
  } catch (error) {
    console.error('Text generation health check error:', error)
    return NextResponse.json(
      {
        status: 'unhealthy',
        service: 'text-generation',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
