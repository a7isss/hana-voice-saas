# 09 - API Endpoints

## 🌐 **API Architecture Overview**

### **Service Communication**
```
Next.js Frontend (Port 3000)
    ↓ HTTP/REST API
Next.js API Routes (/api/*)
    ↓ HTTP/REST API ↔ WebSocket
Python Voice Service (Port 8000)
    ↓ WebSocket (Voice Processing)
Voice Models (Vosk/Coqui)
```

### **Authentication Flow**
```
Client → Next.js API → JWT Validation → Supabase Auth → Database
```

---

## 🔐 **Authentication API**

### **JWT Token Management**
```typescript
// POST /api/auth/validate
// Validate JWT token and get user session
interface AuthValidateRequest {
  token: string;
}

interface AuthValidateResponse {
  valid: boolean;
  user?: {
    id: string;
    email: string;
    role: string;
  };
  error?: string;
}
```

### **Session Management**
```typescript
// GET /api/auth/session
// Get current user session
interface SessionResponse {
  user: {
    id: string;
    email: string;
    role: string;
    full_name?: string;
  } | null;
}
```

---

## 📋 **Survey Management API**

### **Survey Templates**
```typescript
// GET /api/survey-templates
// List all active survey templates
interface SurveyTemplate {
  id: string;
  title: string;
  description?: string;
  questions: Question[];
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

interface Question {
  type: 'multiple_choice' | 'scale' | 'open_ended' | 'yes_no';
  question: string;
  options?: string[];
  min?: number;
  max?: number;
}

// POST /api/survey-templates
// Create new survey template
interface CreateSurveyTemplateRequest {
  title: string;
  description?: string;
  questions: Question[];
}

// PUT /api/survey-templates/:id
// Update survey template
interface UpdateSurveyTemplateRequest {
  title?: string;
  description?: string;
  questions?: Question[];
  is_active?: boolean;
}

// DELETE /api/survey-templates/:id
// Soft delete survey template
```

### **Survey Instances**
```typescript
// GET /api/surveys
// List surveys with filtering and pagination
interface ListSurveysRequest {
  page?: number;
  limit?: number;
  status?: 'in_progress' | 'completed' | 'failed';
  patient_phone?: string;
  template_id?: string;
}

interface ListSurveysResponse {
  surveys: Survey[];
  total: number;
  page: number;
  limit: number;
}

interface Survey {
  id: string;
  template_id: string;
  patient_phone: string;
  responses: SurveyResponse[];
  status: 'in_progress' | 'completed' | 'failed';
  call_duration?: number;
  created_at: string;
  completed_at?: string;
}

interface SurveyResponse {
  question_id: string;
  question_text: string;
  answer: string | number | boolean;
  timestamp: string;
}

// POST /api/surveys
// Create new survey instance
interface CreateSurveyRequest {
  template_id: string;
  patient_phone: string;
}

// PUT /api/surveys/:id/responses
// Update survey responses
interface UpdateSurveyResponsesRequest {
  responses: SurveyResponse[];
  status?: 'completed' | 'failed';
  call_duration?: number;
}
```

---

## 📞 **Campaign Management API**

### **Campaign Operations**
```typescript
// GET /api/campaigns
// List campaigns with pagination
interface ListCampaignsRequest {
  page?: number;
  limit?: number;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

interface ListCampaignsResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

interface Campaign {
  id: string;
  name: string;
  description?: string;
  survey_template_id: string;
  target_patients: string[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// POST /api/campaigns
// Create new campaign
interface CreateCampaignRequest {
  name: string;
  description?: string;
  survey_template_id: string;
  target_patients: string[];
  start_date?: string;
  end_date?: string;
}

// PUT /api/campaigns/:id
// Update campaign
interface UpdateCampaignRequest {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
  start_date?: string;
  end_date?: string;
}

// POST /api/campaigns/:id/start
// Start a campaign
// POST /api/campaigns/:id/pause
// Pause a campaign
// POST /api/campaigns/:id/complete
// Complete a campaign
```

### **Campaign Progress**
```typescript
// GET /api/campaigns/:id/progress
// Get campaign progress statistics
interface CampaignProgressResponse {
  campaign: Campaign;
  statistics: {
    total_patients: number;
    contacted_patients: number;
    completed_surveys: number;
    completion_rate: number;
    average_call_duration: number;
  };
  progress: CampaignProgress[];
}

interface CampaignProgress {
  id: string;
  patient_phone: string;
  survey_id?: string;
  status: 'pending' | 'contacted' | 'completed' | 'failed';
  attempts: number;
  last_attempt?: string;
  created_at: string;
  updated_at: string;
}
```

---

## 📞 **Telephony Integration API**

### **Telephony Settings**
```typescript
// GET /api/telephony-settings
// Get current telephony settings
interface TelephonySettingsResponse {
  id: string;
  telephony_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// PUT /api/telephony-settings
// Update telephony settings
interface UpdateTelephonySettingsRequest {
  telephony_token: string;
  is_active: boolean;
}

// POST /api/telephony/test-connection
// Test telephony connection
interface TestConnectionResponse {
  connected: boolean;
  message: string;
  details?: any;
}
```

### **Call Management**
```typescript
// GET /api/call-logs
// List call logs with filtering
interface ListCallLogsRequest {
  page?: number;
  limit?: number;
  patient_phone?: string;
  campaign_id?: string;
  start_date?: string;
  end_date?: string;
}

interface ListCallLogsResponse {
  call_logs: CallLog[];
  total: number;
  page: number;
  limit: number;
}

interface CallLog {
  id: string;
  patient_phone: string;
  campaign_id?: string;
  survey_id?: string;
  call_duration?: number;
  call_status: 'completed' | 'failed' | 'no_answer' | 'busy';
  recording_url?: string;
  created_at: string;
}
```

---

## 🔊 **Voice Service API**

### **WebSocket Endpoints**
```typescript
// WebSocket: ws://localhost:8000/ws/healthcare-questionnaire
// Real-time voice processing for surveys

interface VoiceWebSocketMessage {
  type: 'audio_chunk' | 'text_response' | 'survey_complete' | 'error';
  session_id: string;
  data: any;
  timestamp: string;
}

// Audio Chunk Message
interface AudioChunkMessage {
  type: 'audio_chunk';
  session_id: string;
  data: {
    audio_base64: string; // WebM/Opus encoded audio
    is_final: boolean;    // Last chunk of speech
  };
}

// Text Response Message
interface TextResponseMessage {
  type: 'text_response';
  session_id: string;
  data: {
    text: string;         // Transcribed Arabic text
    confidence: number;   // STT confidence score (0-1)
    is_final: boolean;    // Final transcription
  };
}

// Survey Complete Message
interface SurveyCompleteMessage {
  type: 'survey_complete';
  session_id: string;
  data: {
    survey_id: string;
    responses: SurveyResponse[];
    call_duration: number;
  };
}
```

### **Voice Service Health Check**
```typescript
// GET http://localhost:8000/health
// Check voice service status
interface VoiceServiceHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  voice_service: 'loaded' | 'loading' | 'error';
  models: {
    stt: string;
    tts: string;
  };
  models_loaded: boolean;
  uptime: number;
  memory_usage: number;
}
```

### **Voice Processing Endpoints**
```typescript
// POST http://localhost:8000/api/process-audio
// Process audio chunk (alternative to WebSocket)
interface ProcessAudioRequest {
  session_id: string;
  audio_base64: string;
  is_final: boolean;
}

interface ProcessAudioResponse {
  text: string;
  confidence: number;
  is_final: boolean;
  session_id: string;
}

// POST http://localhost:8000/api/generate-speech
// Generate TTS audio from text
interface GenerateSpeechRequest {
  text: string;
  language: 'ar'; // Arabic only for now
}

interface GenerateSpeechResponse {
  audio_base64: string; // WAV encoded audio
  duration: number;     // Audio duration in seconds
}
```

---

## 🩺 **Health Check API**

### **System Health**
```typescript
// GET /api/health
// Comprehensive system health check
interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: {
    database: 'connected' | 'disconnected';
    voice_service: 'connected' | 'disconnected';
    telephony: 'connected' | 'disconnected';
  };
  uptime: number;
  timestamp: string;
  version: string;
}

// GET /api/health/database
// Database health check
interface DatabaseHealthResponse {
  status: 'connected' | 'disconnected';
  response_time: number;
  database_size: string;
  active_connections: number;
}

// GET /api/health/voice
// Voice service health check
interface VoiceHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  models_loaded: boolean;
  stt_model: string;
  tts_model: string;
  memory_usage: number;
  response_time: number;
}
```

---

## 📊 **Analytics API**

### **Survey Analytics**
```typescript
// GET /api/analytics/surveys
// Survey completion and response analytics
interface SurveyAnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  total_surveys: number;
  completed_surveys: number;
  completion_rate: number;
  average_call_duration: number;
  template_breakdown: {
    template_id: string;
    template_name: string;
    count: number;
    completion_rate: number;
  }[];
}

// GET /api/analytics/campaigns
// Campaign performance analytics
interface CampaignAnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  active_campaigns: number;
  total_campaigns: number;
  campaign_performance: {
    campaign_id: string;
    campaign_name: string;
    total_patients: number;
    contacted_patients: number;
    completed_surveys: number;
    completion_rate: number;
    average_call_duration: number;
  }[];
}
```

### **Voice Analytics**
```typescript
// GET /api/analytics/voice
// Voice processing performance analytics
interface VoiceAnalyticsResponse {
  period: {
    start: string;
    end: string;
  };
  total_processing_sessions: number;
  average_processing_time: number;
  stt_accuracy: number;
  error_breakdown: {
    error_type: string;
    count: number;
    percentage: number;
  }[];
  performance_metrics: {
    date: string;
    average_response_time: number;
    success_rate: number;
    concurrent_sessions: number;
  }[];
}
```

---

## 🔧 **Utility API**

### **Export Operations**
```typescript
// POST /api/export/surveys
// Export survey data
interface ExportSurveysRequest {
  format: 'csv' | 'json' | 'excel';
  start_date?: string;
  end_date?: string;
  template_id?: string;
  status?: string;
}

interface ExportResponse {
  download_url: string;
  file_name: string;
  file_size: number;
  expires_at: string;
}

// POST /api/export/campaigns
// Export campaign data
interface ExportCampaignsRequest {
  format: 'csv' | 'json' | 'excel';
  campaign_ids?: string[];
  include_progress?: boolean;
}
```

### **System Configuration**
```typescript
// GET /api/config
// Get system configuration
interface SystemConfigResponse {
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    voice_processing: boolean;
    telephony_integration: boolean;
    multi_tenant: boolean;
    advanced_analytics: boolean;
  };
  limits: {
    max_concurrent_calls: number;
    max_surveys_per_campaign: number;
    data_retention_days: number;
  };
}
```

---

## 🛡️ **Error Handling**

### **Standard Error Response**
```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    request_id: string;
  };
}
```

### **Common Error Codes**
```typescript
// Authentication Errors
const AUTH_ERRORS = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
};

// Validation Errors
const VALIDATION_ERRORS = {
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',
};

// Business Logic Errors
const BUSINESS_ERRORS = {
  SURVEY_NOT_FOUND: 'SURVEY_NOT_FOUND',
  CAMPAIGN_NOT_ACTIVE: 'CAMPAIGN_NOT_ACTIVE',
  VOICE_SERVICE_UNAVAILABLE: 'VOICE_SERVICE_UNAVAILABLE',
  TELEPHONY_CONNECTION_FAILED: 'TELEPHONY_CONNECTION_FAILED',
};
```

---

## 📝 **API Testing**

### **Example API Calls**
```bash
# Test health endpoint
curl -X GET http://localhost:3000/api/health

# Test authentication
curl -X POST http://localhost:3000/api/auth/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "your-jwt-token"}'

# Test voice service health
curl -X GET http://localhost:8000/health

# Test WebSocket connection
# Use browser dev tools or WebSocket client
```

### **API Documentation**
- **Swagger/OpenAPI**: Available at `/api/docs` (if implemented)
- **Postman Collection**: Export available for testing
- **cURL Examples**: Provided in documentation

---

## 🔄 **WebSocket Flow Example**

### **Voice Survey Session**
```typescript
// 1. Establish WebSocket connection
const ws = new WebSocket('ws://localhost:8000/ws/healthcare-questionnaire');

// 2. Send audio chunks during speech
ws.send(JSON.stringify({
  type: 'audio_chunk',
  session_id: 'survey-123',
  data: {
    audio_base64: '...', // WebM/Opus encoded audio
    is_final: false
  }
}));

// 3. Receive transcriptions
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'text_response') {
    console.log('Transcription:', message.data.text);
  }
};

// 4. Finalize survey
ws.send(JSON.stringify({
  type: 'survey_complete',
  session_id: 'survey-123',
  data: {
    survey_id: 'survey-123',
    responses: [...],
    call_duration: 180
  }
}));
```

---

**Last Updated**: November 9, 2025  
**API Version**: 2.0  
**Next Review**: After API changes or new endpoints
