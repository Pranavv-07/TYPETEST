# Institutional Typing Speed Assessment & Examination Engine
**Department of Computer Science & Engineering**

An institutional-grade typing assessment, proctoring, and certification platform engineered for university departments, programming cohorts, and placement preparation.

---

## 🚀 Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tooling & Bundler**: [Vite 6](https://vitejs.dev/)
- **Styling & UI**: [Tailwind CSS v4](https://tailwindcss.com/) with modern dark aesthetic
- **Icons**: [Lucide React](https://lucide.react)
- **Animations & Visual Feedback**: [Motion](https://motion.dev/) & [canvas-confetti](https://www.npmjs.com/package/canvas-confetti)
- **State & Persistence**: React Context API (`AppContext`) with persistent client-side storage (`localStorage`) and pre-seeded institutional datasets
- **Typing & Proctoring Engine**: Zero-dependency keystroke analyzer with real-time Net WPM, Raw WPM, character error metrics, and anti-cheat event monitors

---

## 🏛️ System Architecture & User Roles

### 1. 🛡️ Department Administrator (`admin`)
- **Student Roster Governance**: Full control to view, search, filter, edit details (Roll No, Candidate Name, Class Cohort, Batch, Custom Passwords), or delete student accounts.
- **Trainer & Proctor Directory**: Create, modify, and manage proctoring staff accounts and classroom permissions.
- **Institutional Audit Log**: View all submission records across cohorts, with ability to reset single-attempt locks for legitimate re-examinations.
- **Bulk Data Ingestion**: Intelligent roster parser supporting Excel rows, comma-separated values, tab-delimited records, or PDF tabular text.

### 2. 🎓 Proctor / Trainer Portal
- **Assessment Management**: Create custom timed typing assessments and coding syntax tests (C, C++, Java, Python, JavaScript, DSA).
- **Targeting & Deadlines**: Assign tests to specific class cohorts or all candidates with passing thresholds (e.g., minimum accuracy %).
- **Evaluation & Submissions**: Real-time performance tracking with detailed breakdowns:
  - Net WPM & Raw WPM
  - Precision Accuracy % & Character Errors
  - Time elapsed and submission timestamps
  - Proctor blur/tab-switch flag count
- **Class Analytics & Export**: Export roster reports to CSV/print view, view dynamic leaderboards, and issue certified scorecards.

### 3. ⌨️ Student Portal
- **Candidate Assessment Hub**: View pending, assigned, and past assessments filtered by enrolled class cohort.
- **Typing Arena**: High-performance typing interface with live letter-by-letter visual feedback (correct, typo, pending cursor).
- **Anti-Cheat Enforcement**:
  - Selection and copy/cut/paste prevention.
  - Right-click context menu blocking.
  - Tab-switching and window-blur counter logged to the examiner report.
  - Single-attempt locking for formal trainer assignments.
- **Digital Certificates**: Dynamically generated certificates of achievement upon meeting qualifying speed and accuracy benchmarks.

---

## ⚙️ How the Engine Works

### 1. Typing Formula & Metrics
- **Net WPM (Words Per Minute)**:
  $$\text{Net WPM} = \max\left(0, \frac{\frac{\text{Correct Characters}}{5} - \text{Uncorrected Errors}}{\text{Elapsed Time (Minutes)}}\right)$$
- **Raw WPM**:
  $$\text{Raw WPM} = \frac{\frac{\text{Total Keypresses}}{5}}{\text{Elapsed Time (Minutes)}}$$
- **Accuracy (%)**:
  $$\text{Accuracy} = \frac{\text{Correct Keypresses}}{\text{Total Keypresses}} \times 100$$

### 2. Single-Attempt Integrity
- When a candidate starts a formal trainer assessment, attempts are tracked by `testId` and `studentId`.
- Once submitted, the test is marked completed in the student's record and locks further retakes.
- Only an administrator or proctor can reset the attempt if an official re-sit is authorized.

### 3. Anti-Cheating & Audit Trail
- **Blur / Visibility Detection**: Listens to browser `visibilitychange` and window `blur` events. Each tab-switch or window defocus increments a security counter.
- **Clipboard Guard**: Disallows pasting into the typing buffer, flagging the incident in the candidate's submission record.

---

## 🔑 Default Accounts & Credentials

### Administrator Account
- **Username**: `admin`
- **Password**: `admin123`

### Trainer / Proctor Accounts
- **Trainer 1**: `mentor_pranav` (Password: `trainer@123`)
- **Trainer 2**: `faculty_cse` (Password: `trainer@123`)

### Pre-Enrolled Student Accounts
The platform comes pre-seeded with the CSE Department cohort. Students log in using their **Roll Number**:
- **Sample Roll Numbers**:
  - `24P31A42S4`
  - `24P31A05B3`
  - `24B11AI213`
  - `24P31A05A1`
  - `24P31A05A2`
- **Default Student Password**: `1234` *(or custom passwords set via Admin Portal)*

---

## 🌐 Publishing & Account Availability

### Do all accounts work when published?
**Yes!** 
- All built-in student roll numbers, trainer accounts, and admin credentials are hardcoded into the initial application bundle (`src/data/initialData.ts`).
- Whenever you publish or share the app, anyone visiting the live URL can immediately log in using any of the pre-seeded student roll numbers, trainer accounts, or admin login.
- Any modifications made during runtime (e.g. creating new students, editing passwords, submitting test attempts) are saved in the client's browser local storage.

---

## 🛠️ Development & Build Commands

```bash
# Install dependencies
npm install

# Start local development server (port 3000)
npm run dev

# Run TypeScript type checks
npm run lint

# Build production bundle
npm run build

# Preview production build
npm run preview
```

---

## 📄 License & Copyright

© 2026 Pranav Vedula | Dept. of CSE. All rights reserved.
