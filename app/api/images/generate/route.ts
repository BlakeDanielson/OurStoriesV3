import { NextRequest, NextResponse } from 'next/server'
import { ImageGenerationService } from '@/lib/ai/image-generation'
import { ProviderConfig } from '@/lib/ai/types/image-generation'

// Configure the image generation service
const config: ProviderConfig = {
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY!,
    baseUrl: 'https://api.replicate.com/v1',
    models: {
      flux1: 'black-forest-labs/flux-schnell',
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
    const body = await request.json()

    // Validate required fields
    if (!body.prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }

    // Test connection first
    const isConnected = await imageService.testConnection('replicate')
    if (!isConnected) {
      return NextResponse.json(
        { error: 'Failed to connect to Replicate API. Check your API key.' },
        { status: 500 }
      )
    }

    // Generate image
    const result = await imageService.generateImage(
      {
        prompt: body.prompt,
        model: body.model || 'flux1', // Default to FLUX.1 Schnell for speed
        width: body.width || 1024,
        height: body.height || 1024,
        style: body.style,
        qualityEnhancers: body.qualityEnhancers,
        negativePrompt: body.negativePrompt,
        seed: body.seed,
        steps: body.steps,
        guidanceScale: body.guidanceScale,
      },
      'replicate'
    )

    return NextResponse.json({
      success: true,
      result,
      cost: imageService.calculateGenerationCost(result),
    })
  } catch (error) {
    console.error('Image generation error:', error)

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
      { error: 'Unknown error occurred' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    console.log('🔍 Testing Replicate connection...')
    console.log('🔑 API Key present:', !!process.env.REPLICATE_API_KEY)
    console.log(
      '🔑 API Key prefix:',
      process.env.REPLICATE_API_KEY?.substring(0, 8) + '...'
    )

    // Test connection endpoint
    const isConnected = await imageService.testConnection('replicate')
    console.log('✅ Connection test result:', isConnected)

    const response = {
      connected: isConnected,
      models: config.replicate.models,
      rateLimit: config.replicate.rateLimit,
    }

    console.log('📤 Sending response:', response)

    return NextResponse.json(response)
  } catch (error) {
    console.error('❌ Connection test error:', error)
    return NextResponse.json(
      {
        error: 'Failed to test connection',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
