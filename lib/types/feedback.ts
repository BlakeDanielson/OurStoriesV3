export type FeedbackType = 'thumbs_up' | 'thumbs_down'
export type ContentType = 'book' | 'page'

export interface ContentFeedback {
  id: string
  user_id: string
  content_type: ContentType
  content_id: string
  book_id: string
  page_number?: number
  feedback_type: FeedbackType
  comment?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface FeedbackSummary {
  thumbs_up_count: number
  thumbs_down_count: number
  total_feedback_count: number
  positive_percentage: number
}

export interface UserFeedback {
  id: string
  feedback_type: FeedbackType
  comment?: string
  created_at: string
}

export interface CreateFeedbackRequest {
  content_type: ContentType
  content_id: string
  book_id: string
  page_number?: number
  feedback_type: FeedbackType
  comment?: string
}

export interface UpdateFeedbackRequest {
  feedback_type?: FeedbackType
  comment?: string
}
