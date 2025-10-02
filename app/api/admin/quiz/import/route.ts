import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as XLSX from 'xlsx'

// POST: Import câu hỏi từ file Excel
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Get form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'Không tìm thấy file' },
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
      return NextResponse.json(
        { error: 'File phải là định dạng Excel (.xlsx hoặc .xls)' },
        { status: 400 }
      )
    }

    // Read file
    const buffer = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]

    if (data.length < 2) {
      return NextResponse.json(
        { error: 'File Excel không có dữ liệu' },
        { status: 400 }
      )
    }

    // Skip header row
    const headers = data[0]
    const rows = data.slice(1)

    // Validate headers
    const requiredHeaders = [
      'Danh mục',
      'Câu hỏi',
      'Độ khó',
      'Đáp án A',
      'Đáp án B',
      'Đáp án C',
      'Đáp án D',
      'Đáp án đúng',
      'Giải thích',
      'Tài liệu tham khảo',
      'Thời gian (giây)',
      'Điểm'
    ]

    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      return NextResponse.json(
        { 
          error: `Thiếu các cột bắt buộc: ${missingHeaders.join(', ')}`,
          hint: 'Vui lòng sử dụng template Excel mẫu'
        },
        { status: 400 }
      )
    }

    // Get column indices
    const getColIndex = (name: string) => headers.indexOf(name)

    // Get all categories for mapping
    const { data: categories, error: catError } = await supabaseAdmin
      .from('quiz_categories')
      .select('id, name, category_key')

    if (catError) throw catError

    // Create multiple mapping strategies for flexible category matching
    const categoryMap = new Map<string, string>()
    categories?.forEach((c: any) => {
      // Map by exact name (case-insensitive)
      categoryMap.set(c.name.toLowerCase(), c.id)
      // Map by category_key
      categoryMap.set(c.category_key.toLowerCase(), c.id)
      // Map by name without special characters (for variations)
      const simplifiedName = c.name.toLowerCase().replace(/[-\s]/g, '')
      categoryMap.set(simplifiedName, c.id)
    })

    // Process rows
    const questionsToInsert = []
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 because Excel is 1-indexed and we skip header

      try {
        // Skip empty rows
        if (!row || row.length === 0 || !row[getColIndex('Câu hỏi')]) {
          continue
        }

        const categoryName = row[getColIndex('Danh mục')]?.toString().trim()
        const questionText = row[getColIndex('Câu hỏi')]?.toString().trim()
        const difficulty = row[getColIndex('Độ khó')]?.toString().toLowerCase().trim()
        const answerA = row[getColIndex('Đáp án A')]?.toString().trim()
        const answerB = row[getColIndex('Đáp án B')]?.toString().trim()
        const answerC = row[getColIndex('Đáp án C')]?.toString().trim()
        const answerD = row[getColIndex('Đáp án D')]?.toString().trim()
        const correctAnswer = row[getColIndex('Đáp án đúng')]?.toString().toUpperCase().trim()
        const explanation = row[getColIndex('Giải thích')]?.toString().trim() || ''
        const reference = row[getColIndex('Tài liệu tham khảo')]?.toString().trim() || ''
        const timeSeconds = parseInt(row[getColIndex('Thời gian (giây)')]?.toString() || '60')
        const points = parseInt(row[getColIndex('Điểm')]?.toString() || '10')

        // Validation
        if (!categoryName || !questionText || !difficulty) {
          errors.push(`Hàng ${rowNum}: Thiếu thông tin bắt buộc (Danh mục, Câu hỏi, hoặc Độ khó)`)
          continue
        }

        // Find category ID - try multiple matching strategies
        let categoryId = categoryMap.get(categoryName.toLowerCase())
        
        // If not found, try without special characters
        if (!categoryId) {
          const simplifiedInput = categoryName.toLowerCase().replace(/[-\s]/g, '')
          categoryId = categoryMap.get(simplifiedInput)
        }
        
        if (!categoryId) {
          const availableCategories = categories?.map((c: any) => c.name).join(', ') || 'N/A'
          errors.push(`Hàng ${rowNum}: Không tìm thấy danh mục "${categoryName}". Các danh mục có sẵn: ${availableCategories}`)
          continue
        }

        // Validate difficulty
        const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert']
        if (!validDifficulties.includes(difficulty)) {
          errors.push(`Hàng ${rowNum}: Độ khó không hợp lệ. Phải là: beginner, intermediate, advanced, hoặc expert`)
          continue
        }

        // Build options
        const options = []
        if (answerA) options.push({ key: 'A', text: answerA })
        if (answerB) options.push({ key: 'B', text: answerB })
        if (answerC) options.push({ key: 'C', text: answerC })
        if (answerD) options.push({ key: 'D', text: answerD })

        if (options.length < 2) {
          errors.push(`Hàng ${rowNum}: Phải có ít nhất 2 đáp án`)
          continue
        }

        // Validate correct answer
        const validAnswers = options.map(o => o.key)
        if (!validAnswers.includes(correctAnswer)) {
          errors.push(`Hàng ${rowNum}: Đáp án đúng "${correctAnswer}" không nằm trong các lựa chọn`)
          continue
        }

        // Add to insert list
        questionsToInsert.push({
          category_id: categoryId,
          question_text: questionText,
          question_type: 'multiple_choice',
          difficulty,
          options,
          correct_answer: correctAnswer,
          explanation,
          reference_source: reference,
          estimated_time_seconds: timeSeconds,
          points_value: points,
          is_active: true,
          review_status: 'approved',
          created_by: session.user.id
        })

      } catch (error: any) {
        errors.push(`Hàng ${rowNum}: Lỗi xử lý - ${error.message}`)
      }
    }

    // Insert questions if any
    let insertedCount = 0
    if (questionsToInsert.length > 0) {
      // @ts-ignore - quiz_questions table types mismatch
      const { data: inserted, error: insertError } = await (supabaseAdmin
        .from('quiz_questions') as any)
        .insert(questionsToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting questions:', insertError)
        return NextResponse.json(
          { 
            error: 'Lỗi khi lưu câu hỏi vào database',
            details: insertError.message
          },
          { status: 500 }
        )
      }

      insertedCount = inserted?.length || 0

      // Update category counts
      const categoryIdsSet = new Set(questionsToInsert.map((q: any) => q.category_id))
      const categoryIds = Array.from(categoryIdsSet)
      for (const catId of categoryIds) {
        // @ts-ignore - RPC function not in types
        await supabaseAdmin.rpc('update_category_question_count', { 
          category_id: catId 
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import thành công ${insertedCount} câu hỏi`,
      data: {
        total_rows: rows.filter(r => r && r.length > 0).length,
        inserted: insertedCount,
        errors: errors.length,
        error_details: errors
      }
    })

  } catch (error: any) {
    console.error('Import Excel error:', error)
    return NextResponse.json(
      { 
        error: 'Lỗi khi import file Excel',
        details: error.message
      },
      { status: 500 }
    )
  }
}

// GET: Download template Excel
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Không có quyền truy cập' },
        { status: 403 }
      )
    }

    // Get categories for reference
    const { data: categories } = await supabaseAdmin
      .from('quiz_categories')
      .select('name')
      .eq('is_active', true)

    const categoryNames = categories?.map((c: any) => c.name).join(', ') || ''

    // Create template data
    const template = [
      [
        'Danh mục',
        'Câu hỏi',
        'Độ khó',
        'Đáp án A',
        'Đáp án B',
        'Đáp án C',
        'Đáp án D',
        'Đáp án đúng',
        'Giải thích',
        'Tài liệu tham khảo',
        'Thời gian (giây)',
        'Điểm'
      ],
      [
        'WHO-UMC',
        'Câu hỏi mẫu: WHO-UMC là gì?',
        'beginner',
        'World Health Organization',
        'World Hospital Organization',
        'World Hygiene Organization',
        'World Healthcare Organization',
        'A',
        'WHO-UMC là tổ chức giám sát an toàn thuốc toàn cầu',
        'WHO Guidelines on Pharmacovigilance',
        '60',
        '10'
      ],
      [
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'HƯỚNG DẪN:',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'Danh mục có sẵn:',
        categoryNames,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'Độ khó hợp lệ:',
        'beginner, intermediate, advanced, expert',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        'Đáp án đúng:',
        'A, B, C, hoặc D (viết hoa)',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]
    ]

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(template)
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Danh mục
      { wch: 50 }, // Câu hỏi
      { wch: 12 }, // Độ khó
      { wch: 30 }, // Đáp án A
      { wch: 30 }, // Đáp án B
      { wch: 30 }, // Đáp án C
      { wch: 30 }, // Đáp án D
      { wch: 12 }, // Đáp án đúng
      { wch: 40 }, // Giải thích
      { wch: 30 }, // Tài liệu
      { wch: 15 }, // Thời gian
      { wch: 10 }  // Điểm
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Câu hỏi')

    // Convert to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-cau-hoi-adr.xlsx"'
      }
    })

  } catch (error: any) {
    console.error('Download template error:', error)
    return NextResponse.json(
      { error: 'Lỗi khi tạo template' },
      { status: 500 }
    )
  }
}

