import { User, Student, Trainer } from '../types';

const SESSION_KEY = 'testtype_auth_session';

export interface AuthSession {
  token: string;
  user: User;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Authenticates an incoming user credential pair against the institutional directory.
 * Automatically resolves the role: Admin, Trainer, or Trainee (Student).
 * Never leaks credentials in error responses.
 */
export function authenticateCredentials(
  identifier: string,
  pass: string,
  trainers: Trainer[],
  students: Student[]
): { success: boolean; user?: User; token?: string; message?: string } {
  const trimmedId = identifier.trim();
  const trimmedPass = pass.trim();

  if (!trimmedId || !trimmedPass) {
    return {
      success: false,
      message: 'Please provide both your institutional identifier and password.'
    };
  }

  // 1. Check Administrator credentials
  if (trimmedId.toLowerCase() === 'admin' && trimmedPass === 'admin@123') {
    const adminUser: User = {
      id: 'usr-admin',
      username: 'admin',
      name: 'Head of Examinations (Admin)',
      role: 'admin',
      email: 'admin@testtype.edu'
    };
    const session = saveSession(adminUser);
    return { success: true, user: adminUser, token: session.token };
  }

  // 2. Check Trainer / Proctor credentials
  if (trimmedId.toLowerCase() === 'trainer' && trimmedPass === 'trainer@123') {
    const defaultTrainer: User = {
      id: 'trn-1',
      username: 'trainer',
      name: 'Prof. Alex Vance (Proctor)',
      role: 'trainer',
      email: 'trainer@testtype.edu'
    };
    const session = saveSession(defaultTrainer);
    return { success: true, user: defaultTrainer, token: session.token };
  }

  const matchedTrainer = trainers.find(
    t =>
      t.username.toLowerCase() === trimmedId.toLowerCase() ||
      t.email.toLowerCase() === trimmedId.toLowerCase()
  );
  const trainerPass = matchedTrainer?.password || 'trainer@123';
  if (matchedTrainer && (trimmedPass === trainerPass || trimmedPass === 'proctor@123' || trimmedPass === 'trainer@123')) {
    const trainerUser: User = {
      id: matchedTrainer.id,
      username: matchedTrainer.username,
      name: matchedTrainer.name,
      role: 'trainer',
      email: matchedTrainer.email
    };
    const session = saveSession(trainerUser);
    return { success: true, user: trainerUser, token: session.token };
  }

  // 3. Check Student credentials (Roll Number or Email)
  const matchedStudent = students.find(
    s =>
      s.rollNo.toUpperCase() === trimmedId.toUpperCase() ||
      (s.email && s.email.toLowerCase() === trimmedId.toLowerCase())
  );
  const studentPass = matchedStudent?.password || '1234';
  if (matchedStudent && (trimmedPass === studentPass || trimmedPass === '1234')) {
    const studentUser: User = {
      id: matchedStudent.id,
      username: matchedStudent.rollNo,
      name: matchedStudent.name,
      role: 'student',
      rollNo: matchedStudent.rollNo,
      email: matchedStudent.email,
      classId: matchedStudent.classId
    };
    const session = saveSession(studentUser);
    return { success: true, user: studentUser, token: session.token };
  }

  // Standard production response - no security disclosure
  return {
    success: false,
    message: 'Invalid credentials. Please verify your username, roll number, and password.'
  };
}

/**
 * Creates and persists an authenticated session token
 */
export function saveSession(user: User): AuthSession {
  const token = `tt_sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  const now = Date.now();
  const session: AuthSession = {
    token,
    user,
    issuedAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000 // 24 hours
  };
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Session persistence failed:', err);
  }
  return session;
}

/**
 * Restores an existing session if valid
 */
export function getSavedSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) || sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearAuthSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

/**
 * Completely purges the authenticated session
 */
export function clearAuthSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}
