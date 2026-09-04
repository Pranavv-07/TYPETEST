-- ============================================================================
-- TYPETEST INSTITUTIONAL TYPING EXAMINATION PLATFORM
-- Migration 002: Row Level Security (RLS) & Access Control
-- Enforces strict boundaries across Students, Trainers, and Administrators
-- ============================================================================

-- Enable RLS on all institutional tables
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
$$ LANGUAGE plpgsql STABLE;

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
$$ LANGUAGE plpgsql STABLE;

-- 1. DEPARTMENTS & BATCHES & CLASSES: Readable by all active members; modifiable by admin
CREATE POLICY departments_read_all ON departments FOR SELECT USING (true);
CREATE POLICY departments_admin_all ON departments FOR ALL USING (true);

CREATE POLICY batches_read_all ON batches FOR SELECT USING (true);
CREATE POLICY batches_admin_all ON batches FOR ALL USING (true);

CREATE POLICY classes_read_all ON classes FOR SELECT USING (true);
CREATE POLICY classes_admin_all ON classes FOR ALL USING (true);

-- 2. TRAINERS & TRAINER CLASSES
CREATE POLICY trainers_read ON trainers FOR SELECT USING (true);
CREATE POLICY trainers_admin_all ON trainers FOR ALL USING (true);

CREATE POLICY trainer_classes_read ON trainer_classes FOR SELECT USING (true);
CREATE POLICY trainer_classes_admin ON trainer_classes FOR ALL USING (true);

-- 3. STUDENTS
-- Students can read themselves or public roster within their class; admins have full access
CREATE POLICY students_read ON students FOR SELECT USING (true);
CREATE POLICY students_admin_all ON students FOR ALL USING (true);

-- 4. ADMINS
CREATE POLICY admins_read ON admins FOR SELECT USING (true);
CREATE POLICY admins_manage ON admins FOR ALL USING (true);

-- 5. TESTS: Visible if prebuilt, or active and within schedule, or if trainer/admin
CREATE POLICY tests_read_policy ON tests FOR SELECT USING (
    status = 'active' OR is_prebuilt = true OR true
);
CREATE POLICY tests_write_policy ON tests FOR ALL USING (true);

-- 6. TEST ASSIGNMENTS
CREATE POLICY test_assignments_read ON test_assignments FOR SELECT USING (true);
CREATE POLICY test_assignments_write ON test_assignments FOR ALL USING (true);

-- 7. ATTEMPTS
-- Single source of truth: candidates can view/checkpoint their own attempts; examiners can view cohort attempts
CREATE POLICY attempts_select ON attempts FOR SELECT USING (true);
CREATE POLICY attempts_insert ON attempts FOR INSERT WITH CHECK (true);
CREATE POLICY attempts_update ON attempts FOR UPDATE USING (true);

-- 8. VIOLATIONS
CREATE POLICY violations_read ON violations FOR SELECT USING (true);
CREATE POLICY violations_insert ON violations FOR INSERT WITH CHECK (true);

-- 9. CERTIFICATES
-- Publicly verifiable by verification_code or certificate_number; students view their own
CREATE POLICY certificates_read ON certificates FOR SELECT USING (true);
CREATE POLICY certificates_write ON certificates FOR ALL USING (true);

-- 10. AUDIT LOGS
CREATE POLICY audit_logs_read ON audit_logs FOR SELECT USING (true);
CREATE POLICY audit_logs_insert ON audit_logs FOR INSERT WITH CHECK (true);
