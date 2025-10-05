/**
 * Test Gmail SMTP Connection
 * Chạy: node test-gmail-smtp.js
 */

const nodemailer = require('nodemailer')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

async function testGmailSMTP() {
  console.log('🔧 Testing Gmail SMTP Configuration...\n')

  // Check environment variables
  console.log('📋 Configuration:')
  console.log('  SMTP_HOST:', process.env.SMTP_HOST)
  console.log('  SMTP_PORT:', process.env.SMTP_PORT)
  console.log('  SMTP_USER:', process.env.SMTP_USER)
  console.log('  SMTP_PASS:', process.env.SMTP_PASS ? '***' + process.env.SMTP_PASS.slice(-4) : 'NOT SET')
  console.log('  EMAIL_FROM:', process.env.EMAIL_FROM)
  console.log('')

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ Missing SMTP configuration in .env.local')
    console.log('Please set: SMTP_HOST, SMTP_USER, SMTP_PASS')
    return
  }

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  })

  try {
    // Test connection
    console.log('🔌 Testing SMTP connection...')
    await transporter.verify()
    console.log('✅ SMTP connection successful!\n')

    // Send test email
    console.log('📧 Sending test email...')
    const info = await transporter.sendMail({
      from: `"ADR System Test" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Gửi cho chính mình
      subject: '[TEST] Gmail SMTP đã hoạt động! ✅',
      text: 'Đây là email test từ hệ thống ADR.\n\nNếu bạn nhận được email này, Gmail SMTP đã được cấu hình thành công!',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #16a34a;">✅ Gmail SMTP hoạt động thành công!</h2>
          <p>Đây là email test từ <strong>Hệ thống ADR</strong>.</p>
          <p>Nếu bạn nhận được email này, nghĩa là:</p>
          <ul>
            <li>✅ Gmail SMTP đã được cấu hình đúng</li>
            <li>✅ App Password đang hoạt động</li>
            <li>✅ Hệ thống sẵn sàng gửi email thật</li>
          </ul>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #666; font-size: 14px;">
            <strong>Next step:</strong> Tạo báo cáo ADR để nhận email "Có báo cáo ADR mới"
          </p>
          <p style="color: #999; font-size: 12px;">
            Test email sent at: ${new Date().toLocaleString('vi-VN')}
          </p>
        </div>
      `
    })

    console.log('✅ Test email sent successfully!')
    console.log('📬 Message ID:', info.messageId)
    console.log('')
    console.log('🎉 SUCCESS! Check your Gmail inbox:')
    console.log('   Email:', process.env.SMTP_USER)
    console.log('   Subject: [TEST] Gmail SMTP đã hoạt động! ✅')
    console.log('')
    console.log('📌 If you received the email, Gmail SMTP is working!')
    console.log('📌 Now you can create ADR reports and receive real emails.')

  } catch (error) {
    console.error('\n❌ SMTP Test Failed!')
    console.error('Error:', error.message)
    console.log('')
    
    if (error.code === 'EAUTH') {
      console.log('🔧 Troubleshooting EAUTH error:')
      console.log('  1. Check App Password is correct (no spaces!)')
      console.log('  2. Make sure 2-Step Verification is enabled')
      console.log('  3. Generate new App Password at: https://myaccount.google.com/apppasswords')
      console.log('  4. Update SMTP_PASS in .env.local')
    } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
      console.log('🔧 Connection error:')
      console.log('  1. Check internet connection')
      console.log('  2. Check firewall settings')
      console.log('  3. Try again in a few minutes')
    } else {
      console.log('🔧 General troubleshooting:')
      console.log('  1. Verify .env.local configuration')
      console.log('  2. Restart the application')
      console.log('  3. Check Gmail account security settings')
    }
  }
}

testGmailSMTP()







