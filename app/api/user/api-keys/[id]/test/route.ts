import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { UserAPIKeyServer } from '@/lib/user-api-key-server'
import { getUserIdFromSession } from '@/lib/get-or-create-user'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const keyId = params.id

    // Get or create user ID
    const userId = await getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to get user ID' },
        { status: 500 }
      )
    }

    const testResult = await UserAPIKeyServer.testAPIKey(userId, keyId)

    return NextResponse.json({
      success: true,
      data: testResult
    })

  } catch (error) {
    console.error('Error testing API key:', error)
    return NextResponse.json(
      { error: 'Không thể test API key' },
      { status: 500 }
    )
  }
}
