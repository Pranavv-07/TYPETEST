export type UserRole = 'admin' | 'trainer' | 'student';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  rollNo?: string;
  email?: string;
  classId?: string;
}

export interface Student {
  id: string;
  rollNo: string;
  name: string;
  email?: string;
  password?: string; // Optional custom password, defaults to '1234'
  classId?: string;
  batch?: string;
  createdAt: string;
}

export interface Trainer {
  id: string;
  username: string;
  name: string;
  email: string;
  password?: string; // Optional custom password, defaults to 'trainer@123'
  assignedClasses: string[];
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  trainerId: string;
  description?: string;
  studentIds: string[];
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
  createdAt?: string;
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
}

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

export type TypingMode = 'time' | 'words' | 'story' | 'code';
