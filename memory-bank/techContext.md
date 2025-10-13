# Technology Context: Hana Voice SaaS

## Technology Stack Overview

Hana Voice SaaS is built on a modern serverless architecture designed for scalability, maintainability, and rapid healthcare automation deployment. The stack prioritizes developer experience, type safety, and cloud-native deployment.

## Core Framework & Runtime

### Next.js 15 with App Router
- **Version**: 15.5.4 (Latest stable)
- **Routing**: App Router (file-based routing)
- **Server Components**: React Server Components for performance
- **API Routes**: Built-in serverless API endpoints

**Key Benefits for Healthcare SaaS**:
- Full-stack TypeScript development
- Zero-config deployment on Render
- Built-in optimization for healthcare dashboards
- Server-side rendering for fast page loads

### React 19 & TypeScript
- **React Version**: 19.0.0 (Latest)
- **TypeScript Version**: 5.0.0
- **Configuration**: Strict type checking enabled

**Healthcare UX Considerations**:
- Complex state management for real-time call monitoring
- Type-safe healthcare data handling
- Accessible component library for medical staff

## Backend Infrastructure

### Supabase (PostgreSQL + Real-time)
- **Database**: PostgreSQL with real-time subscriptions
- **Authentication**: Built-in user management (future expansion)
- **Edge Functions**: Serverless functions for data processing
- **Storage**: File storage for call recordings and exports

**Healthcare Data Management**:
- HIPAA-ready architecture foundation
- Row Level Security (RLS) for patient data isolation
- Audit logging for compliance tracking
- Real-time call status updates

### Render Platform as a Service
- **Deployment**: One-click deployment from GitHub
- **Scaling**: Automatic horizontal scaling
- **CDN**: Global content delivery for low-latency access
- **Security**: Enterprise-grade infrastructure security

## AI & Voice Processing

### OpenAI Integration
- **TTS Models**: text-to-speech for Arabic voice calls
- **STT Models**: speech-to-text for survey responses
- **GPT Models**: Response analysis and survey understanding
- **API Version**: v4.28.0 (latest stable)

**Arabic Language Support**:
- Native Arabic text processing
- Gulf Arabic dialect optimization
- Cultural context understanding for healthcare conversations

### External Service Integrations

#### FreePBX Telephony
- **Protocol**: Asterisk Manager Interface (AMI)
- **Authentication**: Username/password based auth
- **Call Management**: Outbound calling, call queuing
- **Status Monitoring**: Real-time call progress tracking

**Integration Requirements**:
- SIP trunk configuration for Saudi telecom providers
- Arabic voice prompts and call scripts
- Call recording for compliance and analysis

## Frontend Technologies

### Tailwind CSS v4.0.0
**Healthcare Dashboard Styling**:
- RTL (Right-to-Left) layout support for Arabic
- Accessible color schemes for medical environments
- Responsive design for tablets/desktops in healthcare settings
- Dark mode support for nighttime hospital use

### Additional UI Libraries
- **ApexCharts**: Real-time call analytics visualization
- **React Dropzone**: Excel file upload for patient lists
- **FullCalendar**: Appointment scheduling integration
- **React DnD**: Drug-dnd for survey form building

## Development Tools & Workflow

### Package Management
```json
{
  "packageManager": "npm",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

### Build Tools
- **ESLint**: Next.js configuration for React/TSX
- **PostCSS**: Tailwind CSS processing
- **TypeScript Compiler**: Strict mode, no implicit any
- **SVG Optimization**: @svgr/webpack for icons

### Development Configuration
```typescript
// next.config.ts
{
  experimental: {
    appDir: true,
    typedRoutes: true
  },
  eslint: {
    ignoreDuringBuilds: false
  },
  typescript: {
    ignoreBuildErrors: false
  }
}
```

## Database Schema

### Healthcare Data Tables
```sql
-- Patient information (de-identified)
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  medical_record_number TEXT,
  phone_number TEXT,
  survey_type TEXT,
  department TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);

-- Call campaigns and automation
CREATE TABLE call_campaigns (
  id UUID PRIMARY KEY,
  client_id TEXT,
  name TEXT,
  survey_script TEXT, -- Arabic survey content
  status TEXT, -- draft, active, completed
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
);

-- Individual call records
CREATE TABLE call_logs (
  id UUID PRIMARY KEY,
  campaign_id UUID REFERENCES call_campaigns(id),
  patient_id UUID REFERENCES patients(id),
  call_sid TEXT, -- FreePBX call identifier
  status TEXT, -- initiated, connected, completed, failed
  duration_seconds INTEGER,
  transcription TEXT, -- Arabic speech-to-text
  response_data JSONB, -- Structured survey responses
  created_at TIMESTAMPTZ
);

-- Analytics and reporting
CREATE TABLE analytics (
  id UUID PRIMARY KEY,
  date DATE,
  total_calls INTEGER,
  completed_calls INTEGER,
  response_rate DECIMAL,
  average_duration DECIMAL,
  department TEXT
);
```

## Environment Configuration

### Required Environment Variables
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1Ni...

# OpenAI Configuration
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx
OPENAI_MODEL=tts-1

# FreePBX Configuration
FREEPBX_HOST=pbx.healthcareclinic.local
FREEPBX_USERNAME=automated-caller
FREEPBX_PASSWORD=secure-password-here

# Application Configuration
JWT_SECRET_KEY=hana-voice-saas-secret-key-2025
NEXT_PUBLIC_API_URL=https://hana-voice-saas.onrender.com
NODE_ENV=production
```

### Environment Validation
```typescript
// Server-side environment validation
const validateEnvironment = () => {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'OPENAI_API_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

## Deployment Configuration

### render.yaml
```yaml
services:
  - type: web
    name: hana-voice-saas
    env: node
    plan: free
    region: frankfurt
    buildCommand: npm install && npm run build
    startCommand: npm start
    healthCheckPath: /api/auth
    autoDeploy: true
    envVars:
      - key: NODE_ENV
        value: production
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
      - key: OPENAI_API_KEY
        sync: false
```

## Security Architecture

### API Security
- **Client Authentication**: API key-based multi-tenancy
- **Request Validation**: Input sanitization and type checking
- **Rate Limiting**: Per-client API call limits
- **CORS Configuration**: Healthcare domain restrictions

### Data Security
- **Encryption**: TLS 1.3 for all data in transit
- **Data Isolation**: Client-specific data separation
- **Audit Logging**: All API calls logged for compliance
- **Backup Strategy**: Automated PostgreSQL backups

## Performance Considerations

### API Optimization
- **Response Caching**: Redis for frequently accessed data
- **Database Indexing**: Optimized queries for large datasets
- **Connection Pooling**: Efficient database connection management
- **CDN Integration**: Static asset delivery optimization

### Voice Processing
- **Audio Compression**: Opus format for bandwidth efficiency
- **Batch Processing**: Multiple calls processed in parallel
- **Caching Strategy**: Voice files cached for repeated use
- **Fallback Handling**: Graceful degradation when OpenAI unavailable

## Monitoring & Observability

### Application Monitoring
- **Health Endpoints**: `/api/auth`, `/api/voice`, `/api/data`, `/api/telephony`
- **Error Tracking**: Sentry integration for production errors
- **Performance Metrics**: Response times, error rates, throughput
- **User Analytics**: Call completion rates, survey response patterns

### Healthcare-Specific Monitoring
- **Call Quality**: Voice clarity, connection stability
- **Response Accuracy**: STT accuracy for Arabic speech
- **Compliance Tracking**: Audit trails for all patient interactions
- **System Availability**: 99.9% uptime requirement for healthcare

## Development Environment

### Local Development Setup
```bash
# Install dependencies
npm install

# Environment setup
cp .env.local.example .env.local
# Configure local environment variables

# Start development server
npm run dev

# Run linting and type checking
npm run lint
```

### Testing Strategy
- **Unit Tests**: Jest for component and utility testing
- **Integration Tests**: API route testing with Supertest
- **E2E Tests**: Playwright for healthcare workflow testing
- **Performance Tests**: Load testing for voice call scenarios

## Future Technology Roadmap

### Phase 2 Enhancements
- **Real-time WebSockets**: Live call monitoring dashboards
- **Machine Learning**: Response sentiment analysis
- **Mobile App**: React Native for healthcare staff
- **Advanced Analytics**: Power BI integration for reporting

### Phase 3 Innovations
- **AI Voice Cloning**: Personalized patient communication
- **Multi-modal Input**: Voice + text survey responses
- **Predictive Analytics**: ML-based patient outcome prediction
- **Integration APIs**: EHR system connectivity

This technology foundation provides the robust, scalable platform needed for healthcare voice automation in Saudi Arabia, balancing modern development practices with the specialized requirements of medical data handling and Arabic language processing.
