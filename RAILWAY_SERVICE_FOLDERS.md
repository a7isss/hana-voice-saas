# Railway Service Root Folder Configuration

## Current Setup (CORRECT)

Your `railway.toml` is already properly configured to avoid conflicts:

```toml
[[services]]
name = "hana-voice-saas"
sourcePath = "."                    # Frontend: Uses entire repository root
buildCommand = "npm install && npm run build"
startCommand = "npm start -- -p $PORT"
healthcheckPath = "/api/health"
healthcheckTimeout = 300

[[services]]
name = "hana-voice-service"
sourcePath = "Python/voice_service" # Backend: Uses only Python service directory
buildCommand = "uv sync --frozen --no-dev"
startCommand = "uv run uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
```

## Why This Setup Works

### Frontend Service (`hana-voice-saas`)
- **Root Folder**: `.` (entire repository root)
- **Includes**: `package.json`, `next.config.ts`, `src/`, `public/`, etc.
- **Builds**: Next.js application
- **Excludes**: `Python/` directory (not included in frontend build)

### Backend Service (`hana-voice-service`)
- **Root Folder**: `Python/voice_service/` (only the Python service)
- **Includes**: `pyproject.toml`, `app/`, `models/`, etc.
- **Builds**: Python FastAPI application
- **Excludes**: Frontend files (`src/`, `package.json`, etc.)

## Benefits of This Approach

1. **No Conflicts**: Each service only sees its own files
2. **Clean Builds**: Frontend doesn't see Python dependencies, backend doesn't see Node.js dependencies
3. **Faster Deployments**: Smaller build contexts for each service
4. **Isolated Environments**: Each service has its own dependency resolution

## Service URLs After Deployment

When deployed, you'll get separate URLs:

```
Frontend:  https://hana-voice-saas-production.railway.app
Backend:   https://hana-voice-service-production.railway.app
```

## Next Steps

1. **Deploy**: Push your changes - Railway will handle the rest
2. **Frontend URL**: Use the frontend URL in your domain configuration
3. **Backend URL**: Update `VOICE_SERVICE_URL` in frontend environment variables

## Alternative Setup (If Needed)

If you ever need separate Railway projects (different from the multi-service approach):

### Option 1: Separate Repositories
```
Frontend Repo:  https://github.com/youruser/hana-voice-frontend.git
Backend Repo:   https://github.com/youruser/hana-voice-backend.git
```

### Option 2: Subdirectory Approach
```
/
├── frontend/     # Frontend service root
│   ├── package.json
│   └── ...
└── backend/      # Backend service root
    ├── pyproject.toml
    └── ...
```

But your current setup is optimal and requires no changes!
