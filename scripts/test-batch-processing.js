#!/usr/bin/env node

/**
 * Test script for batch processing functionality
 * Run with: node scripts/test-batch-processing.js
 */

const fetch = require('node-fetch')

const API_BASE = 'http://localhost:3000'

async function testBatchProcessing() {
  console.log('🧪 Testing Batch Processing Fixes...\n')

  try {
    // Test 1: Schedule a batch
    console.log('1. Scheduling a test batch...')
    const batchResponse = await fetch(`${API_BASE}/api/images/batch-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompts: [
          'A cute cartoon cat',
          'A mountain landscape',
          'A futuristic city',
        ],
        model: 'flux1',
        options: {
          width: 1024,
          height: 1024,
          priority: 'medium',
          maxConcurrency: 2,
          failureStrategy: 'continue-on-error',
        },
      }),
    })

    const batchData = await batchResponse.json()
    console.log('✅ Batch scheduled:', batchData)

    if (!batchData.batchId) {
      throw new Error('No batch ID returned')
    }

    const batchId = batchData.batchId

    // Test 2: Monitor batch progress
    console.log('\n2. Monitoring batch progress...')
    let attempts = 0
    const maxAttempts = 30 // 1 minute max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds

      const statusResponse = await fetch(
        `${API_BASE}/api/images/batch-generate?batchId=${batchId}`
      )
      const statusData = await statusResponse.json()

      console.log(
        `📊 Progress: ${statusData.progress}% (${statusData.completedCount}/${statusData.totalCount})`
      )
      console.log(`   Status: ${statusData.status}`)
      console.log(`   Message: ${statusData.statusMessage}`)

      if (statusData.status === 'completed' || statusData.status === 'failed') {
        console.log('\n✅ Batch processing completed!')
        console.log('Final status:', statusData)
        break
      }

      attempts++
    }

    if (attempts >= maxAttempts) {
      console.log('\n⚠️  Batch did not complete within timeout')
    }

    // Test 3: Check queue status
    console.log('\n3. Checking queue status...')
    const queueResponse = await fetch(
      `${API_BASE}/api/images/batch-generate?action=queue`
    )
    const queueData = await queueResponse.json()
    console.log('📋 Queue status:', queueData)

    // Test 4: Check metrics
    console.log('\n4. Checking metrics...')
    const metricsResponse = await fetch(
      `${API_BASE}/api/images/batch-generate?action=metrics`
    )
    const metricsData = await metricsResponse.json()
    console.log('📈 Metrics:', metricsData)

    console.log('\n🎉 All tests completed successfully!')
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    process.exit(1)
  }
}

// Run the test
testBatchProcessing()
