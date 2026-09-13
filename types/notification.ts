export type NotificationType =
  | 'new_report'
  | 'report_updated'
  | 'allergy_update_submitted'
  | 'allergy_update_reviewed'
  | 'system'

export interface NotificationPayload {
  report_id?: string
  report_code?: string
  patient_name?: string
  organization?: string
  severity_level?: string
  event?: 'new_report' | 'report_updated' | 'allergy_update_submitted' | 'allergy_update_reviewed' | 'system'
  allergy_card_id?: string
  allergy_card_code?: string
  allergy_update_submission_id?: string
  [key: string]: unknown
}

export interface Notification {
  id: string
  recipient_id: string
  sender_id: string | null
  type: NotificationType
  title: string
  message: string
  data: NotificationPayload | null
  read: boolean
  created_at: string
  updated_at: string
}

export interface NotificationWithSender extends Notification {
  sender?: {
    id: string
    name: string
    email: string
    organization?: string
  } | null
}

export interface NotificationStats {
  total: number
  unread: number
  read: number
}
