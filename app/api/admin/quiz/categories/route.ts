import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'KhĂ´ng cĂ³ quyá»n truy cáº­p' },
        { status: 403 }
      )
    }

    const supabase = createClient()

    const { data, error } = await supabase
      .from('quiz_categories')
      .select(`
        *,
        active_questions:quiz_questions(count)
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { error: 'KhĂ´ng thá»ƒ láº¥y danh sĂ¡ch chá»§ Ä‘á»' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })

  } catch (error) {
    console.error('Admin quiz categories GET error:', error)
    return NextResponse.json(
      { error: 'Lá»—i server' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'KhĂ´ng cĂ³ quyá»n truy cáº­p' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      name,
      category_key,
      description,
      icon_name,
      color_scheme
    } = body

    // Validation
    if (!name || !category_key) {
      return NextResponse.json(
        { error: 'TĂªn vĂ  khĂ³a chá»§ Ä‘á» lĂ  báº¯t buá»™c' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    // Check if category_key already exists
    const { data: existing, error: checkError } = await supabase
      .from('quiz_categories')
      .select('id')
      .eq('category_key', category_key)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'KhĂ³a chá»§ Ä‘á» Ä‘Ă£ tá»“n táº¡i' },
        { status: 409 }
      )
    }

    const { data, error } = await supabase
      .from('quiz_categories')
      .insert({
        name,
        category_key,
        description,
        icon_name: icon_name || 'BookOpenIcon',
        color_scheme: color_scheme || 'gray',
        total_questions: 0,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { error: 'KhĂ´ng thá»ƒ táº¡o chá»§ Ä‘á»' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Táº¡o chá»§ Ä‘á» thĂ nh cĂ´ng'
    })

  } catch (error) {
    console.error('Admin quiz categories POST error:', error)
    return NextResponse.json(
      { error: 'Lá»—i server' },
      { status: 500 }
    )
  }
}



