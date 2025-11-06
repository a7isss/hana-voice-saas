# Survey Questionnaire System Implementation Plan

## Executive Summary

This document outlines the implementation of a survey questionnaire system for Hana Voice SaaS that converts the current script-based calling robot into a structured survey tool. The system will maintain parallel functionality with the existing voice testing and calling robot features to ensure safe development and testing.

## Current System State (Preserved)

### Existing Functionality ✅
- **Agent Configuration**: Arabic script management with voice testing
- **Voice Tester**: Real-time script testing with TTS/STT integration
- **Calling Robot**: Professional voice interface with script playback
- **Demo Call**: Voice testing interface with Maqsam integration

### Database Tables (Existing)
- `audio_sets`: JSONB fields for configuration, audio_files, survey_flow
- `company_greetings`: Hospital-specific greeting audio files
- `agent_scripts`: Arabic conversation scripts with metadata

## Survey Questionnaire System Requirements

### Core Flow
1. **Call Initiation**: Customer phone number input
2. **Welcome Message**: Hospital-specific greeting + "this will take only a minute"
3. **Question Sequence**: TTS reads each question → configurable pause (1-20 seconds)
4. **Response Capture**: STT listens for "yes/no/uncertain" during pauses
5. **Completion**: Goodbye message and call termination

### Key Features
- **Pre-recorded Templates**: Generate audio once, store as files, play instantly
- **Configurable Pauses**: 1-20 second pause settings between questions
- **Hospital Branding**: Different greetings per hospital
- **Response Validation**: Arabic STT for yes/no/uncertain responses
- **Future Name Calling**: Infrastructure for personalized customer calls

## Implementation Strategy

### Phase 1: Database Foundation
**Goal**: Extend schema while preserving existing functionality

#### New Tables
```sql
-- Survey templates
CREATE TABLE surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  hospital_id TEXT NOT NULL,
  department_id TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Individual survey questions
CREATE TABLE survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL, -- Arabic question text
  question_order INTEGER NOT NULL,
  pause_seconds INTEGER DEFAULT 5 CHECK (pause_seconds BETWEEN 1 AND 20),
  expected_responses TEXT[] DEFAULT ARRAY['نعم', 'لا', 'غير متأكد'], -- Arabic responses
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-recorded voice templates
CREATE TABLE voice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
  question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
  template_type TEXT NOT NULL CHECK (template_type IN ('greeting', 'question', 'goodbye')),
  audio_file_path TEXT NOT NULL, -- Supabase storage path
  audio_duration_seconds DECIMAL(5,2),
  language TEXT DEFAULT 'ar',
  voice_model TEXT DEFAULT 'tts_arabic',
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Survey call responses
CREATE TABLE survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID REFERENCES surveys(id),
  call_sid TEXT NOT NULL, -- Maqsam call identifier
  customer_phone TEXT NOT NULL,
  customer_name TEXT, -- Future: for personalized calling
  hospital_id TEXT NOT NULL,
  question_id UUID REFERENCES survey_questions(id),
  response_text TEXT, -- Raw STT transcription
  response_value TEXT CHECK (response_value IN ('yes', 'no', 'uncertain')),
  confidence_score DECIMAL(3,2), -- STT confidence 0.0-1.0
  response_timestamp TIMESTAMPTZ DEFAULT NOW(),
  call_duration_seconds INTEGER,
  call_status TEXT DEFAULT 'completed' CHECK (call_status IN ('completed', 'failed', 'timeout'))
);
```

#### Migration Strategy
- **Backward Compatibility**: All existing tables remain unchanged
- **New Tables**: Added alongside existing schema
- **Rollback Plan**: DROP TABLE commands for new tables if needed

### Phase 2: Voice Template System
**Goal**: Pre-recorded audio generation and management

#### Template Generation Service
```typescript
// New service in Python/voice_service/app/
class SurveyVoiceTemplateService:
    def __init__(self):
        self.tts_service = CoquiTTSService()
        self.storage_service = SupabaseStorageService()

    async def generate_survey_templates(self, survey_id: str) -> List[VoiceTemplate]:
        """Generate all voice templates for a survey"""
        survey = await self.get_survey_data(survey_id)
        templates = []

        # Generate greeting
        greeting_audio = await self.tts_service.generate_arabic_audio(
            survey.hospital_greeting_text
        )
        greeting_path = await self.storage_service.upload_audio(
            greeting_audio, f"surveys/{survey_id}/greeting.wav"
        )
        templates.append(VoiceTemplate(
            survey_id=survey_id,
            template_type="greeting",
            audio_file_path=greeting_path,
            audio_duration_seconds=len(greeting_audio) / 22050  # Sample rate
        ))

        # Generate questions
        for question in survey.questions:
            question_audio = await self.tts_service.generate_arabic_audio(
                question.question_text
            )
            question_path = await self.storage_service.upload_audio(
                question_audio, f"surveys/{survey_id}/q_{question.id}.wav"
            )
            templates.append(VoiceTemplate(
                survey_id=survey_id,
                question_id=question.id,
                template_type="question",
                audio_file_path=question_path,
                audio_duration_seconds=len(question_audio) / 22050
            ))

        # Generate goodbye
        goodbye_audio = await self.tts_service.generate_arabic_audio(
            survey.goodbye_text
        )
        goodbye_path = await self.storage_service.upload_audio(
            goodbye_audio, f"surveys/{survey_id}/goodbye.wav"
        )
        templates.append(VoiceTemplate(
            survey_id=survey_id,
            template_type="goodbye",
            audio_file_path=goodbye_path,
            audio_duration_seconds=len(goodbye_audio) / 22050
        ))

        return templates
```

#### Storage Strategy
- **Supabase Storage**: Audio files stored in `survey-templates/` bucket
- **File Organization**: `survey-templates/{survey_id}/{template_type}_{question_id}.wav`
- **CDN Delivery**: Fast audio streaming during calls

### Phase 3: Survey Management Interface
**Goal**: Admin interface for survey creation and management

#### New Pages
- `/admin/surveys`: Survey list and management
- `/admin/surveys/create`: Survey builder with question editor
- `/admin/surveys/{id}/edit`: Survey editing interface
- `/admin/survey-templates`: Template generation and management

#### Survey Builder Features
```typescript
interface SurveyBuilderProps {
  survey: Survey;
  onSave: (survey: Survey) => Promise<void>;
  onGenerateTemplates: (surveyId: string) => Promise<void>;
}

const SurveyBuilder: React.FC<SurveyBuilderProps> = ({ survey, onSave, onGenerateTemplates }) => {
  const [questions, setQuestions] = useState<SurveyQuestion[]>(survey.questions || []);

  const addQuestion = () => {
    const newQuestion: SurveyQuestion = {
      id: generateId(),
      question_text: "",
      question_order: questions.length + 1,
      pause_seconds: 5,
      expected_responses: ["نعم", "لا", "غير متأكد"]
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updates: Partial<SurveyQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  return (
    <div className="survey-builder">
      <div className="survey-header">
        <input
          type="text"
          placeholder="Survey Name"
          value={survey.name}
          onChange={(e) => setSurveyName(e.target.value)}
        />
        <select value={survey.hospital_id}>
          {/* Hospital options */}
        </select>
      </div>

      <div className="questions-list">
        {questions.map((question, index) => (
          <div key={question.id} className="question-item">
            <textarea
              placeholder="Arabic question text"
              value={question.question_text}
              onChange={(e) => updateQuestion(index, { question_text: e.target.value })}
            />
            <div className="question-settings">
              <label>Pause seconds (1-20):</label>
              <input
                type="number"
                min="1"
                max="20"
                value={question.pause_seconds}
                onChange={(e) => updateQuestion(index, { pause_seconds: parseInt(e.target.value) })}
              />
            </div>
          </div>
        ))}
        <button onClick={addQuestion}>Add Question</button>
      </div>

      <div className="survey-actions">
        <button onClick={() => onSave({ ...survey, questions })}>
          Save Survey
        </button>
        <button onClick={() => onGenerateTemplates(survey.id)}>
          Generate Voice Templates
        </button>
      </div>
    </div>
  );
};
```

### Phase 4: Modified Calling Robot
**Goal**: Convert calling robot to survey flow

#### Survey Call Flow
```typescript
interface SurveyCallSession {
  surveyId: string;
  callSid: string;
  customerPhone: string;
  currentQuestionIndex: number;
  responses: SurveyResponse[];
  status: 'greeting' | 'questioning' | 'listening' | 'completed' | 'failed';
}

class SurveyCallingRobot {
  constructor(
    private maqsamService: MaqsamService,
    private voiceTemplateService: VoiceTemplateService,
    private sttService: STTService,
    private surveyService: SurveyService
  ) {}

  async initiateSurveyCall(phoneNumber: string, surveyId: string): Promise<CallResult> {
    const survey = await this.surveyService.getSurvey(surveyId);
    const session: SurveyCallSession = {
      surveyId,
      callSid: generateCallSid(),
      customerPhone: phoneNumber,
      currentQuestionIndex: -1, // Start with greeting
      responses: [],
      status: 'greeting'
    };

    // Start call with Maqsam
    const callResult = await this.maqsamService.initiateCall(phoneNumber);

    if (callResult.success) {
      // Begin survey flow
      await this.playGreeting(session);
    }

    return callResult;
  }

  private async playGreeting(session: SurveyCallSession): Promise<void> {
    const greetingTemplate = await this.voiceTemplateService.getGreetingTemplate(session.surveyId);
    await this.maqsamService.playAudio(session.callSid, greetingTemplate.audio_file_path);

    // After greeting, move to first question
    setTimeout(() => {
      this.playNextQuestion(session);
    }, greetingTemplate.audio_duration_seconds * 1000 + 1000); // Add 1s buffer
  }

  private async playNextQuestion(session: SurveyCallSession): Promise<void> {
    session.currentQuestionIndex++;
    const survey = await this.surveyService.getSurvey(session.surveyId);

    if (session.currentQuestionIndex >= survey.questions.length) {
      // Survey complete
      await this.playGoodbye(session);
      return;
    }

    const question = survey.questions[session.currentQuestionIndex];
    const questionTemplate = await this.voiceTemplateService.getQuestionTemplate(
      session.surveyId,
      question.id
    );

    session.status = 'questioning';
    await this.maqsamService.playAudio(session.callSid, questionTemplate.audio_file_path);

    // Start listening after question playback + configured pause
    setTimeout(() => {
      this.startListeningForResponse(session, question);
    }, (questionTemplate.audio_duration_seconds + question.pause_seconds) * 1000);
  }

  private async startListeningForResponse(
    session: SurveyCallSession,
    question: SurveyQuestion
  ): Promise<void> {
    session.status = 'listening';

    // Start STT recording for the configured pause duration
    const audioData = await this.maqsamService.recordAudio(
      session.callSid,
      question.pause_seconds
    );

    // Process STT
    const transcription = await this.sttService.transcribeArabicAudio(audioData);

    // Validate response
    const validatedResponse = this.validateResponse(transcription, question.expected_responses);

    // Store response
    await this.surveyService.saveResponse({
      survey_id: session.surveyId,
      call_sid: session.callSid,
      customer_phone: session.customerPhone,
      question_id: question.id,
      response_text: transcription,
      response_value: validatedResponse.value,
      confidence_score: validatedResponse.confidence,
      call_duration_seconds: this.calculateCallDuration(session)
    });

    // Continue to next question
    this.playNextQuestion(session);
  }

  private async playGoodbye(session: SurveyCallSession): Promise<void> {
    const goodbyeTemplate = await this.voiceTemplateService.getGoodbyeTemplate(session.surveyId);
    await this.maqsamService.playAudio(session.callSid, goodbyeTemplate.audio_file_path);

    // End call after goodbye
    setTimeout(() => {
      this.maqsamService.endCall(session.callSid);
      session.status = 'completed';
    }, goodbyeTemplate.audio_duration_seconds * 1000 + 2000); // Add 2s buffer
  }

  private validateResponse(
    transcription: string,
    expectedResponses: string[]
  ): { value: string; confidence: number } {
    // Arabic response validation logic
    const normalizedText = transcription.toLowerCase().trim();

    // Check for yes responses
    if (normalizedText.includes('نعم') || normalizedText.includes('اي') || normalizedText.includes('yes')) {
      return { value: 'yes', confidence: 0.9 };
    }

    // Check for no responses
    if (normalizedText.includes('لا') || normalizedText.includes('no')) {
      return { value: 'no', confidence: 0.9 };
    }

    // Check for uncertain responses
    if (normalizedText.includes('غير متأكد') || normalizedText.includes('uncertain') || normalizedText.includes('لا اعرف')) {
      return { value: 'uncertain', confidence: 0.8 };
    }

    // Low confidence fallback
    return { value: 'uncertain', confidence: 0.3 };
  }
}
```

### Phase 5: API Extensions
**Goal**: Backend support for survey functionality

#### New API Endpoints
```typescript
// /api/surveys - Survey management
GET  /api/surveys          - List surveys
POST /api/surveys          - Create survey
GET  /api/surveys/[id]     - Get survey details
PUT  /api/surveys/[id]     - Update survey
DELETE /api/surveys/[id]   - Delete survey

// /api/survey-templates - Voice template management
POST /api/survey-templates/generate - Generate templates for survey
GET  /api/survey-templates/[surveyId] - Get templates for survey

// /api/survey-calls - Survey calling
POST /api/survey-calls/initiate - Start survey call
GET  /api/survey-calls/[callSid]/status - Get call status
GET  /api/survey-calls/[callSid]/responses - Get call responses

// /api/survey-analytics - Analytics and reporting
GET  /api/survey-analytics/[surveyId]/summary - Survey completion stats
GET  /api/survey-analytics/[surveyId]/responses - Response breakdown
```

### Phase 6: Testing and Validation
**Goal**: Ensure parallel functionality and rollback capability

#### Testing Strategy
1. **Unit Tests**: Individual components (services, validation, etc.)
2. **Integration Tests**: API endpoints and database operations
3. **Voice Tests**: Template generation and playback verification
4. **Call Flow Tests**: End-to-end survey call simulation

#### Rollback Plan
- **Database**: Keep existing tables unchanged, new tables can be dropped
- **Code**: Feature flags to enable/disable survey functionality
- **Routes**: New survey routes don't conflict with existing ones
- **Testing**: Parallel testing environment preserves current functionality

#### Validation Checklist
- [ ] Existing voice tester still works
- [ ] Existing calling robot unchanged
- [ ] New survey routes functional
- [ ] Voice template generation works
- [ ] Survey call flow executes correctly
- [ ] Response validation accurate
- [ ] Analytics and reporting functional

## Future Enhancements

### Name Calling Infrastructure
```sql
-- Future: Extend survey_responses table
ALTER TABLE survey_responses ADD COLUMN customer_name TEXT;
ALTER TABLE surveys ADD COLUMN enable_name_calling BOOLEAN DEFAULT false;
```

### Advanced Features
- **Voice Cloning**: Personalized voice for specific customers
- **Dynamic Questions**: Conditional question flow based on responses
- **Multi-language**: Support for additional Arabic dialects
- **Real-time Analytics**: Live dashboard during survey campaigns

## Implementation Timeline

### Week 1: Foundation
- Database schema extensions
- Basic survey CRUD operations
- Voice template service skeleton

### Week 2: Voice System
- Complete voice template generation
- Audio storage and retrieval
- Template validation and testing

### Week 3: Survey Interface
- Survey management UI
- Question builder with pause configuration
- Template generation interface

### Week 4: Calling Integration
- Modified calling robot for survey flow
- Response processing and validation
- Call completion handling

### Week 5: Testing & Polish
- End-to-end testing
- Performance optimization
- Documentation and training

## Risk Mitigation

### Technical Risks
- **Voice Quality**: Template regeneration capability if TTS quality issues
- **STT Accuracy**: Fallback response handling for unclear audio
- **Call Reliability**: Retry logic and error recovery

### Business Risks
- **Parallel Functionality**: Feature flags ensure existing system unaffected
- **Rollback Capability**: Database migration reversibility
- **Testing Coverage**: Comprehensive testing before production deployment

## Success Criteria

- [ ] Survey calls follow exact flow: greeting → questions with pauses → responses → goodbye
- [ ] Pre-recorded templates eliminate TTS delay during calls
- [ ] Configurable pause times (1-20 seconds) work correctly
- [ ] Hospital-specific greetings and branding maintained
- [ ] Complete response tracking and analytics
- [ ] Infrastructure ready for future name calling feature
- [ ] Existing functionality remains unaffected and testable

## Documentation Updates

### Memory Bank Updates
- Update `activeContext.md` with survey system status
- Update `progress.md` with implementation milestones
- Update `systemPatterns.md` with new architectural patterns
- Add survey-specific patterns and workflows

### Technical Documentation
- API endpoint documentation
- Database schema documentation
- Voice template generation guide
- Survey creation and management guide

---

**Implementation Status**: Ready for Phase 1 development
**Parallel Functionality**: Maintained through feature flags and separate routes
**Rollback Plan**: Database drops and feature flag deactivation
**Testing Strategy**: Comprehensive validation with existing system preservation
