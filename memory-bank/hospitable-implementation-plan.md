# 🏥 HANA VOICE SaaS - Hospital Implementation Plan
## Complete Missing Components for Hospital User System

**Date:** November 16, 2025
**Status:** Ready for Implementation
**Priority:** HIGH - Required for production hospital access

---

## 🎯 **EXECUTIVE SUMMARY**

Current architecture has **A/B access separation** but missing **authentication & data access**. This plan implements secure hospital registration, authentication, and data access using **simple but robust** patterns.

### **🎨 Approach: Secure & Simple**
- **JWT Authentication** with refresh tokens for hospitals
- **Email-based signup** for hospitals (admin approval)  
- **Role-based access control** (hospital_staff = read-only)
- **Database Row Level Security** for hospital data isolation
- **Minimal dependencies** - built with existing tech stack

---

## 🔐 **1. HOSPITAL AUTHENTICATION SYSTEM**

### **1.1 User Registration Requirements**
- **Hospital Signup Fields**: Email, User Name, Organization Name
- **Auto-creation**: Organization created if doesn't exist
- **Email Verification**: Required for account activation
- **Admin Approval**: Hospitals must be approved by super admin
- **Initial Role**: `hospital_staff` (read-only access)

### **1.2 JWT Authentication Flow**
```typescript
// HOSPITAL SIGNUP:
// 1. Email + Name + Organization → /api/auth/hospital/signup
// 2. Organization auto-created or matched
// 3. User created with hospital_id, role=hospital_staff
// 4. Email verification sent
// 5. Wait for admin approval
// 6. Login enabled

// HOSPITAL LOGIN:
// 1. Email + Password → /api/auth/hospital/login
// 2. JWT + Refresh token issued
// 3. Redirect to /hospital
```

### **1.3 Security Features**
- **Password hashing** with bcrypt
- **JWT tokens** with hospital_id and role claims
- **Refresh token rotation** for security
- **Session management** with automatic logout
- **Rate limiting** on auth endpoints

---

## 🗄️ **2. DATABASE SECURITY & RLS POLICIES**

### **2.1 Current Schema Status**
✨ **Already Created:** `supabase_schema_comprehensive.sql`
- 15+ tables including users, hospitals, patients, campaigns
- RLS disabled on all tables (needs activation)
- Proper foreign key relationships established

### **2.2 RLS Policies to Implement**

```sql
-- Enable RLS on hospital data
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- HOSPITAL-SPECIFIC POLICIES (read-only for hospital_staff)
CREATE POLICY "hospital_staff_access_patients" ON patients
FOR SELECT USING (hospital_id = auth.jwt()->>'hospital_id');

CREATE POLICY "hospital_staff_access_campaigns" ON campaigns
FOR SELECT USING (hospital_id = auth.jwt()->>'hospital_id');

CREATE POLICY "hospital_staff_access_call_sessions" ON call_sessions
FOR SELECT USING (campaign_id IN (
  SELECT id FROM campaigns WHERE hospital_id = auth.jwt()->>'hospital_id'
));
```

### **2.3 Migration Strategy**
- **Origin Schema:** Keep existing robocall tables (backwards compatible)
- **New Schema:** Apply comprehensive schema SUPER CAREFULLY
- **Data Preservation:** Migrate user conversations to new patient structure
- **Fallback:** Staging environment testing before production

---

## 🔑 **3. HOSPITAL REGISTRATION SYSTEM**

### **3.1 Frontend Components**
```
📁 src/app/auth/hospital/
├── signup/page.tsx        # Hospital registration form
├── login/page.tsx         # Hospital login form
├── verify/page.tsx        # Email verification
├── pending/page.tsx       # Approval waiting page
├── layout.tsx             # Auth layout (no sidebar)
```

### **3.2 Registration Fields**
```typescript
interface HospitalSignup {
  email: string;              // Required - unique login
  fullName: string;           // Required - display name
  organizationName: string;   // Required - creates/links hospital
  password: string;           // Required - hashed storage
}
```

### **3.3 Admin Approval Interface**
```
📁 src/app/admin/hospital-management/
├── page.tsx               # List hospitals awaiting approval
├── approve/[id]/page.tsx  # Approve/reject individual hospitals
├── manage/page.tsx        # Manage approved hospitals
├── invite/page.tsx        # Invite new hospitals
```

---

## 🚀 **4. COMPLETE HOSPITAL API IMPLEMENTATION**

### **4.1 Dashboard Metrics** ✅ **PARTIALLY DONE**
```typescript
GET /api/hospital/dashboard
- Auth required (JWT)
- Returns: active_calls, completed_calls, success_rate, etc.
- Hospital-specific data only
```
**Status:** Created but falls back to demo data (Supabase connection issues)

### **4.2 Robocall Campaigns API** 🔧 **MISSING - HIGH PRIORITY**
```typescript
GET /api/hospital/campaigns
- Lists completed campaigns for user's hospital
- Returns: campaign_name, success_rate, responses, date
- Real-time: currently running campaigns
- ✅ RLS ensures hospital sees only their campaigns
```

### **4.3 Patient Management API** 🔧 **MISSING - HIGH PRIORITY**
```typescript
GET /api/hospital/patients
- Lists patients contacted by hospital's campaigns
- Returns: patient_info, contact_history, survey_results
- Search/filter by: name, phone, condition, date_range
- ✅ Medical Notes: Store follow-up requirements
```

### **4.4 Appointment Management API** 🔧 **MISSING - HIGH PRIORITY**
```typescript
GET /api/hospital/appointments
GET /api/hospital/appointments/scheduled
GET /api/hospital/appointments/completed
- Lists appointments generated from robocall surveys
- ✅ Auto-created when audio survey asks "Do you need an appointment?"
- Includes: patient_name, datetime, doctor, department, notes
```

---

## 🎨 **5. FRONTEND HOSPITAL INTERFACE COMPLETION**

### **5.1 Hospital Dashboard Tabs** 🔧 **PARTIALLY DONE**

**✅ Overview Tab:** Working with demo data
- Active calls counter, daily metrics, success rates
- Weekly performance charts, critical alerts

**🔧 Campaigns Tab:** Currently placeholder
```tsx
// TODO: Connect to /api/hospital/campaigns
// Show: Campaign name, success rate, total calls, date range
// Filter: By date, type, status
```

**🔧 Patients Tab:** Currently placeholder
```tsx
// TODO: Connect to /api/hospital/patients
// Show: Patient name, phone, condition, last contact, survey results
// Search: Name, condition, date range
```

**🔧 Appointments Tab:** Currently placeholder
```tsx
// TODO: Connect to /api/hospital/appointments
// Show: Scheduled appointments with patient details, doctor, timing
// Filter: Upcoming, completed, cancelled
// Export: PDF appointment summary
```

---

## 🔒 **6. SUPER ADMIN HOSPITAL MANAGEMENT**

### **6.1 Hospital Management Pages** 🔧 **MISSING**
```tsx
// Admin can:
// 1. Approve/reject hospital signups
// 2. View all registered hospitals
// 3. See hospital usage statistics
// 4. Reset hospital passwords
// 5. Transfer patients between hospitals
// 6. View hospital payment/account status
```

### **6.2 Hospital Analytics** 🔧 **MISSING**
- **Dashboard:** Hospital overview metrics
- **Usage Reports:** Call volumes, success rates
- **Financial Reports:** Subscription status, billing
- **Audit Logs:** Security and access tracking

---

## 🧪 **7. TESTING & VALIDATION PLAN**

### **7.1 Unit Tests**
- Authentication flow testing
- RLS policy validation
- API endpoint access control
- JWT token management

### **7.2 Integration Tests**
- Hospital signup → approval → login flow
- Data access isolation between hospitals
- Cross-hospital security prevention
- Real-time campaign updates

### **7.3 End-to-End Tests**
- Complete hospital user journey
- Admin hospital management workflow
- Multi-hospital data isolation
- Performance under load

---

## 📅 **8. IMPLEMENTATION PHASES**

### **Phase 1: Critical Authentication (Week 1)**
1. ✅ Create auth pages: signup, login, verify, pending
2. ✅ Build auth APIs: signup, login, verify
3. ✅ JWT implementation with hospital claims
4. ✅ Basic RLS policies for data isolation
5. 🧪 Test: Hospital login/signup flow

### **Phase 2: Hospital APIs (Week 1-2)**
1. ✅ Fix dashboard API connection
2. 🔧 Implement campaigns API
3. 🔧 Implement patients API
4. 🔧 Implement appointments API
5. 🧪 Test: All hospital endpoints work

### **Phase 3: Admin Interface (Week 2)**  
1. 🔧 Build hospital management pages
2. 🔧 Hospital approval/rejection system
3. 🔧 Hospital usage analytics
4. 🧪 Test: Admin hospital management works

### **Phase 4: Polish & Security (Week 2)**  
1. 🔧 Complete frontend tabs with APIs
2. 🔧 Error handling and user feedback
3. 🔧 Security audit and edge case testing
4. 🧪 Performance and security validation

---

## 🛠️ **9. TECHNICAL IMPLEMENTATION DETAILS**

### **9.1 Technology Stack**
- **Frontend:** Next.js 15, TypeScript, Tailwind CSS (existing)
- **Backend:** Next.js API routes (existing)
- **Database:** Supabase PostgreSQL (existing)
- **Auth:** JWT with refresh tokens (NEW)
- **Security:** bcrypt for passwords, RLS for data access (NEW)

### **9.2 Environment Variables**  
```bash
# ADD TO .env (existing + new)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=hana_voice_jwt_secret_2025
JWT_REFRESH_SECRET=hana_voice_refresh_secret_2025
SMTP_HOST=outlook.office365.com
SMTP_USER=support@hanavoice.com
SMTP_PASS=...

# REQUIRED CRITICAL BLOCKER  
TELEPHONY_TOKEN=your-maqsam-pre-shared-token
```

### **9.3 Error Handling Strategy**
- **API Errors:** JSON responses with error codes
- **Auth Errors:** Proper HTTP status codes (401, 403)
- **Database Errors:** User-friendly messages without exposure
- **Network Errors:** Retry logic for hospital client

---

## 🎯 **SUCCESS CRITERIA**

### **Functional Requirements**
- ✅ Hospital users can register with email + name + organization
- ✅ Super admin can approve/reject hospital registrations  
- ✅ Hospitals get read-only access to their robocall results
- ✅ Complete data isolation between hospitals
- ✅ Telephony integration works with TELEPHONY_TOKEN

### **Security Requirements**
- ✅ JWT-based authentication with refresh tokens
- ✅ Database RLS prevents cross-hospital data access
- ✅ Secure password storage and email verification
- ✅ Rate limiting on auth endpoints
- ✅ Comprehensive audit logging

### **User Experience Requirements**
- ✅ Simple hospital signup process (email, name, organization)  
- ✅ Clear waiting page for admin approval
- ✅ Intuitive dashboard showing robocall results
- ✅ Arabic-first interface for Saudi hospitals
- ✅ Mobile-responsive design

---

## 🚀 **READY FOR IMPLEMENTATION**

**This plan provides:**  
✅ **Complete roadmap** for missing hospital functionality  
✅ **Simple but secure** authentication system  
✅ **Clear implementation phases** with specific deliverables  
✅ **Technology stack aligned** with existing codebase  
✅ **Testing strategy** for quality assurance  

**Next Step:** Create new task with this plan's context for implementation!

---

**Plan Created:** November 16, 2025  
**Estimated Effort:** 2-3 weeks (part-time)  
**Risk Level:** LOW (using familiar technologies)  
**Dependencies:** TELEPHONY_TOKEN for testing
