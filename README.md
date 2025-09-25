# Hana Voice SaaS - Healthcare Voice Automation Platform

![Hana Voice SaaS Dashboard](./banner.png)

Hana Voice SaaS is a comprehensive healthcare voice automation platform designed specifically for Saudi Arabian healthcare providers. The system automates patient outreach through voice calls, conducts health surveys in Arabic, and provides detailed analytics and reporting.

## 🎯 Key Features

- **Automated Voice Calls**: Initiate automated calls to patients for health surveys
- **Multilingual Support**: Primary support for Arabic with RTL text formatting
- **Real-time Analytics**: Export call analytics and survey responses in Excel format
- **Healthcare Compliance**: Designed for Saudi healthcare regulations and standards
- **Scalable Architecture**: Built on modern serverless architecture with Next.js

## 🚀 Quick Start

### Prerequisites
- Node.js 18.x or later
- Supabase account and project
- OpenAI API account with credits
- Freepbx server with AMI access (optional for testing)

### 5-Minute Setup

```bash
# Clone the repository
git clone https://github.com/a7isss/hana-voice-saas.git
cd hana-voice-saas

# Install dependencies
npm install

# Set up environment
cp .env.local.example .env.local
# Edit .env.local with your actual values

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📚 Comprehensive Documentation

### Core Documentation
- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Complete technical documentation
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Detailed setup and configuration guide
- **[COMPREHENSIVE_FLOW_DOCUMENTATION.md](COMPREHENSIVE_FLOW_DOCUMENTATION.md)** - Architecture and flow analysis
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment checklist

### API Documentation
- **Authentication API** (`/api/auth`) - Client authentication and health checks
- **Voice Processing API** (`/api/voice`) - Text-to-speech and speech-to-text services
- **Data Export API** (`/api/data`) - Excel export and analytics
- **Telephony API** (`/api/telephony`) - Call management and automation

## 🏗️ Architecture Overview

```
Frontend (Next.js) → API Routes → External Services → Database (Supabase)
     ↓              ↓           ↓                   ↓
   React Pages   /api/*      OpenAI/Freepbx     PostgreSQL
```

### Technology Stack
- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase PostgreSQL
- **AI Services**: OpenAI TTS/STT, GPT analysis
- **Telephony**: Freepbx AMI integration
- **Deployment**: Render platform

## 🔧 Core Functionality

### Voice Automation
- Arabic text-to-speech generation
- Speech-to-text transcription for survey responses
- Multi-language support with RTL text handling
- Voice survey processing and analysis

### Call Management
- Automated patient outreach calls
- Excel-based patient list processing
- Call progress tracking and analytics
- Real-time call status monitoring

### Data Analytics
- Excel export with Arabic RTL formatting
- Survey response analysis and reporting
- Call analytics and performance metrics
- Healthcare compliance reporting

## 🚀 Deployment

### Render Deployment
The application is configured for deployment on Render with automatic builds from GitHub.

```yaml
# See render.yaml for deployment configuration
services:
  - type: web
    name: hana-voice-saas
    env: node
    plan: free
    region: frankfurt
    buildCommand: npm install && npm run build
    startCommand: npm start
```

### Environment Variables
Required environment variables for production:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase API key
- `OPENAI_API_KEY` - OpenAI API key for voice services
- `FREEPBX_*` - Freepbx telephony configuration

## 📊 Healthcare Compliance

### Saudi Arabia Specific Features
- Arabic language support with proper RTL text handling
- Healthcare survey templates for Saudi medical specialties
- Data privacy compliance with local regulations
- Multi-dialect Arabic speech recognition

### Supported Medical Specialties
- Cardiology, Dermatology, Endocrinology
- Emergency Medicine, ENT, General Practice
- Laboratory, Neurology, Obstetrics/Gynecology
- Oncology, Ophthalmology, Orthopedics
- Pediatrics, Pharmacy, Physical Therapy
- Psychiatry, Radiology, Surgery, Urology

## 🔒 Security Features

- Environment-based configuration management
- Supabase Row Level Security (RLS)
- Input validation and sanitization
- HTTPS enforcement in production
- Regular security updates and monitoring

## 🤝 Contributing

We welcome contributions to improve Hana Voice SaaS. Please see our documentation for:
- Code style guidelines
- API development standards
- Testing procedures
- Security considerations

## 📞 Support

### Documentation Resources
- **[PROJECT_DOCUMENTATION.md](PROJECT_DOCUMENTATION.md)** - Complete technical reference
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step setup instructions
- **[DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)** - Production deployment guide

### Community Support
- GitHub Issues for bug reports and feature requests
- Stack Overflow for technical questions
- Render Community for deployment issues

## 📄 License

Hana Voice SaaS is released under the MIT License.

## 🙏 Acknowledgments

Built on the TailAdmin Next.js template with extensive modifications for healthcare voice automation in Saudi Arabia.

---

*For detailed technical information, please refer to the comprehensive documentation files linked above.*
