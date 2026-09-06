import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import {
  User,
  Student,
  Trainer,
  ClassRoom,
  TypingTest,
  TypingSubmission,
  StudentCertificate,
  TestReport,
  Department,
  Batch,
  AdminUser,
  ViolationRecord,
  AuditLogEntry
} from '../types';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  authenticateWithDatabase,
  fetchDepartments,
  createDepartment as apiCreateDept,
  updateDepartment as apiUpdateDept,
  deleteDepartment as apiDeleteDept,
  fetchBatches,
  createBatch as apiCreateBatch,
  updateBatch as apiUpdateBatch,
  deleteBatch as apiDeleteBatch,
  fetchClasses,
  createClass as apiCreateClass,
  updateClass as apiUpdateClass,
  deleteClass as apiDeleteClass,
  fetchStudents,
  createStudent as apiCreateStudent,
  updateStudent as apiUpdateStudent,
  deleteStudent as apiDeleteStudent,
  bulkImportStudents,
  fetchTrainers,
  createTrainer as apiCreateTrainer,
  updateTrainer as apiUpdateTrainer,
  deleteTrainer as apiDeleteTrainer,
  fetchTests,
  createTest as apiCreateTest,
  updateTest as apiUpdateTest,
  deleteTest as apiDeleteTest,
  fetchSubmissions,
  resetStudentAttemptAtomic,
  fetchViolations,
  fetchCertificates,
  fetchAuditLogs,
  recordAuditLog,
  fetchAdmins,
  createAdminUser,
  startTestAttemptAtomic,
  checkpointAttempt as apiCheckpointAttempt,
  recordViolation as apiRecordViolation,
  submitTestAttemptAtomic
} from '../services/supabaseService';
import { soundController } from '../utils/audio';

interface AppContextType {
  currentUser: User | null;
  departments: Department[];
  batches: Batch[];
  classes: ClassRoom[];
  students: Student[];
  trainers: Trainer[];
  admins: AdminUser[];
  tests: TypingTest[];
  submissions: TypingSubmission[];
  certificates: StudentCertificate[];
  violations: ViolationRecord[];
  auditLogs: AuditLogEntry[];
  reports: TestReport[];
  soundEnabled: boolean;
  isLoading: boolean;
  isDatabaseConnected: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  refreshData: () => Promise<void>;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  // Departments
  createDepartment: (dept: Omit<Department, 'id' | 'createdAt'>) => Promise<Department>;
  updateDepartment: (id: string, updates: Partial<Department>) => Promise<void>;
  deleteDepartment: (id: string) => Promise<void>;
  // Batches
  createBatch: (batch: Omit<Batch, 'id' | 'createdAt'>) => Promise<Batch>;
  updateBatch: (id: string, updates: Partial<Batch>) => Promise<void>;
  deleteBatch: (id: string) => Promise<void>;
  // Classes
  createClass: (name: string, description?: string, deptId?: string, batchId?: string) => Promise<ClassRoom>;
  updateClass: (id: string, updates: Partial<ClassRoom>) => Promise<void>;
  deleteClass: (id: string) => Promise<void>;
  addStudentsToClass: (classId: string, studentIds: string[]) => Promise<void>;
  // Students
  addStudent: (studentData: Omit<Student, 'id' | 'createdAt'>) => Promise<Student>;
  updateStudent: (studentId: string, updatedData: Partial<Student>) => Promise<void>;
  deleteStudent: (studentId: string) => Promise<void>;
  bulkAddStudents: (newStudents: Omit<Student, 'id' | 'createdAt'>[]) => Promise<number>;
  // Trainers
  addTrainer: (trainerData: Omit<Trainer, 'id' | 'createdAt'>) => Promise<Trainer>;
  updateTrainer: (trainerId: string, updatedData: Partial<Trainer>) => Promise<void>;
  deleteTrainer: (trainerId: string) => Promise<void>;
  // Admins
  addAdmin: (adminData: Omit<AdminUser, 'id' | 'createdAt'>) => Promise<AdminUser>;
  // Tests
  createCustomTest: (testData: Omit<TypingTest, 'id' | 'isPrebuilt'>) => Promise<TypingTest>;
  updateCustomTest: (testId: string, updatedData: Partial<TypingTest>) => Promise<void>;
  deleteTest: (testId: string) => Promise<void>;
  assignTestToClasses: (testId: string, classIds: string[]) => Promise<void>;
  toggleTestAssignment: (testId: string, classId: string) => Promise<void>;
  // Submissions & Attempts
  recordSubmission: (submissionData: Omit<TypingSubmission, 'id' | 'timestamp'>) => Promise<TypingSubmission | null>;
  startAttempt: (testId: string, studentId: string) => Promise<{ success: boolean; attempt?: any; message?: string }>;
  checkpoint: (attemptId: string, metrics: any) => Promise<boolean>;
  logViolation: (attemptId: string, studentId: string, violationType: ViolationRecord['violationType'], meta?: any) => Promise<void>;
  submitAttempt: (attemptId: string, submissionData: Omit<TypingSubmission, 'id' | 'timestamp'>) => Promise<{ success: boolean; submission?: TypingSubmission; certificate?: StudentCertificate; message?: string }>;
  resetStudentAttempt: (testId: string, studentId: string, reason?: string) => Promise<void>;
  // Reports & Certificates
  generateTestReport: (testId: string) => TestReport;
  deleteReport: (reportId: string) => void;
  getStudentCertificates: (studentId: string) => StudentCertificate[];
  downloadReportCSV: (report: TestReport) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const USER_SESSION_KEY = 'testtype_session_user';
const SOUND_KEY = 'testtype_sound_v2';

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const isDatabaseConnected = isSupabaseConfigured();

  // Active user in session
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = sessionStorage.getItem(USER_SESSION_KEY) || localStorage.getItem(USER_SESSION_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  // Institutional data collections backed by Supabase
  const [departments, setDepartments] = useState<Department[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [tests, setTests] = useState<TypingTest[]>([]);
  const [submissions, setSubmissions] = useState<TypingSubmission[]>([]);
  const [certificates, setCertificates] = useState<StudentCertificate[]>([]);
  const [violations, setViolations] = useState<ViolationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [reports, setReports] = useState<TestReport[]>([]);

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(SOUND_KEY);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundController.enabled = enabled;
    localStorage.setItem(SOUND_KEY, JSON.stringify(enabled));
  };

  // Synchronize active session user
  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
      localStorage.setItem(USER_SESSION_KEY, JSON.stringify(currentUser));
    } else {
      sessionStorage.removeItem(USER_SESSION_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
    }
  }, [currentUser]);

  // Load authoritative institutional dataset from Supabase / Service
  const refreshData = useCallback(async () => {
    try {
      const [
        deptsData,
        batchesData,
        classesData,
        studentsData,
        trainersData,
        adminsData,
        testsData,
        subsData,
        certsData,
        violsData,
        logsData
      ] = await Promise.all([
        fetchDepartments(),
        fetchBatches(),
        fetchClasses(),
        fetchStudents(),
        fetchTrainers(),
        fetchAdmins(),
        fetchTests(),
        fetchSubmissions(),
        fetchCertificates(),
        fetchViolations(),
        fetchAuditLogs()
      ]);

      setDepartments(deptsData);
      setBatches(batchesData);
      setClasses(classesData);
      setStudents(studentsData);
      setTrainers(trainersData);
      setAdmins(adminsData);
      setTests(testsData);
      setSubmissions(subsData);
      setCertificates(certsData);
      setViolations(violsData);
      setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load institutional records:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Supabase Realtime Subscriptions (For live proctoring and examiner dashboards)
  useEffect(() => {
    if (!isDatabaseConnected) return;

    const channel = supabase
      .channel('public:institutional_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts' }, () => {
        fetchSubmissions().then(setSubmissions);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'violations' }, () => {
        fetchViolations().then(setViolations);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tests' }, () => {
        fetchTests().then(setTests);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isDatabaseConnected]);

  // ==========================================================================
  // AUTHENTICATION
  // ==========================================================================
  const login = async (identifier: string, pass: string): Promise<{ success: boolean; message?: string }> => {
    const res = await authenticateWithDatabase(identifier, pass);
    if (res.success && res.user) {
      setCurrentUser(res.user);
      return { success: true };
    }
    return {
      success: false,
      message: res.message || 'Invalid username or password.'
    };
  };

  const logout = () => {
    sessionStorage.removeItem(USER_SESSION_KEY);
    localStorage.removeItem(USER_SESSION_KEY);
    setCurrentUser(null);
  };

  // ==========================================================================
  // DEPARTMENTS
  // ==========================================================================
  const createDepartment = async (dept: Omit<Department, 'id' | 'createdAt'>): Promise<Department> => {
    const created = await apiCreateDept(dept);
    setDepartments(prev => [...prev, created]);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Admin',
      action: 'CREATE_DEPARTMENT',
      entityType: 'department',
      entityId: created.id,
      details: { code: created.code, name: created.name }
    });
    return created;
  };

  const updateDepartment = async (id: string, updates: Partial<Department>) => {
    await apiUpdateDept(id, updates);
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDepartment = async (id: string) => {
    await apiDeleteDept(id);
    setDepartments(prev => prev.filter(d => d.id !== id));
  };

  // ==========================================================================
  // BATCHES
  // ==========================================================================
  const createBatch = async (batch: Omit<Batch, 'id' | 'createdAt'>): Promise<Batch> => {
    const created = await apiCreateBatch(batch);
    setBatches(prev => [created, ...prev]);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Admin',
      action: 'CREATE_BATCH',
      entityType: 'batch',
      entityId: created.id,
      details: { name: created.name, batchYear: created.batchYear }
    });
    return created;
  };

  const updateBatch = async (id: string, updates: Partial<Batch>) => {
    await apiUpdateBatch(id, updates);
    setBatches(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBatch = async (id: string) => {
    await apiDeleteBatch(id);
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  // ==========================================================================
  // CLASSES
  // ==========================================================================
  const createClass = async (
    name: string,
    description?: string,
    deptId?: string,
    batchId?: string
  ): Promise<ClassRoom> => {
    const created = await apiCreateClass({
      name,
      description,
      departmentId: deptId,
      batchId,
      trainerId: currentUser?.id || '',
      studentIds: [],
      status: 'active'
    });
    setClasses(prev => [created, ...prev]);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Admin',
      action: 'CREATE_CLASS',
      entityType: 'class',
      entityId: created.id,
      details: { name, code: created.code }
    });
    return created;
  };

  const updateClass = async (id: string, updates: Partial<ClassRoom>) => {
    await apiUpdateClass(id, updates);
    setClasses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteClass = async (id: string) => {
    await apiDeleteClass(id);
    setClasses(prev => prev.filter(c => c.id !== id));
  };

  const addStudentsToClass = async (classId: string, studentIds: string[]) => {
    // Update students in state & database
    for (const sId of studentIds) {
      await apiUpdateStudent(sId, { classId });
    }
    setStudents(prev =>
      prev.map(s => studentIds.includes(s.id) ? { ...s, classId } : s)
    );
    setClasses(prev =>
      prev.map(c => {
        if (c.id === classId) {
          const combined = Array.from(new Set([...c.studentIds, ...studentIds]));
          return { ...c, studentIds: combined };
        }
        return c;
      })
    );
  };

  // ==========================================================================
  // STUDENTS
  // ==========================================================================
  const addStudent = async (studentData: Omit<Student, 'id' | 'createdAt'>): Promise<Student> => {
    const created = await apiCreateStudent(studentData);
    setStudents(prev => [created, ...prev]);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Admin',
      action: 'CREATE_STUDENT',
      entityType: 'student',
      entityId: created.id,
      details: { rollNo: created.rollNo, name: created.name }
    });
    return created;
  };

  const updateStudent = async (studentId: string, updatedData: Partial<Student>) => {
    await apiUpdateStudent(studentId, updatedData);
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, ...updatedData } : s));
  };

  const deleteStudent = async (studentId: string) => {
    await apiDeleteStudent(studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
  };

  const bulkAddStudents = async (newStudentsData: Omit<Student, 'id' | 'createdAt'>[]): Promise<number> => {
    const res = await bulkImportStudents(newStudentsData);
    if (res.valid === 0 && res.errors.length > 0) {
      throw new Error(res.errors[0]);
    }
    const reloaded = await fetchStudents();
    setStudents(reloaded);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Admin',
      action: 'BULK_IMPORT_STUDENTS',
      entityType: 'student',
      details: { totalImported: res.valid, duplicates: res.duplicates }
    });
    return res.valid;
  };

  // ==========================================================================
  // TRAINERS
  // ==========================================================================
  const addTrainer = async (trainerData: Omit<Trainer, 'id' | 'createdAt'>): Promise<Trainer> => {
    const created = await apiCreateTrainer(trainerData);
    setTrainers(prev => [...prev, created]);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Admin',
      action: 'CREATE_TRAINER',
      entityType: 'trainer',
      entityId: created.id,
      details: { username: created.username, name: created.name }
    });
    return created;
  };

  const updateTrainer = async (trainerId: string, updatedData: Partial<Trainer>) => {
    await apiUpdateTrainer(trainerId, updatedData);
    setTrainers(prev => prev.map(t => t.id === trainerId ? { ...t, ...updatedData } : t));
  };

  const deleteTrainer = async (trainerId: string) => {
    await apiDeleteTrainer(trainerId);
    setTrainers(prev => prev.filter(t => t.id !== trainerId));
  };

  // ==========================================================================
  // ADMINS
  // ==========================================================================
  const addAdmin = async (adminData: Omit<AdminUser, 'id' | 'createdAt'>): Promise<AdminUser> => {
    const created = await createAdminUser(adminData);
    setAdmins(prev => [...prev, created]);
    return created;
  };

  // ==========================================================================
  // TESTS & ASSIGNMENTS
  // ==========================================================================
  const createCustomTest = async (testData: Omit<TypingTest, 'id' | 'isPrebuilt'>): Promise<TypingTest> => {
    const created = await apiCreateTest(testData);
    setTests(prev => [created, ...prev]);
    recordAuditLog({
      adminId: currentUser?.id,
      adminName: currentUser?.name || 'Trainer',
      action: 'CREATE_TEST',
      entityType: 'test',
      entityId: created.id,
      details: { title: created.title, category: created.category }
    });
    return created;
  };

  const updateCustomTest = async (testId: string, updatedData: Partial<TypingTest>) => {
    await apiUpdateTest(testId, updatedData);
    setTests(prev => prev.map(t => t.id === testId ? { ...t, ...updatedData } : t));
  };

  const deleteTest = async (testId: string) => {
    await apiDeleteTest(testId);
    setTests(prev => prev.filter(t => t.id !== testId));
  };

  const assignTestToClasses = async (testId: string, classIds: string[]) => {
    await apiUpdateTest(testId, { assignedClassIds: classIds });
    setTests(prev => prev.map(t => t.id === testId ? { ...t, assignedClassIds: classIds } : t));
  };

  const toggleTestAssignment = async (testId: string, classId: string) => {
    const test = tests.find(t => t.id === testId);
    if (!test) return;
    const current = test.assignedClassIds || [];
    const exists = current.includes(classId);
    const updated = exists ? current.filter(id => id !== classId) : [...current, classId];
    await assignTestToClasses(testId, updated);
  };

  // ==========================================================================
  // ATTEMPTS & SUBMISSIONS
  // ==========================================================================
  const startAttempt = async (testId: string, studentId: string) => {
    return await startTestAttemptAtomic(testId, studentId);
  };

  const checkpoint = async (attemptId: string, metrics: any) => {
    return await apiCheckpointAttempt(attemptId, metrics);
  };

  const logViolation = async (
    attemptId: string,
    studentId: string,
    violationType: ViolationRecord['violationType'],
    meta?: any
  ) => {
    await apiRecordViolation(attemptId, studentId, violationType, meta);
  };

  const submitAttempt = async (
    attemptId: string,
    submissionData: Omit<TypingSubmission, 'id' | 'timestamp'>
  ) => {
    let finalAttemptId = attemptId;
    if (!finalAttemptId && currentUser) {
      try {
        const { getOrCreatePracticeTest } = await import('../services/supabaseService');
        const pId = await getOrCreatePracticeTest(submissionData.testCategory || 'standard');
        const startRes = await startTestAttemptAtomic(pId, currentUser.id);
        if (startRes.attempt) {
          finalAttemptId = startRes.attempt.id;
        }
      } catch (err) {
        console.error('Failed to create practice attempt', err);
      }
    }
    const res = await submitTestAttemptAtomic(finalAttemptId, submissionData);
    if (res.submission) {
      setSubmissions(prev => [res.submission!, ...prev]);
    }
    if (res.certificate) {
      setCertificates(prev => [res.certificate!, ...prev]);
    }
    return res;
  };

  const recordSubmission = async (
    submissionData: Omit<TypingSubmission, 'id' | 'timestamp'>
  ): Promise<TypingSubmission | null> => {
    const res = await submitAttempt('', submissionData);
    return res.submission || null;
  };

  const resetStudentAttempt = async (testId: string, studentId: string, reason: string = 'Authorized re-examination') => {
    await resetStudentAttemptAtomic(
      testId,
      studentId,
      currentUser?.id || 'admin',
      currentUser?.name || 'Administrator',
      reason
    );
    setSubmissions(prev => prev.filter(s => !(s.testId === testId && s.studentId === studentId)));
  };

  // ==========================================================================
  // REPORTS & CERTIFICATES
  // ==========================================================================
  const generateTestReport = (testId: string): TestReport => {
    const test = tests.find(t => t.id === testId);
    const testTitle = test?.title || 'Typing Assessment';
    const testDuration = test?.timeLimit || 120;

    let assignedStudentList: Student[] = [];
    if (test?.assignedStudentIds && test.assignedStudentIds.length > 0) {
      assignedStudentList = students.filter(s => test.assignedStudentIds?.includes(s.id));
    } else if (test?.assignedClassIds && test.assignedClassIds.length > 0) {
      const classStudentIds = classes
        .filter(c => test.assignedClassIds.includes(c.id))
        .flatMap(c => c.studentIds);
      assignedStudentList = students.filter(s => classStudentIds.includes(s.id));
    } else {
      assignedStudentList = students;
    }

    const testSubmissions = submissions.filter(s => s.testId === testId);

    const studentResults: TestReport['studentResults'] = assignedStudentList.map(std => {
      const sub = testSubmissions.find(s => s.studentId === std.id);
      if (sub) {
        return {
          rank: undefined,
          studentId: std.id,
          studentName: std.name,
          rollNo: std.rollNo,
          status: 'completed',
          wpm: sub.netWpm,
          rawWpm: sub.rawWpm,
          accuracy: sub.accuracy,
          errors: sub.errors,
          timeTaken: sub.timeTaken,
          timestamp: sub.timestamp
        };
      }
      return {
        rank: undefined,
        studentId: std.id,
        studentName: std.name,
        rollNo: std.rollNo,
        status: 'not-attempted'
      };
    });

    const completedStudents = studentResults
      .filter(r => r.status === 'completed')
      .sort((a, b) => (b.wpm || 0) - (a.wpm || 0) || (b.accuracy || 0) - (a.accuracy || 0));

    completedStudents.forEach((st, idx) => {
      st.rank = idx + 1;
    });

    const totalAssigned = assignedStudentList.length;
    const totalCompleted = completedStudents.length;
    const avgWpm =
      totalCompleted > 0
        ? Math.round(
            completedStudents.reduce((acc, curr) => acc + (curr.wpm || 0), 0) / totalCompleted
          )
        : 0;
    const avgAccuracy =
      totalCompleted > 0
        ? Math.round(
            (completedStudents.reduce((acc, curr) => acc + (curr.accuracy || 0), 0) /
              totalCompleted) *
              10
          ) / 10
        : 0;
    const highestWpm = completedStudents.length > 0 ? completedStudents[0].wpm || 0 : 0;

    const report: TestReport = {
      id: `rep-${testId}-${Date.now()}`,
      testId,
      testTitle,
      trainerId: currentUser?.id || 'trainer',
      generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      durationSeconds: testDuration,
      totalAssigned,
      totalCompleted,
      averageWpm: avgWpm,
      averageAccuracy: avgAccuracy,
      highestWpm,
      studentResults
    };

    setReports(prev => [report, ...prev.filter(r => r.testId !== testId)]);
    return report;
  };

  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
  };

  const getStudentCertificates = (studentId: string): StudentCertificate[] => {
    return certificates.filter(c => c.studentId === studentId);
  };

  const downloadReportCSV = (report: TestReport) => {
    const headers = [
      'Rank',
      'Roll No',
      'Student Name',
      'Status',
      'Net WPM',
      'Raw WPM',
      'Accuracy (%)',
      'Errors',
      'Time Taken (s)',
      'Submission Timestamp'
    ];

    const rows = report.studentResults.map(r => [
      r.rank ? String(r.rank) : '-',
      `"${r.rollNo}"`,
      `"${r.studentName}"`,
      r.status,
      r.wpm !== undefined ? String(r.wpm) : '-',
      r.rawWpm !== undefined ? String(r.rawWpm) : '-',
      r.accuracy !== undefined ? `${r.accuracy}%` : '-',
      r.errors !== undefined ? String(r.errors) : '-',
      r.timeTaken !== undefined ? String(r.timeTaken) : '-',
      r.timestamp ? `"${r.timestamp}"` : '-'
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `TestReport_${report.testTitle.replace(/\s+/g, '_')}_${report.testId}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        departments,
        batches,
        classes,
        students,
        trainers,
        admins,
        tests,
        submissions,
        certificates,
        violations,
        auditLogs,
        reports,
        soundEnabled,
        isLoading,
        isDatabaseConnected,
        setSoundEnabled,
        refreshData,
        login,
        logout,
        createDepartment,
        updateDepartment,
        deleteDepartment,
        createBatch,
        updateBatch,
        deleteBatch,
        createClass,
        updateClass,
        deleteClass,
        addStudentsToClass,
        addStudent,
        updateStudent,
        deleteStudent,
        bulkAddStudents,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        addAdmin,
        createCustomTest,
        updateCustomTest,
        deleteTest,
        assignTestToClasses,
        toggleTestAssignment,
        recordSubmission,
        startAttempt,
        checkpoint,
        logViolation,
        submitAttempt,
        resetStudentAttempt,
        generateTestReport,
        deleteReport,
        getStudentCertificates,
        downloadReportCSV
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
