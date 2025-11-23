# Hana Voice SaaS - Arabic Healthcare Voice Automation

Hana Voice SaaS is a comprehensive, AI-powered voice automation platform designed specifically for the Saudi Arabian healthcare market. It enables hospitals to automate patient interactions, surveys, and appointment scheduling using natural Arabic voice conversations.

## 🚀 Project Status: MVP Ready

The project has reached MVP status with the following core features enabled:

-   **Frontend**: Next.js 15 App Router with a 3-basket route structure (`(public)`, `hospital/`, `sadmin/`).
-   **Database**: Supabase (PostgreSQL) with a comprehensive, future-proof schema (`db/schema_mvp.sql`).
-   **Voice Service**: Python FastAPI service with WebSocket support for real-time Arabic STT/TTS and Maqsam telephony integration.
-   **Authentication**: Custom RBAC system (Super Admin, Hospital Admin, Staff) integrated with Supabase.

## 📂 Project Structure

-   `src/app/(public)`: Public-facing pages (Landing, Auth).
-   `src/app/hospital`: Hospital Dashboard and tools (Campaigns, Reports, Templates).
-   `src/app/sadmin`: Super Admin Dashboard and system management tools.
-   `src/app/api`: Next.js API routes (Voice proxy, Dashboard data aggregation).
-   `Python/voice_service`: Core voice processing service (FastAPI, Vosk, Coqui TTS).
-   `db`: Database schemas and migration scripts.
-   `docs/archive`: Archived documentation and planning files.

## 🛠️ Quick Start

### Prerequisites

-   Node.js 18+
-   Python 3.10+
-   Supabase Project
-   Railway Account (for deployment)

### 1. Database Setup

1.  Create a new Supabase project.
2.  Run the SQL script `db/schema_mvp.sql` in the Supabase SQL Editor to create tables and policies.
3.  Get your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
VOICE_SERVICE_URL=http://localhost:8000
VOICE_SERVICE_SECRET=your_secret_key
```

### 3. Run Voice Service (Python)

```bash
cd Python/voice_service
pip install -r requirements.txt
python -m app.main
```

### 4. Run Frontend (Next.js)

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` to access the application.

## 🔑 Key Features

-   **Smart Campaigns**: Create and manage automated calling campaigns.
-   **Real-time Dashboard**: Monitor call progress, success rates, and patient responses.
-   **Arabic Voice AI**: Native support for Saudi dialect speech recognition and synthesis.
-   **Telephony Integration**: Ready for Maqsam integration for PSTN calls.

## 📚 Documentation

For historical context and detailed planning documents, check the `docs/archive` directory.
