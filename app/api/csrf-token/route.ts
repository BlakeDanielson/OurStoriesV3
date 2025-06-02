import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFTokenForClient } from '@/lib/csrf/middleware'

export async function GET(request: NextRequest) {
  try {
    // Generate CSRF token for the client
    const { token, response } = await generateCSRFTokenForClient(request)

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to generate CSRF token' },
        { status: 500 }
      )
    }

    // Return the token in the response body and headers
    const jsonResponse = NextResponse.json({
      csrfToken: token,
      message: 'CSRF token generated successfully',
    })

    // Copy cookies from the generated response
    const cookies = response.cookies.getAll()
    cookies.forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    // Add token to header as well
    jsonResponse.headers.set('X-CSRF-Token', token)

    return jsonResponse
  } catch (error) {
    console.error('Error generating CSRF token:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
