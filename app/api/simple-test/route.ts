import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Simple test successful!',
    timestamp: new Date().toISOString(),
  })
}
