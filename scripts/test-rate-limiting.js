#!/usr/bin/env node

/**
 * Rate Limiting Test Script
 *
 * This script tests the rate limiting functionality by making multiple
 * requests to different API endpoints and checking the responses.
 */

const BASE_URL = process.env.TEST_URL || 'http://localhost:3001'

// Test configuration
const TESTS = [
  {
    name: 'Simple Test API Rate Limiting',
    endpoint: '/api/simple-test',
    method: 'GET',
    params: '',
    expectedLimit: 100, // 100 requests per 15 minutes for general API
    testCount: 10, // Test within the limit
  },
  {
    name: 'Rate Limited API Test',
    endpoint: '/api/test-rate-limit',
    method: 'GET',
    params: '',
    expectedLimit: 100, // 100 requests per 15 minutes for general API
    testCount: 15, // Test within the limit
  },
]

async function makeRequest(url, method = 'GET') {
  try {
    const response = await fetch(url, { method })

    return {
      status: response.status,
      headers: {
        'x-ratelimit-limit': response.headers.get('x-ratelimit-limit'),
        'x-ratelimit-remaining': response.headers.get('x-ratelimit-remaining'),
        'x-ratelimit-reset': response.headers.get('x-ratelimit-reset'),
        'x-ratelimit-window': response.headers.get('x-ratelimit-window'),
      },
      body: response.status === 429 ? await response.json() : null,
    }
  } catch (error) {
    return {
      status: 'ERROR',
      error: error.message,
    }
  }
}

async function testRateLimit(test) {
  console.log(`\n🧪 Testing: ${test.name}`)
  console.log(`📍 Endpoint: ${test.method} ${test.endpoint}${test.params}`)
  console.log(`🎯 Expected Limit: ${test.expectedLimit} requests`)
  console.log(`🔄 Making ${test.testCount} requests...\n`)

  const url = `${BASE_URL}${test.endpoint}${test.params}`
  const results = []

  for (let i = 1; i <= test.testCount; i++) {
    const result = await makeRequest(url, test.method)
    results.push(result)

    const remaining = result.headers['x-ratelimit-remaining']
    const limit = result.headers['x-ratelimit-limit']

    if (result.status === 429) {
      console.log(`❌ Request ${i}: RATE LIMITED (429)`)
      console.log(
        `   Message: ${result.body?.message || 'Rate limit exceeded'}`
      )
      console.log(`   Retry After: ${result.body?.retryAfter || 'N/A'} seconds`)
      break
    } else if (result.status === 'ERROR') {
      console.log(`💥 Request ${i}: ERROR - ${result.error}`)
      break
    } else {
      console.log(
        `✅ Request ${i}: ${result.status} (Remaining: ${remaining}/${limit})`
      )
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

async function runTests() {
  console.log('🚀 Starting Rate Limiting Tests')
  console.log(`🌐 Base URL: ${BASE_URL}`)
  console.log('='.repeat(60))

  for (const test of TESTS) {
    await testRateLimit(test)

    // Wait a bit between different test suites
    console.log('\n⏳ Waiting 2 seconds before next test...')
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n✨ Rate limiting tests completed!')
  console.log('\n📊 Summary:')
  console.log('- Check that rate limit headers are present in responses')
  console.log('- Verify that 429 status is returned when limits are exceeded')
  console.log('- Confirm that different endpoints have different limits')
  console.log('- Monitor server logs for rate limit violation warnings')
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { runTests, testRateLimit, makeRequest }
