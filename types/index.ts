// Core data models based on specifications

export interface Requirement {
  id: string
  title: string
  description: string
  importance: 'critical' | 'important' | 'nice-to-have'
}

export interface RequirementScore {
  requirement_id: string
  requirement_title: string
  score: number // 0-10 scale as per specifications
  reasoning: string
}

export interface CandidateResult {
  id: string
  analysis_id: string
  name: string
  cv_file_id: string
  overall_score: number // 0-10 scale
  requirement_scores: RequirementScore[]
  processed_at: Date
}

export interface Analysis {
  id: string
  user_id: string
  job_title: string
  job_description_file?: string
  job_description_text?: string
  requirements: Requirement[]
  selected_requirements?: string[]
  status: 'created' | 'requirements_extracted' | 'requirements_selected' | 'processing' | 'completed' | 'failed'
  created_at: Date
  completed_at?: Date
  candidate_count?: number
}

export interface AnalysisProgress {
  analysis_id: string
  total_files: number
  processed_files: number
  current_file?: string
  updated_at: Date
}

// User and subscription types
export interface User {
  id: string
  email: string
  created_at: Date
  subscription_status: 'trial' | 'active' | 'cancelled' | 'expired'
  subscription_ends_at?: Date
  trial_ends_at?: Date
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: Record<string, any>
  }
  meta?: {
    page?: number
    limit?: number
    total?: number
  }
}

// Danish scoring scale descriptors
export const SCORE_DESCRIPTORS = {
  10: "Strategisk/Ledende niveau",
  9: "Dyb erfaring/Ekspertniveau", 
  8: "Dyb erfaring/Ekspertniveau",
  7: "Solid & selvstændig erfaring",
  6: "Solid & selvstændig erfaring", 
  5: "Praktisk grundlæggende erfaring",
  4: "Praktisk grundlæggende erfaring",
  3: "Begrænset/teoretisk erfaring",
  2: "Begrænset/teoretisk erfaring",
  1: "Nul dokumentation",
  0: "Nul dokumentation"
} as const

// Error codes from API specification
export enum ErrorCode {
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_INVALID = 'AUTH_INVALID', 
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  SUBSCRIPTION_REQUIRED = 'SUBSCRIPTION_REQUIRED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  OPENAI_ERROR = 'OPENAI_ERROR',
  ANALYSIS_IN_PROGRESS = 'ANALYSIS_IN_PROGRESS',
  NOT_FOUND = 'NOT_FOUND',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
} 