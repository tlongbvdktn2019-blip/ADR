export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user'
  organization: string | null
  phone: string | null
  created_at: string
  updated_at: string
  password_hash?: string
  password_updated_at?: string
  reset_token?: string
  reset_token_expires?: string
  statistics?: {
    totalReports: number
    totalCards: number
  }
}

export interface UserFormData {
  name: string
  email: string
  organization: string
  phone?: string
  role: 'admin' | 'user'
}

export interface UserListResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

export interface UserFilters {
  search?: string
  role?: 'admin' | 'user'
  page: number
  limit: number
}




