# Dashboard Implementation Plan for Voice AI Project

## Project Overview
Build a comprehensive dashboard environment for the existing multi-client voice AI system (هناء/Hana) with phone-based authentication, user management, and questionnaire analytics.

## Architecture
- **Frontend**: React/Next.js hosted on Netlify
- **Backend**: FastAPI on Render
- **Authentication**: Supabase Auth (phone number OTP verification)
- **Database**: Supabase (existing PostgreSQL)
- **User Management**: Supabase Auth with custom user metadata
- **Existing Integration**: Leverage current voice AI project structure

## Backend API Structure (FastAPI on Render)

### Authentication Endpoints
```python
# Endpoints for Supabase Auth with phone OTP
POST /auth/send-otp           # Send OTP to phone number
POST /auth/verify-otp         # Verify OTP and create/login user
POST /auth/register           # Complete registration with email and company
POST /auth/logout             # User logout
GET /auth/me                  # Get current user info
GET /auth/session             # Check session status
```

### User Management Endpoints
```python
# User and company management
GET /users                    # List users (admin only)
GET /users/{user_id}          # Get user details
PUT /users/{user_id}          # Update user info
DELETE /users/{user_id}       # Delete user (admin)
GET /companies                # List companies
POST /companies               # Create new company
```

### Dashboard Data Endpoints
```python
# Questionnaire results and analytics
GET /dashboard/overview       # Overall KPIs and summary
GET /dashboard/responses      # Filtered survey responses
GET /dashboard/trends         # Time-based trend data
GET /dashboard/departments    # Department-specific reports
GET /dashboard/patients       # Patient feedback history
```

## Frontend Components (React/Next.js for Netlify)

### Pages Structure
```
src/
  components/
    auth/
      LoginForm.js           # Supabase phone input
      VerifyOTP.js           # OTP verification
      RegisterForm.js        # Sign-up with phone, email, company
    dashboard/
      Overview.js           # Main dashboard with KPIs
      Responses.js          # Survey response browser
      Trends.js             # Charts and trend analysis
      Departments.js        # Department performance
      Patients.js           # Patient feedback viewer
  pages/
    index.js                # Landing page
    login.js                # Login page
    register.js             # Registration page
    dashboard.js            # Main dashboard
    dashboard/[section].js  # Dashboard subsections
```

### Key Performance Indicators (KPIs)
- **Completion Rate**: Percentage of completed surveys vs total calls
- **Response Distribution**: Yes/No/Uncertain percentages
- **Department Performance**: Comparison across departments
- **Call Success Rate**: Successful calls vs attempted
- **Trend Analysis**: Daily/weekly performance trends
- **Patient Satisfaction**: Overall yes rate minus no rate

## Authentication Flow with Supabase Auth

### Login/Registration Process
1. User enters phone number on login/register page
2. System sends OTP via Supabase Auth's phone verification
3. User enters OTP for verification
4. For new users: system prompts for email and company name after OTP verification
5. User account is created/authenticated with Supabase Auth
6. Custom user metadata (email, company) is stored in Supabase
7. System creates session and redirects to dashboard

### User Management
- Supabase Auth handles phone verification and base user authentication
- Custom user data (email, company, role) stored in separate table linked to Supabase user ID
- Role-based access control integrated with Supabase sessions

## Data Models

### User Profile Model (Extends Supabase Auth)
```sql
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    company_id UUID REFERENCES companies(id),
    role VARCHAR(20) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ,
    CONSTRAINT fk_user FOREIGN KEY (id) REFERENCES auth.users(id)
);

-- Enable RLS for security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Company Model
```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view companies they are associated with
CREATE POLICY "Users can view associated companies" ON companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM user_profiles 
            WHERE id = auth.uid()
        )
        OR created_by = auth.uid()
    );

-- Policy: Admins can view all companies
CREATE POLICY "Admins can view all companies" ON companies
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
```

### Data Integration with Existing Tables
```sql
-- Add company_id to existing survey_responses for filtering
ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);

-- Add company_id to existing call_logs for filtering  
ALTER TABLE call_logs 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
```

## Integration with Existing Voice AI System

### Data Access Patterns
- Read-only access to existing survey responses and call logs
- Join between dashboard_users and existing client configurations
- Company-based data filtering for multi-tenancy

### API Security
- JWT-based authentication for all dashboard endpoints
- Role-based access control (user, admin, superadmin)
- Company-based data isolation
- CORS configuration for Netlify frontend

## Deployment Configuration

### Render Backend Setup
```yaml
# render.yaml
services:
  - type: web
    name: hana-dashboard-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port 8000
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: hana-dashboard
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_KEY
        sync: false
```

### Netlify Frontend Setup
```yaml
# netlify.toml
[build]
  publish = "out"
  command = "npm run build"

[build.environment]
  NEXT_PUBLIC_API_URL = "https://hana-dashboard-api.onrender.com"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## Environment Variables

### Backend (.env)
```ini
DATABASE_URL=postgresql://user:pass@host:5432/db
JWT_SECRET=your-jwt-secret-key
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
ALLOWED_ORIGINS=https://your-netlify-app.netlify.app
```

### Frontend (.env.local)
```ini
NEXT_PUBLIC_API_URL=https://hana-dashboard-api.onrender.com
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Implementation Phases

### Phase 1: Authentication Foundation
- [ ] Configure Supabase Auth with phone OTP
- [ ] Create user/company models in Supabase
- [ ] Implement Supabase Auth integration endpoints
- [ ] Build phone verification frontend components

### Phase 2: Dashboard Core
- [ ] Create dashboard layout and navigation
- [ ] Implement data fetching from existing tables
- [ ] Build KPI overview components
- [ ] Add basic charts and visualizations

### Phase 3: Advanced Features
- [ ] Implement department filtering
- [ ] Add trend analysis and time filters
- [ ] Create patient feedback viewer
- [ ] Add export functionality

### Phase 4: Polish and Deployment
- [ ] Style refinement and responsive design
- [ ] Error handling and loading states
- [ ] Deployment to Render and Netlify
- [ ] Testing and bug fixes

## Dependencies

### Backend Requirements
```txt
fastapi==0.104.1
uvicorn==0.24.0
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
supabase==1.0.3
requests==2.31.0
```

### Frontend Requirements
```txt
next: 14.0.0
react: 18.0.0
react-dom: 18.0.0
axios: 1.6.0
chart.js: 4.4.0
react-chartjs-2: 5.2.0
tailwindcss: 3.3.0
```

This plan provides a comprehensive roadmap for building the dashboard environment that integrates with your existing voice AI system while adding phone-based authentication and advanced analytics capabilities.
