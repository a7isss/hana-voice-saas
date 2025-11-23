# Campaign-Initiated Survey Call Architecture
## Clean, Modular Design with Clear Error Boundaries

## Executive Summary

This document defines a **clean, modular architecture** for initiating survey calls through the campaigns system. Each component has a **single responsibility** and **clear error boundaries**, making debugging and maintenance straightforward.

## Architecture Principles

### 1. Separation of Concerns
- **Frontend**: User interaction and campaign management
- **API Layer**: Business logic and validation
- **Call Orchestrator**: Call initiation and scheduling
- **Voice Service**: Audio processing and survey execution
- **Database**: Data persistence and state management

### 2. Error Isolation
- Each module has its own error handling
- Errors are logged with module-specific prefixes
- Failed components don't crash the entire system
- Clear error propagation path

### 3. Modularity
- Each component can be tested independently
- Components communicate through well-defined interfaces
- Easy to replace or upgrade individual modules

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAMPAIGN CALL FLOW                           │
└─────────────────────────────────────────────────────────────────┘

1. FRONTEND (Hospital Dashboard)
   └─ /hospital/campaigns
      ├─ Create Campaign
      ├─ Select Survey Template
      ├─ Choose Patients
      └─ Click "Start Campaign"

2. API LAYER (Next.js)
   └─ POST /api/campaigns/initiate
      ├─ Validate campaign data
      ├─ Check hospital permissions
      ├─ Verify survey template exists
      └─ Create call queue

3. CALL ORCHESTRATOR (New Service)
   └─ /api/calls/orchestrate
      ├─ Load campaign details
      ├─ Get patient list
      ├─ Schedule calls
      └─ Initiate calls one-by-one

4. TELEPHONY GATEWAY (Maqsam Integration)
   └─ POST /api/calls/initiate
      ├─ Generate call context
      ├─ Call Maqsam API
      └─ Create call session

5. VOICE SERVICE (Python)
   └─ WebSocket /voice/maqsam
      ├─ Receive call
      ├─ Load survey template
      ├─ Execute survey flow
      └─ Submit responses

6. RESPONSE HANDLER (Next.js)
   └─ POST /api/responses/submit
      ├─ Validate responses
      ├─ Save to database
      └─ Update campaign analytics
```

## Module Breakdown

### Module 1: Campaign Manager (Frontend)
**Location**: `src/app/hospital/campaigns/`

**Responsibility**: Campaign creation and management UI

**Files**:
```
src/app/hospital/campaigns/
├── page.tsx                    # Campaign list view
├── create/
│   └── page.tsx               # Campaign creation form
├── [id]/
│   ├── page.tsx               # Campaign details
│   └── start/
│       └── page.tsx           # Campaign start confirmation
└── components/
    ├── CampaignCard.tsx       # Campaign display card
    ├── CampaignForm.tsx       # Campaign creation form
    └── StartCampaignModal.tsx # Start confirmation modal
```

**Error Handling**:
- Form validation errors → Display inline
- API errors → Toast notifications
- Network errors → Retry button

**Key Functions**:
```typescript
// Create campaign
async function createCampaign(data: CampaignData): Promise<Campaign>

// Start campaign
async function startCampaign(campaignId: string): Promise<void>

// Monitor campaign
async function getCampaignStatus(campaignId: string): Promise<CampaignStatus>
```

---

### Module 2: Campaign API (Backend)
**Location**: `src/app/api/campaigns/`

**Responsibility**: Campaign business logic and validation

**Files**:
```
src/app/api/campaigns/
├── route.ts                   # GET/POST campaigns
├── [id]/
│   ├── route.ts              # GET/PUT/DELETE campaign
│   └── start/
│       └── route.ts          # POST start campaign
├── initiate/
│   └── route.ts              # POST initiate calls
└── status/
    └── route.ts              # GET campaign status
```

**Error Handling**:
- Validation errors → 400 with details
- Permission errors → 403 with message
- Not found → 404
- Server errors → 500 with error ID

**Key Endpoints**:
```typescript
// POST /api/campaigns/[id]/start
// Validates and queues campaign for execution
export async function POST(request: NextRequest, { params }: { params: { id: string } })

// POST /api/campaigns/initiate
// Initiates actual call execution
export async function POST(request: NextRequest)
```

---

### Module 3: Call Orchestrator (New Service)
**Location**: `src/lib/services/callOrchestrator.ts`

**Responsibility**: Manage call queue and scheduling

**Purpose**: Separate call scheduling logic from campaign management

**Class Structure**:
```typescript
class CallOrchestrator {
  // Queue management
  async queueCampaignCalls(campaignId: string): Promise<QueueResult>
  
  // Call scheduling
  async scheduleNextCall(campaignId: string): Promise<CallSchedule>
  
  // Call initiation
  async initiateCall(callData: CallData): Promise<CallResult>
  
  // Status tracking
  async updateCallStatus(callId: string, status: CallStatus): Promise<void>
  
  // Error recovery
  async retryFailedCall(callId: string): Promise<CallResult>
}
```

**Error Handling**:
- Queue full → Delay and retry
- Invalid call data → Skip and log
- Telephony errors → Retry with backoff
- Max retries reached → Mark as failed

**State Management**:
```typescript
interface CallQueueItem {
  id: string;
  campaign_id: string;
  patient_id: string;
  template_id: string;
  hospital_id: string;
  scheduled_at: Date;
  status: 'queued' | 'calling' | 'completed' | 'failed';
  retry_count: number;
  error_message?: string;
}
```

---

### Module 4: Telephony Gateway
**Location**: `src/lib/services/telephonyGateway.ts`

**Responsibility**: Interface with Maqsam API

**Purpose**: Isolate telephony provider logic

**Class Structure**:
```typescript
class TelephonyGateway {
  // Call initiation
  async initiateCall(phoneNumber: string, context: CallContext): Promise<CallSession>
  
  // Call control
  async hangupCall(callSid: string): Promise<void>
  async transferCall(callSid: string, destination: string): Promise<void>
  
  // Status monitoring
  async getCallStatus(callSid: string): Promise<CallStatus>
  
  // WebSocket URL generation
  generateWebSocketUrl(callSid: string): string
}

interface CallContext {
  campaign_id: string;
  patient_id: string;
  template_id: string;
  hospital_id: string;
  survey_questions: Question[];
}
```

**Error Handling**:
- API errors → Throw TelephonyError
- Network errors → Retry with exponential backoff
- Invalid credentials → Alert admin
- Rate limiting → Queue and delay

---

### Module 5: Survey Executor (Python Voice Service)
**Location**: `Python/voice_service/app/survey_executor.py`

**Responsibility**: Execute survey flow during call

**Purpose**: Separate survey logic from telephony handling

**Class Structure**:
```python
class SurveyExecutor:
    """Executes survey flow with clean state management"""
    
    def __init__(self, template_id: str, session_context: Dict[str, Any]):
        self.template_id = template_id
        self.session_context = session_context
        self.questions = []
        self.current_index = 0
        self.responses = []
    
    async def load_template(self) -> bool:
        """Load survey template from database/cache"""
        pass
    
    async def start_survey(self) -> str:
        """Return greeting message"""
        pass
    
    async def get_next_question(self) -> Optional[Question]:
        """Get next question or None if complete"""
        pass
    
    async def process_response(self, audio_bytes: bytes) -> Response:
        """Process patient response with STT"""
        pass
    
    async def is_complete(self) -> bool:
        """Check if survey is complete"""
        pass
    
    async def submit_responses(self) -> SubmissionResult:
        """Submit all responses to API"""
        pass
```

**Error Handling**:
- Template not found → End call gracefully
- STT failure → Ask to repeat
- Low confidence → Ask to repeat
- Submission failure → Retry 3 times, then save locally

---

### Module 6: Response Handler
**Location**: `src/app/api/responses/submit/route.ts` (Already implemented)

**Responsibility**: Validate and save survey responses

**Error Handling**: ✅ Already implemented
- Invalid template → 400
- Invalid hospital → 400
- Duplicate response → 200 (idempotent)
- Database error → 500

---

## Data Flow with Error Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                    ERROR BOUNDARY MAP                           │
└─────────────────────────────────────────────────────────────────┘

[Frontend: Campaign Manager]
├─ Error: Form validation
│  └─ Handle: Display inline errors
├─ Error: API request failed
│  └─ Handle: Toast notification + retry button
└─ Error: Network timeout
   └─ Handle: Offline indicator + queue for retry

[API: Campaign Endpoints]
├─ Error: Invalid campaign data
│  └─ Handle: Return 400 with validation details
├─ Error: Permission denied
│  └─ Handle: Return 403 with reason
└─ Error: Database error
   └─ Handle: Return 500 + log error ID

[Service: Call Orchestrator]
├─ Error: Queue full
│  └─ Handle: Delay 5s + retry
├─ Error: Invalid call data
│  └─ Handle: Skip call + log + notify admin
└─ Error: Max retries reached
   └─ Handle: Mark failed + update campaign stats

[Service: Telephony Gateway]
├─ Error: Maqsam API error
│  └─ Handle: Retry with backoff (3 attempts)
├─ Error: Rate limit
│  └─ Handle: Queue + delay based on rate limit
└─ Error: Invalid credentials
   └─ Handle: Alert admin + pause campaign

[Python: Survey Executor]
├─ Error: Template not found
│  └─ Handle: Play error message + end call
├─ Error: STT low confidence
│  └─ Handle: Ask to repeat (max 2 times)
└─ Error: Response submission failed
   └─ Handle: Retry 3 times + save locally + alert

[API: Response Handler]
├─ Error: Invalid data
│  └─ Handle: Return 400 with details
└─ Error: Database error
   └─ Handle: Return 500 + log + retry queue
```

## Implementation Plan

### Phase 1: Call Orchestrator Service
**Files to Create**:
1. `src/lib/services/callOrchestrator.ts` - Main orchestrator
2. `src/lib/types/campaign.ts` - TypeScript types
3. `src/app/api/campaigns/[id]/start/route.ts` - Start endpoint

**Responsibilities**:
- Queue campaign calls
- Schedule call execution
- Track call status
- Handle retries

### Phase 2: Telephony Gateway
**Files to Create**:
1. `src/lib/services/telephonyGateway.ts` - Maqsam interface
2. `src/lib/types/telephony.ts` - Telephony types
3. `src/app/api/calls/initiate/route.ts` - Call initiation endpoint

**Responsibilities**:
- Initiate calls via Maqsam
- Generate WebSocket URLs
- Monitor call status
- Handle telephony errors

### Phase 3: Survey Executor (Python)
**Files to Create**:
1. `Python/voice_service/app/survey_executor.py` - Survey logic
2. `Python/voice_service/app/template_loader.py` - Template management
3. `Python/voice_service/app/response_submitter.py` - Response submission

**Responsibilities**:
- Load survey templates
- Execute survey flow
- Process responses
- Submit to API

### Phase 4: Frontend Integration
**Files to Update**:
1. `src/app/hospital/campaigns/[id]/page.tsx` - Add start button
2. `src/app/hospital/campaigns/components/StartCampaignModal.tsx` - Confirmation
3. `src/app/hospital/campaigns/components/CampaignMonitor.tsx` - Real-time status

**Responsibilities**:
- Campaign start UI
- Real-time monitoring
- Error display
- Progress tracking

### Phase 5: Error Handling & Logging
**Files to Create**:
1. `src/lib/utils/errorLogger.ts` - Centralized logging
2. `src/lib/utils/errorBoundary.tsx` - React error boundary
3. `Python/voice_service/app/error_handler.py` - Python error handling

**Responsibilities**:
- Centralized error logging
- Error categorization
- Alert generation
- Error recovery

## Error Logging Strategy

### Log Levels
```typescript
enum LogLevel {
  DEBUG = 'DEBUG',     // Development only
  INFO = 'INFO',       // Normal operations
  WARN = 'WARN',       // Recoverable errors
  ERROR = 'ERROR',     // Failures requiring attention
  CRITICAL = 'CRITICAL' // System-wide failures
}
```

### Log Format
```typescript
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;        // e.g., 'CallOrchestrator', 'TelephonyGateway'
  function: string;      // e.g., 'initiateCall', 'submitResponses'
  message: string;
  error?: Error;
  context?: {
    campaign_id?: string;
    call_id?: string;
    patient_id?: string;
    hospital_id?: string;
  };
}
```

### Module-Specific Prefixes
```
[CAMPAIGN] - Campaign management
[ORCHESTRATOR] - Call orchestration
[TELEPHONY] - Telephony gateway
[SURVEY] - Survey execution
[RESPONSE] - Response handling
[DB] - Database operations
```

### Example Logs
```
[INFO] [CAMPAIGN] createCampaign: Campaign created successfully (ID: abc-123)
[WARN] [ORCHESTRATOR] scheduleNextCall: Queue at 80% capacity
[ERROR] [TELEPHONY] initiateCall: Maqsam API error (retry 1/3)
[CRITICAL] [DB] saveResponse: Database connection lost
```

## Testing Strategy

### Unit Tests
- Each module tested independently
- Mock external dependencies
- Test error handling paths

### Integration Tests
- Test module interactions
- Test error propagation
- Test retry logic

### End-to-End Tests
- Full campaign flow
- Error recovery scenarios
- Performance under load

## Monitoring & Alerts

### Metrics to Track
```typescript
interface CampaignMetrics {
  // Call metrics
  calls_queued: number;
  calls_in_progress: number;
  calls_completed: number;
  calls_failed: number;
  
  // Performance metrics
  average_call_duration: number;
  average_queue_time: number;
  success_rate: number;
  
  // Error metrics
  error_count_by_type: Record<string, number>;
  retry_count: number;
  failed_after_retry: number;
}
```

### Alert Conditions
- Error rate > 10% → Alert admin
- Queue size > 1000 → Slow down
- Success rate < 70% → Investigate
- Database errors → Critical alert

## Next Steps

1. **Review & Approve Architecture**
2. **Implement Phase 1: Call Orchestrator**
3. **Implement Phase 2: Telephony Gateway**
4. **Implement Phase 3: Survey Executor**
5. **Implement Phase 4: Frontend Integration**
6. **Implement Phase 5: Error Handling**
7. **Testing & Validation**
8. **Production Deployment**

---

**Document Version**: 1.0  
**Last Updated**: November 17, 2025  
**Status**: Architecture Design - Ready for Implementation  
**Priority**: ⭐ HIGH - Core Campaign Feature
