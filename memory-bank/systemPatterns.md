# System Patterns: Hana Voice SaaS

## Architecture Overview

Hana Voice SaaS implements a modern serverless architecture optimized for healthcare voice automation. The system follows microservices patterns with clear separation of concerns between authentication, voice processing, data management, and telephony integration.

## Core Architectural Patterns

### API Gateway Pattern
```
Frontend → Next.js API Routes → Service Layer → External APIs
     ↓           ↓                      ↓             ↓
   React     /api/* endpoints      Business Logic    OpenAI/FreePBX
```

- **API Routes**: Serverless endpoints handling all external integrations
- **Service Layer**: Clean business logic separation from API concerns
- **External APIs**: Isolated third-party service integrations

### Multi-Tenant Authentication Pattern
```typescript
// Client-based multi-tenancy with API key authentication
interface Client {
  id: string;
  name: string;
  department: string;
  permissions: string[];
}

// JWT token validation with client isolation
const authenticateClient = (clientId: string, apiKey: string) => {
  // Validate credentials against Supabase
  // Return client context and permissions
};
```

### Voice Processing Pipeline Pattern
```typescript
// Modular voice processing stages
enum VoiceStage {
  TEXT_TO_SPEECH = 'tts',
  SPEECH_TO_TEXT = 'stt', 
  SURVEY_PROCESSING = 'survey',
  RESPONSE_ANALYSIS = 'analysis'
}

// Pipeline execution with error handling
const processVoiceRequest = async (action: string, payload: any) => {
  const stage = determineStage(action);
  const result = await executePipeline(stage, payload);
  return handleResponse(result);
};
```

## Data Flow Patterns

### Call Automation Flow
```
Excel Upload → Patient List Processing → Call Queue → Voice Generation
      ↓              ↓                        ↓             ↓
   Validation    Data Sanitization       Queue Management  OpenAI TTS
      ↓              ↓                        ↓             ↓
   Database       Supabase Storage       FreePBX AMI       Arabic Audio
      ↓              ↓                        ↓             ↓
   Analytics      Response Tracking      Call Logs         Survey Playback
```

### Survey Response Flow
```typescript
// Voice survey processing pipeline
interface SurveyFlow {
  initiation: CallInitiation;
  interaction: VoiceInteraction;
  capture: ResponseCapture;
  analysis: DataAnalysis;
}

// Each stage handles specific responsibilities
const processSurveyResponse = async (audioData: Buffer) => {
  const transcription = await transcribeAudio(audioData);
  const analysis = await analyzeResponse(transcription);
  const result = await storeResponse(analysis);
  return generateReport(result);
};
```

## Component Relationship Patterns

### API Structure Pattern
```
/api/auth        - Authentication & health checks
/api/voice       - TTS, STT, survey processing  
/api/data        - Excel exports & analytics
/api/telephony   - FreePBX call management
```

### Service Integration Pattern
```typescript
// Abstract service interfaces for testability
interface VoiceService {
  generateSpeech(text: string, language: string): Promise<AudioBuffer>;
  transcribeAudio(audio: Buffer): Promise<string>;
  processSurvey(responses: SurveyData[]): Promise<Analysis>;
}

interface TelephonyService {
  initiateCall(phoneNumber: string): Promise<CallResult>;
  getCallStatus(callId: string): Promise<CallStatus>;
  uploadContacts(excelData: Buffer): Promise<ContactList>;
}
```

## Design Patterns in Use

### Repository Pattern for Data Access
```typescript
// Abstract data operations from business logic
class SupabaseRepository<T> {
  constructor(private table: string) {}

  async findById(id: string): Promise<T | null> {
    return await supabase.from(this.table).select('*').eq('id', id).single();
  }

  async create(data: Partial<T>): Promise<T> {
    return await supabase.from(this.table).insert(data).select().single();
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return await supabase.from(this.table).update(data).eq('id', id).select().single();
  }
}
```

### Factory Pattern for Service Creation
```typescript
// Service instantiation based on environment
const createVoiceService = (provider: 'openai' | 'azure'): VoiceService => {
  switch (provider) {
    case 'openai':
      return new OpenAIVoiceService({
        apiKey: process.env.OPENAI_API_KEY,
        model: 'tts-1'
      });
    case 'azure':
      return new AzureVoiceService({
        key: process.env.AZURE_KEY,
        region: process.env.AZURE_REGION
      });
  }
};
```

### Chain of Responsibility for Request Validation
```typescript
// Request validation pipeline
class ValidationChain {
  private validators: Validator[] = [];

  addValidator(validator: Validator) {
    this.validators.push(validator);
  }

  async validate(request: any): Promise<ValidationResult> {
    for (const validator of this.validators) {
      const result = await validator.validate(request);
      if (!result.isValid) {
        return result;
      }
    }
    return { isValid: true };
  }
}

// Usage for API endpoints
const authValidation = new ValidationChain()
  .addValidator(new RequiredFieldsValidator(['clientId', 'action']))
  .addValidator(new ClientIdValidator())
  .addValidator(new ApiKeyValidator());
```

## Error Handling Patterns

### Hierarchical Error Classification
```typescript
enum ErrorType {
  VALIDATION_ERROR = 'validation',
  AUTHENTICATION_ERROR = 'authentication',
  SERVICE_ERROR = 'service',
  NETWORK_ERROR = 'network',
  DATABASE_ERROR = 'database'
}

class AppError extends Error {
  constructor(
    public type: ErrorType,
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
  }
}

// Centralized error handling middleware
const handleErrors = (error: Error) => {
  if (error instanceof AppError) {
    return {
      type: error.type,
      message: error.message,
      statusCode: error.statusCode
    };
  }
  
  // Unknown errors - log and return generic response
  console.error('Unexpected error:', error);
  return {
    type: ErrorType.SERVICE_ERROR,
    message: 'Internal server error',
    statusCode: 500
  };
};
```

### Circuit Breaker Pattern for External Services
```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.failureThreshold) {
      this.state = 'open';
    }
  }
}
```

## Configuration Patterns

### Environment-Based Configuration
```typescript
// Type-safe environment configuration
interface AppConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  openai: {
    apiKey: string;
    model: string;
  };
  freepbx: {
    host: string;
    username: string;
    password: string;
  };
}

// Validate and parse environment variables
const loadConfig = (): AppConfig => {
  const required = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  
  for (const env of required) {
    if (!process.env[env]) {
      throw new Error(`Missing required environment variable: ${env}`);
    }
  }

  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || '',
      model: process.env.OPENAI_MODEL || 'tts-1'
    },
    freepbx: {
      host: process.env.FREEPBX_HOST || '',
      username: process.env.FREEPBX_USERNAME || '',
      password: process.env.FREEPBX_PASSWORD || ''
    }
  };
};
```

## Security Patterns

### API Key Authentication Pattern
```typescript
// Request authentication middleware
const authenticateRequest = async (req: NextRequest) => {
  const clientId = req.headers.get('x-client-id');
  const apiKey = req.headers.get('x-api-key');

  if (!clientId || !apiKey) {
    throw new AppError(
      ErrorType.AUTHENTICATION_ERROR,
      'Missing authentication headers',
      401
    );
  }

  const client = await validateClientCredentials(clientId, apiKey);
  return client;
};
```

### Input Validation Pattern
```typescript
// Comprehensive input validation for healthcare data
const validateHealthcareData = (data: any): HealthcareData => {
  const schema = Joi.object({
    patientId: Joi.string().required(),
    phoneNumber: Joi.string().pattern(/^\+966\d{9}$/).required(),
    medicalRecordNumber: Joi.string().required(),
    surveyType: Joi.string().valid('cardiology', 'oncology', 'general').required(),
    arabicText: Joi.string().when('language', {
      is: 'ar',
      then: Joi.string().required()
    })
  });

  const { error, value } = schema.validate(data);
  if (error) {
    throw new AppError(
      ErrorType.VALIDATION_ERROR,
      error.details[0].message,
      400
    );
  }
  
  return value;
};
```

## Performance Patterns

### Connection Pooling Pattern
```typescript
// Database connection optimization
const createSupabaseClient = () => {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'x-my-custom-header': 'hana-voice-saas'
        }
      }
    }
  );
};

// Singleton pattern for client reuse
let supabaseClient: SupabaseClient | null = null;

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createSupabaseClient();
  }
  return supabaseClient;
};
```

### Caching Pattern for External APIs
```typescript
// Cache frequently accessed data
class CacheManager {
  private cache = new Map<string, { data: any; expiry: number }>();

  async get<T>(key: string, fetcher: () => Promise<T>, ttl = 300000): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, expiry: Date.now() + ttl });
    return data;
  }

  invalidate(key: string) {
    this.cache.delete(key);
  }
}

// Usage for voice service metadata
const voiceCache = new CacheManager();
const getVoiceModels = () => voiceCache.get('voice-models', fetchVoiceModels);
```

These architectural patterns ensure Hana Voice SaaS is maintainable, scalable, and reliable for healthcare automation, with proper error handling, security, and performance optimizations built into the core system design.
