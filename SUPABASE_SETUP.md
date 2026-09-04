# TYPETEST Institutional Supabase Setup & Architecture Guide

This guide details the complete deployment, PostgreSQL database schema, security configuration, and concurrency architecture for **TYPETEST** — an institutional typing examination and proctoring platform designed to support **200+ concurrent students** with server-authoritative integrity, Row-Level Security (RLS), and automatic certification.

---

## 1. System Architecture Overview

```
                          ┌────────────────────────┐
                          │   Vercel Edge / SPA    │
                          │ React 19 + TypeScript  │
                          └───────────┬────────────┘
                                      │
                   HTTPS / WSS Realtime (Anon Key only)
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │    Supabase PostgreSQL    │
                        │    (Supavisor Pooler)     │
                        ├───────────────────────────┤
                        │ • RLS Policies            │
                        │ • Atomic RPC Functions    │
                        │ • Anti-Cheat Logging      │
                        │ • Unique Attempt Locks    │
                        └───────────────────────────┘
```

### High-Concurrency Guarantee (200+ Students)
Standard naive typing apps send each keystroke over HTTP or WebSockets, creating 200–500 DB writes per second per student (40,000–100,000 QPS for 200 students), causing immediate connection starvation and database crashes.

TYPETEST uses a **hybrid client-engine & atomic-checkpoint architecture**:
1. **Zero Keystroke DB Calls:** Keystrokes, raw WPM, net WPM, backspaces, and accuracy are calculated synchronously in-memory at 60 FPS using browser high-resolution timers (`performance.now()`).
2. **Periodic Checkpoints (15–30s):** The client emits a light periodic heartbeat via the `checkpoint_test_attempt` RPC function to keep the live proctor board updated without saturating the database connection pool.
3. **Atomic Transactions (`FOR UPDATE`):** The `start_test_attempt` and `submit_test_attempt` functions acquire pessimistic row locks to guarantee single attempts and prevent race conditions.
4. **Authoritative Timestamps:** Attempt duration and expiry are validated against server-side PostgreSQL timestamps (`clock_timestamp()`) to prevent student device clock tampering.

---

## 2. Supabase Project Setup Step-by-Step

### Step 1: Create Supabase Project
1. Log in to [Supabase](https://supabase.com) and click **New Project**.
2. Name the project `TYPETEST` and choose your preferred cloud region closest to your institution.
3. Choose a strong database password.

### Step 2: Execute SQL Migrations
Navigate to the **SQL Editor** in your Supabase dashboard and execute the migration files located in `/supabase/migrations/` in sequential order:

1. **`001_initial_schema.sql`**
   - Creates the institutional relational model: `departments`, `batches`, `classes`, `trainers`, `students`, `admins`, `tests`, `test_assignments`, `attempts`, `violations`, `certificates`, and `audit_logs`.
   - Sets up indexes on foreign keys and active statuses for sub-second query performance.
2. **`002_rls_policies.sql`**
   - Enables Row-Level Security (RLS) on all tables.
   - Configures granular policies for anonymous public reads on active tests, student-restricted attempt updates, trainer classroom access, and admin full authority.
3. **`003_functions.sql`**
   - Creates the atomic PL/pgSQL stored procedures:
     - `start_test_attempt(p_test_id, p_student_id)`
     - `checkpoint_test_attempt(p_attempt_id, p_net_wpm, ...)`
     - `record_violation(p_attempt_id, p_student_id, p_violation_type, ...)`
     - `submit_test_attempt(p_attempt_id, ...)`
     - `reset_student_attempt(p_test_id, p_student_id, p_admin_id, ...)`
4. **`004_seed_data.sql`**
   - Seeds initial departments (CSE, IT, AI&DS), batches (2024-2028), classrooms, faculty trainers, student candidates, and initial assessment tests.

---

## 3. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set the following variables with credentials from **Supabase Dashboard > Project Settings > API**:

```env
# Supabase Project URL (HTTPS)
VITE_SUPABASE_URL=https://your-project-ref.supabase.co

# Supabase Anonymous Publishable Key (Public - Safe for browser)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ **CRITICAL SECURITY RULE:**
> **Never** expose `SUPABASE_SERVICE_ROLE_KEY` in Vite client environment variables (`VITE_*`). The service-role key bypasses RLS and must remain private to backend services. All frontend operations run safely through the anonymous publishable key guarded by PostgreSQL Row-Level Security and atomic stored functions.

---

## 4. Vercel Deployment Instructions

TYPETEST is ready for one-click continuous deployment on Vercel:

1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Log into [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your GitHub repository (`TYPETEST`).
4. In the **Build and Output Settings**:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
5. In **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = Your Supabase anon publishable key
6. Click **Deploy**. Vercel will build and serve your app on global edge CDN locations with sub-50ms latency.

---

## 5. Seed Accounts & Roles

The system comes pre-seeded with the following credentials (configured in `004_seed_data.sql`):

| Role | Username / Identifier | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **System Admin** | `admin` | `admin123` | Institutional Admin Portal: full access to departments, batches, classes, student rosters, trainer accounts, reset overrides, and immutable audit trails. |
| **Faculty Trainer** | `trainer` | `trainer123` | Trainer Dashboard: manage custom tests, schedule timed windows, assign classes, monitor live tests, view leaderboards, and generate CSV reports. |
| **Faculty Proctor** | `proctor` | `proctor123` | Proctor dashboard: real-time examination monitoring and violation reviews. |
| **Student 1** | `24CS001` | `student123` | Student Portal: view assigned assessments, take tests, view certified credentials, and practice arena. |
| **Student 2** | `24CS002` | `student123` | Student Portal: view assigned assessments, take tests, and view certificates. |
| **Student 3** | `24CS003` | `student123` | Student Portal: view assigned assessments, take tests, and view certificates. |

*(Students can also log in directly using their Roll Number if passwords are set to roll numbers by default).*

---

## 6. Anti-Cheat & Single-Attempt Technical Enforcement

1. **Database Constraint:** The `attempts` table has a `UNIQUE(test_id, student_id)` constraint. Attempting to initiate two simultaneous tests will trigger a PostgreSQL conflict error.
2. **Server-Side Expiry:** `submit_test_attempt` validates `clock_timestamp() - started_at <= (time_limit_seconds + 15)` (with a 15-second grace period for network transit). Late submissions are rejected.
3. **Proctor Events:** Tab blur, clipboard paste, and page visibility changes emit an instant `record_violation` event to the database, flagging the student's submission.
4. **Authorized Reset:** If a student experiences an unexpected workstation failure, an administrator or trainer can invoke `reset_student_attempt(test_id, student_id, admin_id, reason)`. This clears the attempt lock while recording an entry in the immutable `audit_logs` table.
