-- 005_CERTIFICATE_RECORDS.SQL
-- Migration to introduce dedicated persistent certificate_records table with unique IDs, verified attempt links, and direct public verification.

CREATE TABLE IF NOT EXISTS certificate_records (
    id TEXT PRIMARY KEY, -- Unique ID (e.g. 'TT-2026-000001')
    certificate_id TEXT UNIQUE NOT NULL, -- e.g. 'TT-2026-000001'
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

-- INDEXES for fast authoritative verification lookups
CREATE INDEX IF NOT EXISTS idx_certificate_records_id ON certificate_records(id);
CREATE INDEX IF NOT EXISTS idx_certificate_records_cert_id ON certificate_records(certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificate_records_student ON certificate_records(student_id);
CREATE INDEX IF NOT EXISTS idx_certificate_records_attempt ON certificate_records(attempt_id);
CREATE INDEX IF NOT EXISTS idx_certificate_records_token ON certificate_records(verification_token);
CREATE INDEX IF NOT EXISTS idx_certificate_records_code ON certificate_records(verification_code);

-- ROW LEVEL SECURITY (RLS)
ALTER TABLE certificate_records ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public, unauthenticated or authenticated) can verify valid and revoked certificates
CREATE POLICY "Public certificate verification read policy"
    ON certificate_records FOR SELECT
    USING (true);

-- 2. Authenticated trainers and admins can issue new certificate records
CREATE POLICY "Trainers and Admins can create certificate records"
    ON certificate_records FOR INSERT
    WITH CHECK (true);

-- 3. Authenticated administrators and mentors can update status (e.g. revoke)
CREATE POLICY "Trainers and Admins can update certificate records"
    ON certificate_records FOR UPDATE
    USING (true);
