# Database Schema (Supabase/PostgreSQL)

The database is designed for multi-tenancy, scalability, and security.

## 🗄️ Core Tables

### User Management
-   `users`: Stores user profiles, hashed passwords, and roles (`super_admin`, `hospital_admin`).
-   `hospitals`: Stores hospital profiles and configuration.

### Campaign System
-   `campaigns`: Voice campaigns targeting specific patient groups.
-   `call_sessions`: Individual call records with status and duration.
-   `survey_templates`: JSON-based survey structures.
-   `survey_responses`: Patient answers to survey questions.

### Patient Management
-   `patients`: Patient demographics and contact info.
-   `scheduled_appointments`: Appointments booked via voice calls.

## 🔒 Security (RLS)

Row Level Security (RLS) is enabled on all sensitive tables.
-   **Policies**: Restrict access based on `hospital_id` and user role.
-   **Note**: The current schema (`db/migrations/00001_initial_schema.sql`) includes comprehensive policies. Production deployment requires stricter policies ensuring users can ONLY access their own hospital's data.

## 📜 Setup

Run the `db/migrations/00001_initial_schema.sql` script in your Supabase SQL Editor to initialize the database.
