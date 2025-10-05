import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth-config'
import { UserAPIKeyServer } from '@/lib/user-api-key-server'
import { getUserIdFromSession } from '@/lib/get-or-create-user'

export async function PUT(
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

    const body = await request.json()
    const keyId = params.id

    // Get or create user ID
    const userId = await getUserIdFromSession(session)
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Failed to get user ID' },
        { status: 500 }
      )
    }

    const updatedKey = await UserAPIKeyServer.updateAPIKey(userId, keyId, body)

    return NextResponse.json({
      success: true,
      data: updatedKey
    })

  } catch (error) {
    console.error('Error updating API key:', error)
    return NextResponse.json(
      { error: 'Không thể cập nhật API key' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    await UserAPIKeyServer.deleteAPIKey(userId, keyId)

    return NextResponse.json({
      success: true,
      message: 'API key đã được xóa'
    })

  } catch (error) {
    console.error('Error deleting API key:', error)
    return NextResponse.json(
      { error: 'Không thể xóa API key' },
      { status: 500 }
    )
  }
}
