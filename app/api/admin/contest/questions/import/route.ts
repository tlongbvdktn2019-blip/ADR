import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { supabaseAdmin } from '@/lib/supabase-admin'
import * as XLSX from 'xlsx'

// POST: Import câu hỏi từ file Excel cho Contest
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
      'Câu hỏi',
      'Đáp án A',
      'Đáp án B',
      'Đáp án C',
      'Đáp án D',
      'Đáp án đúng',
      'Giải thích',
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

        const questionText = row[getColIndex('Câu hỏi')]?.toString().trim()
        const answerA = row[getColIndex('Đáp án A')]?.toString().trim()
        const answerB = row[getColIndex('Đáp án B')]?.toString().trim()
        const answerC = row[getColIndex('Đáp án C')]?.toString().trim()
        const answerD = row[getColIndex('Đáp án D')]?.toString().trim()
        const correctAnswer = row[getColIndex('Đáp án đúng')]?.toString().toUpperCase().trim()
        const explanation = row[getColIndex('Giải thích')]?.toString().trim() || ''
        const points = parseInt(row[getColIndex('Điểm')]?.toString() || '10')

        // Validation
        if (!questionText) {
          errors.push(`Hàng ${rowNum}: Thiếu câu hỏi`)
          continue
        }

        // Build options - phải có đủ 4 đáp án
        if (!answerA || !answerB || !answerC || !answerD) {
          errors.push(`Hàng ${rowNum}: Phải có đủ 4 đáp án A, B, C, D`)
          continue
        }

        const options = [
          { key: 'A', text: answerA },
          { key: 'B', text: answerB },
          { key: 'C', text: answerC },
          { key: 'D', text: answerD }
        ]

        // Validate correct answer
        if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
          errors.push(`Hàng ${rowNum}: Đáp án đúng phải là A, B, C hoặc D`)
          continue
        }

        // Add to insert list
        questionsToInsert.push({
          question_text: questionText,
          options,
          correct_answer: correctAnswer,
          explanation,
          points_value: points,
          is_active: true,
          created_by: session.user.id
        })

      } catch (error: any) {
        errors.push(`Hàng ${rowNum}: Lỗi xử lý - ${error.message}`)
      }
    }

    // Insert questions if any
    let insertedCount = 0
    if (questionsToInsert.length > 0) {
      // @ts-ignore - contest tables not in Database types yet
      const { data: inserted, error: insertError } = await (supabaseAdmin
        .from('contest_questions') as any)
        .insert(questionsToInsert)
        .select()

      if (insertError) {
        console.error('Error inserting contest questions:', insertError)
        return NextResponse.json(
          { 
            error: 'Lỗi khi lưu câu hỏi vào database',
            details: insertError.message
          },
          { status: 500 }
        )
      }

      insertedCount = inserted?.length || 0
    }

    return NextResponse.json({
      success: true,
      message: `Import thành công ${insertedCount} câu hỏi cuộc thi`,
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

    // Create template data
    const template = [
      [
        'Câu hỏi',
        'Đáp án A',
        'Đáp án B',
        'Đáp án C',
        'Đáp án D',
        'Đáp án đúng',
        'Giải thích',
        'Điểm'
      ],
      [
        'WHO-UMC là viết tắt của gì?',
        'World Health Organization - Uppsala Monitoring Centre',
        'World Hospital Organization',
        'World Hygiene Organization',
        'World Healthcare Organization',
        'A',
        'WHO-UMC là trung tâm giám sát an toàn thuốc toàn cầu của WHO',
        '10'
      ],
      [
        'Thang điểm Naranjo có bao nhiêu câu hỏi?',
        '8 câu',
        '10 câu',
        '12 câu',
        '15 câu',
        'B',
        'Thang điểm Naranjo gồm 10 câu hỏi đánh giá mối liên quan nhân quả',
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
        ''
      ],
      [
        '- Phải có đủ 4 đáp án A, B, C, D',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        '- Đáp án đúng: A, B, C, hoặc D (viết HOA)',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ],
      [
        '- Điểm mặc định: 10',
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
      { wch: 70 }, // Câu hỏi
      { wch: 40 }, // Đáp án A
      { wch: 40 }, // Đáp án B
      { wch: 40 }, // Đáp án C
      { wch: 40 }, // Đáp án D
      { wch: 12 }, // Đáp án đúng
      { wch: 50 }, // Giải thích
      { wch: 10 }  // Điểm
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Câu hỏi Cuộc thi')

    // Convert to buffer
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="template-cau-hoi-cuoc-thi-adr.xlsx"'
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

