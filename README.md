# Institutional Examination & Typing Assessment Engine
**Enterprise University & College Technical Examination Platform**

An institutional-grade typing assessment, secure examination proctoring, and automated certification platform engineered for university departments, coding cohorts, and placement evaluation drives. Built for multi-device cross-network administration with centralized PostgreSQL cloud persistence.

---

## 🚀 Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Database & Cloud Backend**: [Supabase](https://supabase.com/) (PostgreSQL 15+ with Row-Level Security & Realtime triggers)
- **Build Tooling & Bundler**: [Vite 6](https://vitejs.dev/)
- **Styling & Design System**: [Tailwind CSS v4](https://tailwindcss.com/) (Sophisticated institutional dark & slate palette)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Animations & Visual FX**: [Motion](https://motion.dev/) & [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **Typing Engine**: Zero-latency keystroke analyzer with real-time Net WPM, Raw WPM, accuracy precision, and proctoring monitors

---

## ⚡ Quick Start: Database Setup (1 Minute)

To allow candidates and administrators to access tests and accounts from **any device or network** (Vercel, mobile, lab PCs), the centralized PostgreSQL database must be initialized once:

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to your project (`felqveyqlcmhbdzuaxaf`).
3. Click on the **SQL Editor** icon in the left navigation bar.
4. Click **New query**.
5. Copy and paste the complete database script from:
   - File in your repository: [`supabase/COMPLETE_INSTITUTIONAL_SETUP.sql`](./supabase/COMPLETE_INSTITUTIONAL_SETUP.sql)
   - Or public web path: [`/setup.sql`](./public/setup.sql)
   - Or click **DB Diagnostics > Copy SQL** inside the application's Admin Portal.
6. Click the green **RUN** button in Supabase.
7. Once executed, all tables (`students`, `admins`, `trainers`, `tests`, `attempts`, `departments`, `classes`, `batches`, `violations`, `audit_logs`) and policies are active!

---

## 🏛️ System Architecture & User Roles

### 1. 🛡️ Department Administrator (`admin`)
- **Central Student Directory**: Add students individually or ingest hundreds of student records via Excel/CSV paste (Roll Number, Full Name, Classroom).
- **Cross-Device Persistence**: Student accounts are immediately synchronized to Supabase PostgreSQL, enabling instant login from any student laptop, lab terminal, or phone.
- **Classrooms & Batches**: Structure departments, graduation batches (e.g. 2024–2028), and section classrooms.
- **Trainer Governance**: Create and assign faculty proctors to classrooms.
- **Audit & Security**: Real-time log of all administrative actions, student logins, and test resets.

### 2. 🎓 Proctor / Trainer Portal
- **Assessment Management**: Create timed typing assessments and programming syntax tests (C, C++, Java, Python, JavaScript, DSA).
- **Targeting & Deadlines**: Assign tests to specific class cohorts with minimum qualifying speed and accuracy benchmarks.
- **Live Proctoring**: Monitor active examinations, live keystroke analytics, and proctoring violation alerts.
- **Export & Reports**: Download complete cohort performance reports in CSV format.

### 3. ⌨️ Student Portal
- **Candidate Hub**: View pending, active, and completed institutional tests assigned to their classroom.
- **Typing Arena**: High-performance typing interface with live character-level feedback (correct, error, pending cursor).
- **Anti-Cheat Enforcement**:
  - Fullscreen lock & focus tracking.
  - Tab switch & window blur detection.
  - Cut, copy, and paste blocking.
  - Right-click context menu prevention.
  - Single-attempt locking for formal assessments.
- **Verifiable Certificates**: Dynamic PDF/print certificates awarded upon achieving passing thresholds.

---

## 🔑 Login Credentials

### Administrator Portal
- **Identifier**: `admin`
- **Password**: `admin123` (or `admin@123`)

### Trainer / Faculty Portal
- **Identifier**: `trainer1`
- **Password**: `trainer123` (or `trainer@123`)

### Student Candidate Login
- **Identifier**: Student's **Roll Number** (e.g. `24CS001`)
- **Password**:
  - The custom password assigned by the Admin when creating the student.
  - Or the student's own **Roll Number** (case-insensitive default).
  - Or default institutional PIN: `1234` or `student123`.

*Note: All demo candidates have been removed. The database is a clean slate ready for your real institutional student roster.*

---

## 🌐 Deployment to Vercel

When deploying to Vercel, ensure the following Environment Variables are configured in your Vercel Project Settings:

| Environment Variable | Description | Value |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Supabase Project REST Endpoint | `https://felqveyqlcmhbdzuaxaf.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anonymous Public Key | *Your Anon Public Key* |

*(The application also includes these as pre-configured fallbacks in code so the connection works immediately).*

---

## 🛠️ Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start development server (port 3000)
npm run dev

# 3. Type check & lint
npm run lint

# 4. Build production bundle
npm run build
```

---

## 📄 License & Institutional Usage

Designed and built for University Department Examination Cells & Placement Assessment Drives. All rights reserved.
