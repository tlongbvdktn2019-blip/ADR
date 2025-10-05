/**
 * Simple Gmail SMTP Test (No dependencies on dotenv)
 * Chạy: node test-gmail-smtp-simple.js
 */

const nodemailer = require('nodemailer')
const fs = require('fs')

// Đọc .env.local manually
function loadEnvFile() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8')
    const env = {}
    
    envContent.split('\n').forEach(line => {
      line = line.trim()
      if (line && !line.startsWith('#') && line.includes('=')) {
        const [key, ...valueParts] = line.split('=')
        env[key.trim()] = valueParts.join('=').trim()
      }
    })
    
    return env
  } catch (error) {
    console.error('❌ Cannot read .env.local:', error.message)
    return null
  }
}

async function testGmailSMTP() {
  console.log('🔧 Testing Gmail SMTP Configuration...\n')

  const env = loadEnvFile()
  if (!env) {
    console.log('❌ Please create .env.local file first')
    return
  }

  // Check configuration
  console.log('📋 Configuration:')
  console.log('  SMTP_HOST:', env.SMTP_HOST || 'NOT SET')
  console.log('  SMTP_PORT:', env.SMTP_PORT || 'NOT SET')
  console.log('  SMTP_USER:', env.SMTP_USER || 'NOT SET')
  console.log('  SMTP_PASS:', env.SMTP_PASS ? '***' + env.SMTP_PASS.slice(-4) : 'NOT SET')
  console.log('  EMAIL_FROM:', env.EMAIL_FROM || 'NOT SET')
  console.log('')

  // Check if App Password has spaces
  if (env.SMTP_PASS && env.SMTP_PASS.includes(' ')) {
    console.log('⚠️  WARNING: SMTP_PASS contains spaces!')
    console.log('   App Password should NOT have spaces.')
    console.log('   Current value:', env.SMTP_PASS)
    console.log('   Remove spaces from SMTP_PASS in .env.local')
    console.log('')
    console.log('❌ Please fix SMTP_PASS and try again.')
    return
  }

  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.error('❌ Missing SMTP configuration in .env.local')
    console.log('Required: SMTP_HOST, SMTP_USER, SMTP_PASS')
    return
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: parseInt(env.SMTP_PORT || '587'),
    secure: env.SMTP_SECURE === 'true',
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS
    },
    debug: true // Enable debug output
  })

  try {
    // Test connection
    console.log('🔌 Testing SMTP connection to Gmail...')
    await transporter.verify()
    console.log('✅ SMTP connection successful!\n')

    // Send test email
    console.log('📧 Sending test email to:', env.SMTP_USER)
    const info = await transporter.sendMail({
      from: `"ADR System Test" <${env.EMAIL_FROM || env.SMTP_USER}>`,
      to: env.SMTP_USER,
      subject: '✅ [TEST] Gmail SMTP đã hoạt động!',
      text: 'Email test từ hệ thống ADR. Nếu nhận được, Gmail SMTP đã OK!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
          <div style="background: white; color: #333; padding: 30px; border-radius: 10px;">
            <h2 style="color: #16a34a; margin-top: 0;">✅ Gmail SMTP hoạt động!</h2>
            <p>Xin chào! Đây là email test từ <strong>Hệ thống ADR</strong>.</p>
            
            <div style="background: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #16a34a;">Thành công! ✨</h3>
              <ul style="margin-bottom: 0;">
                <li>✅ Gmail SMTP đã được cấu hình đúng</li>
                <li>✅ App Password hoạt động tốt</li>
                <li>✅ Hệ thống sẵn sàng gửi email thật</li>
              </ul>
            </div>

            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #3b82f6;">📌 Next Steps:</h3>
              <ol style="margin-bottom: 0;">
                <li>Tạo báo cáo ADR mới từ hệ thống</li>
                <li>Email "Có báo cáo ADR mới" sẽ tự động gửi đến Gmail này</li>
                <li>Check inbox để nhận thông báo</li>
              </ol>
            </div>

            <hr style="margin: 25px 0; border: none; border-top: 1px solid #e5e7eb;">
            
            <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
              <strong>Test completed at:</strong> ${new Date().toLocaleString('vi-VN')}<br>
              <strong>System:</strong> ADR Management System
            </p>
          </div>
        </div>
      `
    })

    console.log('\n✅ Test email sent successfully!')
    console.log('📬 Message ID:', info.messageId)
    console.log('')
    console.log('╔════════════════════════════════════════════╗')
    console.log('║  🎉 SUCCESS! Gmail SMTP is working! 🎉    ║')
    console.log('╚════════════════════════════════════════════╝')
    console.log('')
    console.log('📧 Check your Gmail inbox:')
    console.log('   ✉️  Email:', env.SMTP_USER)
    console.log('   📝 Subject: ✅ [TEST] Gmail SMTP đã hoạt động!')
    console.log('')
    console.log('🎯 Next: Tạo báo cáo ADR để nhận email thật!')

  } catch (error) {
    console.error('\n❌ SMTP Test Failed!')
    console.error('Error:', error.message)
    console.log('')
    
    if (error.code === 'EAUTH') {
      console.log('🔧 LỖI XÁC THỰC (EAUTH):')
      console.log('   Nguyên nhân:')
      console.log('   • App Password không đúng')
      console.log('   • 2-Step Verification chưa bật')
      console.log('   • App Password đã bị revoke')
      console.log('')
      console.log('   Giải pháp:')
      console.log('   1. Vào: https://myaccount.google.com/apppasswords')
      console.log('   2. Tạo App Password mới')
      console.log('   3. Copy password (KHÔNG có khoảng trắng!)')
      console.log('   4. Update SMTP_PASS trong .env.local')
      console.log('   5. Chạy lại: node test-gmail-smtp-simple.js')
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('🔧 LỖI KẾT NỐI:')
      console.log('   • Kiểm tra internet connection')
      console.log('   • Kiểm tra firewall/antivirus')
      console.log('   • Thử lại sau vài phút')
    } else {
      console.log('🔧 Troubleshooting:')
      console.log('   1. Kiểm tra lại file .env.local')
      console.log('   2. SMTP_PASS không có khoảng trắng')
      console.log('   3. Restart terminal và thử lại')
    }
  }
}

console.log('═════════════════════════════════════════')
console.log('   Gmail SMTP Connection Test')
console.log('═════════════════════════════════════════\n')

testGmailSMTP()







