/**
 * Script kiểm tra migration approval_status đã chạy chưa
 * 
 * Cách chạy: node scripts/check-approval-migration.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

async function checkMigration() {
  console.log('🔍 Đang kiểm tra migration approval_status...\n')

  // Kiểm tra env variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Thiếu environment variables!')
    console.error('   - NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌')
    console.error('   - SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌')
    console.error('\nVui lòng kiểm tra file .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Kiểm tra bảng adr_reports có các cột mới chưa
    console.log('1️⃣ Kiểm tra cột approval_status...')
    
    const { data: reports, error } = await supabase
      .from('adr_reports')
      .select('id, report_code, approval_status, approved_by, approved_at')
      .limit(1)

    if (error) {
      if (error.message.includes('approval_status')) {
        console.error('\n❌ MIGRATION CHƯA CHẠY!')
        console.error('   Cột approval_status chưa tồn tại trong database\n')
        console.error('📋 Cần làm gì:')
        console.error('   1. Mở Supabase Dashboard → SQL Editor')
        console.error('   2. Chạy file: supabase/add-approval-status.sql')
        console.error('   3. Chạy lại script này để kiểm tra\n')
        console.error('Chi tiết lỗi:', error.message)
        process.exit(1)
      } else {
        throw error
      }
    }

    console.log('✅ Cột approval_status đã tồn tại!')
    
    // Kiểm tra dữ liệu
    console.log('\n2️⃣ Kiểm tra dữ liệu...')
    
    const { data: allReports, error: countError } = await supabase
      .from('adr_reports')
      .select('approval_status')

    if (countError) {
      throw countError
    }

    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: allReports.length
    }

    allReports.forEach(report => {
      if (report.approval_status) {
        stats[report.approval_status] = (stats[report.approval_status] || 0) + 1
      }
    })

    console.log('✅ Thống kê trạng thái duyệt:')
    console.log(`   - Tổng số báo cáo: ${stats.total}`)
    console.log(`   - Chưa duyệt: ${stats.pending}`)
    console.log(`   - Đã duyệt: ${stats.approved}`)
    console.log(`   - Từ chối: ${stats.rejected}`)

    // Kiểm tra sample data
    console.log('\n3️⃣ Dữ liệu mẫu:')
    
    const { data: sampleReports } = await supabase
      .from('adr_reports')
      .select('report_code, approval_status, approved_at')
      .limit(5)

    if (sampleReports && sampleReports.length > 0) {
      console.log('┌─────────────┬──────────────┬─────────────┐')
      console.log('│ Mã báo cáo  │ Trạng thái   │ Duyệt lúc   │')
      console.log('├─────────────┼──────────────┼─────────────┤')
      sampleReports.forEach(r => {
        const status = r.approval_status || 'N/A'
        const approvedAt = r.approved_at ? new Date(r.approved_at).toLocaleDateString('vi-VN') : '-'
        console.log(`│ ${r.report_code.padEnd(11)} │ ${status.padEnd(12)} │ ${approvedAt.padEnd(11)} │`)
      })
      console.log('└─────────────┴──────────────┴─────────────┘')
    }

    console.log('\n✅ MIGRATION ĐÃ CHẠY THÀNH CÔNG!')
    console.log('🎉 Bạn có thể sử dụng tính năng duyệt báo cáo ngay!\n')

  } catch (error) {
    console.error('\n❌ Có lỗi xảy ra:', error.message)
    console.error('\nStack trace:', error.stack)
    process.exit(1)
  }
}

// Run the check
checkMigration()




