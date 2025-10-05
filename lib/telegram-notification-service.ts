/**
 * Telegram Notification Service
 * Gửi thông báo ADR qua Telegram Bot
 * 
 * Setup:
 * 1. Tạo bot: https://t.me/BotFather
 * 2. Lấy Bot Token
 * 3. Lấy Chat ID (gửi tin nhắn cho bot, vào https://api.telegram.org/bot<TOKEN>/getUpdates)
 * 4. Thêm vào .env.local:
 *    TELEGRAM_BOT_TOKEN=your-bot-token
 *    TELEGRAM_CHAT_ID=your-chat-id
 */

import { ADRReport } from '@/types/report'

interface TelegramConfig {
  botToken: string
  chatId: string
}

/**
 * Get Telegram configuration from environment variables
 */
function getTelegramConfig(): TelegramConfig | null {
  const botToken = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!botToken || !chatId) {
    console.warn('Telegram notification disabled: Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    return null
  }

  return { botToken, chatId }
}

/**
 * Format ADR report as Telegram message
 */
function formatTelegramMessage(report: ADRReport): string {
  const severityEmoji = {
    death: '☠️',
    life_threatening: '🚨',
    hospitalization: '🏥',
    birth_defect: '👶',
    permanent_disability: '♿',
    not_serious: '✅'
  }

  const emoji = severityEmoji[report.severity_level] || '📋'

  return `
🔔 <b>Có báo cáo ADR mới!</b>

${emoji} <b>Mã báo cáo:</b> ${report.report_code}
👤 <b>Bệnh nhân:</b> ${report.patient_name}
🏥 <b>Tổ chức:</b> ${report.organization}
⚠️ <b>Mức độ:</b> ${getSeverityLabel(report.severity_level)}
📅 <b>Ngày xảy ra:</b> ${formatDate(report.adr_occurrence_date)}

💊 <b>Thuốc nghi ngờ:</b>
${report.suspected_drugs?.map((drug, i) => `  ${i + 1}. ${drug.drug_name}`).join('\n') || 'Không có'}

📝 <b>Mô tả:</b> ${truncate(report.adr_description, 100)}

👨‍⚕️ <b>Người báo cáo:</b> ${report.reporter_name} (${report.reporter_profession})
📞 <b>Liên hệ:</b> ${report.reporter_phone || report.reporter_email || 'Không có'}

⏰ <b>Thời gian:</b> ${new Date().toLocaleString('vi-VN')}
  `.trim()
}

/**
 * Send Telegram notification
 */
export async function sendTelegramNotification(
  report: ADRReport
): Promise<{ success: boolean; error?: string }> {
  const config = getTelegramConfig()

  if (!config) {
    return {
      success: false,
      error: 'Telegram not configured'
    }
  }

  try {
    const message = formatTelegramMessage(report)
    const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_id: config.chatId,
        text: message,
        parse_mode: 'HTML'
      })
    })

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data)
      return {
        success: false,
        error: data.description || 'Telegram API error'
      }
    }

    console.log(`✅ Telegram notification sent for report ${report.report_code}`)
    return { success: true }

  } catch (error) {
    console.error('Telegram notification error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Test Telegram configuration
 */
export async function testTelegramConnection(): Promise<boolean> {
  const config = getTelegramConfig()

  if (!config) {
    console.error('Telegram not configured')
    return false
  }

  try {
    const url = `https://api.telegram.org/bot${config.botToken}/getMe`
    const response = await fetch(url)
    const data = await response.json()

    if (data.ok) {
      console.log('✅ Telegram bot connected:', data.result.username)
      return true
    } else {
      console.error('❌ Telegram bot error:', data.description)
      return false
    }
  } catch (error) {
    console.error('❌ Telegram connection error:', error)
    return false
  }
}

// Helper functions
function getSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    death: 'Tử vong',
    life_threatening: 'Đe dọa tính mạng',
    hospitalization: 'Nhập viện',
    birth_defect: 'Dị tật bẩm sinh',
    permanent_disability: 'Tàn tật vĩnh viễn',
    not_serious: 'Không nghiêm trọng'
  }
  return labels[severity] || severity
}

function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('vi-VN')
  } catch {
    return dateString
  }
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}







