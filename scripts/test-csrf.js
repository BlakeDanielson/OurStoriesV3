#!/usr/bin/env node

const BASE_URL = 'http://localhost:3001'

async function testCSRFProtection() {
  console.log('🛡️  Testing CSRF Protection System\n')

  try {
    // Test 1: Get CSRF token
    console.log('1️⃣  Getting CSRF token...')
    const tokenResponse = await fetch(`${BASE_URL}/api/csrf-token`, {
      method: 'GET',
      credentials: 'include',
    })

    if (!tokenResponse.ok) {
      throw new Error(`Failed to get CSRF token: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    const csrfToken = tokenData.csrfToken
    const cookies = tokenResponse.headers.get('set-cookie')

    console.log(`✅ CSRF token received: ${csrfToken.substring(0, 20)}...`)
    console.log(`✅ Cookie set: ${cookies ? 'Yes' : 'No'}`)

    // Test 2: POST without CSRF token (should fail)
    console.log('\n2️⃣  Testing POST without CSRF token (should fail)...')
    const noTokenResponse = await fetch(`${BASE_URL}/api/test-csrf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'no-token' }),
    })

    console.log(`Status: ${noTokenResponse.status}`)
    const noTokenResult = await noTokenResponse.json()
    console.log(`Response: ${JSON.stringify(noTokenResult, null, 2)}`)

    if (noTokenResponse.status === 403) {
      console.log('✅ CSRF protection working - request blocked')
    } else {
      console.log('❌ CSRF protection NOT working - request allowed')
    }

    // Test 3: POST with CSRF token in header (should succeed)
    console.log(
      '\n3️⃣  Testing POST with CSRF token in header (should succeed)...'
    )
    const withTokenResponse = await fetch(`${BASE_URL}/api/test-csrf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrfToken,
        Cookie: cookies || '',
      },
      body: JSON.stringify({ test: 'with-token' }),
    })

    console.log(`Status: ${withTokenResponse.status}`)
    const withTokenResult = await withTokenResponse.json()
    console.log(`Response: ${JSON.stringify(withTokenResult, null, 2)}`)

    if (withTokenResponse.status === 200) {
      console.log('✅ CSRF token validation working - request allowed')
    } else {
      console.log('❌ CSRF token validation NOT working - request blocked')
    }

    // Test 4: POST with CSRF token in body (should succeed)
    console.log(
      '\n4️⃣  Testing POST with CSRF token in body (should succeed)...'
    )
    const bodyTokenResponse = await fetch(`${BASE_URL}/api/test-csrf`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookies || '',
      },
      body: JSON.stringify({ test: 'body-token', _csrf: csrfToken }),
    })

    console.log(`Status: ${bodyTokenResponse.status}`)
    const bodyTokenResult = await bodyTokenResponse.json()
    console.log(`Response: ${JSON.stringify(bodyTokenResult, null, 2)}`)

    if (bodyTokenResponse.status === 200) {
      console.log('✅ CSRF token in body working - request allowed')
    } else {
      console.log('❌ CSRF token in body NOT working - request blocked')
    }

    // Test 5: GET request (should always succeed)
    console.log('\n5️⃣  Testing GET request (should always succeed)...')
    const getResponse = await fetch(`${BASE_URL}/api/test-csrf`, {
      method: 'GET',
    })

    console.log(`Status: ${getResponse.status}`)
    const getResult = await getResponse.json()
    console.log(`Response: ${JSON.stringify(getResult, null, 2)}`)

    if (getResponse.status === 200) {
      console.log('✅ GET request working - no CSRF protection needed')
    } else {
      console.log('❌ GET request failed unexpectedly')
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testCSRFProtection()
