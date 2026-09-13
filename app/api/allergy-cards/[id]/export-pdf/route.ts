import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.redirect(new URL(`/api/allergy-cards/${params.id}/print-view`, request.url), 307)
}
