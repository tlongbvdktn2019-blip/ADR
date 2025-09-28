import nodemailer from 'nodemailer'

// Email configuration
const EMAIL_CONFIG = {
  targetEmail: 'di.pvcenter@gmail.com',
  senderName: 'Hệ thống ADR',
  senderEmail: process.env.EMAIL_FROM || 'noreply@adrsystem.gov.vn'
}

// Create transporter based on environment
export function createEmailTransporter() {
  // For development/demo, we'll use a test configuration
  // In production, you should use real SMTP credentials
  
  if (process.env.NODE_ENV === 'production' && process.env.SMTP_HOST) {
    // Production SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  } else {
    // Development: Use Ethereal Email for testing
    // This creates a fake SMTP service for development
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass'
      }
    })
  }
}

export interface EmailOptions {
  to?: string // Override default recipient
  subject: string
  html: string
  text: string
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean, messageId?: string, previewURL?: string, error?: string }> {
  try {
    const transporter = createEmailTransporter()

    // For development mode, using existing configuration

    const mailOptions = {
      from: `${EMAIL_CONFIG.senderName} <${EMAIL_CONFIG.senderEmail}>`,
      to: options.to || EMAIL_CONFIG.targetEmail,
      subject: options.subject,
      text: options.text,
      html: options.html,
      // Add headers for better deliverability
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }

    const info = await transporter.sendMail(mailOptions)
    
    // Generate preview URL for development
    let previewURL = undefined
    if (process.env.NODE_ENV !== 'production') {
      previewURL = nodemailer.getTestMessageUrl(info)
    }

    return {
      success: true,
      messageId: info.messageId,
      previewURL: previewURL || undefined
    }

  } catch (error) {
    console.error('Email sending error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Email templates for different types
export const EMAIL_TEMPLATES = {
  ADR_REPORT: 'adr_report',
  REPORT_UPDATE: 'report_update',
  SYSTEM_NOTIFICATION: 'system_notification'
} as const

// Utility function to validate email address
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Get email configuration for display
export function getEmailConfig() {
  return {
    targetEmail: EMAIL_CONFIG.targetEmail,
    senderEmail: EMAIL_CONFIG.senderEmail,
    senderName: EMAIL_CONFIG.senderName,
    isProduction: process.env.NODE_ENV === 'production',
    hasSmtpConfig: !!(process.env.SMTP_HOST && process.env.SMTP_USER)
  }
}


