# Hana Voice SaaS - Healthcare Voice Survey Platform

![Hana Voice SaaS](https://img.shields.io/badge/Hana-Voice%20SaaS-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat&logo=fastapi&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black?style=flat&logo=next.js&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)

A modern, scalable voice survey platform for healthcare institutions, featuring Arabic language support, real-time analytics, and automated patient follow-up.

## 🚀 Quick Start

### One-Click Deployment (Recommended)
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

### Manual Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd hana-voice-saas

# Set up environment variables
cp config/environment.example .env
# Edit .env with your API keys

# Deploy to Render (automatically detects render.yaml)
# Or run locally with Docker:
docker-compose up -d
```

## 📋 Prerequisites

- **Supabase Account**: For database and authentication
- **OpenAI API Key**: For voice processing (TTS/STT)
- **Render Account**: For deployment (free tier available)
- **FreePBX Server**: Optional, for telephony integration

## 🏗️ Architecture

### Microservices Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Gateway    │    │   Voice Service │
│  (Next.js 15)   │◄──►│   (FastAPI)      │◄──►│   (TTS/STT)     │
│   Port: 3000    │    │   Port: 8000     │    │   Port: 8001    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              │
                      ┌─────────────────┐
                      │   Data Service  │
                      │   (Excel Export)│
                      │   Port: 8002    │
                      └─────────────────┘
```

### Database Schema (Supabase)
- **profiles**: User accounts and credits
- **institutions**: Healthcare clients
- **customers**: Patients for calling
- **survey_responses**: Voice survey results
- **call_logs**: Call analytics
- **credit_transactions**: Billing history
- **audio_files**: Cached TTS audio

## 🎯 Key Features

### Voice Processing
- **Arabic TTS/STT**: Native support for Saudi dialect
- **Multi-language**: Arabic, English, French, Spanish
- **Audio Caching**: Reduces API costs and latency
- **Voice Quality**: 6 different TTS voices with customizable speed

### Data Management
- **Excel Export**: Professional reports with Arabic RTL formatting
- **Real-time Analytics**: Call success rates, department breakdowns
- **Batch Processing**: Efficient handling of large datasets
- **Data Validation**: Comprehensive error checking

### Healthcare Focus
- **Department-specific Surveys**: Cardiology, dermatology, emergency, etc.
- **Patient Management**: Priority-based calling and follow-up
- **Compliance Ready**: Audit trails and data protection
- **Saudi Market**: Arabic interface and local regulations

## 📁 Project Structure

```
hana-voice-saas/
├── api-service/           # FastAPI gateway (port 8000)
│   ├── src/
│   │   ├── api/          # REST endpoints
│   │   ├── core/         # Business logic
│   │   └── storage/      # Database operations
│   └── Dockerfile
├── voice-service/         # TTS/STT processing (port 8001)
│   ├── src/
│   │   └── core/         # Voice processing
│   └── Dockerfile
├── data-service/          # Excel export (port 8002)
│   ├── src/
│   │   └── core/         # Data export logic
│   └── Dockerfile
├── frontend/              # Next.js 15 dashboard
│   ├── src/
│   │   ├── app/          # App router
│   │   ├── components/   # UI components
│   │   └── layout/       # Header, sidebar
│   └── package.json
├── config/                # Environment configuration
├── docs/                  # Documentation
└── render.yaml            # Multi-service deployment
```

## 🔧 Configuration

### Environment Variables
```bash
# API Service
JWT_SECRET_KEY=your-secret-key
SUPABASE_URL=your-project-url
SUPABASE_KEY=your-anon-key
OPENAI_API_KEY=your-openai-key

# Voice Service
OPENAI_API_KEY=your-openai-key

# Frontend
NEXT_PUBLIC_API_URL=https://hana-voice-api.onrender.com
```

### Database Setup
1. Create Supabase project at [supabase.com](https://supabase.com)
2. Run the schema: `supabase_schema.sql`
3. Configure RLS policies and functions

## 🚀 Deployment

### Render Deployment (Recommended)
1. **Connect GitHub repository** to Render
2. **Auto-detection**: Render will detect `render.yaml`
3. **Environment variables**: Set in Render dashboard
4. **Custom domain**: Optional domain setup

### Local Development
```bash
# Run with Docker
docker-compose up -d

# Or run services individually
cd api-service && uvicorn src.main:app --reload
cd voice-service && uvicorn src.main:app --reload --port 8001
cd data-service && uvicorn src.main:app --reload --port 8002
cd frontend && npm run dev
```

## 📊 API Documentation

### Authentication
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}
```

### Voice Processing
```http
POST /api/v1/voice/generate-speech
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "مرحبا، كيف حالك اليوم؟",
  "voice": "nova",
  "language": "ar"
}
```

### Data Export
```http
GET /api/v1/export/survey-responses?client_id=client123&language=ar
Authorization: Bearer <token>
```

## 🎨 Frontend Features

### Dashboard Components
- **Voice Analytics**: Call volume, success rates, credit usage
- **Patient Management**: Customer lists and status tracking
- **Report Generation**: Excel exports with Arabic formatting
- **Real-time Updates**: Live call status and statistics

### Arabic RTL Support
- **Right-to-left layout**: Proper Arabic text direction
- **Arabic fonts**: Optimized typography for readability
- **Bilingual interface**: Arabic/English toggle
- **Cultural adaptation**: Saudi-specific design elements

## 💰 Pricing & Credits

### Credit System
- **Free credits**: 10 calls per new user
- **Paid credits**: Purchase additional credits
- **Call cost**: 0.50 credits per successful call
- **Bulk discounts**: Volume-based pricing

### Cost Optimization
- **Audio caching**: Reduces TTS API calls
- **Efficient calling**: Smart retry logic
- **Batch processing**: Optimized data exports
- **Free tier**: Development and testing

## 🔒 Security

### Authentication & Authorization
- **JWT tokens**: Secure API access
- **Role-based access**: User, admin, super_admin roles
- **Row-level security**: Database-level permission control
- **Rate limiting**: API abuse prevention

### Data Protection
- **Encrypted storage**: Sensitive data encryption
- **Audit trails**: Complete transaction history
- **GDPR compliance**: Data protection regulations
- **Regular backups**: Automated database backups

## 📞 Support & Maintenance

### Monitoring
- **Health checks**: Automatic service monitoring
- **Error tracking**: Comprehensive logging
- **Performance metrics**: Response times and uptime
- **Alert system**: Proactive issue detection

### Maintenance
- **Weekly backups**: Database and file backups
- **Security updates**: Regular dependency updates
- **Performance tuning**: Continuous optimization
- **Feature updates**: Monthly feature releases

## 🚨 Troubleshooting

### Common Issues
```bash
# Database connection issues
Check SUPABASE_URL and SUPABASE_KEY in environment variables

# Voice processing failures
Verify OPENAI_API_KEY and check API quota

# Frontend build errors
Ensure Node.js version 18+ and run npm install

# Deployment failures
Check Render logs and environment variable configuration
```

### Health Check Endpoints
- API Service: `https://hana-voice-api.onrender.com/health`
- Voice Service: `https://hana-voice-service.onrender.com/health`
- Data Service: `https://hana-data-service.onrender.com/health`

## 📈 Performance Metrics

### Target Performance
- **API response time**: < 200ms
- **Voice processing**: < 2 seconds
- **Excel export**: < 30 seconds for 10,000 records
- **Concurrent users**: 50+ simultaneous users

### Scalability
- **Horizontal scaling**: Multiple service instances
- **Load balancing**: Automatic traffic distribution
- **Database optimization**: Indexed queries and caching
- **CDN integration**: Static asset delivery

## 🤝 Contributing

### Development Workflow
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open pull request**

### Code Standards
- **TypeScript**: Strict type checking
- **Python**: PEP 8 compliance
- **Testing**: Comprehensive test coverage
- **Documentation**: Clear code comments

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: For advanced TTS/STT capabilities
- **Supabase**: For scalable database infrastructure
- **Render**: For seamless deployment platform
- **FastAPI**: For high-performance API framework
- **Next.js**: For modern React framework

---

**Need Help?** Check our [documentation](docs/) or create an issue in the repository.

**Status**: Production Ready 🚀
