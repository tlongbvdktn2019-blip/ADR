import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  void request

  return NextResponse.json(
    {
      error: 'Tra cứu công khai theo mã thẻ đã bị vô hiệu hóa',
      message: 'Vui lòng dùng mã QR mới hoặc liên hệ nơi cấp thẻ để phát hành lại QR an toàn.',
      legacy_code: params.code,
    },
    { status: 410 }
  )
}
