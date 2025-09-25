# Hana Voice SaaS - Comprehensive Project Documentation

## 📖 Table of Contents
- [Project Overview](#project-overview)
- [Architecture](#architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Environment Setup](#environment-setup)
- [API Reference](#api-reference)
- [Deployment Guide](#deployment-guide)
- [Troubleshooting](#troubleshooting)
- [Development Guidelines](#development-guidelines)

## 🎯 Project Overview

Hana Voice SaaS is a comprehensive healthcare voice automation platform designed for Saudi Arabian healthcare providers. The system automates patient outreach through voice calls, conducts health surveys in Arabic, and provides detailed analytics and reporting.

### Key Features
- **Automated Voice Calls**: Initiate automated calls to patients for health surveys
- **Multilingual Support**: Primary support for Arabic with RTL text formatting
- **Real-time Analytics**: Export call analytics and survey responses in Excel format
- **Healthcare Compliance**: Designed for Saudi healthcare regulations and standards
- **Scalable Architecture**: Built on modern serverless architecture with Next.js

### Target Audience
- Saudi Arabian hospitals and clinics
- Healthcare providers needing patient follow-up automation
- Medical research organizations conducting health surveys

## 🏗️ Architecture

### High-Level Architecture Diagram
```
Frontend (Next.js) → API Routes → External Services → Database (Supabase)
     ↓              ↓           ↓                   ↓
   React Pages   /api/*      OpenAI/Freepbx     PostgreSQL
```

### Component Architecture
1. **Frontend Layer**: Next.js 15 with React 19 and TypeScript
2. **API Layer**: Next.js API routes for authentication, voice processing, data export
3. **Service Layer**: Integration with OpenAI (TTS/STT) and Freepbx (telephony)
4. **Data Layer**: Supabase PostgreSQL for persistent storage

### Data Flow
1. **Call Initiation**: Excel file upload → Patient list processing → Call initiation via Freepbx
2. **Voice Processing**: Text-to-speech generation → Call playback → Speech-to-text transcription
3. **Data Collection**: Survey responses → Database storage → Analytics and reporting
4. **Export Functionality**: Data export in Excel format with Arabic RTL support

## 🔧 Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **React 19**: Latest React version with concurrent features
- **TypeScript**: Type-safe JavaScript development
- **Tailwind CSS**: Utility-first CSS framework
- **ExcelJS**: Client-side Excel file generation

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Supabase**: PostgreSQL database with real-time capabilities
- **OpenAI API**: Text-to-speech and speech-to-text services
- **Freepbx**: Telephony system for call management

### Deployment & Infrastructure
- **Render**: Platform as a service for deployment
- **Supabase**: Database hosting and management
- **Environment Variables**: Secure configuration management

## 📁 Project Structure

```
hana-voice-saas/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── (admin)/       # Admin dashboard pages
│   │   │   ├── (others-pages)/
│   │   │   │   ├── audio-conversion/    # Audio processing UI
│   │   │   │   ├── calling-robot/       # Call automation UI
│   │   │   │   └── demo-test-call/      # Testing interface
│   │   ├── api/           # API routes
│   │   │   ├── auth/      # Authentication endpoints
│   │   │   ├── data/      # Data export endpoints
│   │   │   ├── telephony/ # Call management endpoints
│   │   │   └── voice/     # Voice processing endpoints
│   │   └── layout.tsx     # Root layout
│   ├── components/        # Reusable UI components
│   ├── context/           # React context providers
│   ├── hooks/             # Custom React hooks
│   └── icons/             # SVG icons
├── .env.local.example     # Environment template
├── render.yaml            # Render deployment configuration
└── package.json           # Dependencies and scripts
```

## ⚙️ Environment Setup

### Prerequisites
- Node.js 18.x or later
- npm or yarn package manager
- Supabase account and project
- OpenAI API account with credits
- Freepbx server with AMI access

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/a7isss/hana-voice-saas.git
   cd hana-voice-saas
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment configuration**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` with your actual values:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   FREEPBX_HOST=your_freepbx_host
   FREEPBX_USERNAME=your_ami_username
   FREEPBX_PASSWORD=your_ami_password
   ```

4. **Database setup**
   - Import the SQL schema from `supabase_schema.sql` to your Supabase project
   - Verify table creation and relationships

5. **Start development server**
   ```bash
   npm run dev
   ```

## 🔌 API Reference

### Authentication API (`/api/auth`)

#### GET /api/auth
**Health check endpoint**
- Response: Service status and database connectivity
- Usage: Monitoring and load balancing

#### POST /api/auth
**Client authentication**
- Body: `{ "action": "authenticate", "clientId": "string", "apiKey": "string" }`
- Response: Client information and permissions

### Voice Processing API (`/api/voice`)

#### GET /api/voice
**Service health check**
- Response: OpenAI connectivity and TTS/STT availability

#### POST /api/voice
**Voice processing operations**
- Supported actions:
  - `generate-speech`: Text-to-speech conversion
  - `transcribe`: Speech-to-text conversion
  - `process-survey`: Complete survey processing pipeline
  - `get-voices`: Available TTS voices
  - `get-languages`: Supported languages

### Data Export API (`/api/data`)

#### GET /api/data
**Service health check**
- Response: Database connectivity and Excel generation capability

#### POST /api/data
**Data export operations**
- Supported actions:
  - `export-survey-responses`: Export survey data to Excel
  - `export-call-analytics`: Export call logs to Excel
  - `export-customer-list`: Export patient list to Excel
  - `get-summary-report`: Generate summary statistics

### Telephony API (`/api/telephony`)

#### GET /api/telephony
**Service health check**
- Response: Freepbx connectivity status

#### POST /api/telephony
**Call management operations**
- Supported actions:
  - `initiate-call`: Start a voice call to a patient
  - `upload-excel`: Process Excel file with patient data
  - `get-call-status`: Check call progress and status

## 🚀 Deployment Guide

### Render Deployment

1. **Prepare repository**
   - Ensure all code is committed and pushed to GitHub
   - Verify `render.yaml` configuration

2. **Environment variables**
   - Set all required environment variables in Render dashboard
   - Use production values for API keys and URLs

3. **Deploy application**
   - Connect GitHub repository to Render
   - Automatic deployment on push to main branch
   - Monitor build logs for errors

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Health checks passing
- [ ] SSL certificates valid
- [ ] Domain configuration complete
- [ ] Monitoring and alerts setup

## 🐛 Troubleshooting

### Common Issues

#### Build Failures
**Problem**: TypeScript errors during build
**Solution**: 
```bash
npm run build
# Fix any TypeScript errors reported
npm install --save-dev @types/node
```

#### Environment Variables
**Problem**: API routes failing with missing environment variables
**Solution**:
- Verify variable names match between `.env.local` and API routes
- Check Render dashboard for production variables
- Restart application after variable changes

#### Database Connection
**Problem**: Supabase connection errors
**Solution**:
- Check Supabase project status
- Verify connection URL and API key
- Test database queries in Supabase dashboard

#### OpenAI API Issues
**Problem**: Voice generation failures
**Solution**:
- Verify OpenAI API key validity
- Check usage limits and billing
- Test API key with OpenAI playground

### Debugging Steps

1. **Check application logs**
   - Render dashboard → Services → Logs
   - Look for error messages and stack traces

2. **Test health endpoints**
   ```bash
   curl https://your-app.onrender.com/api/auth
   curl https://your-app.onrender.com/api/voice
   curl https://your-app.onrender.com/api/data
   ```

3. **Verify external services**
   - Supabase database connectivity
   - OpenAI API responsiveness
   - Freepbx AMI connection

## 💻 Development Guidelines

### Code Style
- Use TypeScript for type safety
- Follow Next.js 15 best practices
- Implement proper error handling
- Write comprehensive documentation

### API Development
- Use consistent response formats
- Implement proper HTTP status codes
- Add input validation and sanitization
- Include comprehensive error messages

### Frontend Development
- Use React hooks for state management
- Implement responsive design with Tailwind CSS
- Follow accessibility best practices
- Optimize performance with Next.js features

### Security Considerations
- Never commit sensitive data to repository
- Use environment variables for configuration
- Implement proper authentication and authorization
- Sanitize all user inputs
- Use HTTPS in production

## 📞 Support and Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Community Support
- GitHub Issues for bug reports and feature requests
- Stack Overflow for technical questions
- Render Community for deployment issues

### Maintenance
- Regular dependency updates
- Security vulnerability monitoring
- Performance optimization
- Backup and disaster recovery procedures

---

*This documentation is maintained as part of the Hana Voice SaaS project. For questions or contributions, please contact the development team.*
