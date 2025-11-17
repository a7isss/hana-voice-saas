/**
 * Campaign and Call Management Types
 * Centralized type definitions for campaign-initiated calls
 */

// ============================================================================
// CAMPAIGN TYPES
// ============================================================================

export interface Campaign {
  id: string;
  hospital_id: string;
  survey_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  
  // Scheduling
  scheduled_start?: Date;
  scheduled_end?: Date;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  
  // Status
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  
  // Metrics
  total_calls_scheduled: number;
  total_calls_completed: number;
  total_calls_failed: number;
  success_rate_target: number;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
  created_by: string;
}

export interface CampaignCreateData {
  hospital_id: string;
  survey_id: string;
  name: string;
  name_ar: string;
  description?: string;
  description_ar?: string;
  patient_selection_criteria?: Record<string, any>;
  included_patient_ids?: string[];
  scheduled_start?: Date;
  scheduled_end?: Date;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// ============================================================================
// CALL QUEUE TYPES
// ============================================================================

export interface CallQueueItem {
  id: string;
  campaign_id: string;
  patient_id: string;
  template_id: string;
  hospital_id: string;
  
  // Patient info
  patient_phone: string;
  patient_name?: string;
  
  // Scheduling
  scheduled_at: Date;
  priority: number; // 1-10, higher = more urgent
  
  // Status
  status: 'queued' | 'calling' | 'completed' | 'failed' | 'cancelled';
  
  // Retry logic
  retry_count: number;
  max_retries: number;
  last_attempt_at?: Date;
  next_retry_at?: Date;
  
  // Error tracking
  error_message?: string;
  error_code?: string;
  
  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface QueueResult {
  success: boolean;
  queued_count: number;
  failed_count: number;
  total_count: number;
  queue_items: CallQueueItem[];
  errors?: string[];
}

// ============================================================================
// CALL SESSION TYPES
// ============================================================================

export interface CallSession {
  id: string;
  campaign_id: string;
  patient_id: string;
  survey_id: string;
  hospital_id: string;
  
  // Call identifiers
  call_sid?: string; // Maqsam call ID
  conversation_id: string;
  
  // Status
  status: 'queued' | 'ringing' | 'answered' | 'in_progress' | 'completed' | 'failed' | 'no_answer' | 'busy';
  current_question_index: number;
  total_questions: number;
  
  // Timing
  queued_at: Date;
  started_at?: Date;
  completed_at?: Date;
  call_duration_seconds?: number;
  
  // Quality
  voice_quality_score?: number;
  
  // Error tracking
  error_code?: string;
  error_message?: string;
  retry_count: number;
  
  created_at: Date;
  updated_at: Date;
}

export interface CallSchedule {
  call_id: string;
  scheduled_time: Date;
  estimated_duration_seconds: number;
  priority: number;
}

export interface CallData {
  campaign_id: string;
  patient_id: string;
  patient_phone: string;
  patient_name?: string;
  template_id: string;
  hospital_id: string;
  priority: number;
}

export interface CallResult {
  success: boolean;
  call_id?: string;
  call_sid?: string;
  status: string;
  error_message?: string;
  error_code?: string;
}

// ============================================================================
// CALL STATUS TYPES
// ============================================================================

export type CallStatus = 
  | 'queued'
  | 'ringing'
  | 'answered'
  | 'in_progress'
  | 'completed'
  | 'failed'
  | 'no_answer'
  | 'busy'
  | 'cancelled';

export interface CallStatusUpdate {
  call_id: string;
  status: CallStatus;
  error_message?: string;
  error_code?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// CAMPAIGN METRICS TYPES
// ============================================================================

export interface CampaignMetrics {
  campaign_id: string;
  
  // Call metrics
  calls_queued: number;
  calls_in_progress: number;
  calls_completed: number;
  calls_failed: number;
  
  // Performance metrics
  average_call_duration: number;
  average_queue_time: number;
  success_rate: number;
  completion_rate: number;
  
  // Error metrics
  error_count_by_type: Record<string, number>;
  retry_count: number;
  failed_after_retry: number;
  
  // Survey metrics
  total_responses: number;
  average_questions_answered: number;
  
  last_updated: Date;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class CallOrchestratorError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'CallOrchestratorError';
  }
}

export class TelephonyError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean = true,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'TelephonyError';
  }
}

// ============================================================================
// CONFIGURATION TYPES
// ============================================================================

export interface OrchestratorConfig {
  max_concurrent_calls: number;
  max_queue_size: number;
  default_retry_count: number;
  retry_delay_seconds: number;
  call_timeout_seconds: number;
  queue_check_interval_ms: number;
}

export const DEFAULT_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
  max_concurrent_calls: 10,
  max_queue_size: 1000,
  default_retry_count: 3,
  retry_delay_seconds: 60,
  call_timeout_seconds: 300, // 5 minutes
  queue_check_interval_ms: 5000, // 5 seconds
};
