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

-- 12B. CERTIFICATE RECORDS (Persistent Unique-ID Registry)
CREATE TABLE IF NOT EXISTS certificate_records (
    id TEXT PRIMARY KEY, -- e.g. 'TT-2026-000001'
    certificate_id TEXT UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    attempt_id UUID NOT NULL REFERENCES attempts(id) ON DELETE CASCADE,
    test_id UUID REFERENCES tests(id) ON DELETE SET NULL,
    recipient_name TEXT NOT NULL,
    recipient_roll_no TEXT NOT NULL,
    achievement_title TEXT NOT NULL,
    test_name TEXT NOT NULL,
    wpm NUMERIC NOT NULL,
    gross_wpm NUMERIC,
    net_wpm NUMERIC,
    accuracy NUMERIC NOT NULL,
    consistency NUMERIC DEFAULT 95,
    error_count INTEGER DEFAULT 0,
    issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    test_completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    issuing_authority TEXT NOT NULL DEFAULT 'TYPETEST Certification Authority',
    organization TEXT NOT NULL DEFAULT 'TYPETEST',
    template TEXT DEFAULT 'modern',
    status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'revoked', 'expired')),
    verification_token TEXT UNIQUE NOT NULL,
    verification_code TEXT UNIQUE NOT NULL,
    anti_cheat_verified BOOLEAN DEFAULT true,
    proctor_violations INTEGER DEFAULT 0,
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

-- Helper security functions
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
BEGIN
    RETURN coalesce(
        current_setting('request.jwt.claim.role', true),
        (current_setting('request.jwt.claims', true)::jsonb ->> 'role'),
        'anon'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_auth_uid()
RETURNS UUID AS $$
BEGIN
    RETURN nullif(
        coalesce(
            current_setting('request.jwt.claim.sub', true),
            (current_setting('request.jwt.claims', true)::jsonb ->> 'sub')
        ),
        ''
    )::UUID;
EXCEPTION
    WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
    IF get_auth_role() = 'service_role' THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM admins
        WHERE auth_user_id = get_auth_uid() AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_trainer_user()
RETURNS BOOLEAN AS $$
BEGIN
    IF get_auth_role() = 'service_role' OR is_admin_user() THEN
        RETURN TRUE;
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM trainers
        WHERE auth_user_id = get_auth_uid() AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_student_id()
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id FROM students WHERE auth_user_id = get_auth_uid();
    RETURN v_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 1. DEPARTMENTS & BATCHES & CLASSES
CREATE POLICY departments_select_policy ON departments FOR SELECT USING (true);
CREATE POLICY departments_insert_admin ON departments FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY departments_update_admin ON departments FOR UPDATE USING (is_admin_user());
CREATE POLICY departments_delete_admin ON departments FOR DELETE USING (is_admin_user());

CREATE POLICY batches_select_policy ON batches FOR SELECT USING (true);
CREATE POLICY batches_insert_admin ON batches FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY batches_update_admin ON batches FOR UPDATE USING (is_admin_user());
CREATE POLICY batches_delete_admin ON batches FOR DELETE USING (is_admin_user());

CREATE POLICY classes_select_policy ON classes FOR SELECT USING (true);
CREATE POLICY classes_insert_admin ON classes FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY classes_update_admin ON classes FOR UPDATE USING (is_admin_user());
CREATE POLICY classes_delete_admin ON classes FOR DELETE USING (is_admin_user());

-- 2. TRAINERS & TRAINER CLASSES
CREATE POLICY trainers_select_policy ON trainers FOR SELECT USING (true);
CREATE POLICY trainers_insert_admin ON trainers FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY trainers_update_admin ON trainers FOR UPDATE USING (is_admin_user());
CREATE POLICY trainers_delete_admin ON trainers FOR DELETE USING (is_admin_user());

CREATE POLICY trainer_classes_select_policy ON trainer_classes FOR SELECT USING (true);
CREATE POLICY trainer_classes_insert_admin ON trainer_classes FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY trainer_classes_update_admin ON trainer_classes FOR UPDATE USING (is_admin_user());
CREATE POLICY trainer_classes_delete_admin ON trainer_classes FOR DELETE USING (is_admin_user());

-- 3. STUDENTS (Candidates)
CREATE POLICY students_select_policy ON students FOR SELECT USING (
    id = get_current_student_id() OR
    auth_user_id = get_auth_uid() OR
    is_trainer_user() OR
    is_admin_user() OR
    get_auth_role() = 'anon'
);
CREATE POLICY students_insert_admin ON students FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY students_update_admin ON students FOR UPDATE USING (is_admin_user() OR id = get_current_student_id());
CREATE POLICY students_delete_admin ON students FOR DELETE USING (is_admin_user());

-- 4. ADMINS
CREATE POLICY admins_select_policy ON admins FOR SELECT USING (is_admin_user() OR get_auth_role() = 'anon');
CREATE POLICY admins_manage_policy ON admins FOR ALL USING (is_admin_user());

-- 5. TESTS
CREATE POLICY tests_select_policy ON tests FOR SELECT USING (
    is_prebuilt = true OR
    status = 'active' OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY tests_insert_policy ON tests FOR INSERT WITH CHECK (is_trainer_user() OR is_admin_user());
CREATE POLICY tests_update_policy ON tests FOR UPDATE USING (is_trainer_user() OR is_admin_user());
CREATE POLICY tests_delete_policy ON tests FOR DELETE USING (is_admin_user());

-- 6. TEST ASSIGNMENTS
CREATE POLICY test_assignments_select ON test_assignments FOR SELECT USING (
    student_id = get_current_student_id() OR
    class_id IN (SELECT class_id FROM students WHERE id = get_current_student_id()) OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY test_assignments_manage ON test_assignments FOR ALL USING (is_trainer_user() OR is_admin_user());

-- 7. ATTEMPTS
CREATE POLICY attempts_select_policy ON attempts FOR SELECT USING (
    student_id = get_current_student_id() OR
    student_id IN (SELECT id FROM students WHERE auth_user_id = get_auth_uid()) OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY attempts_insert_policy ON attempts FOR INSERT WITH CHECK (
    student_id = get_current_student_id() OR
    student_id IN (SELECT id FROM students WHERE auth_user_id = get_auth_uid()) OR
    is_admin_user()
);
CREATE POLICY attempts_update_policy ON attempts FOR UPDATE USING (
    (student_id = get_current_student_id() AND status = 'in_progress') OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY attempts_delete_policy ON attempts FOR DELETE USING (is_admin_user());

-- 8. VIOLATIONS
CREATE POLICY violations_select_policy ON violations FOR SELECT USING (
    student_id = get_current_student_id() OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY violations_insert_policy ON violations FOR INSERT WITH CHECK (
    student_id = get_current_student_id() OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY violations_delete_policy ON violations FOR DELETE USING (is_admin_user());

-- 9. CERTIFICATES
CREATE POLICY certificates_select_policy ON certificates FOR SELECT USING (
    status = 'valid' OR
    student_id = get_current_student_id() OR
    is_trainer_user() OR
    is_admin_user()
);
CREATE POLICY certificates_manage_policy ON certificates FOR ALL USING (is_admin_user());

-- 10. AUDIT LOGS
CREATE POLICY audit_logs_select_policy ON audit_logs FOR SELECT USING (is_admin_user());
CREATE POLICY audit_logs_insert_policy ON audit_logs FOR INSERT WITH CHECK (true);

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
    IF p_accuracy < 0 OR p_accuracy > 100 OR p_net_wpm < 0 OR p_net_wpm > 350 THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_METRICS');
    END IF;

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
    v_val_net_wpm NUMERIC := GREATEST(0, LEAST(350, p_net_wpm));
    v_val_acc NUMERIC := GREATEST(0, LEAST(100, p_accuracy));
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
        net_wpm = v_val_net_wpm,
        raw_wpm = p_raw_wpm,
        accuracy = v_val_acc,
        correct_characters = p_correct_characters,
        total_characters = p_total_characters,
        errors = p_errors,
        violation_count = p_violation_count,
        history = p_history,
        updated_at = v_now
    WHERE id = p_attempt_id;

    -- Automatic certification if qualified (>= 20 WPM and >= 90% accuracy)
    IF v_val_acc >= coalesce(v_test.min_accuracy, 90.0) AND v_val_net_wpm >= 20.0 THEN
        v_cert_number := 'TYPETEST-' || to_char(v_now, 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
        v_verify_code := 'V-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
        
        IF v_val_net_wpm >= 60.0 THEN
            v_achieve_title := 'Master Assessment Certification';
        ELSIF v_val_net_wpm >= 40.0 THEN
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
            v_val_net_wpm,
            v_val_acc,
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

-- 6. RESET STUDENT ATTEMPT (Admin / Authorized Trainer Override)
CREATE OR REPLACE FUNCTION reset_student_attempt(
    p_test_id UUID,
    p_student_id UUID,
    p_admin_id UUID,
    p_reason TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_is_authorized BOOLEAN := FALSE;
    v_deleted_count INTEGER;
BEGIN
    -- Verify caller authorization
    SELECT EXISTS (
        SELECT 1 FROM admins WHERE id = p_admin_id AND status = 'active'
    ) OR EXISTS (
        SELECT 1 FROM trainers WHERE id = p_admin_id AND status = 'active'
    ) INTO v_is_authorized;

    IF NOT v_is_authorized THEN
        RAISE EXCEPTION 'UNAUTHORIZED: Only an active Administrator or Trainer may authorize attempt resets';
    END IF;

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
        'Authorized Staff Override',
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
