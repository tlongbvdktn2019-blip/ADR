/**
 * Auto Email Service - Tự động gửi email thông báo khi có báo cáo ADR mới
 * 
 * Chức năng:
 * - Tự động gửi email đến người báo cáo (nếu có reporter_email)
 * - Gửi đến email của organization (query từ database)
 * - Gửi đến admin email
 * 
 * Version 2.0: Database-based organization email mapping
 */

import { sendEmail, isValidEmail } from './email-service'
import { generateADRReportEmailHTML, generateADRReportEmailSubject, generateADRReportEmailText } from './email-templates/adr-report'
import { ADRReport } from '@/types/report'
import { createClient } from '@supabase/supabase-js'
import { config } from './config'

// Default email nếu không tìm thấy trong database
const DEFAULT_EMAIL = process.env.DEFAULT_NOTIFICATION_EMAIL || 'di.pvcenter@gmail.com'

// Create Supabase client for server-side operations
const getSupabaseClient = () => {
  return createClient(
    config.supabase.url,
    config.supabase.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

/**
 * Get notification emails for a specific organization from database
 */
export async function getOrganizationEmails(organization: string): Promise<string[]> {
  const emails: string[] = []
  
  try {
    const supabase = getSupabaseClient()
    
    // Query organization settings from database
    const { data, error } = await supabase
      .from('organization_settings')
      .select('notification_email')
      .eq('organization_name', organization)
      .eq('is_active', true)
      .single()
    
    if (error) {
      console.warn(`Organization "${organization}" not found in database, using default email:`, error.message)
      emails.push(DEFAULT_EMAIL)
    } else if (data && data.notification_email) {
      emails.push(data.notification_email)
    } else {
      console.warn(`No email configured for organization "${organization}", using default`)
      emails.push(DEFAULT_EMAIL)
    }
  } catch (error) {
    console.error('Error fetching organization email from database:', error)
    // Fallback to default email on error
    emails.push(DEFAULT_EMAIL)
  }
  
  return emails
}

/**
 * Get notification emails for a specific organization (synchronous fallback)
 * Use this only when async is not possible
 */
export function getOrganizationEmailsSync(organization: string): string[] {
  // Return default email for sync calls
  // The async version should be used whenever possible
  return [DEFAULT_EMAIL]
}

/**
 * Get all recipient emails for a report (async version)
 */
export async function getReportRecipientEmails(report: ADRReport): Promise<string[]> {
  const emails: string[] = []
  
  // 1. Add reporter's email if provided and valid
  if (report.reporter_email && isValidEmail(report.reporter_email)) {
    emails.push(report.reporter_email)
  }
  
  // 2. Add organization emails from database
  const orgEmails = await getOrganizationEmails(report.organization)
  emails.push(...orgEmails)
  
  // Remove duplicates
  return Array.from(new Set(emails))
}

/**
 * Send automatic email notification for a new ADR report
 */
export async function sendAutoReportEmail(
  report: ADRReport,
  options?: {
    includeReporter?: boolean // Gửi cho người báo cáo (default: true)
    includeOrganization?: boolean // Gửi cho tổ chức (default: true)
    additionalRecipients?: string[] // Email bổ sung
  }
): Promise<{
  success: boolean
  sentTo: string[]
  failures: Array<{ email: string; error: string }>
}> {
  const {
    includeReporter = true,
    includeOrganization = true,
    additionalRecipients = []
  } = options || {}

  const recipients: string[] = []
  const sentTo: string[] = []
  const failures: Array<{ email: string; error: string }> = []

  // Collect recipient emails
  if (includeReporter && report.reporter_email && isValidEmail(report.reporter_email)) {
    recipients.push(report.reporter_email)
  }

  if (includeOrganization) {
    const orgEmails = await getOrganizationEmails(report.organization)
    recipients.push(...orgEmails)
  }

  // Add additional recipients
  recipients.push(...additionalRecipients.filter(email => isValidEmail(email)))

  // Remove duplicates
  const uniqueRecipients = Array.from(new Set(recipients))

  if (uniqueRecipients.length === 0) {
    console.warn('No valid recipients for auto email notification')
    return {
      success: false,
      sentTo: [],
      failures: [{ email: 'none', error: 'No valid recipients' }]
    }
  }

  // Generate email content once
  const emailSubject = generateADRReportEmailSubject(report)
  const emailHTML = generateADRReportEmailHTML(report)
  const emailText = generateADRReportEmailText(report)

  // Send email to each recipient
  for (const recipientEmail of uniqueRecipients) {
    try {
      const result = await sendEmail({
        to: recipientEmail,
        subject: emailSubject,
        html: emailHTML,
        text: emailText
      })

      if (result.success) {
        sentTo.push(recipientEmail)
        console.log(`✅ Auto email sent to: ${recipientEmail}`, {
          reportCode: report.report_code,
          messageId: result.messageId,
          previewURL: result.previewURL
        })
      } else {
        failures.push({
          email: recipientEmail,
          error: result.error || 'Unknown error'
        })
        console.error(`❌ Failed to send email to: ${recipientEmail}`, result.error)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      failures.push({
        email: recipientEmail,
        error: errorMessage
      })
      console.error(`❌ Exception sending email to: ${recipientEmail}`, error)
    }
  }

  return {
    success: sentTo.length > 0,
    sentTo,
    failures
  }
}

/**
 * Send email notification to admins about a new report
 */
export async function sendAdminNotificationEmail(
  report: ADRReport,
  adminEmails: string[]
): Promise<{
  success: boolean
  sentTo: string[]
  failures: Array<{ email: string; error: string }>
}> {
  const validAdminEmails = adminEmails.filter(email => isValidEmail(email))
  
  if (validAdminEmails.length === 0) {
    return {
      success: false,
      sentTo: [],
      failures: [{ email: 'none', error: 'No valid admin emails' }]
    }
  }

  return sendAutoReportEmail(report, {
    includeReporter: false,
    includeOrganization: false,
    additionalRecipients: validAdminEmails
  })
}

/**
 * Get all configured organization emails from database
 */
export async function getAllOrganizationEmails(): Promise<Array<{
  organization: string
  email: string
  contact_person?: string
  contact_phone?: string
}>> {
  try {
    const supabase = getSupabaseClient()
    
    const { data, error } = await supabase
      .from('organization_settings')
      .select('organization_name, notification_email, contact_person, contact_phone')
      .eq('is_active', true)
      .order('organization_name')
    
    if (error) {
      console.error('Error fetching organization emails:', error)
      return []
    }
    
    return (data || []).map(row => ({
      organization: row.organization_name,
      email: row.notification_email,
      contact_person: row.contact_person || undefined,
      contact_phone: row.contact_phone || undefined
    }))
  } catch (error) {
    console.error('Error in getAllOrganizationEmails:', error)
    return []
  }
}

