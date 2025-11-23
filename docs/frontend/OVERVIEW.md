# Frontend Overview (Next.js)

The frontend is built with **Next.js 15 (App Router)**, **React 19**, and **Tailwind CSS**. It serves as the primary interface for hospitals, super admins, and patients.

## 📂 Directory Structure

-   `src/app/(public)`: Public pages (Landing, Login, Signup).
-   `src/app/hospital`: Hospital Dashboard (Campaigns, Reports, Patient Management).
-   `src/app/sadmin`: Super Admin Dashboard (System Health, Hospital Management).
-   `src/app/api`: Backend-for-Frontend (BFF) API routes.
-   `src/components`: Reusable UI components (AuthGuard, Header, Button, etc.).
-   `src/lib`: Utility functions (Supabase client, Auth service).

## 🔐 Authentication

-   **Custom RBAC**: We use a custom Role-Based Access Control system.
-   **Guards**:
    -   `AuthGuard`: Protects Super Admin routes.
    -   `HospitalAuthGuard`: Protects Hospital routes.
-   **Storage**: Tokens and user info are stored in `localStorage` ('hospital_token', 'hospital_user').

## 🛠️ Key Features

1.  **Dashboard**: Real-time visualization of campaign stats.
2.  **Campaign Manager**: Create and schedule voice campaigns.
3.  **Voice Integration**: Proxies requests to the Python Voice Service via `/api/voice`.

## 🚀 Development

```bash
npm install
npm run dev
```
