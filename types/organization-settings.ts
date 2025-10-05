/**
 * Organization Settings Types
 * Cấu hình email thông báo cho từng tổ chức
 */

export interface OrganizationSettings {
  id: string
  organization_name: string
  notification_email: string
  contact_person: string | null
  contact_phone: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateOrganizationSettingsData {
  organization_name: string
  notification_email: string
  contact_person?: string
  contact_phone?: string
  is_active?: boolean
}

export interface UpdateOrganizationSettingsData {
  notification_email?: string
  contact_person?: string
  contact_phone?: string
  is_active?: boolean
}

export interface OrganizationSettingsStats {
  total: number
  active: number
  inactive: number
}







