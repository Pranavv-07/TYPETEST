-- ============================================================================
-- TYPETEST INSTITUTIONAL TYPING EXAMINATION PLATFORM
-- ALL-IN-ONE CONSOLIDATED PRODUCTION SETUP SCRIPT
-- Paste this entire file into your Supabase Project > SQL Editor and click "RUN"
-- ============================================================================

-- EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. SCHEMAS & TABLES
-- ============================================================================

-- 1. DEPARTMENTS
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
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

-- 3. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES batches(id) ON DELETE SET NULL,
    academic_year TEXT NOT NULL DEFAULT '2025-26',
    section TEXT DEFAULT 'A',
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TRAINERS (Faculty & Examiners)
CREATE TABLE IF NOT EXISTS trainers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    employee_id TEXT,
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

-- 9. TEST ASSIGNMENTS (Classroom or Candidate-specific assignments)
CREATE TABLE IF NOT EXISTS test_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID,
    CONSTRAINT unique_test_assignment UNIQUE(test_id, student_id, class_id)
);

-- 10. ATTEMPTS (Strict Single Attempt Enforcement)
CREATE TABLE IF NOT EXISTS attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'abandoned', 'disqualified')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    submitted_at TIMESTAMPTZ,
    time_taken_seconds INTEGER DEFAULT 0,
    net_wpm NUMERIC NOT NULL DEFAULT 0.0,
    raw_wpm NUMERIC NOT NULL DEFAULT 0.0,
    accuracy NUMERIC NOT NULL DEFAULT 0.0,
    correct_characters INTEGER DEFAULT 0,
    total_characters INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    violation_count INTEGER DEFAULT 0,
    client_ip TEXT,
    user_agent TEXT,
    history JSONB DEFAULT '[]'::jsonb,
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT unique_student_test_attempt UNIQUE (test_id, student_id)
);

-- 11. PROCTORING VIOLATIONS
CREATE TABLE IF NOT EXISTS violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID REFERENCES attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    violation_type TEXT NOT NULL CHECK (violation_type IN ('window_blur', 'paste_attempt', 'visibility_change', 'unauthorized_key', 'speed_anomaly')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. CERTIFICATES
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES attempts(id) ON DELETE SET NULL,
    test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
    certificate_number TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    score NUMERIC NOT NULL,
    accuracy NUMERIC NOT NULL,
    achievement_title TEXT NOT NULL,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 13. AUDIT LOGS (Immutable System Activity Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID,
    admin_name TEXT,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_students_roll ON students(roll_number);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_attempts_student ON attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_attempts_test ON attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_violations_attempt ON violations(attempt_id);
CREATE INDEX IF NOT EXISTS idx_certificates_student ON certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_code ON certificates(verification_code);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Anonymous/Public access policies for the institutional portal
DROP POLICY IF EXISTS departments_all ON departments;
CREATE POLICY departments_all ON departments FOR ALL USING (true);

DROP POLICY IF EXISTS batches_all ON batches;
CREATE POLICY batches_all ON batches FOR ALL USING (true);

DROP POLICY IF EXISTS classes_all ON classes;
CREATE POLICY classes_all ON classes FOR ALL USING (true);

DROP POLICY IF EXISTS trainers_all ON trainers;
CREATE POLICY trainers_all ON trainers FOR ALL USING (true);

DROP POLICY IF EXISTS trainer_classes_all ON trainer_classes;
CREATE POLICY trainer_classes_all ON trainer_classes FOR ALL USING (true);

DROP POLICY IF EXISTS students_all ON students;
CREATE POLICY students_all ON students FOR ALL USING (true);

DROP POLICY IF EXISTS admins_all ON admins;
CREATE POLICY admins_all ON admins FOR ALL USING (true);

DROP POLICY IF EXISTS tests_all ON tests;
CREATE POLICY tests_all ON tests FOR ALL USING (true);

DROP POLICY IF EXISTS test_assignments_all ON test_assignments;
CREATE POLICY test_assignments_all ON test_assignments FOR ALL USING (true);

DROP POLICY IF EXISTS attempts_all ON attempts;
CREATE POLICY attempts_all ON attempts FOR ALL USING (true);

DROP POLICY IF EXISTS violations_all ON violations;
CREATE POLICY violations_all ON violations FOR ALL USING (true);

DROP POLICY IF EXISTS certificates_all ON certificates;
CREATE POLICY certificates_all ON certificates FOR ALL USING (true);

DROP POLICY IF EXISTS audit_logs_all ON audit_logs;
CREATE POLICY audit_logs_all ON audit_logs FOR ALL USING (true);

-- Enable Realtime publication
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

ALTER PUBLICATION supabase_realtime ADD TABLE attempts, violations, tests, students;

-- ============================================================================
-- 3. STORED PROCEDURES & RPC FUNCTIONS
-- ============================================================================

-- 1. AUTHORITATIVE SERVER TIME
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN clock_timestamp();
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. ATOMIC START TEST ATTEMPT
CREATE OR REPLACE FUNCTION start_test_attempt(
    p_test_id UUID,
    p_student_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_test RECORD;
    v_student RECORD;
    v_existing_attempt RECORD;
    v_assigned BOOLEAN := FALSE;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_new_attempt RECORD;
BEGIN
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'STUDENT_NOT_FOUND: The specified student record does not exist';
    END IF;

    IF v_student.status != 'active' THEN
        RAISE EXCEPTION 'STUDENT_INACTIVE: Student account is %', v_student.status;
    END IF;

    SELECT * INTO v_test FROM tests WHERE id = p_test_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'TEST_NOT_FOUND: The requested test does not exist';
    END IF;

    IF v_test.status != 'active' AND NOT v_test.is_prebuilt THEN
        RAISE EXCEPTION 'TEST_INACTIVE: This assessment is currently %', v_test.status;
    END IF;

    IF v_test.start_time IS NOT NULL AND v_now < v_test.start_time THEN
        RAISE EXCEPTION 'TEST_NOT_STARTED: This assessment opens at %', to_char(v_test.start_time, 'YYYY-MM-DD HH24:MI:SS TZ');
    END IF;

    IF v_test.end_time IS NOT NULL AND v_now > v_test.end_time THEN
        RAISE EXCEPTION 'TEST_EXPIRED: Assessment concluded at %', to_char(v_test.end_time, 'YYYY-MM-DD HH24:MI:SS TZ');
    END IF;

    SELECT * INTO v_existing_attempt FROM attempts
    WHERE test_id = p_test_id AND student_id = p_student_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing_attempt.status = 'submitted' THEN
            RAISE EXCEPTION 'ALREADY_ATTEMPTED: Candidate has already completed this examination';
        ELSIF v_existing_attempt.status = 'disqualified' THEN
            RAISE EXCEPTION 'DISQUALIFIED: Attempt was disqualified for security violations';
        ELSE
            UPDATE attempts
            SET last_activity_at = v_now, updated_at = v_now
            WHERE id = v_existing_attempt.id
            RETURNING * INTO v_new_attempt;

            RETURN jsonb_build_object(
                'status', 'resumed',
                'attempt', row_to_json(v_new_attempt)
            );
        END IF;
    END IF;

    INSERT INTO attempts (
        test_id,
        student_id,
        status,
        started_at,
        last_activity_at
    ) VALUES (
        p_test_id,
        p_student_id,
        'in_progress',
        v_now,
        v_now
    ) RETURNING * INTO v_new_attempt;

    RETURN jsonb_build_object(
        'status', 'started',
        'attempt', row_to_json(v_new_attempt)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. CHECKPOINT ATTEMPT
CREATE OR REPLACE FUNCTION checkpoint_test_attempt(
    p_attempt_id UUID,
    p_net_wpm NUMERIC,
    p_raw_wpm NUMERIC,
    p_accuracy NUMERIC,
    p_correct_chars INTEGER,
    p_total_chars INTEGER,
    p_errors INTEGER
)
RETURNS JSONB AS $$
BEGIN
    UPDATE attempts
    SET
        net_wpm = p_net_wpm,
        raw_wpm = p_raw_wpm,
        accuracy = p_accuracy,
        correct_characters = p_correct_chars,
        total_characters = p_total_chars,
        errors = p_errors,
        last_activity_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = p_attempt_id AND status = 'in_progress';

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. SUBMIT ATTEMPT & ISSUE CERTIFICATE
CREATE OR REPLACE FUNCTION submit_test_attempt(
    p_attempt_id UUID,
    p_net_wpm NUMERIC,
    p_raw_wpm NUMERIC,
    p_accuracy NUMERIC,
    p_correct_characters INTEGER,
    p_total_characters INTEGER,
    p_errors INTEGER,
    p_violation_count INTEGER DEFAULT 0,
    p_history JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_attempt RECORD;
    v_test RECORD;
    v_student RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_time_taken INTEGER;
    v_certificate RECORD;
    v_cert_number TEXT;
    v_verify_code TEXT;
    v_achieve_title TEXT;
BEGIN
    SELECT * INTO v_attempt FROM attempts WHERE id = p_attempt_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_FOUND: Record does not exist';
    END IF;

    IF v_attempt.status = 'submitted' THEN
        RAISE EXCEPTION 'ALREADY_SUBMITTED: Attempt has already been submitted';
    END IF;

    SELECT * INTO v_test FROM tests WHERE id = v_attempt.test_id;
    SELECT * INTO v_student FROM students WHERE id = v_attempt.student_id;

    v_time_taken := GREATEST(1, EXTRACT(EPOCH FROM (v_now - v_attempt.started_at))::INTEGER);

    UPDATE attempts
    SET
        status = 'submitted',
        submitted_at = v_now,
        time_taken_seconds = v_time_taken,
        net_wpm = p_net_wpm,
        raw_wpm = p_raw_wpm,
        accuracy = p_accuracy,
        correct_characters = p_correct_characters,
        total_characters = p_total_characters,
        errors = p_errors,
        violation_count = p_violation_count,
        history = p_history,
        updated_at = v_now
    WHERE id = p_attempt_id;

    -- Automatic certification if qualified (>= 20 WPM and >= 90% accuracy)
    IF p_accuracy >= 90.0 AND p_net_wpm >= 20.0 THEN
        v_cert_number := 'TYPETEST-' || to_char(v_now, 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
        v_verify_code := 'V-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
        
        IF p_net_wpm >= 60.0 THEN
            v_achieve_title := 'Master Assessment Certification';
        ELSIF p_net_wpm >= 40.0 THEN
            v_achieve_title := 'Proficient Assessment Certification';
        ELSE
            v_achieve_title := 'Standard Assessment Certification';
        END IF;

        INSERT INTO certificates (
            student_id,
            attempt_id,
            test_id,
            certificate_number,
            verification_code,
            score,
            accuracy,
            achievement_title,
            issued_at
        ) VALUES (
            v_attempt.student_id,
            v_attempt.id,
            v_attempt.test_id,
            v_cert_number,
            v_verify_code,
            p_net_wpm,
            p_accuracy,
            v_achieve_title,
            v_now
        ) RETURNING * INTO v_certificate;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'certificate', CASE WHEN v_certificate.id IS NOT NULL THEN row_to_json(v_certificate) ELSE NULL END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RECORD VIOLATION
CREATE OR REPLACE FUNCTION record_violation(
    p_attempt_id UUID,
    p_student_id UUID,
    p_violation_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
BEGIN
    INSERT INTO violations (
        attempt_id,
        student_id,
        violation_type,
        metadata,
        timestamp
    ) VALUES (
        p_attempt_id,
        p_student_id,
        p_violation_type,
        p_metadata,
        clock_timestamp()
    );

    IF p_attempt_id IS NOT NULL THEN
        UPDATE attempts
        SET violation_count = violation_count + 1, updated_at = clock_timestamp()
        WHERE id = p_attempt_id;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RESET STUDENT ATTEMPT (Admin / Trainer Override)
CREATE OR REPLACE FUNCTION reset_student_attempt(
    p_test_id UUID,
    p_student_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM attempts
    WHERE test_id = p_test_id AND student_id = p_student_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    INSERT INTO audit_logs (
        admin_id,
        admin_name,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_admin_id,
        'Admin Override',
        'RESET_ATTEMPT',
        'attempt',
        p_test_id::text,
        jsonb_build_object(
            'student_id', p_student_id,
            'reason', p_reason,
            'cleared_attempts', v_deleted_count
        )
    );

    RETURN jsonb_build_object('success', true, 'deleted', v_deleted_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. SEED DATA (Departments, Batches, Classes, Accounts, Tests)
-- ============================================================================

-- 1. Departments
INSERT INTO departments (id, name, code, hod, description, status)
VALUES
    ('d0000000-0000-0000-0000-000000000001', 'Computer Science & Engineering', 'CSE', 'Dr. V. S. Murthy', 'Department of Computer Science and Engineering', 'active'),
    ('d0000000-0000-0000-0000-000000000002', 'Artificial Intelligence & Machine Learning', 'AIML', 'Dr. Radhika Sen', 'Department of AI & Machine Learning', 'active'),
    ('d0000000-0000-0000-0000-000000000003', 'Information Technology', 'IT', 'Prof. K. Raman', 'Department of Information Technology', 'active')
ON CONFLICT (code) DO NOTHING;

-- 2. Batches
INSERT INTO batches (id, name, batch_year, academic_year, department_id, start_date, end_date, status)
VALUES
    ('b0000000-0000-0000-0000-000000000001', 'Batch 2024-28', '2024-28', '2025-26', 'd0000000-0000-0000-0000-000000000001', '2024-08-01', '2028-05-31', 'active'),
    ('b0000000-0000-0000-0000-000000000002', 'Batch 2023-27', '2023-27', '2025-26', 'd0000000-0000-0000-0000-000000000001', '2023-08-01', '2027-05-31', 'active')
ON CONFLICT DO NOTHING;

-- 3. Classes
INSERT INTO classes (id, name, code, department_id, batch_id, academic_year, section, description, status)
VALUES
    ('c0000000-0000-0000-0000-000000000001', 'CSE Alpha (2024-28)', 'CSE-A-24', 'd0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', '2025-26', 'A', 'Computer Science and Engineering - Section A Core Batch', 'active'),
    ('c0000000-0000-0000-0000-000000000002', 'AIML Beta (2024-28)', 'AIML-B-24', 'd0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', '2025-26', 'B', 'Artificial Intelligence & Machine Learning Track', 'active'),
    ('c0000000-0000-0000-0000-000000000003', 'Data Science Delta (2024-28)', 'IT-D-24', 'd0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', '2025-26', 'C', 'Data Engineering and Statistical Computing Division', 'active')
ON CONFLICT (code) DO NOTHING;

-- 4. Initial Administrator (Password: admin123)
INSERT INTO admins (id, name, email, username, password_hash, role, status)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Head of Examinations (Admin)', 'admin@testtype.edu', 'admin', 'admin123', 'SUPER ADMIN', 'active')
ON CONFLICT (username) DO NOTHING;

-- 5. Initial Trainers (Password: trainer@123 or trainer123)
INSERT INTO trainers (id, name, email, phone, employee_id, department_id, designation, username, password_hash, status)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'Prof. Alex Vance (Proctor)', 'trainer@testtype.edu', '+91 98480 12345', 'EMP-CSE-01', 'd0000000-0000-0000-0000-000000000001', 'Assistant Professor & Proctor', 'trainer', 'trainer@123', 'active'),
    ('f0000000-0000-0000-0000-000000000002', 'Pranav Vedula (CSE Faculty)', 'mentor_pranav@testtype.edu', '+91 98480 54321', 'EMP-CSE-02', 'd0000000-0000-0000-0000-000000000001', 'Lead Technical Trainer', 'mentor_pranav', 'trainer@123', 'active'),
    ('f0000000-0000-0000-0000-000000000003', 'Faculty CSE Examination Cell', 'faculty_cse@testtype.edu', '+91 98480 98765', 'EMP-CSE-03', 'd0000000-0000-0000-0000-000000000001', 'Senior Examiner', 'faculty_cse', 'trainer@123', 'active')
ON CONFLICT (username) DO NOTHING;

-- 6. Link Trainers to Classes
INSERT INTO trainer_classes (trainer_id, class_id)
VALUES
    ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('f0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000002'),
    ('f0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- 7. Students Roster is clean by default (All students are created or bulk-imported by Admin)

-- 8. Seed Tests
INSERT INTO tests (id, title, description, category, language, content, duration_minutes, time_limit_seconds, min_accuracy, created_by, status, is_prebuilt, difficulty)
VALUES
    (
        'e0000000-0000-0000-0000-000000000001',
        'Python: Two Sum & Hash Map Lookup',
        'Classic algorithmic assessment demonstrating linear time hash map indexing.',
        'code',
        'python',
        'def two_sum(nums, target):
    seen = {}
    for index, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], index]
        seen[num] = index
    return []',
        2,
        120,
        92.0,
        'f0000000-0000-0000-0000-000000000001',
        'active',
        true,
        'medium'
    ),
    (
        'e0000000-0000-0000-0000-000000000002',
        'C++: Binary Search Tree Inorder Traversal',
        'Recursive traversal of a binary search tree in modern C++.',
        'code',
        'cpp',
        '#include <iostream>
#include <vector>
using namespace std;

struct TreeNode {
    int val;
    TreeNode *left;
    TreeNode *right;
    TreeNode(int x) : val(x), left(nullptr), right(nullptr) {}
};

void inorder(TreeNode* root, vector<int>& res) {
    if (!root) return;
    inorder(root->left, res);
    res.push_back(root->val);
    inorder(root->right, res);
}',
        3,
        180,
        90.0,
        'f0000000-0000-0000-0000-000000000001',
        'active',
        true,
        'hard'
    ),
    (
        'e0000000-0000-0000-0000-000000000003',
        'Operating Systems: Kernel Primitives & Synchronization',
        'Typing cadence evaluation based on OS concurrency primitives.',
        'standard',
        'none',
        'The kernel is the foundational layer of an operating system responsible for managing hardware resources and arbitrating process execution. Mutual exclusion primitives such as semaphores, spinlocks, and mutex locks ensure deterministic state transitions when concurrent threads access shared virtual memory pages.',
        2,
        120,
        90.0,
        'f0000000-0000-0000-0000-000000000001',
        'active',
        true,
        'easy'
    )
ON CONFLICT (id) DO NOTHING;

-- 9. Assign Prebuilt Tests to Class 1
INSERT INTO test_assignments (test_id, class_id)
VALUES
    ('e0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001'),
    ('e0000000-0000-0000-0000-000000000003', 'c0000000-0000-0000-0000-000000000001')
ON CONFLICT DO NOTHING;

-- Verification query
SELECT
    (SELECT count(*) FROM departments) AS departments_count,
    (SELECT count(*) FROM classes) AS classes_count,
    (SELECT count(*) FROM students) AS students_count,
    (SELECT count(*) FROM trainers) AS trainers_count,
    (SELECT count(*) FROM admins) AS admins_count,
    (SELECT count(*) FROM tests) AS tests_count;
