# 11 - Testing Strategy

## 🧪 **Testing Philosophy**

### **Testing Principles**
- **Voice-First**: Prioritize Arabic voice processing accuracy
- **Healthcare-Focused**: Ensure patient data privacy and compliance
- **Real-World Scenarios**: Test with actual Arabic healthcare conversations
- **Performance Matters**: Voice processing must be fast and reliable

### **Testing Pyramid**
```
      End-to-End Tests (10%)
        ↑
   Integration Tests (20%)
        ↑
    Unit Tests (70%)
```

---

## 🔬 **Unit Testing**

### **Voice Service Unit Tests**

#### **STT Model Testing**
```python
# tests/test_stt_model.py
import pytest
from app.voice.stt import ArabicSTTProcessor

class TestArabicSTTProcessor:
    def test_model_loading(self):
        """Test that STT model loads correctly"""
        processor = ArabicSTTProcessor()
        assert processor.model_loaded is True
        assert processor.sample_rate == 16000

    def test_arabic_transcription(self, sample_audio_data):
        """Test Arabic speech transcription"""
        processor = ArabicSTTProcessor()
        result = processor.transcribe(sample_audio_data)
        
        assert isinstance(result, dict)
        assert 'text' in result
        assert 'confidence' in result
        assert result['confidence'] > 0.7  # Minimum confidence threshold

    def test_audio_format_validation(self, invalid_audio_data):
        """Test audio format validation"""
        processor = ArabicSTTProcessor()
        with pytest.raises(ValueError):
            processor.transcribe(invalid_audio_data)
```

#### **TTS Model Testing**
```python
# tests/test_tts_model.py
import pytest
from app.voice.tts import ArabicTTSGenerator

class TestArabicTTSGenerator:
    def test_tts_generation(self):
        """Test Arabic text-to-speech generation"""
        tts = ArabicTTSGenerator()
        arabic_text = "مرحباً، كيف يمكنني مساعدتك اليوم؟"
        
        audio_data = tts.generate_speech(arabic_text)
        
        assert isinstance(audio_data, bytes)
        assert len(audio_data) > 1000  # Reasonable audio length
        
    def test_audio_properties(self):
        """Test generated audio properties"""
        tts = ArabicTTSGenerator()
        audio_data = tts.generate_speech("اختبار")
        
        # Verify audio format (WAV, 16kHz, mono)
        assert audio_data[:4] == b'RIFF'  # WAV header
        
    @pytest.mark.slow
    def test_first_run_performance(self):
        """Test TTS first-run performance (model loading)"""
        tts = ArabicTTSGenerator()
        start_time = time.time()
        
        audio_data = tts.generate_speech("مرحباً")
        
        end_time = time.time()
        processing_time = end_time - start_time
        
        # First run should be under 30 seconds
        assert processing_time < 30
```

### **API Unit Tests**

#### **Survey API Testing**
```typescript
// src/__tests__/api/surveys.test.ts
import { test, expect } from '@jest/globals';
import { createSurvey, getSurveys } from '../../app/api/surveys/route';

describe('Survey API', () => {
  test('should create survey with valid data', async () => {
    const surveyData = {
      template_id: 'template-123',
      patient_phone: '+966501234567'
    };
    
    const response = await createSurvey(surveyData);
    
    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('id');
    expect(response.data.patient_phone).toBe(surveyData.patient_phone);
  });
  
  test('should validate survey template exists', async () => {
    const invalidData = {
      template_id: 'non-existent-template',
      patient_phone: '+966501234567'
    };
    
    await expect(createSurvey(invalidData))
      .rejects
      .toThrow('Survey template not found');
  });
});
```

#### **Authentication Testing**
```typescript
// src/__tests__/auth/auth.test.ts
import { validateToken, createSession } from '../../lib/auth';

describe('Authentication', () => {
  test('should validate JWT token', async () => {
    const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
    const result = await validateToken(validToken);
    
    expect(result.valid).toBe(true);
    expect(result.user).toHaveProperty('id');
    expect(result.user).toHaveProperty('email');
  });
  
  test('should reject invalid token', async () => {
    const invalidToken = 'invalid-token';
    const result = await validateToken(invalidToken);
    
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

---

## 🔗 **Integration Testing**

### **Voice Service Integration Tests**

#### **WebSocket Communication**
```python
# tests/integration/test_websocket_voice.py
import pytest
import asyncio
from websockets.client import connect
import json

class TestVoiceWebSocket:
    @pytest.mark.asyncio
    async def test_websocket_connection(self):
        """Test WebSocket connection to voice service"""
        async with connect('ws://localhost:8000/ws/healthcare-questionnaire') as websocket:
            # Connection should be established
            assert websocket.open is True
            
            # Send test message
            test_message = {
                'type': 'test_connection',
                'session_id': 'test-session-123'
            }
            await websocket.send(json.dumps(test_message))
            
            # Should receive response
            response = await websocket.recv()
            response_data = json.loads(response)
            
            assert response_data['type'] == 'connection_established'
            assert response_data['session_id'] == 'test-session-123'

    @pytest.mark.asyncio
    async def test_audio_processing_flow(self, sample_audio_chunk):
        """Test complete audio processing flow"""
        async with connect('ws://localhost:8000/ws/healthcare-questionnaire') as websocket:
            # Send audio chunk
            audio_message = {
                'type': 'audio_chunk',
                'session_id': 'test-session-456',
                'data': {
                    'audio_base64': sample_audio_chunk,
                    'is_final': True
                }
            }
            await websocket.send(json.dumps(audio_message))
            
            # Receive transcription
            response = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            response_data = json.loads(response)
            
            assert response_data['type'] == 'text_response'
            assert 'text' in response_data['data']
            assert 'confidence' in response_data['data']
```

#### **Service-to-Service Communication**
```python
# tests/integration/test_service_communication.py
import pytest
import requests

class TestServiceCommunication:
    def test_voice_service_health(self):
        """Test voice service health endpoint"""
        response = requests.get('http://localhost:8000/health')
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['status'] in ['healthy', 'degraded', 'unhealthy']
        assert 'models_loaded' in data
        assert 'uptime' in data

    def test_nextjs_health(self):
        """Test Next.js health endpoint"""
        response = requests.get('http://localhost:3000/api/health')
        
        assert response.status_code == 200
        data = response.json()
        
        assert data['status'] in ['healthy', 'degraded', 'unhealthy']
        assert 'services' in data
```

### **Database Integration Tests**

#### **Survey Data Operations**
```python
# tests/integration/test_survey_database.py
import pytest
from app.database import SurveyRepository

class TestSurveyDatabase:
    @pytest.fixture
    def survey_repo(self):
        return SurveyRepository()

    def test_create_survey(self, survey_repo):
        """Test creating a new survey"""
        survey_data = {
            'template_id': 'test-template',
            'patient_phone': '+966501234567',
            'created_by': 'test-user'
        }
        
        survey = survey_repo.create(survey_data)
        
        assert survey.id is not None
        assert survey.status == 'in_progress'
        assert survey.patient_phone == survey_data['patient_phone']

    def test_update_survey_responses(self, survey_repo):
        """Test updating survey responses"""
        survey = survey_repo.create({
            'template_id': 'test-template',
            'patient_phone': '+966501234567'
        })
        
        responses = [
            {
                'question_id': 'q1',
                'question_text': 'كيف تشعر اليوم؟',
                'answer': 'جيد',
                'timestamp': '2025-01-01T10:00:00Z'
            }
        ]
        
        updated_survey = survey_repo.update_responses(
            survey.id, 
            responses, 
            status='completed'
        )
        
        assert updated_survey.status == 'completed'
        assert len(updated_survey.responses) == 1
```

---

## 🌐 **End-to-End Testing**

### **Complete Survey Flow**

#### **Voice Survey E2E Test**
```python
# tests/e2e/test_voice_survey_flow.py
import pytest
import asyncio
from playwright.async_api import async_playwright
import websockets
import json

class TestVoiceSurveyE2E:
    @pytest.mark.asyncio
    async def test_complete_survey_flow(self):
        """Test complete voice survey from start to finish"""
        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Navigate to survey interface
            await page.goto('http://localhost:3000/surveys/new')
            
            # Start survey
            await page.click('button[data-testid="start-survey"]')
            
            # Connect to voice WebSocket
            async with websockets.connect(
                'ws://localhost:8000/ws/healthcare-questionnaire'
            ) as websocket:
                
                # Simulate audio input and responses
                test_audio_chunk = "base64_encoded_audio_data_here"
                
                await websocket.send(json.dumps({
                    'type': 'audio_chunk',
                    'session_id': 'e2e-test-session',
                    'data': {
                        'audio_base64': test_audio_chunk,
                        'is_final': True
                    }
                }))
                
                # Wait for transcription
                response = await asyncio.wait_for(
                    websocket.recv(), 
                    timeout=10.0
                )
                response_data = json.loads(response)
                
                # Verify transcription
                assert response_data['type'] == 'text_response'
                assert len(response_data['data']['text']) > 0
                
                # Complete survey
                await websocket.send(json.dumps({
                    'type': 'survey_complete',
                    'session_id': 'e2e-test-session',
                    'data': {
                        'survey_id': 'test-survey-123',
                        'responses': [
                            {
                                'question_id': 'q1',
                                'question_text': 'كيف تشعر اليوم؟',
                                'answer': 'جيد',
                                'timestamp': '2025-01-01T10:00:00Z'
                            }
                        ],
                        'call_duration': 120
                    }
                }))
            
            # Verify survey completion in UI
            await page.wait_for_selector('[data-testid="survey-complete"]')
            completion_text = await page.text_content(
                '[data-testid="survey-complete"]'
            )
            assert 'مكتمل' in completion_text  # Arabic for "completed"
            
            await browser.close()
```

#### **Campaign Management E2E**
```python
# tests/e2e/test_campaign_management.py
import pytest
from playwright.async_api import async_playwright

class TestCampaignManagementE2E:
    @pytest.mark.asyncio
    async def test_create_and_run_campaign(self):
        """Test creating and running a complete campaign"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            # Login
            await page.goto('http://localhost:3000/login')
            await page.fill('[data-testid="email"]', 'admin@example.com')
            await page.fill('[data-testid="password"]', 'password')
            await page.click('[data-testid="login-button"]')
            
            # Navigate to campaigns
            await page.goto('http://localhost:3000/campaigns')
            await page.click('[data-testid="create-campaign"]')
            
            # Fill campaign details
            await page.fill('[data-testid="campaign-name"]', 'Test Campaign')
            await page.select_option(
                '[data-testid="survey-template"]', 
                'test-template'
            )
            await page.fill(
                '[data-testid="target-patients"]', 
                '+966501234567,+966502345678'
            )
            
            # Create campaign
            await page.click('[data-testid="create-campaign-button"]')
            
            # Verify campaign created
            await page.wait_for_selector('[data-testid="campaign-created"]')
            
            # Start campaign
            await page.click('[data-testid="start-campaign"]')
            
            # Verify campaign started
            campaign_status = await page.text_content(
                '[data-testid="campaign-status"]'
            )
            assert campaign_status == 'نشط'  # Arabic for "active"
            
            await browser.close()
```

---

## 🔊 **Voice-Specific Testing**

### **Arabic Language Testing**

#### **Arabic Speech Accuracy**
```python
# tests/voice/test_arabic_accuracy.py
import pytest
from app.voice.stt import ArabicSTTProcessor

class TestArabicAccuracy:
    @pytest.fixture
    def common_arabic_phrases(self):
        return [
            ("مرحباً، كيف حالك؟", "greeting"),
            ("أشعر بألم في رأسي", "symptom"),
            ("نعم، أفهم", "confirmation"),
            ("لا، شكراً", "refusal"),
            ("أحتاج إلى مساعدة", "help_request")
        ]

    def test_common_healthcare_phrases(self, common_arabic_phrases):
        """Test common healthcare Arabic phrases"""
        processor = ArabicSTTProcessor()
        
        for phrase, category in common_arabic_phrases:
            # Load pre-recorded audio for each phrase
            audio_file = f"tests/fixtures/audio/{category}.wav"
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
            
            result = processor.transcribe(audio_data)
            
            # Check transcription accuracy
            assert result['confidence'] > 0.8
            # Basic check that we got Arabic text
            assert any(char in result['text'] for char in 'اأإآبةتثجحخدذرزسشصضطظعغفقكلمنهوي')

    def test_arabic_dialect_variations(self):
        """Test different Arabic dialect variations"""
        processor = ArabicSTTProcessor()
        
        # Test with different regional pronunciations
        dialect_samples = [
            ("شلونك", "gulf"),      # How are you (Gulf)
            ("كيفك", "levantine"),  # How are you (Levantine)
            ("ازيك", "egyptian")    # How are you (Egyptian)
        ]
        
        for phrase, dialect in dialect_samples:
            audio_file = f"tests/fixtures/audio/dialect_{dialect}.wav"
            with open(audio_file, 'rb') as f:
                audio_data = f.read()
            
            result = processor.transcribe(audio_data)
            # Even with dialect variations, should get reasonable transcription
            assert result['confidence'] > 0.6
```

#### **TTS Quality Testing**
```python
# tests/voice/test_tts_quality.py
import pytest
from app.voice.tts import ArabicTTSGenerator

class TestTTSQuality:
    def test_arabic_pronunciation(self):
        """Test Arabic text-to-speech pronunciation quality"""
        tts = ArabicTTSGenerator()
        
        test_phrases = [
            "مرحباً، أنا مساعدك الصحي",  # Formal healthcare Arabic
            "كيف تشعر اليوم؟",           # Question phrasing
            "شكراً لك على وقتك"          # Polite closing
        ]
        
        for phrase in test_phrases:
            audio_data = tts.generate_speech(phrase)
            
            # Verify audio generation
            assert len(audio_data) > 0
            # Audio should be reasonable length for the phrase
            assert 1000 < len(audio_data) < 100000

    def test_tts_performance(self):
        """Test TTS generation performance"""
        tts = ArabicTTSGenerator()
        
        start_time = time.time()
        audio_data = tts.generate_speech("هذا اختبار للأداء")
        end_time = time.time()
        
        processing_time = end_time - start_time
        
        # After first run, should be reasonably fast
        assert processing_time < 5.0  # Under 5 seconds
```

---

## 📊 **Performance Testing**

### **Voice Processing Performance**

#### **Concurrent Voice Sessions**
```python
# tests/performance/test_concurrent_voice.py
import pytest
import asyncio
import websockets
import json

class TestConcurrentVoice:
    @pytest.mark.asyncio
    async def test_multiple_concurrent_sessions(self):
        """Test handling multiple concurrent voice sessions"""
        num_sessions = 5
        tasks = []
        
        async def simulate_voice_session(session_id):
            async with websockets.connect(
                'ws://localhost:8000/ws/healthcare-questionnaire'
            ) as websocket:
                # Send multiple audio chunks
                for i in range(3):
                    await websocket.send(json.dumps({
                        'type': 'audio_chunk',
                        'session_id': f'session-{session_id}',
                        'data': {
                            'audio_base64': f'test_audio_chunk_{i}',
                            'is_final': (i == 2)
                        }
                    }))
                    
                    # Wait for response
                    response = await asyncio.wait_for(
                        websocket.recv(), 
                        timeout=5.0
                    )
                    response_data = json.loads(response)
                    
                    assert response_data['type'] == 'text_response'
        
        # Create multiple concurrent sessions
        for i in range(num_sessions):
            task = asyncio.create_task(simulate_voice_session(i))
            tasks.append(task)
        
        # Wait for all sessions to complete
        await asyncio.gather(*tasks, return_exceptions=True)
```

#### **Memory Usage Testing**
```python
# tests/performance/test_memory_usage.py
import pytest
import psutil
import os

class TestMemoryUsage:
    def test_voice_model_memory(self):
        """Test memory usage of voice models"""
        process = psutil.Process(os.getpid())
        
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Load voice models
        from app.voice.stt import ArabicSTTProcessor
        from app.voice.tts import ArabicTTSGenerator
        
        stt_processor = ArabicSTTProcessor()
        tts_generator = ArabicTTSGenerator()
        
        final_memory = process.memory_info().rss / 1024 / 1024  # MB
        memory_increase = final_memory - initial_memory
        
        # Voice models should use reasonable memory (~2GB expected)
        assert memory_increase < 3000  # Under 3GB
        assert memory_increase > 500   # At least 500MB
```

---

## 🧩 **Test Data Management**

### **Test Fixtures**

#### **Arabic Audio Samples**
```python
# tests/fixtures/audio_fixtures.py
import pytest
import base64

@pytest.fixture
def sample_arabic_greeting_audio():
    """Sample Arabic greeting audio for testing"""
    with open('tests/fixtures/audio/greeting.wav', 'rb') as f:
        audio_data = f.read()
    return base64.b64encode(audio_data).decode('utf-8')

@pytest.fixture
def sample_healthcare_response_audio():
    """Sample healthcare response audio for testing"""
    with open('tests/fixtures/audio/health_response.wav', 'rb') as f:
        audio_data = f.read()
    return base64.b64encode(audio_data).decode('utf-8')

@pytest.fixture
def invalid_audio_data():
    """Invalid audio data for error testing"""
    return base64.b64encode(b'invalid_audio_data').decode('utf-8')
```

#### **Survey Test Data**
```python
# tests/fixtures/survey_fixtures.py
import pytest

@pytest.fixture
def sample_survey_template():
    """Sample survey template for testing"""
    return {
        'id': 'test-template-123',
        'title': 'استبيان الصحة العامة',
        'description': 'استبيان لتقييم الحالة الصحية العامة',
        'questions': [
            {
                'id': 'q1',
                'type': 'multiple_choice',
                'question': 'كيف تشعر اليوم؟',
                'options': ['ممتاز', 'جيد', 'متوسط', 'سيء']
            },
            {
                'id': 'q2', 
                'type': 'scale',
                'question': 'قيم مستوى الألم من 1 إلى 10',
                'min': 1,
                'max': 10
            }
        ],
        'is_active': True
    }
```

---

## 🚀 **Running Tests**

### **Test Commands**
```bash
# Run all tests
make test

# Run specific test categories
npm test                          # Next.js tests
cd Python/voice_service && pytest # Python voice service tests

# Run with coverage
npm test -- --coverage
pytest --cov=app tests/

# Run performance tests
pytest tests/performance/ -v

# Run E2E tests
pytest tests/e2e/ -v
```

### **Continuous Integration**
```yaml
# GitHub Actions example
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          npm install
          cd Python/voice_service && uv sync
      - name: Run tests
        run: |
          npm test
          cd Python/voice_service && pytest
```

---

## 📈 **Test Reporting**

### **Coverage Reports**
```bash
# Generate coverage reports
npm test -- --coverage --coverageReporters=html
pytest --cov=app --cov-report=html tests/

# Coverage targets
# - Line coverage: >80%
# - Branch coverage: >70%
# - Voice processing: >90%
```

### **Performance Metrics**
```python
# Performance benchmarks
VOICE_PROCESSING_TARGETS = {
    'stt_response_time': '<2.0 seconds',
    'tts_generation_time': '<5.0 seconds',
    'websocket_latency': '<100ms',
    'concurrent_sessions': '10+ sessions'
}
```

---

## 🛡️ **Security Testing**

### **Authentication Testing**
```python
# tests/security/test_authentication.py
import pytest
import jwt

class TestSecurity:
    def test_jwt_token_validation(self):
        """Test JWT token security"""
        # Test token expiration
        expired_token = create_expired_token()
        result = validate_token(expired_token)
        assert result.valid is False
        
        # Test token tampering
        tampered_token = tamper_with_token(valid_token)
        result = validate_token(tampered_token)
        assert result.valid is False

    def test_voice_service_authentication(self):
        """Test voice service authentication"""
        # Test without authentication header
        response = requests.get('http://localhost:8000/health')
        assert response.status_code == 401  # Unauthorized
        
        # Test with invalid secret
        response = requests.get(
            'http://localhost:8000/health',
            headers={'X-Voice-Service-Secret': 'wrong-secret'}
        )
        assert response.status_code == 403  # Forbidden
```

---

**Last Updated**: November 9, 2025  
**Testing Strategy Version**: 2.0  
**Next Review**: After major feature additions or test failures
