// ADR Information types for the news/information management system

export type InformationType = 'news' | 'guideline' | 'alert' | 'announcement' | 'education'

export type InformationStatus = 'draft' | 'published' | 'archived'

export interface Attachment {
  name: string
  url: string
  type: string
  size: number
}

export interface ADRInformation {
  id: string
  title: string
  summary?: string
  content: string
  type: InformationType
  priority: number // 1 = highest, 5 = lowest
  tags: string[]
  featured_image_url?: string
  attachments: Attachment[]
  status: InformationStatus
  published_at?: string
  expires_at?: string
  created_by_user_id: string
  author_name: string
  author_organization?: string
  target_audience: string[] // ['admin', 'user', 'public'] or specific organizations
  is_pinned: boolean
  show_on_homepage: boolean
  view_count: number
  likes_count: number
  meta_keywords?: string
  meta_description?: string
  slug?: string
  created_at: string
  updated_at: string
}

export interface InformationView {
  id: string
  information_id: string
  user_id?: string
  user_ip?: string
  viewed_at: string
  read_duration_seconds: number
}

export interface InformationLike {
  id: string
  information_id: string
  user_id: string
  liked_at: string
}

// Form types for creating/editing information
export interface CreateInformationData {
  title: string
  status?: InformationStatus
  published_at?: string
  summary?: string
  content: string
  type?: InformationType
  priority?: number
  tags?: string[]
  featured_image_url?: string
  attachments?: Attachment[]
  target_audience?: string[]
  is_pinned?: boolean
  show_on_homepage?: boolean
  meta_keywords?: string
  meta_description?: string
  expires_at?: string
}

export interface UpdateInformationData extends Partial<CreateInformationData> {
  status?: InformationStatus
  published_at?: string
}

// API Response types
export interface InformationListResponse {
  data: ADRInformation[]
  total: number
  page: number
  limit: number
  totalPages: number
  error?: string
}

export interface InformationResponse {
  data: ADRInformation
  isLiked?: boolean
  hasViewed?: boolean
  error?: string
}

// Filter and search types
export interface InformationFilters {
  type?: InformationType | InformationType[]
  status?: InformationStatus | InformationStatus[]
  tags?: string[]
  author?: string
  target_audience?: string
  is_pinned?: boolean
  show_on_homepage?: boolean
  search?: string // Search in title and content
  priority?: number
  created_after?: string
  created_before?: string
  published_after?: string
  published_before?: string
}

export interface InformationSortOptions {
  field: 'title' | 'created_at' | 'published_at' | 'priority' | 'view_count' | 'likes_count'
  direction: 'asc' | 'desc'
}

export interface InformationQueryParams extends InformationFilters {
  page?: number
  limit?: number
  sort?: InformationSortOptions
}

// Statistics types
export interface InformationStatsItem {
  id: string
  title: string
  view_count?: number
  likes_count?: number
  published_at?: string
}

export interface InformationStats {
  total_published: number
  total_draft: number
  total_archived: number
  total_views: number
  total_likes: number
  most_viewed: InformationStatsItem[]
  most_liked: InformationStatsItem[]
  recent_activity: {
    new_posts: number
    new_views: number
    new_likes: number
  }
}

// User engagement types
export interface UserEngagement {
  user_id: string
  user_name: string
  total_views: number
  total_likes: number
  avg_read_duration: number
  favorite_topics: string[]
  last_activity: string
}

// Content analytics types
export interface ContentAnalytics {
  information_id: string
  title: string
  views_by_date: { date: string; count: number }[]
  likes_by_date: { date: string; count: number }[]
  popular_tags: { tag: string; count: number }[]
  audience_breakdown: { audience: string; count: number }[]
  avg_read_duration: number
  bounce_rate: number
}

// Rich text editor types
export interface EditorContent {
  html: string
  text: string
  wordCount: number
  readingTime: number // estimated reading time in minutes
}

// Image upload types
export interface ImageUpload {
  file: File
  preview: string
  uploadProgress?: number
  error?: string
}

// Notification types related to information
export interface InformationNotification {
  id: string
  type: 'new_post' | 'post_updated' | 'post_liked' | 'comment_added'
  information_id: string
  information_title: string
  triggered_by_user_id: string
  triggered_by_name: string
  message: string
  created_at: string
}



