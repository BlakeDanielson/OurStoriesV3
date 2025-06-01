#!/usr/bin/env node

/**
 * Simple script to test Replicate API connectivity
 * Run with: node scripts/test-replicate.js
 */

require('dotenv').config()

async function testReplicateAPI() {
  const apiKey = process.env.REPLICATE_API_KEY

  if (!apiKey) {
    console.error('❌ REPLICATE_API_KEY not found in environment variables')
    console.log('Please add your Replicate API key to your .env file:')
    console.log('REPLICATE_API_KEY=r8_your_api_key_here')
    process.exit(1)
  }

  console.log('🔑 API Key found, testing connection...')

  try {
    // Test connection by making a simple API call
    const response = await fetch('https://api.replicate.com/v1/models', {
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 401) {
        console.error('❌ Authentication failed - Invalid API key')
        return false
      }
      console.error(`❌ API request failed with status: ${response.status}`)
      return false
    }

    const data = await response.json()
    console.log('✅ Connection successful!')
    console.log(`📊 Found ${data.results?.length || 0} available models`)

    // Test a simple image generation
    console.log('\n🎨 Testing image generation with FLUX.1 Schnell...')

    const generateResponse = await fetch(
      'https://api.replicate.com/v1/predictions',
      {
        method: 'POST',
        headers: {
          Authorization: `Token ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version:
            'black-forest-labs/flux-schnell:bf2f2e683d03a9549f484a37a0df1581072b17c0b0db49c9b4a4f51e42eba55f',
          input: {
            prompt: 'A simple test image of a cute cat',
            width: 512,
            height: 512,
            num_inference_steps: 4,
          },
        }),
      }
    )

    if (!generateResponse.ok) {
      console.error(
        `❌ Image generation failed with status: ${generateResponse.status}`
      )
      const errorData = await generateResponse.json()
      console.error('Error details:', errorData)
      return false
    }

    const prediction = await generateResponse.json()
    console.log('✅ Image generation started successfully!')
    console.log(`🆔 Prediction ID: ${prediction.id}`)
    console.log(`📊 Status: ${prediction.status}`)

    if (
      prediction.status === 'starting' ||
      prediction.status === 'processing'
    ) {
      console.log(
        '⏳ Image is being generated... (this may take 10-30 seconds)'
      )
      console.log(
        `🔗 You can check status at: https://replicate.com/p/${prediction.id}`
      )
    }

    return true
  } catch (error) {
    console.error('❌ Network error:', error.message)
    return false
  }
}

// Run the test
testReplicateAPI()
  .then(success => {
    if (success) {
      console.log('\n🎉 Replicate API is working correctly!')
      console.log(
        'You can now use the web interface at: http://localhost:3000/test-replicate'
      )
    } else {
      console.log('\n💡 Please check your API key and try again.')
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error)
    process.exit(1)
  })
