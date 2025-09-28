import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../lib/auth-config'

// Simple test endpoint to check if API is working
export async function GET(request: NextRequest) {
  try {
    console.log('Simple test API called')
    
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      session: session ? {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name,
        userRole: session.user.role
      } : null,
      success: true
    })
    
  } catch (error) {
    console.error('Simple test API error:', error)
    return NextResponse.json({
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}

import { authOptions } from '../../../lib/auth-config'

// Simple test endpoint to check if API is working
export async function GET(request: NextRequest) {
  try {
    console.log('Simple test API called')
    
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      message: 'API is working!',
      timestamp: new Date().toISOString(),
      session: session ? {
        userId: session.user.id,
        userEmail: session.user.email,
        userName: session.user.name,
        userRole: session.user.role
      } : null,
      success: true
    })
    
  } catch (error) {
    console.error('Simple test API error:', error)
    return NextResponse.json({
      error: 'Test API failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      success: false
    }, { status: 500 })
  }
}
