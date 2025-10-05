import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { UserAPIKeyServer } from '@/lib/user-api-key-server'
import { getUserIdFromSession } from '@/lib/get-or-create-user'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get or create user ID
    const userId = await getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to get user ID' },
        { status: 500 }
      )
    }

    const apiKeys = await UserAPIKeyServer.getUserAPIKeys(userId)

    return NextResponse.json({
      success: true,
      data: apiKeys
    })

  } catch (error) {
    console.error('Error fetching API keys:', error)
    return NextResponse.json(
      { error: 'Không thể tải danh sách API keys' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { provider, api_key, api_key_name } = body

    if (!provider || !api_key) {
      return NextResponse.json(
        { error: 'Provider và API key là bắt buộc' },
        { status: 400 }
      )
    }

    // Get or create user ID
    const userId = await getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to get user ID' },
        { status: 500 }
      )
    }

    const newAPIKey = await UserAPIKeyServer.addAPIKey(userId, {
      provider,
      api_key,
      api_key_name
    })

    return NextResponse.json({
      success: true,
      data: newAPIKey
    })

  } catch (error) {
    console.error('Error adding API key:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Không thể thêm API key' },
      { status: 500 }
    )
  }
}
