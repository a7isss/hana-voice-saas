/**
 * Call Orchestrator Service
 * Manages call queue, scheduling, and execution for campaign-initiated calls
 * 
 * Error Handling: [ORCHESTRATOR] prefix in all logs
 * Responsibilities:
 * - Queue campaign calls
 * - Schedule call execution
 * - Track call status
 * - Handle retries
 * - Update campaign metrics
 */

import { createClient } from '@supabase/supabase-js';
import {
  CallQueueItem,
  QueueResult,
  CallSchedule,
  CallData,
  CallResult,
  CallStatus,
  CallStatusUpdate,
  CallOrchestratorError,
  OrchestratorConfig,
  DEFAULT_ORCHESTRATOR_CONFIG,
} from '@/lib/types/campaign';

export class CallOrchestrator {
  private supabase;
  private config: OrchestratorConfig;
  private activeCallsCount: number = 0;
  private queueCheckInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_ORCHESTRATOR_CONFIG, ...config };
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new CallOrchestratorError(
        'Missing Supabase credentials',
        'MISSING_CREDENTIALS'
      );
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('[ORCHESTRATOR] Initialized with config:', this.config);
  }

  /**
   * Queue all calls for a campaign
   */
  async queueCampaignCalls(campaignId: string): Promise<QueueResult> {
    console.log(`[ORCHESTRATOR] queueCampaignCalls: Starting for campaign ${campaignId}`);
    
    try {
      // Get campaign details
      const { data: campaign, error: campaignError } = await this.supabase
        .from('campaigns')
        .select(`
          *,
          hospital_surveys!inner(
            id,
            template_id
          )
        `)
        .eq('id', campaignId)
        .single();

      if (campaignError || !campaign) {
        throw new CallOrchestratorError(
          `Campaign not found: ${campaignId}`,
          'CAMPAIGN_NOT_FOUND',
          { campaignId }
        );
      }

      // Get patients for this campaign
      const patients = await this.getCampaignPatients(campaignId, campaign);

      if (patients.length === 0) {
        console.warn(`[ORCHESTRATOR] queueCampaignCalls: No patients found for campaign ${campaignId}`);
        return {
          success: true,
          queued_count: 0,
          failed_count: 0,
          total_count: 0,
          queue_items: [],
        };
      }

      // Check queue capacity
      const currentQueueSize = await this.getQueueSize();
      if (currentQueueSize + patients.length > this.config.max_queue_size) {
        throw new CallOrchestratorError(
          `Queue capacity exceeded: ${currentQueueSize + patients.length} > ${this.config.max_queue_size}`,
          'QUEUE_FULL',
          { currentQueueSize, requestedSize: patients.length }
        );
      }

      // Create queue items
      const queueItems: Partial<CallQueueItem>[] = patients.map((patient, index) => ({
        campaign_id: campaignId,
        patient_id: patient.id,
        template_id: campaign.hospital_surveys.template_id,
        hospital_id: campaign.hospital_id,
        patient_phone: patient.phone_number,
        patient_name: patient.first_name,
        scheduled_at: this.calculateScheduledTime(campaign, index),
        priority: this.calculatePriority(campaign.priority),
        status: 'queued' as const,
        retry_count: 0,
        max_retries: this.config.default_retry_count,
      }));

      // Insert into call_sessions table
      const { data: insertedSessions, error: insertError } = await this.supabase
        .from('call_sessions')
        .insert(
          queueItems.map(item => ({
            campaign_id: item.campaign_id,
            patient_id: item.patient_id,
            survey_id: campaign.hospital_surveys.id,
            hospital_id: item.hospital_id,
            conversation_id: `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            status: 'queued',
            current_question_index: -1,
            total_questions: 0, // Will be set when survey loads
            retry_count: 0,
          }))
        )
        .select();

      if (insertError) {
        console.error('[ORCHESTRATOR] queueCampaignCalls: Insert error:', insertError);
        throw new CallOrchestratorError(
          'Failed to queue calls',
          'INSERT_ERROR',
          { error: insertError }
        );
      }

      // Update campaign status
      await this.supabase
        .from('campaigns')
        .update({
          status: 'scheduled',
          total_calls_scheduled: patients.length,
          updated_at: new Date().toISOString(),
        })
        .eq('id', campaignId);

      console.log(`[ORCHESTRATOR] queueCampaignCalls: Queued ${insertedSessions?.length || 0} calls for campaign ${campaignId}`);

      return {
        success: true,
        queued_count: insertedSessions?.length || 0,
        failed_count: 0,
        total_count: patients.length,
        queue_items: insertedSessions as CallQueueItem[] || [],
      };

    } catch (error) {
      console.error('[ORCHESTRATOR] queueCampaignCalls: Error:', error);
      
      if (error instanceof CallOrchestratorError) {
        throw error;
      }
      
      throw new CallOrchestratorError(
        'Failed to queue campaign calls',
        'QUEUE_ERROR',
        { error, campaignId }
      );
    }
  }

  /**
   * Schedule next call from queue
   */
  async scheduleNextCall(campaignId: string): Promise<CallSchedule | null> {
    console.log(`[ORCHESTRATOR] scheduleNextCall: Checking for campaign ${campaignId}`);
    
    try {
      // Check if we're at capacity
      if (this.activeCallsCount >= this.config.max_concurrent_calls) {
        console.warn(`[ORCHESTRATOR] scheduleNextCall: At capacity (${this.activeCallsCount}/${this.config.max_concurrent_calls})`);
        return null;
      }

      // Get next queued call
      const { data: nextCall, error } = await this.supabase
        .from('call_sessions')
        .select('*')
        .eq('campaign_id', campaignId)
        .eq('status', 'queued')
        .lte('retry_count', this.config.default_retry_count)
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (error || !nextCall) {
        console.log(`[ORCHESTRATOR] scheduleNextCall: No queued calls found for campaign ${campaignId}`);
        return null;
      }

      const schedule: CallSchedule = {
        call_id: nextCall.id,
        scheduled_time: new Date(),
        estimated_duration_seconds: 180, // 3 minutes estimate
        priority: 5, // Default priority
      };

      console.log(`[ORCHESTRATOR] scheduleNextCall: Scheduled call ${nextCall.id}`);
      return schedule;

    } catch (error) {
      console.error('[ORCHESTRATOR] scheduleNextCall: Error:', error);
      return null;
    }
  }

  /**
   * Initiate a call
   */
  async initiateCall(callData: CallData): Promise<CallResult> {
    console.log(`[ORCHESTRATOR] initiateCall: Initiating call for patient ${callData.patient_id}`);
    
    try {
      // This will be implemented when we create the Telephony Gateway
      // For now, return a placeholder
      console.warn('[ORCHESTRATOR] initiateCall: Telephony Gateway not yet implemented');
      
      return {
        success: false,
        status: 'failed',
        error_code: 'NOT_IMPLEMENTED',
        error_message: 'Telephony Gateway not yet implemented',
      };

    } catch (error) {
      console.error('[ORCHESTRATOR] initiateCall: Error:', error);
      
      return {
        success: false,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Update call status
   */
  async updateCallStatus(callId: string, statusUpdate: CallStatusUpdate): Promise<void> {
    console.log(`[ORCHESTRATOR] updateCallStatus: Updating call ${callId} to ${statusUpdate.status}`);
    
    try {
      const updateData: any = {
        status: statusUpdate.status,
        updated_at: new Date().toISOString(),
      };

      if (statusUpdate.error_message) {
        updateData.error_message = statusUpdate.error_message;
      }

      if (statusUpdate.error_code) {
        updateData.error_code = statusUpdate.error_code;
      }

      if (statusUpdate.status === 'in_progress' && !updateData.started_at) {
        updateData.started_at = new Date().toISOString();
      }

      if (['completed', 'failed', 'no_answer', 'busy'].includes(statusUpdate.status)) {
        updateData.completed_at = new Date().toISOString();
        
        // Calculate duration if started_at exists
        const { data: session } = await this.supabase
          .from('call_sessions')
          .select('started_at')
          .eq('id', callId)
          .single();

        if (session?.started_at) {
          const duration = Math.floor(
            (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
          );
          updateData.call_duration_seconds = duration;
        }
      }

      const { error } = await this.supabase
        .from('call_sessions')
        .update(updateData)
        .eq('id', callId);

      if (error) {
        throw new CallOrchestratorError(
          'Failed to update call status',
          'UPDATE_ERROR',
          { error, callId, statusUpdate }
        );
      }

      // Update campaign metrics
      await this.updateCampaignMetrics(callId);

    } catch (error) {
      console.error('[ORCHESTRATOR] updateCallStatus: Error:', error);
      throw error;
    }
  }

  /**
   * Retry a failed call
   */
  async retryFailedCall(callId: string): Promise<CallResult> {
    console.log(`[ORCHESTRATOR] retryFailedCall: Retrying call ${callId}`);
    
    try {
      // Get call session
      const { data: session, error } = await this.supabase
        .from('call_sessions')
        .select('*, campaigns(*), patients(*)')
        .eq('id', callId)
        .single();

      if (error || !session) {
        throw new CallOrchestratorError(
          `Call session not found: ${callId}`,
          'SESSION_NOT_FOUND',
          { callId }
        );
      }

      // Check retry limit
      if (session.retry_count >= this.config.default_retry_count) {
        console.warn(`[ORCHESTRATOR] retryFailedCall: Max retries reached for call ${callId}`);
        return {
          success: false,
          status: 'failed',
          error_code: 'MAX_RETRIES',
          error_message: 'Maximum retry attempts reached',
        };
      }

      // Increment retry count
      await this.supabase
        .from('call_sessions')
        .update({
          retry_count: session.retry_count + 1,
          status: 'queued',
          error_message: null,
          error_code: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', callId);

      console.log(`[ORCHESTRATOR] retryFailedCall: Call ${callId} queued for retry (attempt ${session.retry_count + 1})`);

      return {
        success: true,
        call_id: callId,
        status: 'queued',
      };

    } catch (error) {
      console.error('[ORCHESTRATOR] retryFailedCall: Error:', error);
      
      return {
        success: false,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get current queue size
   */
  private async getQueueSize(): Promise<number> {
    const { count, error } = await this.supabase
      .from('call_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued');

    if (error) {
      console.error('[ORCHESTRATOR] getQueueSize: Error:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get patients for campaign
   */
  private async getCampaignPatients(campaignId: string, campaign: any): Promise<any[]> {
    // If specific patient IDs are provided
    if (campaign.included_patient_ids && campaign.included_patient_ids.length > 0) {
      const { data, error } = await this.supabase
        .from('patients')
        .select('*')
        .in('id', campaign.included_patient_ids)
        .eq('hospital_id', campaign.hospital_id)
        .eq('status', 'active')
        .eq('automated_calls_consent', true);

      if (error) {
        console.error('[ORCHESTRATOR] getCampaignPatients: Error:', error);
        return [];
      }

      return data || [];
    }

    // Otherwise, use selection criteria
    let query = this.supabase
      .from('patients')
      .select('*')
      .eq('hospital_id', campaign.hospital_id)
      .eq('status', 'active')
      .eq('automated_calls_consent', true);

    // Apply additional filters from patient_selection_criteria
    if (campaign.patient_selection_criteria) {
      const criteria = campaign.patient_selection_criteria;
      
      if (criteria.department) {
        query = query.eq('department', criteria.department);
      }
      
      if (criteria.priority_level) {
        query = query.eq('priority_level', criteria.priority_level);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ORCHESTRATOR] getCampaignPatients: Error:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Calculate scheduled time for a call
   */
  private calculateScheduledTime(campaign: any, index: number): Date {
    const now = new Date();
    const startTime = campaign.scheduled_start ? new Date(campaign.scheduled_start) : now;
    
    // Stagger calls by 30 seconds each
    const delayMs = index * 30 * 1000;
    
    return new Date(startTime.getTime() + delayMs);
  }

  /**
   * Calculate priority number from priority level
   */
  private calculatePriority(priority: string): number {
    const priorityMap: Record<string, number> = {
      low: 3,
      normal: 5,
      high: 7,
      urgent: 10,
    };
    
    return priorityMap[priority] || 5;
  }

  /**
   * Update campaign metrics
   */
  private async updateCampaignMetrics(callId: string): Promise<void> {
    try {
      // Get call session to find campaign
      const { data: session } = await this.supabase
        .from('call_sessions')
        .select('campaign_id, status')
        .eq('id', callId)
        .single();

      if (!session) return;

      // Get all calls for this campaign
      const { data: calls } = await this.supabase
        .from('call_sessions')
        .select('status')
        .eq('campaign_id', session.campaign_id);

      if (!calls) return;

      // Calculate metrics
      const completed = calls.filter(c => c.status === 'completed').length;
      const failed = calls.filter(c => ['failed', 'no_answer', 'busy'].includes(c.status)).length;

      // Update campaign
      await this.supabase
        .from('campaigns')
        .update({
          total_calls_completed: completed,
          total_calls_failed: failed,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.campaign_id);

    } catch (error) {
      console.error('[ORCHESTRATOR] updateCampaignMetrics: Error:', error);
    }
  }
}

// Export singleton instance
let orchestratorInstance: CallOrchestrator | null = null;

export function getCallOrchestrator(config?: Partial<OrchestratorConfig>): CallOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new CallOrchestrator(config);
  }
  return orchestratorInstance;
}
