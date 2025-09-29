import { NextRequest, NextResponse } from 'next/server'

// Simple health check endpoint
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'false'
    },
    message: 'API is working correctly'
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    status: 'POST OK',
    timestamp: new Date().toISOString(),
    message: 'POST request working'
  })
}
