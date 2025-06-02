import { NextRequest, NextResponse } from 'next/server'
import { withCSRFProtection } from '@/lib/csrf/middleware'

async function postHandler(request: NextRequest) {
  try {
    const body = await request.json()

    return NextResponse.json({
      message: 'CSRF protection test successful!',
      timestamp: new Date().toISOString(),
      receivedData: body,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to parse request body' },
      { status: 400 }
    )
  }
}

export const POST = withCSRFProtection(postHandler)

export async function GET() {
  return NextResponse.json({
    message: 'GET requests do not require CSRF protection',
    timestamp: new Date().toISOString(),
  })
}
