export type UserRole = 'admin' | 'trainer' | 'student';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  rollNo?: string;
  email?: string;
  classId?: string;
  adminRole?: 'SUPER ADMIN' | 'ADMIN' | 'ACADEMIC ADMIN' | 'EXAM ADMIN';
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hod?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Batch {
  id: string;
  name: string;
  batchYear: string;
  academicYear: string;
  departmentId?: string;
  startDate?: string;
  endDate?: string;
  status: 'active' | 'completed' | 'inactive';
  createdAt: string;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email?: string;
  phone?: string;
  password?: string; // Optional custom password, defaults to '1234'
  classId?: string;
  batchId?: string;
  batch?: string;
  departmentId?: string;
  studentIdNumber?: string;
  username?: string;
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface Trainer {
  id: string;
  username: string;
  name: string;
  email: string;
  phone?: string;
  employeeId?: string;
  departmentId?: string;
  designation?: string;
  password?: string; // Optional custom password, defaults to 'trainer@123'
  assignedClasses: string[];
  status?: 'active' | 'inactive' | 'suspended';
  createdAt: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: 'SUPER ADMIN' | 'ADMIN' | 'ACADEMIC ADMIN' | 'EXAM ADMIN';
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  code?: string;
  trainerId: string;
  departmentId?: string;
  batchId?: string;
  academicYear?: string;
  section?: string;
  description?: string;
  studentIds: string[];
  status?: 'active' | 'inactive' | 'archived';
  createdAt: string;
}

export type TestCategory = 'standard' | 'story' | 'code';
export type ProgrammingLanguage = 'python' | 'javascript' | 'java' | 'cpp' | 'none';

export interface TypingTest {
  id: string;
  title: string;
  category: TestCategory;
  language?: ProgrammingLanguage;
  content: string;
  timeLimit: number; // in seconds
  minAccuracy: number; // percentage
  assignedClassIds: string[]; // empty if open or unassigned
  assignedStudentIds?: string[]; // Specific students assigned
  isCustomAssignment?: boolean;
  startAt?: string; // ISO date-time string e.g. "2026-09-04T09:00"
  endAt?: string; // ISO date-time string e.g. "2026-09-04T18:00"
  attemptLimit?: number; // default 1
  isPrebuilt: boolean;
  createdBy: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  status?: 'draft' | 'active' | 'closed' | 'archived';
  createdAt?: string;
}

export interface TestAssignment {
  id: string;
  testId: string;
  studentId?: string;
  classId?: string;
  assignedAt: string;
  createdBy?: string;
}

export interface ViolationRecord {
  id: string;
  attemptId: string;
  studentId: string;
  studentName?: string;
  rollNo?: string;
  testTitle?: string;
  violationType: 'tab_switch' | 'window_blur' | 'visibility_change' | 'paste_attempt' | 'copy_attempt' | 'cut_attempt' | 'fullscreen_exit' | 'unusual_speed' | 'other';
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  adminId?: string;
  adminName: string;
  action: string;
  entityType: string;
  entityId?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export interface SubmissionHistoryPoint {
  second: number;
  wpm: number;
  rawWpm?: number;
  errors: number;
  accuracy?: number;
}

export interface TypingSubmission {
  id: string;
  testId: string;
  testTitle: string;
  testCategory: TestCategory;
  language?: ProgrammingLanguage;
  studentId: string;
  studentName: string;
  rollNo: string;
  classId: string;
  className: string;
  wpm: number;
  rawWpm: number;
  netWpm: number;
  accuracy: number;
  errors: number;
  backspaces?: number;
  totalKeystrokes?: number;
  totalChars: number;
  correctChars: number;
  timeTaken: number; // seconds
  proctorBlurFlags: number; // tab switches or window unfocused
  passed: boolean;
  history: SubmissionHistoryPoint[];
  timestamp: string;
  status?: 'in_progress' | 'submitted' | 'abandoned' | 'disqualified' | 'reset';
}

export type TestSubmission = TypingSubmission;

export interface StudentCertificate {
  id: string;
  studentId: string;
  studentName: string;
  rollNo: string;
  achievementTitle: string;
  wpm: number;
  accuracy: number;
  testTitle: string;
  issuedAt: string;
  issuingAuthority: string;
  verificationCode: string;
  certificateNumber?: string;
  status?: 'valid' | 'revoked';
}

export interface TestReport {
  id: string;
  testId: string;
  testTitle: string;
  trainerId: string;
  generatedAt: string;
  durationSeconds: number;
  totalAssigned: number;
  totalCompleted: number;
  averageWpm: number;
  averageAccuracy: number;
  highestWpm: number;
  studentResults: {
    studentId: string;
    studentName: string;
    rollNo: string;
    status: 'completed' | 'in-progress' | 'not-attempted';
    wpm?: number;
    rawWpm?: number;
    accuracy?: number;
    errors?: number;
    timeTaken?: number;
    timestamp?: string;
    rank?: number;
  }[];
}

export interface BulkImportResult {
  total: number;
  valid: number;
  duplicates: number;
  invalid: number;
  errors: string[];
}

export type TypingMode = 'time' | 'words' | 'story' | 'code';

// ==========================================
// TYPING ACADEMY (LESSONS & CURRICULUM MODULE)
// ==========================================

export type FingerAssignment =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'thumbs'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export interface KeyFingerGuide {
  key: string;
  finger: FingerAssignment;
  hand: 'left' | 'right' | 'both';
  label: string;
}

export interface GuidedDrill {
  id: string;
  drillNumber: number;
  title: string;
  subtitle: string;
  drillType: 'bigram' | 'words' | 'phrasing';
  targetText: string;
  focusHint: string;
}

export interface AcademyLesson {
  id: string;
  levelId: number;
  order: number;
  title: string;
  subtitle?: string;
  objective: string;
  concept: string;
  keysIntroduced: string[];
  targetFingers: KeyFingerGuide[];
  guidedText: string;
  practiceText: string;
  assessmentText: string;
  drills?: GuidedDrill[]; // 2-3 structured progressive drills
  assessmentDuration: number; // in seconds
  minAccuracy: number; // strictly 95% minimum
  minWpm: number; // e.g. 20 WPM
  prerequisiteLessonId?: string;
  prerequisiteReason?: string;
  isLevelAssessment?: boolean;
}

export interface AcademyLevel {
  id: number;
  title: string;
  tagline: string;
  description: string;
  iconName: string;
  lessons: AcademyLesson[];
  minAccuracy: number;
  minWpm: number;
  prerequisiteLevelId?: number;
}

export interface AcademyCurriculum {
  id: string;
  title: string;
  code: string;
  category: 'university' | 'school' | 'professional' | 'coding';
  description: string;
  levels: AcademyLevel[];
}

export interface StudentLessonAttempt {
  id: string;
  studentId: string;
  lessonId: string;
  levelId: number;
  phase: 'guided' | 'practice' | 'assessment';
  wpm: number;
  rawWpm: number;
  accuracy: number;
  correctChars: number;
  incorrectChars: number;
  totalChars: number;
  errors: number;
  timeTakenSeconds: number;
  passed: boolean;
  mastered: boolean;
  weakKeysDetected: string[];
  timestamp: string;
}

export interface StudentLessonProgress {
  lessonId: string;
  studentId: string;
  status: 'locked' | 'unlocked' | 'in_progress' | 'completed' | 'mastered';
  attemptsCount: number;
  bestWpm: number;
  bestAccuracy: number;
  lastAttemptDate?: string;
  masteredAt?: string;
  lockReason?: string;
  guidedCompleted?: boolean;
  conceptRead?: boolean;
}

export interface StudentAcademyProfile {
  studentId: string;
  curriculumId: string;
  currentLevelId: number;
  currentLessonId: string;
  diagnosticCompleted: boolean;
  diagnosticWpm?: number;
  diagnosticAccuracy?: number;
  diagnosticRecommendedLevel?: number;
  lessonProgress: Record<string, StudentLessonProgress>; // lessonId -> progress
  weakKeysCounter: Record<string, number>; // character -> error count
  totalPracticeSeconds: number;
  streakDays: number;
  certificateEarned?: boolean;
  certificateId?: string;
  trainerOverrideUnlockAll?: boolean;
}

export interface AcademyDiagnosticResult {
  wpm: number;
  accuracy: number;
  errors: number;
  consistency: number;
  recommendedLevelId: number;
  recommendedLevelTitle: string;
  placementMessage: string;
  weakKeys: string[];
  timestamp: string;
}

export interface AcademyAssignment {
  id: string;
  title: string;
  classId: string;
  className: string;
  trainerId: string;
  curriculumId: string;
  levelIds: number[];
  lessonIds?: string[];
  minWpm: number;
  minAccuracy: number;
  startDate: string;
  dueDate: string;
  status: 'active' | 'completed' | 'archived';
  createdAt: string;
}

