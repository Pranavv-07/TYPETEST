-- ============================================================================
-- TYPETEST INSTITUTIONAL TYPING EXAMINATION PLATFORM
-- Migration 003: High-Performance Atomic RPCs & Security Procedures
-- Guarantees atomic attempt creation, strict time windows, and server-side validation
-- ============================================================================

-- 1. AUTHORITATIVE SERVER TIME
-- Guarantees examinee countdown is synchronized with the database clock, not client clock
CREATE OR REPLACE FUNCTION get_server_time()
RETURNS TIMESTAMPTZ AS $$
BEGIN
    RETURN clock_timestamp();
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. ATOMIC TEST ATTEMPT CREATION
-- Handles race conditions atomically; validates availability window and single-attempt constraint
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
    -- 1. Validate student exists and is active
    SELECT * INTO v_student FROM students WHERE id = p_student_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'STUDENT_NOT_FOUND: The specified student record does not exist';
    END IF;

    IF v_student.status != 'active' THEN
        RAISE EXCEPTION 'STUDENT_INACTIVE: Student account is inactive or suspended (%s)', v_student.status;
    END IF;

    -- 2. Validate test exists
    SELECT * INTO v_test FROM tests WHERE id = p_test_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'TEST_NOT_FOUND: The requested examination was not found';
    END IF;

    IF v_test.status != 'active' AND NOT v_test.is_prebuilt THEN
        RAISE EXCEPTION 'TEST_INACTIVE: This examination is currently %s', v_test.status;
    END IF;

    -- 3. Enforce strict Server-Side Time Window (Do NOT trust client clock)
    IF v_test.start_time IS NOT NULL AND v_now < v_test.start_time THEN
        RAISE EXCEPTION 'TEST_NOT_STARTED: This assessment opens at % (Server Time: %)',
            to_char(v_test.start_time, 'YYYY-MM-DD HH24:MI:SS TZ'),
            to_char(v_now, 'YYYY-MM-DD HH24:MI:SS TZ');
    END IF;

    IF v_test.end_time IS NOT NULL AND v_now > v_test.end_time THEN
        RAISE EXCEPTION 'TEST_EXPIRED: This assessment concluded at % (Server Time: %)',
            to_char(v_test.end_time, 'YYYY-MM-DD HH24:MI:SS TZ'),
            to_char(v_now, 'YYYY-MM-DD HH24:MI:SS TZ');
    END IF;

    -- 4. Verify assignment authorization
    IF v_test.is_prebuilt THEN
        v_assigned := TRUE;
    ELSE
        -- Check direct student assignment
        IF EXISTS (SELECT 1 FROM test_assignments WHERE test_id = p_test_id AND student_id = p_student_id) THEN
            v_assigned := TRUE;
        -- Check cohort/class assignment
        ELSIF v_student.class_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM test_assignments WHERE test_id = p_test_id AND class_id = v_student.class_id
        ) THEN
            v_assigned := TRUE;
        END IF;
    END IF;

    IF NOT v_assigned THEN
        RAISE EXCEPTION 'NOT_ASSIGNED: You are not authorized to take this assessment';
    END IF;

    -- 5. Atomic check for existing attempt
    SELECT * INTO v_existing_attempt FROM attempts
    WHERE test_id = p_test_id AND student_id = p_student_id
    FOR UPDATE;

    IF FOUND THEN
        IF v_existing_attempt.status = 'submitted' THEN
            RAISE EXCEPTION 'ALREADY_ATTEMPTED: Candidate has already completed this single-attempt examination on %',
                to_char(v_existing_attempt.submitted_at, 'YYYY-MM-DD HH24:MI:SS');
        ELSIF v_existing_attempt.status = 'disqualified' THEN
            RAISE EXCEPTION 'DISQUALIFIED: Attempt was disqualified due to examination integrity violations';
        ELSE
            -- Resume in-progress attempt
            UPDATE attempts
            SET last_activity_at = v_now, updated_at = v_now
            WHERE id = v_existing_attempt.id
            RETURNING * INTO v_new_attempt;

            RETURN to_jsonb(v_new_attempt);
        END IF;
    END IF;

    -- 6. Insert new attempt atomically
    INSERT INTO attempts (
        test_id,
        student_id,
        started_at,
        last_activity_at,
        status,
        net_wpm,
        raw_wpm,
        accuracy,
        correct_characters,
        total_characters,
        errors,
        violation_count
    ) VALUES (
        p_test_id,
        p_student_id,
        v_now,
        v_now,
        'in_progress',
        0,
        0,
        100.0,
        0,
        0,
        0,
        0
    )
    RETURNING * INTO v_new_attempt;

    RETURN to_jsonb(v_new_attempt);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PERIODIC CHECKPOINT RPC (Low-overhead batching for 200+ concurrent students)
-- Called every 15-30s instead of every keystroke
CREATE OR REPLACE FUNCTION checkpoint_test_attempt(
    p_attempt_id UUID,
    p_net_wpm NUMERIC,
    p_raw_wpm NUMERIC,
    p_accuracy NUMERIC,
    p_correct_characters INT,
    p_total_characters INT,
    p_errors INT,
    p_violation_count INT,
    p_progress_data JSONB DEFAULT '{}'::jsonb
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
BEGIN
    SELECT status INTO v_status FROM attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    IF v_status != 'in_progress' THEN
        RETURN FALSE;
    END IF;

    UPDATE attempts
    SET
        net_wpm = p_net_wpm,
        raw_wpm = p_raw_wpm,
        accuracy = p_accuracy,
        correct_characters = p_correct_characters,
        total_characters = p_total_characters,
        errors = p_errors,
        violation_count = p_violation_count,
        progress_data = p_progress_data,
        last_activity_at = clock_timestamp(),
        updated_at = clock_timestamp()
    WHERE id = p_attempt_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RECORD PROCTORING VIOLATION
CREATE OR REPLACE FUNCTION record_violation(
    p_attempt_id UUID,
    p_student_id UUID,
    p_violation_type TEXT,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_violation RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
    INSERT INTO violations (
        attempt_id,
        student_id,
        violation_type,
        timestamp,
        metadata
    ) VALUES (
        p_attempt_id,
        p_student_id,
        p_violation_type,
        v_now,
        p_metadata
    )
    RETURNING * INTO v_violation;

    -- Increment attempt violation count atomically
    UPDATE attempts
    SET violation_count = violation_count + 1,
        last_activity_at = v_now,
        updated_at = v_now
    WHERE id = p_attempt_id;

    RETURN to_jsonb(v_violation);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ATOMIC SUBMIT ATTEMPT & CERTIFICATION
CREATE OR REPLACE FUNCTION submit_test_attempt(
    p_attempt_id UUID,
    p_net_wpm NUMERIC,
    p_raw_wpm NUMERIC,
    p_accuracy NUMERIC,
    p_correct_characters INT,
    p_total_characters INT,
    p_errors INT,
    p_violation_count INT,
    p_history JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB AS $$
DECLARE
    v_attempt RECORD;
    v_test RECORD;
    v_student RECORD;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_cert_record RECORD;
    v_cert_no TEXT;
    v_verify_code TEXT;
    v_is_passed BOOLEAN := FALSE;
    v_result JSONB;
BEGIN
    SELECT * INTO v_attempt FROM attempts WHERE id = p_attempt_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ATTEMPT_NOT_FOUND';
    END IF;

    IF v_attempt.status = 'submitted' THEN
        RETURN jsonb_build_object(
            'alreadySubmitted', true,
            'attempt', to_jsonb(v_attempt)
        );
    END IF;

    SELECT * INTO v_test FROM tests WHERE id = v_attempt.test_id;
    SELECT * INTO v_student FROM students WHERE id = v_attempt.student_id;

    -- Determine pass/fail
    IF p_accuracy >= coalesce(v_test.min_accuracy, 90.0) AND p_net_wpm >= 20 THEN
        v_is_passed := TRUE;
    END IF;

    -- Update attempt to submitted
    UPDATE attempts
    SET
        status = 'submitted',
        submitted_at = v_now,
        net_wpm = p_net_wpm,
        raw_wpm = p_raw_wpm,
        accuracy = p_accuracy,
        correct_characters = p_correct_characters,
        total_characters = p_total_characters,
        errors = p_errors,
        violation_count = p_violation_count,
        history = p_history,
        last_activity_at = v_now,
        updated_at = v_now
    WHERE id = p_attempt_id
    RETURNING * INTO v_attempt;

    -- Generate certificate if passed
    IF v_is_passed THEN
        v_cert_no := 'TYPETEST-CERT-' || to_char(v_now, 'YYYY') || '-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 8));
        v_verify_code := 'V-' || upper(substring(replace(gen_random_uuid()::text, '-', '') from 1 for 6));

        INSERT INTO certificates (
            student_id,
            attempt_id,
            test_id,
            certificate_number,
            verification_code,
            issued_at,
            score,
            accuracy,
            status
        ) VALUES (
            v_attempt.student_id,
            v_attempt.id,
            v_attempt.test_id,
            v_cert_no,
            v_verify_code,
            v_now,
            p_net_wpm,
            p_accuracy,
            'valid'
        )
        RETURNING * INTO v_cert_record;
    END IF;

    v_result := jsonb_build_object(
        'success', true,
        'attempt', to_jsonb(v_attempt),
        'passed', v_is_passed,
        'certificate', CASE WHEN v_is_passed THEN to_jsonb(v_cert_record) ELSE NULL END
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RESET STUDENT ATTEMPT (Admin/Proctor Authorized)
CREATE OR REPLACE FUNCTION reset_student_attempt(
    p_test_id UUID,
    p_student_id UUID,
    p_admin_id UUID,
    p_admin_name TEXT,
    p_reason TEXT DEFAULT 'Official re-examination authorized'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_deleted_count INT := 0;
BEGIN
    DELETE FROM attempts
    WHERE test_id = p_test_id AND student_id = p_student_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    -- Record in audit logs
    INSERT INTO audit_logs (
        admin_id,
        admin_name,
        action,
        entity_type,
        entity_id,
        details
    ) VALUES (
        p_admin_id,
        p_admin_name,
        'RESET_ATTEMPT',
        'attempt',
        p_test_id::text || ':' || p_student_id::text,
        jsonb_build_object(
            'test_id', p_test_id,
            'student_id', p_student_id,
            'reason', p_reason,
            'rows_affected', v_deleted_count,
            'timestamp', clock_timestamp()
        )
    );

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
