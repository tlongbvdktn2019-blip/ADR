import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { createServerClient } from '@/lib/supabase';

// Force Node.js runtime (not Edge)
export const runtime = 'nodejs'

/**
 * GET /api/allergy-cards/[id]/export-pdf
 * Export allergy card as PDF (HTML version)
 */
export async function GET(
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

    // For now, return a simple HTML response
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Allergy Card Export</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
        .message { background: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
        .btn { background: #2563eb; color: white; padding: 10px 20px; border: none; border-radius: 5px; }
      </style>
    </head>
    <body>
      <div class="message">
        <h2>🔄 Allergy Card PDF Export</h2>
        <p>PDF generation for allergy cards is being updated.</p>
        <p>Please use the web view for now or try again later.</p>
        <button class="btn" onclick="window.close()">Close</button>
      </div>
    </body>
    </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })

  } catch (error) {
    console.error('Allergy card export error:', error)
    
    return NextResponse.json(
      { error: 'Unable to export allergy card' },
      { status: 500 }
    )
  }
}