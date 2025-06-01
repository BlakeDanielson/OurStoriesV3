# AI Image Generation Service

A comprehensive, production-ready image generation service built using Test-Driven Development (TDD) methodology. This service provides a unified interface for multiple AI image generation providers with automatic failover, rate limiting, and cost optimization.

## Features

- **Multi-Provider Support**: Integrates with Replicate and RunPod APIs
- **Automatic Failover**: Seamless switching between providers when one fails
- **Rate Limiting**: Respects provider rate limits with intelligent queuing
- **Cost Optimization**: Automatic provider selection based on request type
- **Prompt Enhancement**: Automatic style modifiers and quality enhancers
- **Performance Monitoring**: Comprehensive metrics and health tracking
- **Type Safety**: Full TypeScript support with comprehensive type definitions

## Available Models

### FLUX.1 Schnell (Primary for Photorealistic)

- **Provider**: Replicate
- **Model ID**: `black-forest-labs/flux-schnell`
- **Cost**: ~$0.035 per 1024x1024 image
- **Best for**: Photorealistic portraits, high-quality character images

### FLUX Kontext Pro (Image Editing)

- **Provider**: Replicate
- **Model ID**: `black-forest-labs/flux-kontext-pro`
- **Cost**: ~$0.06 per image
- **Best for**: Text-based image editing, style transfer, object modification

### Google Imagen 4 (Premium Quality)

- **Provider**: Replicate
- **Model ID**: `google/imagen-4`
- **Cost**: ~$0.08 per image
- **Best for**: High-quality generation, fine detail rendering, typography

### MiniMax Image-01 (Character Reference)

- **Provider**: Replicate
- **Model ID**: `minimax/image-01`
- **Cost**: ~$0.05 per image
- **Best for**: Character consistency, reference-based generation

### FLUX 1.1 Pro Ultra (Ultra High-Resolution)

- **Provider**: Replicate
- **Model ID**: `black-forest-labs/flux-1.1-pro-ultra`
- **Cost**: ~$0.06 per image
- **Best for**: Ultra high-resolution images (up to 4MP), professional quality

## Quick Start

```typescript
import { ImageGenerationService } from './lib/ai/image-generation'
import { ProviderConfig } from './lib/ai/types/image-generation'

// Configure providers
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
    apiKey: process.env.RUNPOD_API_KEY!,
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

// Initialize service
const imageService = new ImageGenerationService(config)

// Generate an image
const request = {
  prompt: 'A happy child reading a book in a cozy library',
  model: 'flux1' as const,
  width: 1024,
  height: 1024,
  style: 'watercolor' as const,
  qualityEnhancers: ['high_detail', 'professional_lighting'] as const,
}

// With automatic failover
const result = await imageService.generateImageWithFailover(request)
console.log('Generated image:', result.imageUrl)
```

## API Reference

### ImageGenerationService

#### Constructor

```typescript
constructor(config: ProviderConfig)
```

#### Methods

##### `generateImage(request, provider)`

Generate an image using a specific provider.

```typescript
async generateImage(
  request: ImageGenerationRequest,
  provider: ImageGenerationProvider
): Promise<ImageGenerationResponse>
```

##### `generateImageWithFailover(request)`

Generate an image with automatic provider failover.

```typescript
async generateImageWithFailover(
  request: ImageGenerationRequest
): Promise<ImageGenerationResponse>
```

##### `testConnection(provider)`

Test connectivity to a specific provider.

```typescript
async testConnection(provider: ImageGenerationProvider): Promise<boolean>
```

##### `selectOptimalProvider(request)`

Select the best provider for a given request.

```typescript
selectOptimalProvider(request: ImageGenerationRequest): ImageGenerationProvider
```

##### `calculateGenerationCost(response)`

Calculate the cost of a generation.

```typescript
calculateGenerationCost(response: ImageGenerationResponse): number
```

##### `getMetrics()`

Get service performance metrics.

```typescript
getMetrics(): GenerationMetrics
```

### Types

#### ImageGenerationRequest

```typescript
interface ImageGenerationRequest {
  prompt: string
  model:
    | 'flux1'
    | 'flux-kontext-pro'
    | 'imagen-4'
    | 'minimax-image-01'
    | 'flux-1.1-pro-ultra'
  width: number
  height: number
  style?:
    | 'watercolor'
    | 'oil_painting'
    | 'digital_art'
    | 'cartoon'
    | 'realistic'
    | 'sketch'
    | 'anime'
  negativePrompt?: string
  qualityEnhancers?: (
    | 'high_detail'
    | 'professional_lighting'
    | 'sharp_focus'
    | 'vibrant_colors'
    | 'cinematic'
  )[]
  seed?: number
  steps?: number
  guidanceScale?: number
  loraWeights?: Record<string, number>
}
```

#### ImageGenerationResponse

```typescript
interface ImageGenerationResponse {
  id: string
  status: 'starting' | 'processing' | 'succeeded' | 'failed' | 'cancelled'
  imageUrl?: string
  provider: 'replicate' | 'runpod' | 'modal'
  model:
    | 'flux1'
    | 'flux-kontext-pro'
    | 'imagen-4'
    | 'minimax-image-01'
    | 'flux-1.1-pro-ultra'
  generationTime?: number
  error?: string
  metadata: ImageGenerationMetadata
  cost?: number
}
```

## Configuration

### Environment Variables

Set the following environment variables:

```bash
# Required API Keys
REPLICATE_API_KEY=your_replicate_api_key
RUNPOD_API_KEY=your_runpod_api_key

# Optional
MODAL_API_KEY=your_modal_api_key
```

### Provider Configuration

```typescript
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
    rateLimit: {
      requestsPerMinute: 60,
      concurrent: 5,
    },
  },
  runpod: {
    apiKey: process.env.RUNPOD_API_KEY!,
    baseUrl: 'https://api.runpod.ai/v2',
    models: {
      flux1: 'flux-1-schnell',
      'flux-kontext-pro': 'flux-kontext-pro',
      'imagen-4': 'imagen-4',
      'minimax-image-01': 'minimax-image-01',
      'flux-1.1-pro-ultra': 'flux-1.1-pro-ultra',
    },
    rateLimit: {
      requestsPerMinute: 100,
      concurrent: 10,
    },
  },
}
```

## Usage Examples

### Basic Image Generation

```typescript
const request = {
  prompt: 'A magical forest with glowing mushrooms',
  model: 'flux1' as const,
  width: 1024,
  height: 1024,
}

const result = await imageService.generateImage(request, 'replicate')
```

### With Style and Quality Enhancers

```typescript
const request = {
  prompt: 'Portrait of a wise old wizard',
  model: 'flux1' as const,
  width: 1024,
  height: 1024,
  style: 'oil_painting',
  qualityEnhancers: ['high_detail', 'professional_lighting', 'cinematic'],
  negativePrompt: 'blurry, low quality, distorted',
}

const result = await imageService.generateImageWithFailover(request)
```

### Batch Processing

```typescript
const requests = [
  {
    prompt: 'A sunny beach',
    model: 'flux1' as const,
    width: 1024,
    height: 1024,
  },
  {
    prompt: 'A snowy mountain',
    model: 'flux-kontext-pro' as const,
    width: 1024,
    height: 1024,
  },
  {
    prompt: 'A bustling city',
    model: 'imagen-4' as const,
    width: 1024,
    height: 1024,
  },
]

const results = await Promise.all(
  requests.map(req => imageService.generateImageWithFailover(req))
)
```

### Cost Optimization

```typescript
// The service automatically selects the optimal provider
const highQualityRequest = {
  prompt: 'Photorealistic portrait',
  model: 'flux1' as const,
  qualityEnhancers: ['high_detail'],
  width: 1024,
  height: 1024,
}

// Will use Replicate for quality
const provider = imageService.selectOptimalProvider(highQualityRequest)
console.log('Selected provider:', provider) // 'replicate'

const standardRequest = {
  prompt: 'Simple illustration',
  model: 'flux1' as const,
  width: 1024,
  height: 1024,
}

// Will use RunPod for cost savings
const provider2 = imageService.selectOptimalProvider(standardRequest)
console.log('Selected provider:', provider2) // 'runpod'
```

## Performance Metrics

The service tracks comprehensive metrics:

```typescript
const metrics = imageService.getMetrics()
console.log({
  totalRequests: metrics.totalRequests,
  successRate: metrics.successfulRequests / metrics.totalRequests,
  averageGenerationTime: metrics.averageGenerationTime,
  totalCost: metrics.totalCost,
  providerUsage: metrics.providerUsage,
})
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await imageService.generateImageWithFailover(request)
  console.log('Success:', result.imageUrl)
} catch (error) {
  if (error.message.includes('All providers failed')) {
    console.error('All providers are currently unavailable')
  } else if (error.message.includes('Authentication failed')) {
    console.error('Check your API keys')
  } else if (error.message.includes('Content policy violation')) {
    console.error('Prompt violates content policy')
  } else {
    console.error('Unexpected error:', error.message)
  }
}
```

## Testing

The service includes comprehensive test coverage:

```bash
# Run tests
npm test lib/ai/__tests__/image-generation.test.ts

# Run with coverage
npm test -- --coverage lib/ai/__tests__/image-generation.test.ts
```

## Performance Targets

The service is designed to meet these performance targets:

- **Latency**: <30 seconds per generation
- **Cost**: <$0.05 per image
- **Uptime**: >99.5%
- **Character Consistency**: >85% (when using LoRA models)

## Integration with Next.js

### API Route Example

```typescript
// app/api/generate-image/route.ts
import { ImageGenerationService } from '@/lib/ai/image-generation'
import { NextRequest, NextResponse } from 'next/server'

const imageService = new ImageGenerationService(config)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const result = await imageService.generateImageWithFailover({
      prompt: body.prompt,
      model: body.model || 'flux1',
      width: body.width || 1024,
      height: body.height || 1024,
      style: body.style,
      qualityEnhancers: body.qualityEnhancers,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### React Hook Example

```typescript
// hooks/useImageGeneration.ts
import { useState } from 'react'
import {
  ImageGenerationRequest,
  ImageGenerationResponse,
} from '@/lib/ai/types/image-generation'

export function useImageGeneration() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateImage = async (
    request: ImageGenerationRequest
  ): Promise<ImageGenerationResponse | null> => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const result = await response.json()
      return result
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      return null
    } finally {
      setLoading(false)
    }
  }

  return { generateImage, loading, error }
}
```

## Roadmap

Future enhancements planned:

1. **LoRA Training Pipeline** (Task 10.2)
2. **Character Consistency System** (Task 10.4)
3. **Image Upscaling Integration** (Task 10.6)
4. **Advanced Quality Control** (Task 10.7)
5. **Safety Filtering** (Task 10.8)

## Contributing

This service was built using Test-Driven Development. When contributing:

1. Write tests first
2. Implement functionality to make tests pass
3. Refactor for optimization
4. Ensure all tests pass
5. Update documentation

## License

Part of the ourStories project.
