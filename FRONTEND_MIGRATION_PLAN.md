# HANA VOICE SAAS - FRONTEND MIGRATION PLAN

## 🎯 **MIGRATION STRATEGY**

### **Use Existing Dashboard as Base**
- Replace `frontend/` directory with `free-nextjs-admin-dashboard-main/`
- Adapt ecommerce components to voice SaaS functionality
- Maintain all existing UI components and structure
- Customize for healthcare voice analytics

### **Files to Keep from Current Scaffold**
- `api-service/` - FastAPI backend services ✓
- `voice-service/` - TTS/STT processing ✓  
- `data-service/` - Excel export service ✓
- `config/` - Environment configuration ✓
- All `.md` documentation files ✓

### **Files to Delete (Cleanup)**
- `dashboard/` - Old React dashboard (redundant)
- `src/` - Legacy Python code (replaced by new services)
- `frontend/` - Basic scaffold (replaced by advanced dashboard)

## 📁 **FILE CLEANUP CHECKLIST**

### **Phase 1: Backup and Prepare**
- [ ] Backup current `free-nextjs-admin-dashboard-main` to safe location
- [ ] Document any customizations needed for voice SaaS
- [ ] Review component structure for adaptation

### **Phase 2: Migrate Frontend**
- [ ] Copy `free-nextjs-admin-dashboard-main` to `frontend/` 
- [ ] Update package.json dependencies for our specific needs
- [ ] Customize layout for Hana Voice branding
- [ ] Adapt ecommerce components to voice analytics

### **Phase 3: Cleanup Legacy Files**
- [ ] Delete `dashboard/` directory (old React app)
- [ ] Delete `src/` directory (legacy Python code)
- [ ] Delete basic `frontend/` scaffold files
- [ ] Keep all `.md` documentation files

### **Phase 4: Integration**
- [ ] Update API service URLs in frontend configuration
- [ ] Create voice-specific pages (calls, customers, reports, admin)
- [ ] Implement authentication flow with our API service
- [ ] Add Arabic language support for RTL text

## 🎨 **COMPONENT ADAPTATION PLAN**

### **Ecommerce → Voice SaaS Transformation**
- **EcommerceMetrics** → **VoiceAnalytics** (calls, success rates, credits)
- **MonthlySalesChart** → **CallVolumeChart** (calls over time)
- **RecentOrders** → **RecentCalls** (call log table)
- **DemographicCard** → **DepartmentStats** (healthcare departments)
- **MonthlyTarget** → **CreditUsage** (billing and credits)

### **New Pages Needed**
- `/calls` - Call management interface
- `/customers` - Patient list management  
- `/reports` - Data export interface
- `/admin` - Super admin dashboard
- `/billing` - Credit management

### **API Integration Points**
- Authentication: `/auth/login` → Supabase JWT
- Call data: `/calls/status` → Real-time statistics
- Customer management: `/customers` → Patient lists
- Export: `/export/surveys` → Excel reports

## 🔧 **TECHNICAL ADAPTATIONS**

### **Package.json Updates**
- Keep all existing dependencies
- Add axios for API calls
- Ensure TypeScript configuration matches our needs

### **Configuration Changes**
- Update `next.config.ts` to proxy to our API services
- Add environment variables for API endpoints
- Configure for Saudi Arabic RTL support

### **Styling Customizations**
- Maintain Tailwind CSS foundation
- Add Hana Voice color scheme
- Ensure proper Arabic font support
- RTL layout adjustments

## 🚀 **IMMEDIATE NEXT STEPS**

1. **Execute cleanup** - Remove redundant files while preserving documentation
2. **Migrate dashboard** - Copy and adapt the advanced Next.js dashboard
3. **Customize components** - Transform ecommerce elements to voice analytics
4. **Integrate APIs** - Connect frontend to our new backend services

## 📊 **SUCCESS METRICS**

- [ ] Frontend loads without errors
- [ ] All existing dashboard functionality works
- [ ] API integration points are connected
- [ ] Arabic RTL support implemented
- [ ] Voice-specific analytics displayed
- [ ] Responsive design maintained

**Status**: Ready for cleanup and migration
