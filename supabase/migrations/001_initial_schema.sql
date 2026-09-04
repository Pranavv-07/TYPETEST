-- ============================================================================
-- TYPETEST INSTITUTIONAL TYPING EXAMINATION PLATFORM
-- Migration 001: Relational Schema Definition
-- Supports 200+ concurrent examination candidates with high-throughput indexing
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    hod TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. BATCHES
CREATE TABLE IF NOT EXISTS batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    batch_year TEXT NOT NULL,
    academic_year TEXT NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. CLASSES (Classrooms / Cohorts)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    academic_year TEXT,
    section TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TRAINERS (Proctors & Faculty)
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    employee_id TEXT UNIQUE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    designation TEXT DEFAULT 'Examiner',
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. TRAINER -> CLASS ASSIGNMENTS
CREATE TABLE IF NOT EXISTS trainer_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES trainers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_trainer_class UNIQUE(trainer_id, class_id)
);

-- 6. STUDENTS (Candidates)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    roll_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    student_id_number TEXT,
    username TEXT,
    password_hash TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. ADMINISTRATORS
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    role TEXT NOT NULL DEFAULT 'ADMIN' CHECK (role IN ('SUPER ADMIN', 'ADMIN', 'ACADEMIC ADMIN', 'EXAM ADMIN')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. TESTS (Typing Examinations & Coding Modules)
CREATE TABLE IF NOT EXISTS tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'standard' CHECK (category IN ('standard', 'story', 'code')),
    language TEXT DEFAULT 'none',
    content TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 2,
    time_limit_seconds INTEGER NOT NULL DEFAULT 120,
    min_accuracy NUMERIC NOT NULL DEFAULT 90.0,
    created_by UUID REFERENCES trainers(id) ON DELETE SET NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'closed', 'archived')),
    is_prebuilt BOOLEAN NOT NULL DEFAULT false,
    difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. TEST ASSIGNMENTS (Cohort or Candidate-specific assignments)
CREATE TABLE IF NOT EXISTS test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT unique_test_student UNIQUE(test_id, student_id)
);

-- 10. ATTEMPTS (Strict Single Attempt per Student per Test)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned', 'disqualified', 'reset')),
    net_wpm NUMERIC NOT NULL DEFAULT 0,
    raw_wpm NUMERIC NOT NULL DEFAULT 0,
    accuracy NUMERIC NOT NULL DEFAULT 0,
    correct_characters INTEGER NOT NULL DEFAULT 0,
    total_characters INTEGER NOT NULL DEFAULT 0,
    errors INTEGER NOT NULL DEFAULT 0,
    violation_count INTEGER NOT NULL DEFAULT 0,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    progress_data JSONB DEFAULT '{}'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_attempt_per_student UNIQUE(test_id, student_id)
);

-- 11. VIOLATIONS (Proctoring and Anti-cheat Events)
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL CHECK (violation_type IN (
        'tab_switch',
        'window_blur',
        'visibility_change',
        'paste_attempt',
        'copy_attempt',
        'cut_attempt',
        'fullscreen_exit',
        'unusual_speed',
        'other'
    )),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 12. CERTIFICATES (Issued for qualifying scores)
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    certificate_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    score NUMERIC NOT NULL DEFAULT 0,
    accuracy NUMERIC NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. AUDIT LOGS (Immutable Administrative Records)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================================
-- HIGH-CONCURRENCY INDEXES (Optimized for 200+ Concurrent Examinees)
-- ============================================================================

-- Fast student lookups during login & roll number checks
CREATE INDEX IF NOT EXISTS idx_students_roll_number ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_batch_id ON students(batch_id);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);

-- Test availability window queries
CREATE INDEX IF NOT EXISTS idx_tests_time_window ON tests(start_time, end_time, status);
CREATE INDEX IF NOT EXISTS idx_tests_created_by ON tests(created_by);

-- Test assignments
CREATE INDEX IF NOT EXISTS idx_test_assignments_student ON test_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_test ON test_assignments(test_id);
CREATE INDEX IF NOT EXISTS idx_test_assignments_class ON test_assignments(class_id);

-- High-frequency attempts queries during live examinations
CREATE INDEX IF NOT EXISTS idx_attempts_student_test ON attempts(student_id, test_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON attempts(status);
CREATE INDEX IF NOT EXISTS idx_attempts_last_activity ON attempts(last_activity_at);

-- Violations & Proctor audit
CREATE INDEX IF NOT EXISTS idx_violations_attempt ON violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_violations_student ON violations(student_id);

-- Certificates verification lookup
CREATE INDEX IF NOT EXISTS idx_certificates_cert_number ON certificates(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);

-- Audit log timeline
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
