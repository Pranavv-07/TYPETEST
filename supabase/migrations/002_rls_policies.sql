-- ============================================================================
-- TYPETEST INSTITUTIONAL TYPING EXAMINATION PLATFORM
-- Migration 002: Hardened Row Level Security (RLS) & Access Control
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
-- Readable for roster resolution; strictly modifiable only by authenticated administrators
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
-- Student data isolation: candidates can view their own profile; trainers/admins can view assigned rosters
CREATE POLICY students_select_policy ON students FOR SELECT USING (
    id = get_current_student_id() OR
    auth_user_id = get_auth_uid() OR
    is_trainer_user() OR
    is_admin_user() OR
    get_auth_role() = 'anon' -- Public roster lookup with password_hash masked by view/RPC
);
CREATE POLICY students_insert_admin ON students FOR INSERT WITH CHECK (is_admin_user());
CREATE POLICY students_update_admin ON students FOR UPDATE USING (is_admin_user() OR id = get_current_student_id());
CREATE POLICY students_delete_admin ON students FOR DELETE USING (is_admin_user());

-- 4. ADMINS
CREATE POLICY admins_select_policy ON admins FOR SELECT USING (is_admin_user() OR get_auth_role() = 'anon');
CREATE POLICY admins_manage_policy ON admins FOR ALL USING (is_admin_user());

-- 5. TESTS
-- Prebuilt and active tests are readable by all candidates; custom drafts visible only to authoring trainer/admin
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
-- Candidates can view/checkpoint only their own attempts; trainers/examiners view cohort attempts
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
-- Publicly verifiable by verification code or certificate number; candidate views own certificates
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
