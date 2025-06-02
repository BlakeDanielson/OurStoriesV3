import { NextRequest, NextResponse } from 'next/server'
import { createRateLimitedApiRoute } from '@/lib/rate-limiting/api-wrapper'

async function handleGET(request: NextRequest) {
  return NextResponse.json({
    message: 'Rate limiting test successful!',
    timestamp: new Date().toISOString(),
    path: request.nextUrl.pathname,
  })
}

// Apply rate limiting to the GET endpoint
export const GET = createRateLimitedApiRoute(handleGET)
