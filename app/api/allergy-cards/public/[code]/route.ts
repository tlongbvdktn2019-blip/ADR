import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  void request

  return NextResponse.json(
    {
      error: 'Liên kết công khai theo mã thẻ đã ngừng hỗ trợ',
      message: 'Vui lòng dùng mã QR mới hoặc yêu cầu cơ sở cấp thẻ phát hành lại QR.',
      legacy_code: params.code,
    },
    { status: 410 }
  )
}
