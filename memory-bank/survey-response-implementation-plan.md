# Survey Response Implementation Plan
## Complete Data Flow: Backend → Frontend → Database

## Executive Summary

**Goal**: Ensure survey questionnaire responses are properly saved to Supabase with complete metadata including phone number, date, and unique template identifier for hospital dashboard visibility.

**Current Status**: ✅ Partially Implemented
- Database schema: ✅ Complete (`template_responses` table with all required fields)
- Backend API: ✅ Complete (`/api/responses/submit` with validation)
- Python Voice Service: ⚠️ Missing response submission logic
- Data Flow: ❌ Incomplete (Python → Next.js API → Supabase)

## Current Implementation Analysis

### ✅ What's Working

#### 1. Database Schema (Supabase)
```sql
-- template_responses table has ALL required fields:
CREATE TABLE template_responses (
    id UUID PRIMARY KEY,
    template_id UUID NOT NULL,              -- ✅ Unique template identifier
    patient_id UUID NOT NULL,               -- ✅ Links to patient (has phone)
    hospital_id UUID NOT NULL,              -- ✅ Hospital context
    
    -- Response data
    answers_json JSONB NOT NULL,            -- ✅ All answers in sorted order
    metadata_json JSONB DEFAULT '{}',       -- ✅ Call context, timestamps
    
    -- Timestamps
    answered_at TIMESTAMP DEFAULT NOW(),    -- ✅ Date/time of response
    
    -- Performance metrics
    question_count INTEGER NOT NULL,
    answered_question_count INTEGER NOT NULL,
    completion_rate DECIMAL(5,2),
    response_time_seconds INTEGER,
    
    -- Deduplication
    response_hash VARCHAR(64) UNIQUE
);
```

#### 2. Backend API Endpoint (`/api/responses/submit`)
```typescript
// ✅ Complete implementation with:
// - JWT authentication
// - Template validation
// - Answer sorting validation
// - Deduplication via hash
// - Proper error handling

POST /api/responses/submit
Authorization: Bearer <JWT_TOKEN>

Request Body:
{
  "template_id": "uuid",
  "question_count": 5,
  "answers": [
    {
      "question_id": "q1",
      "question_order": 1,
      "response": "نعم",
      "confidence": 0.95,
      "response_time_seconds": 3.2
    }
  ],
  "metadata": {
    "session_id": "call_123",
    "patient_id": "uuid",
    "hospital_id": "uuid",
    "call_duration_seconds": 120,
    "call_context": { /* Maqsam context */ }
  }
}
```

### ❌ What's Missing

#### 1. Python Voice Service Response Submission
The `maqsam_handler.py` processes voice calls but **DOES NOT** send responses to the Next.js API:

```python
# Current code in _handle_audio_input():
response_text, audio_file_path = self.voice_service.process_voice_interaction(
    wav_bytes, session_context
)
# ❌ Missing: Send response_text to /api/responses/submit
```

**Problem**: Survey responses are processed but never saved to database!

#### 2. Session Context Tracking
The session context exists but doesn't accumulate responses:

```python
session_context = {
    "session_id": session_id,
    "questionnaire_state": "initial",
    "patient_responses": {},  # ❌ Never populated!
    "language": "ar",
    "call_context": {}
}
```

## Bulletproof Implementation Plan

### Phase 1: Python Voice Service Enhancement ⭐ CRITICAL

#### Step 1.1: Add HTTP Client for API Communication
```python
# Python/voice_service/app/maqsam_handler.py

import httpx
import os

class MaqsamProtocolHandler:
    def __init__(self, voice_service: VoiceService):
        self.voice_service = voice_service
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        
        # API configuration
        self.nextjs_api_url = os.getenv(
            "NEXTJS_API_URL", 
            "http://localhost:3000"
        )
        self.api_secret = os.getenv("VOICE_SERVICE_SECRET")
        
        # HTTP client for API calls
        self.http_client = httpx.AsyncClient(timeout=30.0)
```

#### Step 1.2: Track Survey Responses in Session Context
```python
async def _handle_audio_input(self, websocket: WebSocket, data: Dict[str, Any], 
                            session_id: str, session_context: Dict[str, Any]):
    """
    Enhanced to track and submit survey responses
    """
    try:
        # ... existing audio processing ...
        
        # Process voice interaction
        if self.voice_service:
            response_text, audio_file_path = self.voice_service.process_voice_interaction(
                wav_bytes, session_context
            )
            
            logger.info(f"{session_id}: Generated response: '{response_text}'")
            
            # ⭐ NEW: Track response in session context
            await self._track_survey_response(
                session_id, 
                session_context, 
                response_text
            )
            
            # Send audio response back to Maqsam
            if audio_file_path and os.path.exists(audio_file_path):
                await self._send_audio_response(websocket, audio_file_path, session_id)
                
                # ⭐ NEW: Check if survey is complete and submit
                if self._is_survey_complete(session_context):
                    await self._submit_survey_responses(session_id, session_context)
```

#### Step 1.3: Implement Response Normalization (Numeric Encoding)
```python
def _normalize_arabic_response(
    self, 
    response_text: str, 
    question_type: str = "yes_no"
) -> tuple[str, Optional[int]]:
    """
    Convert Arabic response to normalized text + numeric value
    
    Numeric Encoding:
    - Yes (نعم) = 1
    - No (لا) = 0
    - Uncertain (غير متأكد) = 3
    - Invalid/No response = None
    
    Returns: (normalized_text, numeric_value)
    """
    normalized = response_text.strip().lower()
    
    if question_type == "yes_no":
        # Yes responses (1)
        yes_patterns = ['نعم', 'اي', 'ايوه', 'yes', 'موافق', 'صحيح', 'اكيد']
        if any(pattern in normalized for pattern in yes_patterns):
            return "نعم", 1
        
        # No responses (0)
        no_patterns = ['لا', 'no', 'غير موافق', 'خطأ', 'ابدا']
        if any(pattern in normalized for pattern in no_patterns):
            return "لا", 0
        
        # Uncertain responses (3)
        uncertain_patterns = ['غير متأكد', 'لا اعرف', 'uncertain', 'maybe', 'ربما', 'مش متأكد']
        if any(pattern in normalized for pattern in uncertain_patterns):
            return "غير متأكد", 3
    
    elif question_type == "rating":
        # Rating scale 1-5
        import re
        numbers = re.findall(r'\d+', normalized)
        if numbers:
            rating = int(numbers[0])
            if 1 <= rating <= 5:
                return str(rating), rating
    
    # Invalid/unclear response
    logger.warning(f"Could not normalize response: '{response_text}'")
    return response_text, None

async def _track_survey_response(
    self, 
    session_id: str, 
    session_context: Dict[str, Any],
    response_text: str
):
    """
    Track individual question responses during the call with numeric encoding
    """
    try:
        # Get current question from context
        current_question = session_context.get("current_question", {})
        question_id = current_question.get("id")
        question_order = current_question.get("order", 0)
        question_type = current_question.get("type", "yes_no")
        
        if not question_id:
            logger.warning(f"{session_id}: No current question to track response")
            return
        
        # Initialize responses list if needed
        if "collected_responses" not in session_context:
            session_context["collected_responses"] = []
        
        # Calculate confidence score (from STT)
        confidence = session_context.get("last_stt_confidence", 0.8)
        
        # ⭐ Normalize response to get numeric value
        normalized_text, numeric_value = self._normalize_arabic_response(
            response_text, 
            question_type
        )
        
        # Record response with both text and numeric value
        response_entry = {
            "question_id": question_id,
            "question_order": question_order,
            "response_text": normalized_text,      # Normalized Arabic text
            "response_value": numeric_value,       # ⭐ Numeric: 1/0/3 or 1-5 for ratings
            "confidence": confidence,
            "response_time_seconds": time.time() - session_context.get("question_start_time", time.time()),
            "timestamp": time.time()
        }
        
        session_context["collected_responses"].append(response_entry)
        
        logger.info(f"{session_id}: Tracked response for Q{question_order}: "
                   f"'{normalized_text}' (value: {numeric_value}, confidence: {confidence})")
        
    except Exception as e:
        logger.error(f"{session_id}: Error tracking response: {e}")

def _is_survey_complete(self, session_context: Dict[str, Any]) -> bool:
    """
    Check if all survey questions have been answered
    """
    total_questions = session_context.get("total_questions", 0)
    collected_responses = session_context.get("collected_responses", [])
    
    return len(collected_responses) >= total_questions and total_questions > 0
```

#### Step 1.4: Implement API Submission
```python
async def _submit_survey_responses(
    self, 
    session_id: str, 
    session_context: Dict[str, Any]
):
    """
    Submit collected survey responses to Next.js API
    """
    try:
        # Extract data from session context
        template_id = session_context.get("template_id")
        patient_id = session_context.get("patient_id")
        hospital_id = session_context.get("hospital_id")
        collected_responses = session_context.get("collected_responses", [])
        call_context = session_context.get("call_context", {})
        
        if not template_id or not hospital_id:
            logger.error(f"{session_id}: Missing template_id or hospital_id for submission")
            return
        
        # Sort responses by question_order
        sorted_responses = sorted(collected_responses, key=lambda x: x["question_order"])
        
        # Prepare API request
        payload = {
            "template_id": template_id,
            "question_count": session_context.get("total_questions", len(sorted_responses)),
            "answers": sorted_responses,
            "metadata": {
                "session_id": session_id,
                "patient_id": patient_id,
                "hospital_id": hospital_id,
                "campaign_id": session_context.get("campaign_id"),
                "call_duration_seconds": int(time.time() - session_context.get("call_start_time", time.time())),
                "voice_quality_score": session_context.get("voice_quality_score"),
                "call_context": call_context
            }
        }
        
        # Generate JWT token for API authentication
        jwt_token = self._generate_service_jwt(hospital_id)
        
        # Submit to Next.js API
        api_url = f"{self.nextjs_api_url}/api/responses/submit"
        headers = {
            "Authorization": f"Bearer {jwt_token}",
            "Content-Type": "application/json"
        }
        
        logger.info(f"{session_id}: Submitting {len(sorted_responses)} responses to {api_url}")
        
        response = await self.http_client.post(
            api_url,
            json=payload,
            headers=headers
        )
        
        if response.status_code == 200:
            result = response.json()
            logger.info(f"{session_id}: ✅ Survey responses submitted successfully! "
                       f"Response ID: {result.get('response_id')}, "
                       f"Completion rate: {result.get('completion_rate')}")
            
            # Mark as submitted in session
            session_context["responses_submitted"] = True
            session_context["submission_result"] = result
        else:
            logger.error(f"{session_id}: ❌ Failed to submit responses: {response.status_code} - {response.text}")
            
    except Exception as e:
        logger.error(f"{session_id}: Error submitting survey responses: {e}")

def _generate_service_jwt(self, hospital_id: str) -> str:
    """
    Generate JWT token for service-to-service authentication
    """
    import jwt
    from datetime import datetime, timedelta
    
    payload = {
        "hospital_id": hospital_id,
        "role": "voice_service",
        "exp": datetime.utcnow() + timedelta(minutes=5),
        "iat": datetime.utcnow()
    }
    
    return jwt.encode(payload, self.api_secret, algorithm="HS256")
```

### Phase 2: Voice Service Integration

#### Step 2.1: Update Voice Service to Provide Question Context
```python
# Python/voice_service/app/services.py

class VoiceService:
    def process_voice_interaction(
        self, 
        audio_bytes: bytes, 
        session_context: Dict[str, Any]
    ) -> Tuple[str, Optional[str]]:
        """
        Enhanced to provide question context for response tracking
        """
        # ... existing STT processing ...
        
        # Get current questionnaire state
        questionnaire_state = session_context.get("questionnaire_state", "initial")
        
        if questionnaire_state == "initial":
            # Send greeting
            response_text = self._get_greeting_text(session_context)
            session_context["questionnaire_state"] = "asking"
            session_context["current_question_index"] = 0
            
        elif questionnaire_state == "asking":
            # Ask next question
            response_text, question_info = self._get_next_question(session_context)
            
            # ⭐ NEW: Set current question context for response tracking
            session_context["current_question"] = question_info
            session_context["question_start_time"] = time.time()
            session_context["questionnaire_state"] = "listening"
            
        elif questionnaire_state == "listening":
            # Process patient response
            patient_response = transcribed_text
            
            # ⭐ NEW: Store STT confidence for response tracking
            session_context["last_stt_confidence"] = stt_confidence
            
            # Move to next question
            session_context["current_question_index"] += 1
            session_context["questionnaire_state"] = "asking"
            
            # Acknowledgment
            response_text = "شكراً"  # Thank you
        
        # Generate TTS audio
        audio_file_path = self._generate_tts_audio(response_text)
        
        return response_text, audio_file_path
    
    def _get_next_question(self, session_context: Dict[str, Any]) -> Tuple[str, Dict[str, Any]]:
        """
        Get next question from template
        """
        template_id = session_context.get("template_id")
        current_index = session_context.get("current_question_index", 0)
        
        # Load template questions (from cache or database)
        questions = self._load_template_questions(template_id)
        
        if current_index >= len(questions):
            # Survey complete
            session_context["questionnaire_state"] = "complete"
            return "شكراً لوقتك. وداعاً", {}  # Thank you for your time. Goodbye
        
        question = questions[current_index]
        
        question_info = {
            "id": question["id"],
            "order": current_index + 1,
            "text": question["text_ar"],
            "type": question["type"]
        }
        
        # Store total questions for completion tracking
        session_context["total_questions"] = len(questions)
        
        return question["text_ar"], question_info
```

### Phase 3: Environment Configuration

#### Step 3.1: Add Environment Variables
```bash
# Python/voice_service/.env
NEXTJS_API_URL=http://localhost:3000
VOICE_SERVICE_SECRET=your_shared_secret_key_here

# For production (Railway):
NEXTJS_API_URL=https://your-nextjs-app.railway.app
```

#### Step 3.2: Update Next.js API to Accept Service Tokens
```typescript
// src/app/api/responses/submit/route.ts

// Add service role validation
if (decoded.role === 'voice_service') {
  // Voice service can submit on behalf of any hospital
  // Validate the hospital_id exists
  const { data: hospital } = await supabase
    .from('hospitals')
    .select('id')
    .eq('id', metadata.hospital_id)
    .single();
    
  if (!hospital) {
    return NextResponse.json(
      { error: 'Invalid hospital_id' },
      { status: 400 }
    );
  }
}
```

### Phase 4: Hospital Dashboard Integration

#### Step 4.1: Create Response Viewing API
```typescript
// src/app/api/hospital/responses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyHospitalToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.substring(7);
    const decoded = await verifyHospitalToken(token);
    
    const url = new URL(request.url);
    const templateId = url.searchParams.get('template_id');
    const patientId = url.searchParams.get('patient_id');
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    
    // Build query
    let query = supabase
      .from('template_responses')
      .select(`
        *,
        patients:patient_id (
          first_name,
          phone_number,
          medical_record_number
        )
      `)
      .eq('hospital_id', decoded.hospital_id)
      .order('answered_at', { ascending: false });
    
    if (templateId) query = query.eq('template_id', templateId);
    if (patientId) query = query.eq('patient_id', patientId);
    if (startDate) query = query.gte('answered_at', startDate);
    if (endDate) query = query.lte('answered_at', endDate);
    
    const { data, error } = await query.limit(100);
    
    if (error) throw error;
    
    return NextResponse.json({
      responses: data,
      count: data.length
    });
    
  } catch (error) {
    console.error('Error fetching responses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
```

#### Step 4.2: Create Hospital Dashboard Page
```typescript
// src/app/hospital/responses/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface SurveyResponse {
  id: string;
  template_id: string;
  answered_at: string;
  completion_rate: number;
  answers_json: Array<{
    question_id: string;
    question_order: number;
    response: string;
    confidence: number;
  }>;
  patients: {
    first_name: string;
    phone_number: string;
    medical_record_number: string;
  };
}

export default function ResponsesPage() {
  const { token } = useAuth();
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchResponses();
  }, []);
  
  const fetchResponses = async () => {
    try {
      const res = await fetch('/api/hospital/responses', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await res.json();
      setResponses(data.responses);
    } catch (error) {
      console.error('Error fetching responses:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Survey Responses</h1>
      
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">Patient</th>
              <th className="px-6 py-3 text-left">Phone Number</th>
              <th className="px-6 py-3 text-left">Date</th>
              <th className="px-6 py-3 text-left">Completion</th>
              <th className="px-6 py-3 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {responses.map((response) => (
              <tr key={response.id} className="border-t">
                <td className="px-6 py-4">
                  {response.patients.first_name}
                  <br />
                  <span className="text-sm text-gray-500">
                    MRN: {response.patients.medical_record_number}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono">
                  {response.patients.phone_number}
                </td>
                <td className="px-6 py-4">
                  {new Date(response.answered_at).toLocaleString('ar-SA')}
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded ${
                    response.completion_rate >= 0.8 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(response.completion_rate * 100).toFixed(0)}%
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button 
                    onClick={() => viewDetails(response)}
                    className="text-blue-600 hover:underline"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Implementation Checklist

### Phase 1: Python Voice Service ⭐ CRITICAL
- [ ] Add httpx dependency to `pyproject.toml`
- [ ] Implement `_normalize_arabic_response()` method (numeric encoding 1/0/3)
- [ ] Implement `_track_survey_response()` method with numeric values
- [ ] Implement `_is_survey_complete()` method
- [ ] Implement `_submit_survey_responses()` method
- [ ] Implement `_generate_service_jwt()` method
- [ ] Add environment variables (NEXTJS_API_URL, VOICE_SERVICE_SECRET)
- [ ] Test response normalization with Arabic patterns
- [ ] Test response tracking during calls

### Phase 2: Voice Service Integration
- [ ] Update `process_voice_interaction()` to provide question context
- [ ] Implement `_get_next_question()` with question info
- [ ] Add template question loading/caching
- [ ] Test question flow and context tracking

### Phase 3: API Enhancement
- [ ] Update `/api/responses/submit` to accept service tokens
- [ ] Add hospital validation for service submissions
- [ ] Add validation for `response_value` field (must be 1, 0, 3, or null)
- [ ] Test API with service JWT tokens
- [ ] Test API with numeric response values

### Phase 4: Hospital Dashboard
- [ ] Create `/api/hospital/responses` endpoint
- [ ] Create `/hospital/responses` page with numeric value display
- [ ] Add response detail view modal
- [ ] Add filtering by date, template, patient, response_value
- [ ] Create analytics queries using numeric values (yes/no/uncertain percentages)
- [ ] Build dashboard charts with response value aggregation
- [ ] Add response value badge components (1=Green, 0=Red, 3=Yellow)
- [ ] Test dashboard with real data

### Phase 5: Testing & Validation
- [ ] End-to-end test: Call → Response → Database → Dashboard
- [ ] Verify phone numbers are captured correctly
- [ ] Verify timestamps are accurate
- [ ] Verify template_id links correctly
- [ ] Test with multiple concurrent calls
- [ ] Test error handling and retry logic

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     COMPLETE DATA FLOW                          │
└─────────────────────────────────────────────────────────────────┘

1. CALL INITIATION
   Maqsam → Python Voice Service (WebSocket)
   ├─ session.setup (call_context with phone numbers)
   └─ session_context initialized

2. SURVEY EXECUTION
   Python Voice Service
   ├─ Ask Question → TTS → Maqsam → Patient
   ├─ Patient Response → Maqsam → STT → Python
   ├─ _track_survey_response() → session_context["collected_responses"]
   └─ Repeat for all questions

3. SURVEY COMPLETION
   Python Voice Service
   ├─ _is_survey_complete() → true
   ├─ _submit_survey_responses()
   │   ├─ Generate JWT token
   │   ├─ Prepare payload with sorted answers
   │   └─ POST to /api/responses/submit

4. API PROCESSING
   Next.js API (/api/responses/submit)
   ├─ Verify JWT token
   ├─ Validate template exists
   ├─ Validate answer structure
   ├─ Generate response_hash
   └─ INSERT into template_responses table

5. DATABASE STORAGE
   Supabase (template_responses)
   ├─ template_id: UUID ✅
   ├─ patient_id: UUID (links to phone_number) ✅
   ├─ hospital_id: UUID ✅
   ├─ answered_at: TIMESTAMP ✅
   ├─ answers_json: JSONB (sorted responses) ✅
   └─ metadata_json: JSONB (call context) ✅

6. HOSPITAL DASHBOARD
   Hospital Staff
   ├─ Login → JWT token
   ├─ GET /api/hospital/responses
   ├─ View responses with:
   │   ├─ Patient name & phone number
   │   ├─ Response date & time
   │   ├─ Template identifier
   │   └─ Individual answers
   └─ Filter & export data
```

## Success Criteria

✅ **Complete Implementation When:**
1. Python voice service tracks responses during calls
2. Responses are automatically submitted to Next.js API
3. API validates and saves to Supabase
4. Hospital dashboard displays responses with:
   - Patient phone number
   - Response date/time
   - Template identifier
   - Individual question answers
5. End-to-end test passes: Call → Database → Dashboard
6. No manual intervention required
7. Error handling and retry logic in place

## Risk Mitigation

### Risk 1: Network Failures During Submission
**Mitigation**: 
- Implement retry logic with exponential backoff
- Store failed submissions locally for later retry
- Add submission queue with persistence

### Risk 2: JWT Token Expiration
**Mitigation**:
- Use short-lived tokens (5 minutes)
- Generate fresh token for each submission
- Add token refresh logic if needed

### Risk 3: Duplicate Submissions
**Mitigation**:
- ✅ Already implemented: `response_hash` for deduplication
- Database unique constraint prevents duplicates
- API returns success even for duplicates

### Risk 4: Missing Patient/Hospital Context
**Mitigation**:
- Validate context at call initiation
- Reject calls without required context
- Log missing context errors for debugging

## Numeric Response Encoding Standard

### ⭐ Core Feature: Numeric Values for Analytics

**For Yes/No/Uncertain Questions:**
- `1` = Yes (نعم) ✅
- `0` = No (لا) ❌
- `3` = Uncertain (غير متأكد) ⚠️
- `null` = No response / Invalid

**For Rating Questions (1-5 scale):**
- `1` to `5` = Rating value

### Benefits of Numeric Encoding

1. **Database Efficiency**: Fast aggregation queries
   ```sql
   -- Calculate yes percentage
   SELECT AVG(CASE WHEN response_value = 1 THEN 1.0 ELSE 0.0 END) * 100 
   FROM responses;
   ```

2. **Easy Analytics**: Direct statistical analysis
   ```typescript
   const yesCount = responses.filter(r => r.response_value === 1).length;
   const yesPercentage = (yesCount / total) * 100;
   ```

3. **Chart-Ready**: No conversion needed for visualization
   ```typescript
   const chartData = {
     yes: responses.filter(r => r.response_value === 1).length,
     no: responses.filter(r => r.response_value === 0).length,
     uncertain: responses.filter(r => r.response_value === 3).length
   };
   ```

4. **Language-Independent**: Works across Arabic/English interfaces

5. **Simple Filtering**: `WHERE response_value = 1` vs complex text matching

### Response Format Example

```json
{
  "question_id": "q1",
  "question_order": 1,
  "response_text": "نعم",        // Human-readable Arabic
  "response_value": 1,           // Machine-readable numeric
  "confidence": 0.95,
  "response_time_seconds": 3.2
}
```

### Database Query Examples

```sql
-- Get all "Yes" responses
SELECT * FROM template_responses 
WHERE answers_json @> '[{"response_value": 1}]';

-- Calculate response distribution per question
SELECT 
  question_id,
  COUNT(*) FILTER (WHERE response_value = 1) as yes_count,
  COUNT(*) FILTER (WHERE response_value = 0) as no_count,
  COUNT(*) FILTER (WHERE response_value = 3) as uncertain_count,
  COUNT(*) FILTER (WHERE response_value IS NULL) as invalid_count
FROM template_responses,
  jsonb_to_recordset(answers_json) as answers(
    question_id text,
    response_value int
  )
GROUP BY question_id;

-- Get average satisfaction (for rating questions)
SELECT AVG(response_value) as avg_rating
FROM template_responses,
  jsonb_to_recordset(answers_json) as answers(response_value int)
WHERE question_id = 'satisfaction_rating';
```

## Next Steps

1. **Immediate**: Implement Phase 1 (Python Voice Service Enhancement with numeric encoding)
2. **Week 1**: Complete Phases 2-3 (Integration & API with numeric validation)
3. **Week 2**: Implement Phase 4 (Hospital Dashboard with numeric analytics)
4. **Week 3**: Testing & Validation
5. **Week 4**: Production deployment & monitoring

---

**Document Version**: 1.1  
**Last Updated**: November 17, 2025  
**Status**: Ready for Implementation  
**Priority**: ⭐ CRITICAL - Core Feature  
**Enhancement**: Added numeric response encoding (1/0/3) for analytics
