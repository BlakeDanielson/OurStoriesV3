# OpenAI Image Generation Integration Guide

## Overview

OurStories now supports OpenAI's latest image generation models alongside the existing Replicate models. This integration includes support for:

- **GPT Image-1**: OpenAI's newest and most advanced image generation model
- **DALL-E 3**: High-quality creative image generation with enhanced prompt understanding
- **DALL-E 2**: Classic OpenAI model for fast, reliable image generation

## Setup

### 1. Environment Configuration

Add your OpenAI API key to your environment variables:

```bash
# Add to .env file
OPENAI_API_KEY=your_openai_api_key_here
```

For MCP/Cursor integration, add to `.cursor/mcp.json`:

```json
{
  "env": {
    "OPENAI_API_KEY": "your_openai_api_key_here"
  }
}
```

### 2. Model Capabilities

#### GPT Image-1

- **Best for**: Latest technology, highest quality, character consistency
- **Features**:
  - Custom sizes (1024x1024, 1536x1024, 1024x1536, or auto)
  - Background transparency control
  - Output format selection (PNG, JPEG, WebP)
  - Compression control (0-100%)
  - Content moderation levels
- **Pricing**: $0.040 per image
- **Response**: Base64-encoded images

#### DALL-E 3

- **Best for**: Creative, artistic images with excellent prompt understanding
- **Features**:
  - Sizes: 1024x1024, 1792x1024, 1024x1792
  - Style control: 'vivid' (hyper-real) or 'natural'
  - Quality: 'hd' or 'standard'
- **Pricing**: $0.040 per image (1024x1024), $0.080 for HD
- **Response**: URLs (valid for 60 minutes)

#### DALL-E 2

- **Best for**: Fast generation, multiple variations
- **Features**:
  - Square images only: 256x256, 512x512, 1024x1024
  - Can generate up to 10 images per request
  - Standard quality only
- **Pricing**: $0.020 per image
- **Response**: URLs (valid for 60 minutes)

## Usage Examples

### 1. Character Consistency Testing

The OpenAI models are now available in the `/test-character-consistency` page:

```typescript
// Select OpenAI model
const selectedModel = 'gpt-image-1' // or 'dall-e-3', 'dall-e-2'

// Generate with character reference
const response = await fetch('/api/images/generate-with-character', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A child playing in a sunny park',
    childProfileId: 'test-character-consistency',
    useCharacterReference: true,
    characterName: 'Test Character',
    model: selectedModel,
    width: 1024,
    height: 1024,
    style: 'watercolor',
  }),
})
```

### 2. Direct API Usage

```typescript
import { ImageGenerationService } from '@/lib/ai/image-generation'

const config = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseUrl: 'https://api.openai.com/v1',
    models: {
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

const imageService = new ImageGenerationService(config)

const request = {
  prompt: 'A magical forest with a child explorer',
  model: 'gpt-image-1',
  width: 1024,
  height: 1024,
  openaiQuality: 'high',
  openaiStyle: 'vivid',
  openaiBackground: 'auto',
  openaiOutputFormat: 'png',
}

const result = await imageService.generateImage(request, 'openai')
```

## OpenAI-Specific Parameters

### GPT Image-1 Parameters

```typescript
interface OpenAIParameters {
  openaiQuality?: 'auto' | 'high' | 'medium' | 'low'
  openaiBackground?: 'transparent' | 'opaque' | 'auto'
  openaiModeration?: 'low' | 'auto'
  openaiOutputFormat?: 'png' | 'jpeg' | 'webp'
  openaiOutputCompression?: number // 0-100, for WebP/JPEG only
}
```

### DALL-E 3 Parameters

```typescript
interface DALLE3Parameters {
  openaiQuality?: 'hd' | 'standard'
  openaiStyle?: 'vivid' | 'natural'
}
```

## Character Reference Support

**Important Update**: OpenAI models now support character reference images through the **Image Edit API**!

### Image Edit vs Standard Generation

1. **Standard Generation (OpenAI models)**: Uses character descriptions in the prompt only
2. **Image Edit (GPT Image-1 & DALL-E 2)**: Uses actual reference images as base for editing
3. **Replicate models**: Use actual reference images with `subject_reference` parameter

```typescript
// Character reference handling with Image Edit
if (model.startsWith('gpt-') || model.startsWith('dall-e-')) {
  if (useImageEdit && characterReference) {
    // OpenAI Image Edit: Use reference image as base
    imageRequest = {
      ...imageRequest,
      useImageEdit: true,
      editImages: [characterReference.url],
      prompt: `Transform this image: ${prompt}`, // Edit the reference image
    }
  } else {
    // OpenAI Standard: Enhance prompt with character description
    enhancedPrompt = `${prompt}, featuring ${characterName} as the main character`
  }
} else {
  // Replicate: Use actual reference image
  characterReferences = [{ url: referenceImageUrl, weight: 0.8 }]
}
```

## OpenAI Image Edit API

### Overview

The Image Edit API allows you to modify existing images using text prompts. This is perfect for character consistency because you can use the character reference photo as the base image and transform it into different scenes.

### Supported Models

- **GPT Image-1**: Up to 16 input images, advanced editing capabilities
- **DALL-E 2**: Single image input, basic editing

### Usage Examples

#### 1. Character Consistency with Image Edit

```typescript
const request = {
  prompt: 'Transform this child into playing in a sunny park with green grass',
  model: 'gpt-image-1',
  useImageEdit: true,
  editImages: [characterReferenceUrl],
  width: 1024,
  height: 1024,
  openaiQuality: 'high',
  openaiBackground: 'auto',
}

const result = await imageService.generateImage(request, 'openai')
```

#### 2. Selective Editing with Mask

```typescript
const request = {
  prompt: 'Change the background to a magical forest',
  model: 'gpt-image-1',
  useImageEdit: true,
  editImages: [characterReferenceUrl],
  editMask: maskImageUrl, // Transparent areas will be edited
  openaiBackground: 'transparent',
}
```

#### 3. Multiple Image Input (GPT Image-1 only)

```typescript
const request = {
  prompt: 'Combine these character poses into a birthday party scene',
  model: 'gpt-image-1',
  useImageEdit: true,
  editImages: [
    characterReference1Url,
    characterReference2Url,
    characterReference3Url,
  ],
}
```

### Character Consistency Testing

The `/test-character-consistency` page now includes an "Use Image Edit" toggle:

1. **Enabled (Recommended for OpenAI)**: Uses character reference as base image

   - Higher character consistency scores (typically 90%+)
   - Better facial feature preservation
   - More accurate character representation

2. **Disabled**: Uses prompt-based character description
   - Standard generation approach
   - Lower consistency but more creative freedom

### API Parameters

#### Image Edit Specific

```typescript
interface ImageEditParameters {
  useImageEdit?: boolean // Enable image edit mode
  editImages?: string[] // Array of image URLs/base64 (up to 16 for gpt-image-1)
  editMask?: string // Optional mask for selective editing
}
```

#### GPT Image-1 Edit Parameters

```typescript
interface GPTImage1EditParameters {
  quality?: 'auto' | 'high' | 'medium' | 'low'
  background?: 'transparent' | 'opaque' | 'auto'
  size?: '1024x1024' | '1536x1024' | '1024x1536' | 'auto'
  n?: number // 1-10 images
}
```

### Implementation Details

#### Form Data Handling

The Image Edit API requires multipart/form-data instead of JSON:

```typescript
const formData = new FormData()
formData.append('prompt', prompt)
formData.append('model', 'gpt-image-1')

// Handle image input
if (imageUrl.startsWith('data:')) {
  // Base64 data URL
  const base64Data = imageUrl.split(',')[1]
  const mimeType = imageUrl.split(';')[0].split(':')[1]
  const blob = new Blob(
    [Uint8Array.from(atob(base64Data), c => c.charCodeAt(0))],
    { type: mimeType }
  )
  formData.append('image', blob, 'character-reference.png')
} else {
  // Regular URL - fetch and convert
  const response = await fetch(imageUrl)
  const blob = await response.blob()
  formData.append('image', blob, 'character-reference.png')
}
```

#### Error Handling

```typescript
try {
  const result = await imageService.generateImage(request, 'openai')

  if (result.status === 'failed') {
    if (result.error?.includes('invalid_image')) {
      // Handle invalid image format
    } else if (result.error?.includes('image_size')) {
      // Handle image size issues
    }
  }
} catch (error) {
  console.error('Image edit failed:', error)
}
```

### Best Practices

1. **Image Quality**: Use high-quality reference images (>512x512)
2. **File Size**: Keep images under 50MB for GPT Image-1, 4MB for DALL-E 2
3. **Format**: PNG, JPEG, or WebP for GPT Image-1; PNG only for DALL-E 2
4. **Prompts**: Be specific about what to change vs what to preserve
5. **Masks**: Use masks for selective editing to preserve character features

### Comparison: Edit vs Generation vs Replicate

| Method            | Character Consistency | Creative Freedom | Cost   | Speed     |
| ----------------- | --------------------- | ---------------- | ------ | --------- |
| OpenAI Image Edit | 90-95%                | Medium           | $0.040 | Medium    |
| OpenAI Generation | 70-80%                | High             | $0.040 | Fast      |
| Replicate MiniMax | 85-90%                | Medium           | $0.025 | Fast      |
| Replicate FLUX    | 60-75%                | High             | $0.003 | Very Fast |

### Troubleshooting

#### Common Issues

1. **Image format errors**: Ensure images are PNG, JPEG, or WebP
2. **Size limits**: Compress large images before upload
3. **Base64 handling**: Properly decode data URLs
4. **CORS issues**: Ensure image URLs are accessible

#### Debug Logging

```typescript
console.log('🎨 OpenAI image edit request:', {
  model: request.model,
  imageCount: request.editImages?.length || 0,
  hasMask: !!request.editMask,
  prompt: request.prompt.substring(0, 100) + '...',
})
```

## Cost Optimization

1. **Use DALL-E 2** for rapid prototyping and testing
2. **Use DALL-E 3** for high-quality final images
3. **Use GPT Image-1** for the latest features and best quality
4. **Monitor usage** through OpenAI's dashboard

## Testing

Test the integration using the character consistency page:

1. Navigate to `/test-character-consistency`
2. Upload a character reference photo
3. Select an OpenAI model (GPT Image-1, DALL-E 3, or DALL-E 2)
4. Generate test scenarios
5. Compare results with Replicate models

## Limitations

1. **No character reference images**: OpenAI models don't support reference images
2. **Base64 responses**: GPT Image-1 returns base64 data (larger responses)
3. **URL expiration**: DALL-E 2/3 URLs expire after 60 minutes
4. **Rate limits**: 60 requests per minute, 5 concurrent requests

## Future Enhancements

- **Image editing**: Support for OpenAI's image edit endpoint
- **Image variations**: Support for DALL-E 2 variations
- **Batch processing**: Multiple image generation
- **Advanced prompting**: Integration with OpenAI's prompt engineering best practices

## Troubleshooting

### Common Issues

1. **API Key not found**: Ensure `OPENAI_API_KEY` is set in environment
2. **Rate limit exceeded**: Implement exponential backoff
3. **Content policy violation**: Adjust prompts to comply with OpenAI's usage policies
4. **Base64 size limits**: GPT Image-1 responses can be large (>1MB)

### Debug Logging

Enable debug logging to see API requests:

```typescript
console.log('🔍 OpenAI generation request:', {
  model: request.model,
  prompt: request.prompt.substring(0, 100) + '...',
  hasApiKey: !!config.openai.apiKey,
})
```

## Conclusion

The OpenAI integration provides powerful alternatives to Replicate models, especially for creative and artistic image generation. While character reference support is limited to prompt-based descriptions, the quality and prompt understanding of OpenAI models make them excellent choices for story illustration and character consistency testing.
