import { supabaseAdmin } from '@/lib/supabase-admin'
import type { NotificationPayload, NotificationType } from '@/types/notification'

interface NotificationRecipient {
  id: string | null
}

interface ReportNotificationSource {
  id: string
  report_code?: string | null
  patient_name?: string | null
  organization?: string | null
  severity_level?: string | null
}

interface CreateNotificationForUsersInput {
  recipientIds?: string[]
  senderId?: string | null
  type: NotificationType
  title: string
  message: string
  data?: NotificationPayload | null
}

export interface NotificationCreationResult {
  success: boolean
  inserted: number
  error?: string
}

async function getAllRecipientIds(): Promise<string[]> {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('id')

  if (error) {
    throw new Error(`Cannot fetch notification recipients: ${error.message}`)
  }

  return dedupeRecipientIds((data as NotificationRecipient[] | null)?.map(user => user.id) || [])
}

function dedupeRecipientIds(ids: Array<string | null | undefined>): string[] {
  return Array.from(new Set(ids.filter((id): id is string => Boolean(id))))
}

function buildReportPayload(
  report: ReportNotificationSource,
  event: 'new_report' | 'report_updated'
): NotificationPayload {
  return {
    report_id: report.id,
    report_code: report.report_code || undefined,
    patient_name: report.patient_name || undefined,
    organization: report.organization || undefined,
    severity_level: report.severity_level || undefined,
    event,
  }
}

export async function createNotificationForUsers(
  input: CreateNotificationForUsersInput
): Promise<NotificationCreationResult> {
  try {
    const recipientIds = input.recipientIds
      ? dedupeRecipientIds(input.recipientIds)
      : await getAllRecipientIds()

    if (recipientIds.length === 0) {
      return { success: true, inserted: 0 }
    }

    const rows = recipientIds.map(recipientId => ({
      recipient_id: recipientId,
      sender_id: input.senderId || null,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || null,
      read: false,
    }))

    const { error } = await supabaseAdmin
      .from('notifications')
      .insert(rows)

    if (error) {
      throw new Error(error.message)
    }

    return { success: true, inserted: rows.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown notification error'
    console.error('Notification creation failed:', message)
    return { success: false, inserted: 0, error: message }
  }
}

export async function notifyAllUsersAboutNewReport(
  report: ReportNotificationSource,
  senderId?: string | null
) {
  const reportCode = report.report_code || 'chưa có mã'
  const organization = report.organization || 'đơn vị chưa xác định'

  return createNotificationForUsers({
    senderId,
    type: 'new_report',
    title: 'Báo cáo ADR mới',
    message: `Báo cáo ${reportCode} từ ${organization} đã được tạo.`,
    data: buildReportPayload(report, 'new_report'),
  })
}

export async function notifyAllUsersAboutReportUpdate(
  report: ReportNotificationSource,
  senderId?: string | null
) {
  const reportCode = report.report_code || 'chưa có mã'

  return createNotificationForUsers({
    senderId,
    type: 'report_updated',
    title: 'Báo cáo ADR đã cập nhật',
    message: `Báo cáo ${reportCode} đã được cập nhật.`,
    data: buildReportPayload(report, 'report_updated'),
  })
}
