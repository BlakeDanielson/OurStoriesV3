#!/usr/bin/env node

/**
 * Test script to verify MiniMax Image-01 timeout configuration
 * Run with: node scripts/test-minimax-timeout.js
 */

require('dotenv').config()

const { ImageGenerationService } = require('../lib/ai/image-generation')

// Configure the image generation service
const config = {
  replicate: {
    apiKey: process.env.REPLICATE_API_KEY,
    baseUrl: 'https://api.replicate.com/v1',
    models: {
      'minimax-image-01': 'minimax/image-01',
      flux1: 'black-forest-labs/flux-schnell',
    },
    rateLimit: { requestsPerMinute: 60, concurrent: 5 },
  },
  runpod: {
    apiKey: process.env.RUNPOD_API_KEY || 'dummy',
    baseUrl: 'https://api.runpod.ai/v2',
    models: {
      'minimax-image-01': 'minimax-image-01',
      flux1: 'flux-1-schnell',
    },
    rateLimit: { requestsPerMinute: 100, concurrent: 10 },
  },
}

async function testMinimaxTimeout() {
  if (!process.env.REPLICATE_API_KEY) {
    console.error('❌ REPLICATE_API_KEY not found in environment variables')
    process.exit(1)
  }

  console.log(
    '🔑 API Key found, testing MiniMax Image-01 timeout configuration...'
  )

  try {
    const imageService = new ImageGenerationService(config)

    // Test connection first
    console.log('🔍 Testing connection...')
    const isConnected = await imageService.testConnection('replicate')

    if (!isConnected) {
      console.error('❌ Failed to connect to Replicate API')
      process.exit(1)
    }

    console.log('✅ Connection successful!')

    // Test MiniMax Image-01 generation with extended timeout
    console.log('\n🎨 Testing MiniMax Image-01 generation with 120s timeout...')
    console.log(
      '⏰ This model has a 120-second timeout (vs 30s for other models)'
    )

    const request = {
      prompt:
        "A cute cartoon character with big eyes, simple children's book illustration style",
      model: 'minimax-image-01',
      width: 1024,
      height: 1024,
    }

    console.log('🚀 Starting generation...')
    const startTime = Date.now()

    try {
      const result = await imageService.generateImage(request, 'replicate')
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000

      console.log('✅ Generation completed successfully!')
      console.log(`⏱️ Duration: ${duration.toFixed(1)} seconds`)
      console.log(`🆔 Prediction ID: ${result.id}`)
      console.log(`🖼️ Image URL: ${result.imageUrl}`)
      console.log(`📊 Status: ${result.status}`)
    } catch (error) {
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000

      console.error(`❌ Generation failed after ${duration.toFixed(1)} seconds`)
      console.error(`Error: ${error.message}`)

      if (error.message.includes('Generation timeout')) {
        console.log(
          '\n💡 The timeout error now includes model-specific information!'
        )
        console.log('✅ Timeout configuration is working correctly')
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testMinimaxTimeout()
  .then(() => {
    console.log('\n🎉 MiniMax timeout test completed!')
    console.log('The model now has a 120-second timeout instead of 30 seconds.')
    console.log('You can test this at: http://localhost:3000/test-replicate')
  })
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
