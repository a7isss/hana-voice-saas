# Railway Python Voice Service Deployment Fix - Todo List

## Current Status
- ✅ Next.js frontend builds successfully locally
- ✅ API cleanup task completed
- ✅ Consolidated Maqsam telephony under `/api/telephony/`
- ✅ Committed and pushed to GitHub (commit: da47a9e)
- ❌ Railway Python voice service deployment failing

## Deployment Fix Tasks

- [ ] 1. Analyze current Railway configuration files
  - [ ] Review railway.toml (root multi-service config)
  - [ ] Review Python/voice_service/railway.json (service-specific config)
  - [ ] Review Python/voice_service/Procfile (Railpack detection)
  - [ ] Review Python/voice_service/nixpacks.toml (Nixpacks config)

- [ ] 2. Diagnose the Railpack vs Nixpacks issue
  - [ ] Determine why Railway is using Railpack instead of Nixpacks
  - [ ] Check if sourcePath configuration is correct
  - [ ] Verify builder detection mechanism

- [ ] 3. Fix Railway configuration
  - [ ] Ensure railway.toml is read correctly
  - [ ] Fix sourcePath for Python voice service
  - [ ] Configure proper builder selection (Nixpacks vs Railpack)
  - [ ] Update service detection files if needed

- [ ] 4. Fix file path issues
  - [ ] Ensure start.sh is in correct location relative to sourcePath
  - [ ] Verify all startup scripts are accessible
  - [ ] Check build and start commands

- [ ] 5. Test and verify deployment
  - [ ] Deploy to Railway with fixes
  - [ ] Verify both services (Next.js + Python) deploy successfully
  - [ ] Test service accessibility in production
  - [ ] Check voice model setup and functionality

- [ ] 6. Documentation updates
  - [ ] Update memory bank with deployment fixes
  - [ ] Document any configuration changes made
  - [ ] Update troubleshooting guides if needed

## Key Files to Review/Fix
1. `railway.toml` - Multi-service configuration
2. `Python/voice_service/railway.json` - Service-specific config  
3. `Python/voice_service/Procfile` - Railpack detection
4. `Python/voice_service/nixpacks.toml` - Nixpacks config
5. `Python/voice_service/start.sh` - Startup script location

## Target Outcome
Both Railway services (Next.js frontend + Python voice service) deploy successfully and are accessible in production with proper voice processing capabilities.
