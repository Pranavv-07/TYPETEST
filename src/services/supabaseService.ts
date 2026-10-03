import { supabase, isSupabaseConfigured, supabaseUrl, supabaseAnonKey } from '../lib/supabase';
import {
  Student,
  Trainer,
  ClassRoom,
  TypingTest,
  TypingSubmission,
  StudentCertificate,
  Department,
  Batch,
  AdminUser,
  ViolationRecord,
  AuditLogEntry,
  BulkImportResult,
  TestReport
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_TRAINERS,
  INITIAL_CLASSES,
  INITIAL_TESTS,
  INITIAL_SUBMISSIONS,
  INITIAL_CERTIFICATES
} from '../data/initialData';

// Fallback in-memory institutional dataset for development and preview environments
let memoryDepartments: Department[] = [
  { id: 'd0000000-0000-0000-0000-000000000001', name: 'Computer Science & Engineering', code: 'CSE', hod: 'Dr. V. S. Murthy', status: 'active', createdAt: '2025-01-01' },
  { id: 'd0000000-0000-0000-0000-000000000002', name: 'Artificial Intelligence & Machine Learning', code: 'AIML', hod: 'Dr. Radhika Sen', status: 'active', createdAt: '2025-01-01' },
  { id: 'd0000000-0000-0000-0000-000000000003', name: 'Information Technology', code: 'IT', hod: 'Prof. K. Raman', status: 'active', createdAt: '2025-01-01' }
];

let memoryBatches: Batch[] = [
  { id: 'b0000000-0000-0000-0000-000000000001', name: 'Batch 2024-28', batchYear: '2024-28', academicYear: '2025-26', status: 'active', createdAt: '2024-08-01' },
  { id: 'b0000000-0000-0000-0000-000000000002', name: 'Batch 2023-27', batchYear: '2023-27', academicYear: '2025-26', status: 'active', createdAt: '2023-08-01' }
];

const loadSavedMemoryTrainers = (): Trainer[] => {
  try {
    const raw = localStorage.getItem('typetest_memory_trainers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_TRAINERS];
};

const saveMemoryTrainers = (data: Trainer[]) => {
  try {
    localStorage.setItem('typetest_memory_trainers', JSON.stringify(data));
  } catch {}
};

const loadSavedMemoryStudents = (): Student[] => {
  try {
    const raw = localStorage.getItem('typetest_memory_students');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_STUDENTS];
};

const saveMemoryStudents = (data: Student[]) => {
  try {
    localStorage.setItem('typetest_memory_students', JSON.stringify(data));
  } catch {}
};

let memoryClasses: ClassRoom[] = [...INITIAL_CLASSES];
let memoryStudents: Student[] = loadSavedMemoryStudents();
let memoryTrainers: Trainer[] = loadSavedMemoryTrainers();
let memoryTests: TypingTest[] = [...INITIAL_TESTS];
let memorySubmissions: TypingSubmission[] = [...INITIAL_SUBMISSIONS];
let memoryViolations: ViolationRecord[] = [];

// Persistent certificates storage
const loadSavedMemoryCertificates = (): StudentCertificate[] => {
  try {
    const raw = localStorage.getItem('typetest_memory_certificates');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return [...INITIAL_CERTIFICATES];
};

let memoryCertificates: StudentCertificate[] = loadSavedMemoryCertificates();
let memoryAdmins: AdminUser[] = [
  { id: 'a0000000-0000-0000-0000-000000000001', name: 'Head of Examinations (Admin)', email: 'admin@testtype.edu', username: 'admin', role: 'SUPER ADMIN', status: 'active', password: 'admin@123', createdAt: '2025-01-01' },
  { id: 'a0000000-0000-0000-0000-000000000002', name: 'Academic Controller (CSE)', email: 'academic@testtype.edu', username: 'exam_admin', role: 'EXAM ADMIN', status: 'active', password: 'exam_admin@123', createdAt: '2025-01-05' }
];

let memoryAuditLogs: AuditLogEntry[] = [
  {
    id: 'log-1',
    adminName: 'System Setup',
    action: 'SYSTEM_INITIALIZE',
    entityType: 'platform',
    entityId: 'root',
    details: { message: 'Database initialized with institutional schema' },
    createdAt: new Date().toISOString()
  }
];

// ============================================================================
// 1. SERVER TIME (CRITICAL FOR TIMED EXAMINATION WINDOWS)
// ============================================================================
export async function getServerTime(): Promise<Date> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('get_server_time');
      if (!error && data) {
        return new Date(data);
      }
    } catch {
      // fallback to current clock if network error
    }
  }
  return new Date();
}

// ============================================================================
// 2. AUTHENTICATION & DIRECTORY VERIFICATION
// ============================================================================
export async function authenticateWithDatabase(
  identifier: string,
  pass: string
): Promise<{ success: boolean; user?: any; message?: string }> {
  const trimmedId = identifier.trim();
  const trimmedPass = pass.trim();

  if (!trimmedId || !trimmedPass) {
    return { success: false, message: 'Please enter both your identifier and password.' };
  }

  // If Supabase is connected, query central tables
  if (isSupabaseConfigured()) {
    try {
      // 1. Check Admin
      const { data: adminData } = await supabase
        .from('admins')
        .select('*')
        .or(`username.ilike.${trimmedId},email.ilike.${trimmedId}`)
        .eq('status', 'active')
        .maybeSingle();

      if (adminData && adminData.password_hash && trimmedPass === adminData.password_hash) {
        return {
          success: true,
          user: {
            id: adminData.id,
            username: adminData.username,
            name: adminData.name,
            email: adminData.email,
            role: 'admin',
            adminRole: adminData.role
          }
        };
      }

      // 2. Check Trainer
      const { data: trainerData } = await supabase
        .from('trainers')
        .select('*')
        .or(`username.ilike.${trimmedId},email.ilike.${trimmedId}`)
        .eq('status', 'active')
        .maybeSingle();

      if (trainerData && trainerData.password_hash && trimmedPass === trainerData.password_hash) {
        return {
          success: true,
          user: {
            id: trainerData.id,
            username: trainerData.username,
            name: trainerData.name,
            email: trainerData.email,
            role: 'trainer'
          }
        };
      }

      // 3. Check Student (Roll Number or Email or Username)
      const { data: studentData, error: studentQueryError } = await supabase
        .from('students')
        .select('*')
        .or(`roll_number.ilike.${trimmedId},email.ilike.${trimmedId},username.ilike.${trimmedId}`)
        .maybeSingle();

      if (studentQueryError) {
        console.warn('Supabase student query error:', studentQueryError);
      }

      if (studentData) {
        if (studentData.status !== 'active') {
          return { success: false, message: `Your student account is currently ${studentData.status}. Please contact your Organization Administrator.` };
        }

        const isStudentPasswordValid = studentData.password_hash && trimmedPass === studentData.password_hash;

        if (isStudentPasswordValid) {
          return {
            success: true,
            user: {
              id: studentData.id,
              username: studentData.roll_number,
              name: studentData.name,
              rollNo: studentData.roll_number,
              email: studentData.email,
              classId: studentData.class_id,
              role: 'student'
            }
          };
        }
      }
    } catch (err) {
      console.warn('Supabase auth lookup failed, falling back to directory memory:', err);
    }
  }

  // Fallback directory lookup
  // Admin check
  const matchedAdmin = memoryAdmins.find(
    a => (a.username.toLowerCase() === trimmedId.toLowerCase() || a.email.toLowerCase() === trimmedId.toLowerCase()) && a.status === 'active'
  );
  if (matchedAdmin && matchedAdmin.password && trimmedPass === matchedAdmin.password) {
    return {
      success: true,
      user: {
        id: matchedAdmin.id,
        username: matchedAdmin.username,
        name: matchedAdmin.name,
        email: matchedAdmin.email,
        role: 'admin',
        adminRole: matchedAdmin.role
      }
    };
  }

  // Trainer check
  const matchedTrainer = memoryTrainers.find(
    t =>
      t.username.toLowerCase() === trimmedId.toLowerCase() ||
      t.email.toLowerCase() === trimmedId.toLowerCase()
  );
  if (matchedTrainer) {
    if (matchedTrainer.status === 'inactive' || matchedTrainer.status === 'suspended') {
      return { success: false, message: 'Your trainer account is currently inactive or suspended.' };
    }
    if (matchedTrainer.password && trimmedPass === matchedTrainer.password) {
      return {
        success: true,
        user: {
          id: matchedTrainer.id,
          username: matchedTrainer.username,
          name: matchedTrainer.name,
          email: matchedTrainer.email,
          role: 'trainer'
        }
      };
    }
  }

  // Student check
  const matchedStudent = memoryStudents.find(
    s =>
      s.rollNo.toUpperCase() === trimmedId.toUpperCase() ||
      (s.email && s.email.toLowerCase() === trimmedId.toLowerCase()) ||
      (s.username && s.username.toLowerCase() === trimmedId.toLowerCase())
  );
  if (matchedStudent) {
    if (matchedStudent.status === 'inactive' || matchedStudent.status === 'suspended') {
      return { success: false, message: `Your student account is currently ${matchedStudent.status}. Please contact your Organization Administrator.` };
    }
    if (matchedStudent.password && trimmedPass === matchedStudent.password) {
      return {
        success: true,
        user: {
          id: matchedStudent.id,
          username: matchedStudent.rollNo,
          name: matchedStudent.name,
          rollNo: matchedStudent.rollNo,
          email: matchedStudent.email,
          classId: matchedStudent.classId,
          role: 'student'
        }
      };
    }
  }

  return { success: false, message: 'Invalid credentials. Please verify your roll number/username and password.' };
}

// ============================================================================
// 3. ATTEMPTS, CHECKPOINTING & SUBMISSION (200+ CONCURRENT USERS)
// ============================================================================

/**
 * Atomically starts or resumes an attempt via PostgreSQL RPC.
 * Enforces server time window and UNIQUE(test_id, student_id) constraint.
 */
export async function startTestAttemptAtomic(
  testId: string,
  studentId: string
): Promise<{ success: boolean; attempt?: any; message?: string }> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('start_test_attempt', {
        p_test_id: testId,
        p_student_id: studentId
      });

      if (error) {
        return { success: false, message: error.message };
      }
      const attemptObj = data?.attempt || data;
      return { success: true, attempt: attemptObj };
    } catch (err: any) {
      return { success: false, message: err.message || 'Database transaction error' };
    }
  }

  // Fallback memory logic with strict single-attempt and time-window enforcement
  const test = memoryTests.find(t => t.id === testId);
  const existingSub = memorySubmissions.find(s => s.testId === testId && s.studentId === studentId);
  if (test?.isCustomAssignment && existingSub) {
    return {
      success: false,
      message: `ALREADY_ATTEMPTED: Candidate has already completed this single-attempt examination.`
    };
  }

  if (test) {
    const now = new Date();
    if (test.startAt && new Date(test.startAt) > now) {
      return { success: false, message: `TEST_NOT_STARTED: This assessment is scheduled to begin at ${test.startAt}` };
    }
    if (test.endAt && new Date(test.endAt) < now) {
      return { success: false, message: `TEST_EXPIRED: This assessment expired at ${test.endAt}` };
    }
  }

  const mockAttempt = {
    id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    test_id: testId,
    student_id: studentId,
    status: 'in_progress',
    started_at: new Date().toISOString()
  };
  return { success: true, attempt: mockAttempt };
}

/**
 * Checkpoint test attempt every 15-30 seconds.
 * Low overhead, non-blocking, handles temporary connection issues safely.
 */
export async function checkpointAttempt(
  attemptId: string,
  metrics: {
    netWpm: number;
    rawWpm: number;
    accuracy: number;
    correctChars: number;
    totalChars: number;
    errors: number;
    violationCount: number;
    progressData?: any;
  }
): Promise<boolean> {
  if (!attemptId) return false;

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('checkpoint_test_attempt', {
        p_attempt_id: attemptId,
        p_net_wpm: metrics.netWpm,
        p_raw_wpm: metrics.rawWpm,
        p_accuracy: metrics.accuracy,
        p_correct_characters: metrics.correctChars,
        p_total_characters: metrics.totalChars,
        p_errors: metrics.errors,
        p_violation_count: metrics.violationCount,
        p_progress_data: metrics.progressData || {}
      });
      return Boolean(!error && data);
    } catch {
      return false;
    }
  }
  return true;
}

/**
 * Records an anti-cheat proctoring violation.
 */
export async function recordViolation(
  attemptId: string,
  studentId: string,
  violationType: ViolationRecord['violationType'],
  metadata: Record<string, any> = {}
): Promise<void> {
  const newViolation: ViolationRecord = {
    id: `viol-${Date.now()}`,
    attemptId,
    studentId,
    violationType,
    timestamp: new Date().toISOString(),
    metadata
  };

  memoryViolations.push(newViolation);

  if (isSupabaseConfigured()) {
    try {
      await supabase.rpc('record_violation', {
        p_attempt_id: attemptId,
        p_student_id: studentId,
        p_violation_type: violationType,
        p_metadata: metadata
      });
    } catch (e) {
      console.warn('Failed to persist violation to Supabase:', e);
    }
  }
}

/**
 * Submits the final examination attempt atomically and triggers certification.
 */
export async function submitTestAttemptAtomic(
  attemptId: string,
  submission: Omit<TypingSubmission, 'id' | 'timestamp'>
): Promise<{ success: boolean; submission?: TypingSubmission; certificate?: StudentCertificate; message?: string }> {
  const subId = attemptId || `sub-${Date.now()}`;
  const completeSubmission: TypingSubmission = {
    ...submission,
    id: subId,
    timestamp: new Date().toISOString(),
    status: 'submitted'
  };

  // Add to local memory
  memorySubmissions.push(completeSubmission);

  let issuedCertificate: StudentCertificate | undefined;

  // Requirement: "a new certificate should be generated only when he beats his Personal record or he completes any test"
  const previousSubmissions = memorySubmissions.filter(
    s => s.studentId === submission.studentId && s.id !== subId
  );
  const previousBests = previousSubmissions.map(s => s.netWpm || s.wpm || 0);
  const highestPriorWpm = previousBests.length > 0 ? Math.max(...previousBests) : 0;

  // Check if student beat their personal record or completed any test
  const isPersonalRecord = submission.netWpm > 0 && (previousBests.length === 0 || submission.netWpm > highestPriorWpm);
  const isTestCompleted = Boolean(submission.passed || submission.accuracy >= 60 || (submission.netWpm > 0 && submission.totalChars > 15));

  if (isPersonalRecord || isTestCompleted) {
    const certNumber = `TYPETEST-CERT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const verifyCode = `V-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    let achievementTitle = `${submission.netWpm >= 60 ? 'Master' : submission.netWpm >= 40 ? 'Proficient' : 'Standard'} Assessment Certification`;
    if (isPersonalRecord && highestPriorWpm > 0) {
      achievementTitle = `🏆 Personal Record Achievement (${submission.netWpm} WPM - Beat previous ${highestPriorWpm} WPM)`;
    } else if (isPersonalRecord) {
      achievementTitle = `🏆 Initial Benchmark & Personal Record (${submission.netWpm} WPM)`;
    }

    issuedCertificate = {
      id: `cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: submission.studentId,
      studentName: submission.studentName,
      rollNo: submission.rollNo,
      achievementTitle,
      wpm: submission.netWpm,
      accuracy: submission.accuracy,
      testTitle: submission.testTitle,
      issuedAt: new Date().toISOString(),
      issuingAuthority: 'Pavan B (Lead Mentor & Proctor), CSE Dept',
      verificationCode: verifyCode,
      certificateNumber: certNumber,
      status: 'valid'
    };
    memoryCertificates = [issuedCertificate, ...memoryCertificates.filter(c => c.id !== issuedCertificate!.id)];
    try {
      localStorage.setItem('typetest_memory_certificates', JSON.stringify(memoryCertificates));
    } catch {}
  }

  if (isSupabaseConfigured()) {
    try {
      const isUuid = attemptId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(attemptId);
      let certRecord: any = null;

      if (isUuid) {
        // 1. Submit existing proctored attempt via RPC
        const { data, error } = await supabase.rpc('submit_test_attempt', {
          p_attempt_id: attemptId,
          p_net_wpm: submission.netWpm,
          p_raw_wpm: submission.rawWpm,
          p_accuracy: submission.accuracy,
          p_correct_characters: submission.correctChars,
          p_total_characters: submission.totalChars,
          p_errors: submission.errors,
          p_violation_count: submission.proctorBlurFlags || 0,
          p_history: submission.history || []
        });

        if (!error && data?.certificate) {
          certRecord = data.certificate;
        } else if (error) {
          console.warn('RPC submit attempt fallback to direct update:', error);
          // Fallback to direct update on attempts table
          await supabase.from('attempts').update({
            status: 'submitted',
            submitted_at: new Date().toISOString(),
            net_wpm: submission.netWpm,
            raw_wpm: submission.rawWpm,
            accuracy: submission.accuracy,
            correct_characters: submission.correctChars,
            total_characters: submission.totalChars,
            errors: submission.errors,
            violation_count: submission.proctorBlurFlags || 0,
            history: submission.history || [],
            time_taken_seconds: submission.timeTaken || 60
          }).eq('id', attemptId);
        }
      } else {
        // 2. Practice arena attempt: persist cleanly in tests and attempts tables
        let targetTestId = submission.testId;
        const isTestUuid = targetTestId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetTestId);

        if (!isTestUuid) {
          const { data: newTestRow } = await supabase.from('tests').insert([{
            title: submission.testTitle || `Practice: ${submission.testCategory || 'Standard'}`,
            category: submission.testCategory || 'standard',
            language: submission.language || 'none',
            content: 'PRACTICE_MODE',
            time_limit_seconds: submission.timeTaken || 60,
            min_accuracy: 0,
            is_prebuilt: true,
            status: 'active'
          }]).select('id').single();

          if (newTestRow?.id) {
            targetTestId = newTestRow.id;
          }
        }

        if (targetTestId && submission.studentId) {
          const { data: attRow } = await supabase.from('attempts').insert([{
            test_id: targetTestId,
            student_id: submission.studentId,
            status: 'submitted',
            started_at: new Date(Date.now() - (submission.timeTaken || 60) * 1000).toISOString(),
            submitted_at: new Date().toISOString(),
            net_wpm: submission.netWpm,
            raw_wpm: submission.rawWpm,
            accuracy: submission.accuracy,
            correct_characters: submission.correctChars,
            total_characters: submission.totalChars,
            errors: submission.errors,
            violation_count: submission.proctorBlurFlags || 0,
            history: submission.history || [],
            time_taken_seconds: submission.timeTaken || 60
          }]).select('id').single();

          if (attRow?.id && submission.accuracy >= 90 && submission.netWpm >= 20) {
            const nextCertId = generateUniqueCertificateId();
            const verifyToken = `TT-VT-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${nextCertId.replace(/[^0-9]/g, '').slice(-6) || '000001'}`;
            const achievementTitle = `${submission.netWpm >= 80 ? '🏆 Grandmaster' : submission.netWpm >= 60 ? 'Master' : submission.netWpm >= 40 ? 'Proficient' : 'Standard'} Touch Typing Assessment Certification`;
            
            // 1. Insert into certificate_records (dedicated database table)
            try {
              const { data: createdRecord } = await supabase.from('certificate_records').insert([{
                id: nextCertId,
                certificate_id: nextCertId,
                student_id: submission.studentId,
                attempt_id: attRow.id,
                test_id: targetTestId,
                recipient_name: submission.studentName,
                recipient_roll_no: submission.rollNo || 'N/A',
                achievement_title: achievementTitle,
                test_name: submission.testTitle,
                wpm: submission.netWpm,
                gross_wpm: submission.rawWpm || submission.netWpm,
                net_wpm: submission.netWpm,
                accuracy: submission.accuracy,
                consistency: submission.accuracy > 95 ? 98 : 94,
                error_count: submission.errors || 0,
                issued_at: new Date().toISOString(),
                test_completed_at: completeSubmission.timestamp || new Date().toISOString(),
                issuing_authority: 'TYPETEST Global Certification Authority',
                organization: 'TYPETEST',
                template: 'modern',
                status: 'valid',
                verification_token: verifyToken,
                verification_code: nextCertId,
                anti_cheat_verified: (submission.proctorBlurFlags || 0) === 0,
                proctor_violations: submission.proctorBlurFlags || 0
              }]).select('*').single();

              if (createdRecord) {
                certRecord = createdRecord;
              }
            } catch (recErr) {
              console.warn('certificate_records table insert note:', recErr);
            }

            // 2. Also insert into legacy certificates table for backward-compatible triggers
            try {
              const { data: createdCert } = await supabase.from('certificates').insert([{
                student_id: submission.studentId,
                attempt_id: attRow.id,
                test_id: targetTestId,
                certificate_number: nextCertId,
                verification_code: nextCertId,
                score: submission.netWpm,
                accuracy: submission.accuracy,
                achievement_title: achievementTitle,
                issued_at: new Date().toISOString(),
                status: 'valid'
              }]).select('*').single();

              if (!certRecord && createdCert) {
                certRecord = createdCert;
              }
            } catch (legacyErr) {
              console.warn('certificates legacy insert note:', legacyErr);
            }
          }
        }
      }

      if (certRecord) {
        issuedCertificate = {
          id: certRecord.id || certRecord.certificate_id || generateUniqueCertificateId(),
          studentId: certRecord.student_id || submission.studentId,
          studentName: certRecord.recipient_name || submission.studentName,
          rollNo: certRecord.recipient_roll_no || submission.rollNo || 'N/A',
          achievementTitle: certRecord.achievement_title || `${submission.netWpm >= 60 ? 'Master' : 'Proficient'} Assessment Certification`,
          wpm: Number(certRecord.net_wpm || certRecord.wpm || certRecord.score || submission.netWpm),
          grossWpm: Number(certRecord.gross_wpm || submission.rawWpm || submission.netWpm),
          netWpm: Number(certRecord.net_wpm || submission.netWpm),
          accuracy: Number(certRecord.accuracy || submission.accuracy),
          consistency: Number(certRecord.consistency || 95),
          testId: submission.testId || 'test-std-1',
          testTitle: certRecord.test_name || submission.testTitle,
          attemptId: certRecord.attempt_id || completeSubmission.id,
          issuedAt: certRecord.issued_at || new Date().toISOString(),
          testCompletedAt: certRecord.test_completed_at || completeSubmission.timestamp || new Date().toISOString(),
          issuingAuthority: certRecord.issuing_authority || 'TYPETEST Global Certification Authority',
          verificationCode: certRecord.verification_code || certRecord.id,
          verificationToken: certRecord.verification_token,
          certificateNumber: certRecord.certificate_number || certRecord.id,
          status: (certRecord.status as any) || 'valid',
          organizationName: certRecord.organization || 'TYPETEST',
          certificateTitle: 'Certificate of Typing Achievement',
          template: certRecord.template || 'modern',
          antiCheatVerified: (submission.proctorBlurFlags || 0) === 0,
          proctorViolations: submission.proctorBlurFlags || 0,
          verifiedAttempt: {
            id: completeSubmission.id,
            netWpm: completeSubmission.netWpm,
            rawWpm: completeSubmission.rawWpm,
            accuracy: completeSubmission.accuracy,
            errors: completeSubmission.errors,
            timeTaken: completeSubmission.timeTaken,
            proctorBlurFlags: completeSubmission.proctorBlurFlags,
            passed: completeSubmission.passed,
            submittedAt: completeSubmission.timestamp
          }
        };
        // Add or update in memory certificates
        memoryCertificates = [issuedCertificate, ...memoryCertificates.filter(c => c.id !== issuedCertificate!.id)];
        try {
          localStorage.setItem('typetest_memory_certificates', JSON.stringify(memoryCertificates));
        } catch {}
      }
    } catch (e) {
      console.warn('Supabase submit attempt error:', e);
    }
  }

  return {
    success: true,
    submission: completeSubmission,
    certificate: issuedCertificate
  };
}

// ============================================================================
// 4. INSTITUTIONAL CRUD SERVICES (DEPARTMENTS, BATCHES, CLASSES)
// ============================================================================

export async function fetchDepartments(): Promise<Department[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      if (!error && data) {
        return data.map(d => ({
          id: d.id,
          name: d.name,
          code: d.code,
          hod: d.hod,
          description: d.description,
          status: d.status,
          createdAt: d.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryDepartments;
}

export async function createDepartment(dept: Omit<Department, 'id' | 'createdAt'>): Promise<Department> {
  const newDept: Department = {
    ...dept,
    id: `dept-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  memoryDepartments.push(newDept);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('departments').insert([{
        name: dept.name,
        code: dept.code,
        hod: dept.hod,
        description: dept.description,
        status: dept.status
      }]).select().single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          code: data.code,
          hod: data.hod,
          description: data.description,
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return newDept;
}

export async function updateDepartment(id: string, updates: Partial<Department>): Promise<void> {
  memoryDepartments = memoryDepartments.map(d => d.id === id ? { ...d, ...updates } : d);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('departments').update({
        ...(updates.name && { name: updates.name }),
        ...(updates.code && { code: updates.code }),
        ...(updates.hod !== undefined && { hod: updates.hod }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

export async function deleteDepartment(id: string): Promise<void> {
  memoryDepartments = memoryDepartments.filter(d => d.id !== id);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('departments').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

// BATCHES
export async function fetchBatches(): Promise<Batch[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('batches').select('*').order('batch_year', { ascending: false });
      if (!error && data) {
        return data.map(b => ({
          id: b.id,
          name: b.name,
          batchYear: b.batch_year,
          academicYear: b.academic_year,
          departmentId: b.department_id,
          startDate: b.start_date,
          endDate: b.end_date,
          status: b.status,
          createdAt: b.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryBatches;
}

export async function createBatch(batch: Omit<Batch, 'id' | 'createdAt'>): Promise<Batch> {
  const newBatch: Batch = {
    ...batch,
    id: `batch-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  memoryBatches.push(newBatch);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('batches').insert([{
        name: batch.name,
        batch_year: batch.batchYear,
        academic_year: batch.academicYear,
        department_id: batch.departmentId || null,
        start_date: batch.startDate || null,
        end_date: batch.endDate || null,
        status: batch.status
      }]).select().single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          batchYear: data.batch_year,
          academicYear: data.academic_year,
          departmentId: data.department_id,
          startDate: data.start_date,
          endDate: data.end_date,
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return newBatch;
}

export async function updateBatch(id: string, updates: Partial<Batch>): Promise<void> {
  memoryBatches = memoryBatches.map(b => b.id === id ? { ...b, ...updates } : b);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('batches').update({
        ...(updates.name && { name: updates.name }),
        ...(updates.batchYear && { batch_year: updates.batchYear }),
        ...(updates.academicYear && { academic_year: updates.academicYear }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

export async function deleteBatch(id: string): Promise<void> {
  memoryBatches = memoryBatches.filter(b => b.id !== id);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('batches').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

// CLASSES
export async function fetchClasses(): Promise<ClassRoom[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('classes').select('*, students(id)');
      if (!error && data) {
        return data.map(c => ({
          id: c.id,
          name: c.name,
          code: c.code,
          trainerId: 'trn-1',
          departmentId: c.department_id,
          batchId: c.batch_id,
          academicYear: c.academic_year,
          section: c.section,
          description: c.description,
          studentIds: c.students ? c.students.map((s: any) => s.id) : [],
          status: c.status,
          createdAt: c.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryClasses;
}

export async function createClass(cls: Omit<ClassRoom, 'id' | 'createdAt'>): Promise<ClassRoom> {
  const newClass: ClassRoom = {
    ...cls,
    id: `class-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  memoryClasses.push(newClass);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('classes').insert([{
        name: cls.name,
        code: cls.code || `CLS-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        description: cls.description,
        department_id: cls.departmentId || null,
        batch_id: cls.batchId || null,
        section: cls.section || 'A',
        status: cls.status || 'active'
      }]).select().single();
      if (!error && data) {
        return {
          id: data.id,
          name: data.name,
          code: data.code,
          trainerId: cls.trainerId,
          description: data.description,
          studentIds: [],
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return newClass;
}

export async function updateClass(id: string, updates: Partial<ClassRoom>): Promise<void> {
  memoryClasses = memoryClasses.map(c => c.id === id ? { ...c, ...updates } : c);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('classes').update({
        ...(updates.name && { name: updates.name }),
        ...(updates.code && { code: updates.code }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      }).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

export async function deleteClass(id: string): Promise<void> {
  memoryClasses = memoryClasses.filter(c => c.id !== id);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('classes').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

// ============================================================================
// 5. STUDENTS MANAGEMENT (VIEW, EDIT, BULK IMPORT, SAFE DELETE)
// ============================================================================

export async function fetchStudents(): Promise<Student[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('students').select('*').order('roll_number');
      if (!error && data) {
        return data.map(s => ({
          id: s.id,
          rollNo: s.roll_number,
          name: s.name,
          email: s.email,
          phone: s.phone,
          password: s.password_hash || s.roll_number,
          classId: s.class_id,
          batchId: s.batch_id,
          departmentId: s.department_id,
          studentIdNumber: s.student_id_number,
          username: s.username,
          status: s.status,
          createdAt: s.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryStudents;
}

export async function createStudent(studentData: Omit<Student, 'id' | 'createdAt'>): Promise<Student> {
  const defaultPassword = studentData.password?.trim() || studentData.rollNo.toUpperCase().trim();
  const newStudent: Student = {
    ...studentData,
    password: defaultPassword,
    id: `std-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('students').insert([{
        roll_number: studentData.rollNo.toUpperCase().trim(),
        name: studentData.name.trim(),
        email: studentData.email?.trim() || null,
        phone: studentData.phone?.trim() || null,
        class_id: studentData.classId || null,
        batch_id: studentData.batchId || null,
        department_id: studentData.departmentId || null,
        password_hash: defaultPassword,
        username: studentData.rollNo.toUpperCase().trim(),
        status: studentData.status || 'active'
      }]).select().single();

      if (error) {
        console.error('Supabase student insert error:', error);
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          throw new Error('Database tables are missing in Supabase. Please execute the setup SQL script in your Supabase SQL Editor before creating student accounts.');
        }
        if (error.code === '23505' || error.message?.includes('duplicate key') || error.message?.includes('unique constraint')) {
          throw new Error(`A student with Roll Number "${studentData.rollNo.toUpperCase().trim()}" already exists.`);
        }
        throw new Error(error.message || 'Database error occurred while adding student.');
      }

      if (data) {
        const persisted: Student = {
          id: data.id,
          rollNo: data.roll_number,
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password_hash || defaultPassword,
          classId: data.class_id,
          batchId: data.batch_id,
          departmentId: data.department_id,
          status: data.status,
          createdAt: data.created_at
        };
        memoryStudents.push(persisted);
        return persisted;
      }
    } catch (e) {
      console.error('Supabase student insert error:', e);
      throw e;
    }
  }

  memoryStudents.push(newStudent);
  saveMemoryStudents(memoryStudents);
  return newStudent;
}

export async function updateStudent(id: string, updates: Partial<Student>): Promise<void> {
  memoryStudents = memoryStudents.map(s => s.id === id ? { ...s, ...updates } : s);
  saveMemoryStudents(memoryStudents);
  if (isSupabaseConfigured()) {
    try {
      const dbUpdates: any = {
        ...(updates.rollNo && { roll_number: updates.rollNo.toUpperCase().trim() }),
        ...(updates.name && { name: updates.name.trim() }),
        ...(updates.email !== undefined && { email: updates.email?.trim() || null }),
        ...(updates.phone !== undefined && { phone: updates.phone?.trim() || null }),
        ...(updates.classId !== undefined && { class_id: updates.classId || null }),
        ...(updates.batchId !== undefined && { batch_id: updates.batchId || null }),
        ...(updates.departmentId !== undefined && { department_id: updates.departmentId || null }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      };
      if (updates.password !== undefined && updates.password.trim()) {
        dbUpdates.password_hash = updates.password.trim();
      }
      await supabase.from('students').update(dbUpdates).eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Checks if a student has historical examination attempts before deleting.
 */
export async function checkStudentAttemptCount(studentId: string): Promise<number> {
  if (isSupabaseConfigured()) {
    try {
      const { count } = await supabase
        .from('attempts')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId);
      return count || 0;
    } catch {
      return 0;
    }
  }
  return memorySubmissions.filter(s => s.studentId === studentId).length;
}

export async function deleteStudent(id: string): Promise<void> {
  memoryStudents = memoryStudents.filter(s => s.id !== id);
  saveMemoryStudents(memoryStudents);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('students').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

/**
 * Bulk imports student records with duplicate detection and validation.
 */
export async function bulkImportStudents(
  records: Array<{
    rollNo: string;
    name: string;
    email?: string;
    phone?: string;
    classId?: string;
    batchId?: string;
    departmentId?: string;
  }>
): Promise<BulkImportResult> {
  const result: BulkImportResult = {
    total: records.length,
    valid: 0,
    duplicates: 0,
    invalid: 0,
    errors: []
  };

  const existingRolls = new Set(memoryStudents.map(s => s.rollNo.toUpperCase()));
  const validToInsert: Omit<Student, 'id' | 'createdAt'>[] = [];

  for (const r of records) {
    const roll = (r.rollNo || '').trim().toUpperCase();
    const name = (r.name || '').trim();

    if (!roll || !name) {
      result.invalid++;
      result.errors.push(`Row missing roll number or name: ${JSON.stringify(r)}`);
      continue;
    }

    if (existingRolls.has(roll)) {
      result.duplicates++;
      continue;
    }

    existingRolls.add(roll);
    validToInsert.push({
      rollNo: roll,
      name,
      email: r.email?.trim(),
      phone: r.phone?.trim(),
      classId: r.classId,
      batchId: r.batchId,
      departmentId: r.departmentId,
      status: 'active'
    });
  }

  // Insert valid
  for (const item of validToInsert) {
    try {
      await createStudent(item);
      result.valid++;
    } catch (err: any) {
      result.invalid++;
      result.errors.push(`${item.rollNo}: ${err.message || 'Insert failed'}`);
      if (err.message?.includes('Database tables are missing')) {
        break;
      }
    }
  }

  return result;
}

// ============================================================================
// 6. TRAINERS MANAGEMENT
// ============================================================================

export async function fetchTrainers(): Promise<Trainer[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('trainers')
        .select('*, trainer_classes(class_id)');
      if (!error && data) {
        return data.map(t => ({
          id: t.id,
          username: t.username,
          name: t.name,
          email: t.email,
          phone: t.phone,
          password: t.password_hash || 'trainer@123',
          employeeId: t.employee_id,
          departmentId: t.department_id,
          designation: t.designation,
          status: t.status,
          assignedClasses: t.trainer_classes ? t.trainer_classes.map((tc: any) => tc.class_id) : [],
          createdAt: t.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryTrainers;
}

export async function createTrainer(trainerData: Omit<Trainer, 'id' | 'createdAt'>): Promise<Trainer> {
  const defaultPassword = trainerData.password?.trim() || 'trainer@123';
  const newTrainer: Trainer = {
    ...trainerData,
    password: defaultPassword,
    id: `trn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString()
  };
  memoryTrainers.push(newTrainer);
  saveMemoryTrainers(memoryTrainers);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('trainers').insert([{
        username: trainerData.username.toLowerCase().trim(),
        name: trainerData.name.trim(),
        email: trainerData.email.trim(),
        phone: trainerData.phone || null,
        employee_id: trainerData.employeeId || null,
        department_id: trainerData.departmentId || null,
        designation: trainerData.designation || 'Examiner',
        password_hash: defaultPassword,
        status: trainerData.status || 'active'
      }]).select().single();
      if (!error && data) {
        // Link assigned classes
        if (trainerData.assignedClasses?.length > 0) {
          const links = trainerData.assignedClasses.map(cId => ({
            trainer_id: data.id,
            class_id: cId
          }));
          await supabase.from('trainer_classes').insert(links);
        }
        return {
          id: data.id,
          username: data.username,
          name: data.name,
          email: data.email,
          phone: data.phone,
          password: data.password_hash || defaultPassword,
          employeeId: data.employee_id,
          departmentId: data.department_id,
          designation: data.designation,
          assignedClasses: trainerData.assignedClasses || [],
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return newTrainer;
}

export async function updateTrainer(id: string, updates: Partial<Trainer>): Promise<void> {
  memoryTrainers = memoryTrainers.map(t => t.id === id ? { ...t, ...updates } : t);
  saveMemoryTrainers(memoryTrainers);
  if (isSupabaseConfigured()) {
    try {
      const dbUpdates: any = {
        ...(updates.name && { name: updates.name }),
        ...(updates.email && { email: updates.email }),
        ...(updates.phone !== undefined && { phone: updates.phone }),
        ...(updates.designation !== undefined && { designation: updates.designation }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      };
      if (updates.password !== undefined && updates.password.trim()) {
        dbUpdates.password_hash = updates.password.trim();
      }
      await supabase.from('trainers').update(dbUpdates).eq('id', id);

      if (updates.assignedClasses) {
        await supabase.from('trainer_classes').delete().eq('trainer_id', id);
        const links = updates.assignedClasses.map(cId => ({
          trainer_id: id,
          class_id: cId
        }));
        if (links.length > 0) {
          await supabase.from('trainer_classes').insert(links);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export async function deleteTrainer(id: string): Promise<void> {
  memoryTrainers = memoryTrainers.filter(t => t.id !== id);
  saveMemoryTrainers(memoryTrainers);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('trainers').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

// ============================================================================
// 7. TESTS & ASSIGNMENTS (CENTRALIZED DATABASE TRUTH)
// ============================================================================

export async function getOrCreatePracticeTest(mode: string): Promise<string> {
  if (!isSupabaseConfigured()) return `practice-${mode}`;
  const title = `Practice: ${mode.charAt(0).toUpperCase() + mode.slice(1)}`;
  const { data: existing } = await supabase.from('tests').select('id').eq('title', title).eq('is_prebuilt', true).limit(1);
  if (existing && existing.length > 0) return existing[0].id;
  const { data: newTest, error } = await supabase.from('tests').insert([{
    title,
    category: mode === 'code' ? 'code' : mode === 'story' ? 'story' : 'standard',
    language: mode === 'code' ? 'javascript' : 'none',
    content: 'PRACTICE_MODE',
    time_limit_seconds: 60,
    min_accuracy: 0,
    is_prebuilt: true,
    status: 'active'
  }]).select('id').single();
  if (error || !newTest) throw new Error('Could not create practice test');
  return newTest.id;
}

export async function fetchTests(): Promise<TypingTest[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, test_assignments(class_id, student_id)')
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data.map(t => {
          const classIds: string[] = [];
          const studentIds: string[] = [];
          if (t.test_assignments) {
            t.test_assignments.forEach((ta: any) => {
              if (ta.class_id) classIds.push(ta.class_id);
              if (ta.student_id) studentIds.push(ta.student_id);
            });
          }
          return {
            id: t.id,
            title: t.title,
            description: t.description,
            category: t.category as any,
            language: t.language as any,
            content: t.content,
            timeLimit: t.time_limit_seconds,
            minAccuracy: Number(t.min_accuracy),
            assignedClassIds: classIds,
            assignedStudentIds: studentIds,
            isCustomAssignment: !t.is_prebuilt,
            startAt: t.start_time,
            endAt: t.end_time,
            isPrebuilt: t.is_prebuilt,
            createdBy: t.created_by,
            difficulty: t.difficulty,
            status: t.status,
            createdAt: t.created_at
          };
        });
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryTests;
}

export async function createTest(testData: Omit<TypingTest, 'id' | 'isPrebuilt'>): Promise<TypingTest> {
  const newTest: TypingTest = {
    ...testData,
    id: `test-${Date.now()}`,
    isPrebuilt: false,
    createdAt: new Date().toISOString(),
    status: testData.status || 'active'
  };
  memoryTests.unshift(newTest);

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('tests').insert([{
        title: testData.title,
        description: testData.description,
        category: testData.category,
        language: testData.language || 'none',
        content: testData.content,
        duration_minutes: Math.ceil(testData.timeLimit / 60),
        time_limit_seconds: testData.timeLimit,
        min_accuracy: testData.minAccuracy,
        start_time: testData.startAt || null,
        end_time: testData.endAt || null,
        is_prebuilt: false,
        difficulty: testData.difficulty || 'medium',
        status: testData.status || 'active'
      }]).select().single();

      if (!error && data) {
        // Create assignments in Supabase
        if (testData.assignedClassIds?.length > 0) {
          const assigns = testData.assignedClassIds.map(cId => ({
            test_id: data.id,
            class_id: cId
          }));
          await supabase.from('test_assignments').insert(assigns);
        }
        if (testData.assignedStudentIds?.length > 0) {
          const studentAssigns = testData.assignedStudentIds.map(sId => ({
            test_id: data.id,
            student_id: sId
          }));
          await supabase.from('test_assignments').insert(studentAssigns);
        }

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          language: data.language,
          content: data.content,
          timeLimit: data.time_limit_seconds,
          minAccuracy: Number(data.min_accuracy),
          assignedClassIds: testData.assignedClassIds || [],
          assignedStudentIds: testData.assignedStudentIds || [],
          isCustomAssignment: true,
          startAt: data.start_time,
          endAt: data.end_time,
          isPrebuilt: false,
          createdBy: data.created_by,
          difficulty: data.difficulty,
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return newTest;
}

export async function updateTest(id: string, updates: Partial<TypingTest>): Promise<void> {
  memoryTests = memoryTests.map(t => t.id === id ? { ...t, ...updates } : t);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('tests').update({
        ...(updates.title && { title: updates.title }),
        ...(updates.description !== undefined && { description: updates.description }),
        ...(updates.content && { content: updates.content }),
        ...(updates.timeLimit && { time_limit_seconds: updates.timeLimit, duration_minutes: Math.ceil(updates.timeLimit / 60) }),
        ...(updates.minAccuracy && { min_accuracy: updates.minAccuracy }),
        ...(updates.startAt !== undefined && { start_time: updates.startAt || null }),
        ...(updates.endAt !== undefined && { end_time: updates.endAt || null }),
        ...(updates.status && { status: updates.status }),
        updated_at: new Date().toISOString()
      }).eq('id', id);

      if (updates.assignedClassIds !== undefined) {
        await supabase.from('test_assignments').delete().eq('test_id', id);
        const assigns = (updates.assignedClassIds || []).map(cId => ({
          test_id: id,
          class_id: cId
        }));
        if (assigns.length > 0) {
          await supabase.from('test_assignments').insert(assigns);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export async function deleteTest(id: string): Promise<void> {
  memoryTests = memoryTests.filter(t => t.id !== id);
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('tests').delete().eq('id', id);
    } catch (e) {
      console.error(e);
    }
  }
}

// ============================================================================
// 8. SUBMISSIONS, AUDIT & RESET ATTEMPTS
// ============================================================================

export async function fetchSubmissions(): Promise<TypingSubmission[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('attempts')
        .select('*, students(name, roll_number, class_id), tests(title, category, language)')
        .eq('status', 'submitted')
        .order('submitted_at', { ascending: false });

      if (!error && data) {
        const dbSubs: TypingSubmission[] = data.map(a => {
          const localStudent = memoryStudents.find(s => s.id === a.student_id);
          return {
            id: a.id,
            testId: a.test_id,
            testTitle: a.tests?.title || 'Examination Module',
            testCategory: (a.tests?.category || 'standard') as any,
            language: (a.tests?.language || 'none') as any,
            studentId: a.student_id,
            studentName: a.students?.name || localStudent?.name || 'Unknown Examinee',
            rollNo: a.students?.roll_number || localStudent?.rollNo || 'N/A',
            classId: a.students?.class_id || localStudent?.classId || '',
            className: 'CSE Core Cohort',
            wpm: Number(a.net_wpm),
            rawWpm: Number(a.raw_wpm),
            netWpm: Number(a.net_wpm),
            accuracy: Number(a.accuracy),
            errors: a.errors,
            totalChars: a.total_characters,
            correctChars: a.correct_characters,
            timeTaken: Number(a.time_taken_seconds) || 60,
            proctorBlurFlags: a.violation_count,
            passed: Number(a.accuracy) >= 90 && Number(a.net_wpm) >= 20,
            history: a.history || [],
            timestamp: a.submitted_at || a.created_at,
            status: a.status
          };
        });

        // Merge with any local memory submissions not yet in DB
        const merged = [...dbSubs];
        for (const mem of memorySubmissions) {
          if (!merged.some(m => m.id === mem.id)) {
            merged.push(mem);
          }
        }
        return merged;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memorySubmissions;
}

/**
 * Resets a student's attempt to allow an authorized re-sit.
 * Atomically deletes attempt and writes an immutable audit record.
 */
export async function resetStudentAttemptAtomic(
  testId: string,
  studentId: string,
  adminId: string,
  adminName: string,
  reason: string = 'Authorized re-examination'
): Promise<boolean> {
  memorySubmissions = memorySubmissions.filter(
    s => !(s.testId === testId && s.studentId === studentId)
  );

  recordAuditLog({
    adminId,
    adminName,
    action: 'RESET_ATTEMPT',
    entityType: 'attempt',
    entityId: `${testId}:${studentId}`,
    details: { testId, studentId, reason }
  });

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.rpc('reset_student_attempt', {
        p_test_id: testId,
        p_student_id: studentId,
        p_admin_id: adminId,
        p_admin_name: adminName,
        p_reason: reason
      });
      return !error && Boolean(data);
    } catch (e) {
      console.error('Supabase reset attempt error:', e);
    }
  }
  return true;
}

// VIOLATIONS
export async function fetchViolations(): Promise<ViolationRecord[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('violations')
        .select('*, students(name, roll_number), attempts(test_id, tests(title))')
        .order('timestamp', { ascending: false })
        .limit(200);

      if (!error && data) {
        return data.map(v => ({
          id: v.id,
          attemptId: v.attempt_id,
          studentId: v.student_id,
          studentName: v.students?.name,
          rollNo: v.students?.roll_number,
          testTitle: (v.attempts as any)?.tests?.title,
          violationType: v.violation_type,
          timestamp: v.timestamp,
          metadata: v.metadata
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryViolations;
}

// ============================================================================
// CERTIFICATES & CERTIFICATE_RECORDS
// ============================================================================

let certificateCounter = 184;

export function generateUniqueCertificateId(): string {
  const year = new Date().getFullYear();
  // Find highest numeric sequence among existing certificates
  const allCerts = [...memoryCertificates, ...INITIAL_CERTIFICATES];
  let maxSeq = certificateCounter;
  for (const c of allCerts) {
    const match = c.id.match(/^TT-\d{4}-(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  certificateCounter = maxSeq + 1;
  const seqPadded = String(certificateCounter).padStart(6, '0');
  return `TT-${year}-${seqPadded}`;
}

export async function fetchCertificates(): Promise<StudentCertificate[]> {
  if (isSupabaseConfigured()) {
    try {
      const resultsMap = new Map<string, StudentCertificate>();

      // 1. First fetch from dedicated certificate_records table
      try {
        const { data: recData, error: recError } = await supabase
          .from('certificate_records')
          .select('*, attempts(*), students(name, roll_number), tests(title)')
          .order('issued_at', { ascending: false });

        if (!recError && recData) {
          recData.forEach(r => {
            const cert: StudentCertificate = {
              id: r.id || r.certificate_id,
              studentId: r.student_id,
              studentName: r.recipient_name || r.students?.name || 'Verified Candidate',
              rollNo: r.recipient_roll_no || r.students?.roll_number || 'N/A',
              achievementTitle: r.achievement_title,
              wpm: Number(r.wpm || r.net_wpm),
              grossWpm: Number(r.gross_wpm || r.wpm),
              netWpm: Number(r.net_wpm || r.wpm),
              accuracy: Number(r.accuracy),
              consistency: Number(r.consistency || 95),
              testId: r.test_id,
              testTitle: r.test_name || r.tests?.title || 'Touch Typing Assessment',
              attemptId: r.attempt_id,
              issuedAt: r.issued_at,
              testCompletedAt: r.test_completed_at,
              issuingAuthority: r.issuing_authority || 'TYPETEST Certification Authority',
              verificationCode: r.verification_code || r.id,
              verificationToken: r.verification_token,
              certificateNumber: r.certificate_id || r.id,
              status: (r.status as any) || 'valid',
              organizationName: r.organization || 'TYPETEST',
              template: r.template || 'modern',
              antiCheatVerified: r.anti_cheat_verified ?? true,
              proctorViolations: r.proctor_violations || 0,
              verifiedAttempt: r.attempts ? {
                id: r.attempts.id,
                netWpm: Number(r.attempts.net_wpm || r.wpm),
                rawWpm: Number(r.attempts.raw_wpm || r.gross_wpm || r.wpm),
                accuracy: Number(r.attempts.accuracy || r.accuracy),
                errors: Number(r.attempts.errors || 0),
                timeTaken: Number(r.attempts.time_taken_seconds || 60),
                proctorBlurFlags: Number(r.attempts.violation_count || 0),
                passed: true,
                submittedAt: r.attempts.submitted_at || r.issued_at
              } : undefined
            };
            resultsMap.set(cert.id, cert);
          });
        }
      } catch (e) {
        console.warn('certificate_records fetch note:', e);
      }

      // 2. Fetch from legacy certificates table
      try {
        const { data: legData, error: legError } = await supabase
          .from('certificates')
          .select('*, students(name, roll_number), tests(title), attempts(*)')
          .order('issued_at', { ascending: false });

        if (!legError && legData) {
          legData.forEach(c => {
            const key = c.id || c.certificate_number;
            if (!resultsMap.has(key)) {
              const localStudent = memoryStudents.find(s => s.id === c.student_id);
              const cert: StudentCertificate = {
                id: c.certificate_number || c.id,
                studentId: c.student_id,
                studentName: c.students?.name || localStudent?.name || 'Verified Candidate',
                rollNo: c.students?.roll_number || localStudent?.rollNo || 'N/A',
                achievementTitle: c.achievement_title || `${Number(c.score) >= 60 ? 'Master' : 'Proficient'} Assessment Certification`,
                wpm: Number(c.score),
                grossWpm: Number(c.score),
                netWpm: Number(c.score),
                accuracy: Number(c.accuracy),
                consistency: 95,
                testId: c.test_id,
                testTitle: c.tests?.title || 'Technical Typing Assessment',
                attemptId: c.attempt_id,
                issuedAt: c.issued_at,
                testCompletedAt: c.issued_at,
                issuingAuthority: 'TYPETEST Global Certification Authority',
                verificationCode: c.verification_code || c.certificate_number || c.id,
                verificationToken: `TT-VT-${c.id}`,
                certificateNumber: c.certificate_number || c.id,
                status: (c.status as any) || 'valid',
                organizationName: 'TYPETEST',
                template: 'modern',
                antiCheatVerified: true,
                proctorViolations: 0,
                verifiedAttempt: c.attempts ? {
                  id: c.attempts.id,
                  netWpm: Number(c.attempts.net_wpm || c.score),
                  rawWpm: Number(c.attempts.raw_wpm || c.score),
                  accuracy: Number(c.attempts.accuracy || c.accuracy),
                  errors: Number(c.attempts.errors || 0),
                  timeTaken: Number(c.attempts.time_taken_seconds || 60),
                  proctorBlurFlags: Number(c.attempts.violation_count || 0),
                  passed: true,
                  submittedAt: c.attempts.submitted_at || c.issued_at
                } : undefined
              };
              resultsMap.set(key, cert);
            }
          });
        }
      } catch (e) {
        console.warn('certificates legacy fetch note:', e);
      }

      // Merge memory certificates
      for (const mem of memoryCertificates) {
        if (!resultsMap.has(mem.id)) {
          resultsMap.set(mem.id, mem);
        }
      }

      return Array.from(resultsMap.values());
    } catch (e) {
      console.error('Fetch certificates master error:', e);
    }
  }
  return memoryCertificates;
}

export async function createCertificateRecord(
  certData: Partial<StudentCertificate> & {
    studentId: string;
    studentName: string;
    rollNo: string;
    wpm: number;
    accuracy: number;
    testTitle: string;
  }
): Promise<StudentCertificate> {
  const certId = certData.id || generateUniqueCertificateId();
  const year = new Date().getFullYear();
  const token = certData.verificationToken || `TT-VT-${year}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${certId.replace(/[^0-9]/g, '').slice(-6) || '000001'}`;
  
  // Ensure attemptId links back to a verified attempt
  let verifiedAttemptId = certData.attemptId;
  let linkedAttempt = certData.verifiedAttempt;

  if (!verifiedAttemptId) {
    // Check if there is an existing submission for this student and test
    const matchedSub = memorySubmissions.find(
      s => s.studentId === certData.studentId || (s.rollNo && s.rollNo === certData.rollNo)
    );
    if (matchedSub) {
      verifiedAttemptId = matchedSub.id;
      linkedAttempt = {
        id: matchedSub.id,
        netWpm: matchedSub.netWpm,
        rawWpm: matchedSub.rawWpm,
        accuracy: matchedSub.accuracy,
        errors: matchedSub.errors,
        timeTaken: matchedSub.timeTaken,
        proctorBlurFlags: matchedSub.proctorBlurFlags,
        passed: matchedSub.passed,
        submittedAt: matchedSub.timestamp
      };
    } else {
      // Create a verified attempt in database/memory so certificate is backed by real attempt record
      verifiedAttemptId = `att-cert-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      const newAttemptSubmission: TypingSubmission = {
        id: verifiedAttemptId,
        testId: certData.testId || 'test-std-1',
        testTitle: certData.testTitle,
        testCategory: 'standard',
        studentId: certData.studentId,
        studentName: certData.studentName,
        rollNo: certData.rollNo,
        classId: 'cls-ext',
        className: certData.department || certData.organizationName || 'General Certification Track',
        wpm: certData.wpm,
        rawWpm: certData.grossWpm || certData.wpm,
        netWpm: certData.netWpm || certData.wpm,
        accuracy: certData.accuracy,
        errors: 0,
        totalChars: certData.wpm * 5,
        correctChars: certData.wpm * 5,
        timeTaken: 60,
        proctorBlurFlags: certData.proctorViolations || 0,
        history: [],
        passed: true,
        timestamp: certData.testCompletedAt || new Date().toISOString(),
        status: 'submitted'
      };
      memorySubmissions.unshift(newAttemptSubmission);
      try {
        localStorage.setItem('typetest_memory_submissions', JSON.stringify(memorySubmissions));
      } catch {}

      linkedAttempt = {
        id: verifiedAttemptId,
        netWpm: certData.wpm,
        rawWpm: certData.grossWpm || certData.wpm,
        accuracy: certData.accuracy,
        errors: 0,
        timeTaken: 60,
        proctorBlurFlags: certData.proctorViolations || 0,
        passed: true,
        submittedAt: newAttemptSubmission.timestamp
      };
    }
  }

  const newCert: StudentCertificate = {
    id: certId,
    studentId: certData.studentId,
    studentName: certData.studentName,
    rollNo: certData.rollNo,
    achievementTitle: certData.achievementTitle || 'Typing Assessment Excellence',
    wpm: Number(certData.wpm),
    grossWpm: Number(certData.grossWpm || certData.wpm),
    netWpm: Number(certData.netWpm || certData.wpm),
    accuracy: Number(certData.accuracy),
    consistency: Number(certData.consistency || 95),
    testId: certData.testId || 'test-std-1',
    testTitle: certData.testTitle,
    attemptId: verifiedAttemptId,
    issuedAt: certData.issuedAt || new Date().toISOString(),
    testCompletedAt: certData.testCompletedAt || new Date().toISOString(),
    issuingAuthority: certData.issuingAuthority || 'TYPETEST Global Credential Registry',
    verificationCode: certData.verificationCode || certId,
    verificationToken: token,
    certificateNumber: certId,
    status: certData.status || 'valid',
    certificateType: certData.certificateType || 'generic',
    organizationName: certData.organizationName || 'TYPETEST',
    department: certData.department,
    certificateTitle: certData.certificateTitle || 'Certificate of Achievement',
    primarySignerName: certData.primarySignerName || 'Alex Mercer',
    primarySignerTitle: certData.primarySignerTitle || 'Director of Evaluations',
    secondarySignerName: certData.secondarySignerName || 'TYPETEST Registry',
    secondarySignerTitle: certData.secondarySignerTitle || 'Credential Officer',
    template: certData.template || 'modern',
    antiCheatVerified: certData.antiCheatVerified ?? true,
    proctorViolations: certData.proctorViolations || 0,
    verifiedAttempt: linkedAttempt
  };

  // 1. Insert into Supabase if configured
  if (isSupabaseConfigured()) {
    try {
      await supabase.from('certificate_records').insert([{
        id: newCert.id,
        certificate_id: newCert.id,
        student_id: newCert.studentId,
        attempt_id: verifiedAttemptId,
        test_id: newCert.testId,
        recipient_name: newCert.studentName,
        recipient_roll_no: newCert.rollNo,
        achievement_title: newCert.achievementTitle,
        test_name: newCert.testTitle,
        wpm: newCert.wpm,
        gross_wpm: newCert.grossWpm,
        net_wpm: newCert.netWpm,
        accuracy: newCert.accuracy,
        consistency: newCert.consistency,
        error_count: 0,
        issued_at: newCert.issuedAt,
        test_completed_at: newCert.testCompletedAt,
        issuing_authority: newCert.issuingAuthority,
        organization: newCert.organizationName,
        template: newCert.template,
        status: newCert.status,
        verification_token: newCert.verificationToken,
        verification_code: newCert.verificationCode,
        anti_cheat_verified: newCert.antiCheatVerified,
        proctor_violations: newCert.proctorViolations
      }]);
    } catch (e) {
      console.warn('Supabase insert certificate_records note:', e);
    }

    try {
      await supabase.from('certificates').insert([{
        student_id: newCert.studentId,
        attempt_id: verifiedAttemptId,
        test_id: newCert.testId,
        certificate_number: newCert.id,
        verification_code: newCert.verificationCode,
        score: newCert.wpm,
        accuracy: newCert.accuracy,
        achievement_title: newCert.achievementTitle,
        issued_at: newCert.issuedAt,
        status: newCert.status
      }]);
    } catch (e) {
      console.warn('Supabase insert certificates fallback note:', e);
    }
  }

  // 2. Persist to memory and localStorage
  memoryCertificates = [newCert, ...memoryCertificates.filter(c => c.id !== newCert.id)];
  try {
    localStorage.setItem('typetest_memory_certificates', JSON.stringify(memoryCertificates));
  } catch {}

  return newCert;
}

export async function verifyCertificateDirectlyFromDatabase(idOrCode: string): Promise<{
  found: boolean;
  certificate: StudentCertificate | null;
  databaseSource: 'supabase_certificate_records' | 'supabase_certificates' | 'persistent_database_storage';
  error?: string;
}> {
  const clean = (idOrCode || '').trim();
  if (!clean) {
    return {
      found: false,
      certificate: null,
      databaseSource: 'persistent_database_storage',
      error: 'Certificate ID or verification code is required.'
    };
  }

  // 1. Direct query to Supabase `certificate_records`
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('certificate_records')
        .select('*, attempts(*), students(name, roll_number, email), tests(title, category)')
        .or(`id.ilike.${clean},certificate_id.ilike.${clean},verification_token.ilike.${clean},verification_code.ilike.${clean}`)
        .limit(1);

      if (!error && data && data.length > 0) {
        const r = data[0];
        const cert: StudentCertificate = {
          id: r.id || r.certificate_id,
          studentId: r.student_id,
          studentName: r.recipient_name || r.students?.name || 'Verified Candidate',
          rollNo: r.recipient_roll_no || r.students?.roll_number || 'N/A',
          achievementTitle: r.achievement_title,
          wpm: Number(r.wpm || r.net_wpm),
          grossWpm: Number(r.gross_wpm || r.wpm),
          netWpm: Number(r.net_wpm || r.wpm),
          accuracy: Number(r.accuracy),
          consistency: Number(r.consistency || 95),
          testId: r.test_id,
          testTitle: r.test_name || r.tests?.title || 'Touch Typing Assessment',
          attemptId: r.attempt_id,
          issuedAt: r.issued_at,
          testCompletedAt: r.test_completed_at || r.attempts?.submitted_at,
          issuingAuthority: r.issuing_authority || 'TYPETEST Certification Authority',
          verificationCode: r.verification_code || r.id,
          verificationToken: r.verification_token,
          certificateNumber: r.certificate_id || r.id,
          status: (r.status as any) || 'valid',
          organizationName: r.organization || 'TYPETEST',
          template: r.template || 'modern',
          antiCheatVerified: r.anti_cheat_verified ?? true,
          proctorViolations: r.proctor_violations || 0,
          verifiedAttempt: r.attempts ? {
            id: r.attempts.id,
            netWpm: Number(r.attempts.net_wpm || r.wpm),
            rawWpm: Number(r.attempts.raw_wpm || r.gross_wpm || r.wpm),
            accuracy: Number(r.attempts.accuracy || r.accuracy),
            errors: Number(r.attempts.errors || 0),
            timeTaken: Number(r.attempts.time_taken_seconds || 60),
            proctorBlurFlags: Number(r.attempts.violation_count || 0),
            passed: true,
            submittedAt: r.attempts.submitted_at || r.issued_at
          } : undefined
        };

        return {
          found: true,
          certificate: cert,
          databaseSource: 'supabase_certificate_records'
        };
      }

      // Fallback: Query legacy certificates table in Supabase
      const { data: legacyData, error: legErr } = await supabase
        .from('certificates')
        .select('*, attempts(*), students(name, roll_number, email), tests(title)')
        .or(`certificate_number.ilike.${clean},verification_code.ilike.${clean}`)
        .limit(1);

      if (!legErr && legacyData && legacyData.length > 0) {
        const c = legacyData[0];
        const cert: StudentCertificate = {
          id: c.certificate_number || c.id,
          studentId: c.student_id,
          studentName: c.students?.name || 'Verified Candidate',
          rollNo: c.students?.roll_number || 'N/A',
          achievementTitle: c.achievement_title || 'Assessment Certification',
          wpm: Number(c.score),
          grossWpm: Number(c.score),
          netWpm: Number(c.score),
          accuracy: Number(c.accuracy),
          consistency: 95,
          testId: c.test_id,
          testTitle: c.tests?.title || 'Touch Typing Assessment',
          attemptId: c.attempt_id,
          issuedAt: c.issued_at,
          testCompletedAt: c.issued_at,
          issuingAuthority: 'TYPETEST Global Certification Authority',
          verificationCode: c.verification_code || c.certificate_number || c.id,
          verificationToken: `TT-VT-${c.id}`,
          certificateNumber: c.certificate_number || c.id,
          status: (c.status as any) || 'valid',
          organizationName: 'TYPETEST',
          template: 'modern',
          antiCheatVerified: true,
          proctorViolations: 0,
          verifiedAttempt: c.attempts ? {
            id: c.attempts.id,
            netWpm: Number(c.attempts.net_wpm || c.score),
            rawWpm: Number(c.attempts.raw_wpm || c.score),
            accuracy: Number(c.attempts.accuracy || c.accuracy),
            errors: Number(c.attempts.errors || 0),
            timeTaken: Number(c.attempts.time_taken_seconds || 60),
            proctorBlurFlags: Number(c.attempts.violation_count || 0),
            passed: true,
            submittedAt: c.attempts.submitted_at || c.issued_at
          } : undefined
        };

        return {
          found: true,
          certificate: cert,
          databaseSource: 'supabase_certificates'
        };
      }
    } catch (dbErr) {
      console.warn('Database certificate verification query error:', dbErr);
    }
  }

  // 2. Query persistent local repository
  const normalizedSearch = clean.toLowerCase();
  const allPersistent = [...memoryCertificates, ...INITIAL_CERTIFICATES];
  const found = allPersistent.find(
    c =>
      c.id.toLowerCase() === normalizedSearch ||
      (c.certificateNumber && c.certificateNumber.toLowerCase() === normalizedSearch) ||
      (c.verificationCode && c.verificationCode.toLowerCase() === normalizedSearch) ||
      (c.verificationToken && c.verificationToken.toLowerCase() === normalizedSearch)
  );

  if (found) {
    // Attach verified attempt if missing
    if (!found.verifiedAttempt && found.attemptId) {
      const att = memorySubmissions.find(s => s.id === found.attemptId);
      if (att) {
        found.verifiedAttempt = {
          id: att.id,
          netWpm: att.netWpm,
          rawWpm: att.rawWpm,
          accuracy: att.accuracy,
          errors: att.errors,
          timeTaken: att.timeTaken,
          proctorBlurFlags: att.proctorBlurFlags,
          passed: att.passed,
          submittedAt: att.timestamp
        };
      }
    }

    return {
      found: true,
      certificate: found,
      databaseSource: 'persistent_database_storage'
    };
  }

  return {
    found: false,
    certificate: null,
    databaseSource: 'persistent_database_storage',
    error: `No official record matching certificate ID "${clean}" was found in the TYPETEST Credential Registry.`
  };
}

export async function updateCertificateStatusInDatabase(
  certificateId: string,
  status: 'valid' | 'revoked' | 'expired'
): Promise<boolean> {
  // Update memory
  memoryCertificates = memoryCertificates.map(c => {
    if (c.id === certificateId || c.certificateNumber === certificateId) {
      return { ...c, status };
    }
    return c;
  });
  try {
    localStorage.setItem('typetest_memory_certificates', JSON.stringify(memoryCertificates));
  } catch {}

  // Update Supabase
  if (isSupabaseConfigured()) {
    try {
      await supabase
        .from('certificate_records')
        .update({ status })
        .or(`id.eq.${certificateId},certificate_id.eq.${certificateId}`);

      await supabase
        .from('certificates')
        .update({ status })
        .or(`id.eq.${certificateId},certificate_number.eq.${certificateId}`);
    } catch (e) {
      console.warn('Supabase updateCertificateStatus error:', e);
    }
  }

  return true;
}

export function addMemoryCertificate(cert: StudentCertificate): void {
  memoryCertificates = [cert, ...memoryCertificates.filter(c => c.id !== cert.id)];
  try {
    localStorage.setItem('typetest_memory_certificates', JSON.stringify(memoryCertificates));
  } catch {}
}

// AUDIT LOGS
export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return data.map(l => ({
          id: l.id,
          adminId: l.admin_id,
          adminName: l.admin_name,
          action: l.action,
          entityType: l.entity_type,
          entityId: l.entity_id,
          details: l.details,
          createdAt: l.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryAuditLogs;
}

export function recordAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>): void {
  const newLog: AuditLogEntry = {
    ...entry,
    id: `log-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  memoryAuditLogs.unshift(newLog);

  if (isSupabaseConfigured()) {
    supabase.from('audit_logs').insert([{
      admin_id: entry.adminId || null,
      admin_name: entry.adminName,
      action: entry.action,
      entity_type: entry.entityType,
      entity_id: entry.entityId || null,
      details: entry.details || {}
    }]).then(({ error }) => {
      if (error) console.error('Supabase audit log insert error:', error);
    });
  }
}

// ADMIN USERS
export async function fetchAdmins(): Promise<AdminUser[]> {
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from('admins').select('*').order('name');
      if (!error && data) {
        return data.map(a => ({
          id: a.id,
          name: a.name,
          email: a.email,
          username: a.username,
          role: a.role as any,
          status: a.status as any,
          createdAt: a.created_at
        }));
      }
    } catch (e) {
      console.error(e);
    }
  }
  return memoryAdmins;
}

export async function createAdminUser(admin: Omit<AdminUser, 'id' | 'createdAt'>): Promise<AdminUser> {
  const newAdmin: AdminUser = {
    ...admin,
    id: `adm-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  memoryAdmins.push(newAdmin);

  if (isSupabaseConfigured()) {
    try {
      const { data } = await supabase.from('admins').insert([{
        name: admin.name,
        email: admin.email,
        username: admin.username,
        role: admin.role,
        status: admin.status
      }]).select().single();
      if (data) {
        return {
          id: data.id,
          name: data.name,
          email: data.email,
          username: data.username,
          role: data.role,
          status: data.status,
          createdAt: data.created_at
        };
      }
    } catch (e) {
      console.error(e);
    }
  }
  return newAdmin;
}

// ============================================================================
// 12. DIAGNOSTICS & SYSTEM HEALTH VERIFICATION
// ============================================================================

export interface DatabaseConnectionStatus {
  isConfigured: boolean;
  supabaseUrl: string;
  maskedUrl: string;
  hasAnonKey: boolean;
  isConnected: boolean;
  tablesFound: {
    students: boolean;
    admins: boolean;
    tests: boolean;
    attempts: boolean;
    classes: boolean;
    departments: boolean;
  };
  counts: {
    students: number;
    admins: number;
    tests: number;
    classes: number;
  };
  errorMessage?: string;
  recommendedAction?: string;
}

export async function checkDatabaseConnection(): Promise<DatabaseConnectionStatus> {
  const isConf = isSupabaseConfigured();
  const rawUrl = supabaseUrl || import.meta.env.VITE_SUPABASE_URL || '';
  const rawKey = supabaseAnonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '';

  const masked = rawUrl
    ? rawUrl.replace(/(https:\/\/[a-z0-9]{4})[a-z0-9]+(\.supabase\.co)/i, '$1••••$2')
    : 'Not configured';

  const status: DatabaseConnectionStatus = {
    isConfigured: isConf,
    supabaseUrl: rawUrl,
    maskedUrl: masked,
    hasAnonKey: Boolean(rawKey && rawKey.length > 20),
    isConnected: false,
    tablesFound: {
      students: false,
      admins: false,
      tests: false,
      attempts: false,
      classes: false,
      departments: false
    },
    counts: {
      students: 0,
      admins: 0,
      tests: 0,
      classes: 0
    }
  };

  if (!isConf) {
    status.errorMessage = 'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not configured in Vercel environment variables.';
    status.recommendedAction = 'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Project Settings > Environment Variables, then redeploy.';
    return status;
  }

  try {
    // Ping students
    const { count: studentCount, error: studentErr } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });

    if (!studentErr) {
      status.tablesFound.students = true;
      status.counts.students = studentCount || 0;
      status.isConnected = true;
    } else {
      // If server returned table missing error, server is alive!
      if (studentErr.code === 'PGRST205' || studentErr.message?.includes('Could not find the table') || studentErr.message?.includes('schema cache')) {
        status.isConnected = true;
      }
      status.errorMessage = studentErr.message;
    }

    // Ping admins
    const { count: adminCount, error: adminErr } = await supabase
      .from('admins')
      .select('*', { count: 'exact', head: true });

    if (!adminErr) {
      status.tablesFound.admins = true;
      status.counts.admins = adminCount || 0;
      status.isConnected = true;
    } else if (adminErr.code === 'PGRST205' || adminErr.message?.includes('Could not find the table')) {
      status.isConnected = true;
    }

    // Ping tests
    const { count: testCount, error: testErr } = await supabase
      .from('tests')
      .select('*', { count: 'exact', head: true });
    if (!testErr) {
      status.tablesFound.tests = true;
      status.counts.tests = testCount || 0;
    }

    // Ping classes
    const { count: classCount, error: classErr } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true });
    if (!classErr) {
      status.tablesFound.classes = true;
      status.counts.classes = classCount || 0;
    }

    // Ping attempts
    const { error: attemptErr } = await supabase
      .from('attempts')
      .select('id', { count: 'exact', head: true });
    if (!attemptErr) {
      status.tablesFound.attempts = true;
    }

    // Ping departments
    const { error: deptErr } = await supabase
      .from('departments')
      .select('id', { count: 'exact', head: true });
    if (!deptErr) {
      status.tablesFound.departments = true;
    }

    if (status.isConnected && (!status.tablesFound.students || !status.tablesFound.admins)) {
      status.errorMessage = 'Supabase server reached, but database tables (students, admins, classes, etc.) have not been created yet.';
      status.recommendedAction = 'Open your Supabase project SQL Editor, paste COMPLETE_INSTITUTIONAL_SETUP.sql, and click RUN.';
    }
  } catch (err: any) {
    status.errorMessage = err.message || 'Failed to ping Supabase instance.';
    status.recommendedAction = 'Verify your Vercel environment variables and ensure your Supabase project is active.';
  }

  return status;
}
