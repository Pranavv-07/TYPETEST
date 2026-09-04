import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  Student,
  Trainer,
  ClassRoom,
  TypingTest,
  TypingSubmission,
  StudentCertificate,
  TestReport
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_TRAINERS,
  INITIAL_CLASSES,
  INITIAL_TESTS,
  INITIAL_SUBMISSIONS
} from '../data/initialData';
import { soundController } from '../utils/audio';
import { authenticateCredentials, getSavedSession, clearAuthSession } from '../utils/auth';

interface AppContextType {
  currentUser: User | null;
  students: Student[];
  trainers: Trainer[];
  classes: ClassRoom[];
  tests: TypingTest[];
  submissions: TypingSubmission[];
  certificates: StudentCertificate[];
  reports: TestReport[];
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  login: (identifier: string, pass: string) => { success: boolean; message?: string };
  logout: () => void;
  createClass: (name: string, description?: string) => ClassRoom;
  addStudentsToClass: (classId: string, studentIds: string[]) => void;
  createCustomTest: (testData: Omit<TypingTest, 'id' | 'isPrebuilt'>) => TypingTest;
  updateCustomTest: (testId: string, updatedData: Partial<TypingTest>) => void;
  deleteTest: (testId: string) => void;
  assignTestToClasses: (testId: string, classIds: string[]) => void;
  toggleTestAssignment: (testId: string, classId: string) => void;
  addStudent: (studentData: Omit<Student, 'id' | 'createdAt'>) => Student;
  updateStudent: (studentId: string, updatedData: Partial<Student>) => void;
  deleteStudent: (studentId: string) => void;
  bulkAddStudents: (newStudents: Omit<Student, 'id' | 'createdAt'>[]) => number;
  addTrainer: (trainerData: Omit<Trainer, 'id' | 'createdAt'>) => Trainer;
  updateTrainer: (trainerId: string, updatedData: Partial<Trainer>) => void;
  deleteTrainer: (trainerId: string) => void;
  recordSubmission: (submissionData: Omit<TypingSubmission, 'id' | 'timestamp'>) => TypingSubmission | null;
  resetStudentAttempt: (testId: string, studentId: string) => void;
  generateTestReport: (testId: string) => TestReport;
  deleteReport: (reportId: string) => void;
  getStudentCertificates: (studentId: string) => StudentCertificate[];
  downloadReportCSV: (report: TestReport) => void;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: 'testtype_user_v2',
  STUDENTS: 'testtype_students_v2',
  TRAINERS: 'testtype_trainers_v2',
  CLASSES: 'testtype_classes_v2',
  TESTS: 'testtype_tests_v2',
  SUBMISSIONS: 'testtype_submissions_v2',
  CERTIFICATES: 'testtype_certificates_v2',
  REPORTS: 'testtype_reports_v2',
  SOUND: 'testtype_sound_v2'
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize user from valid authenticated session or storage
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const activeSession = getSavedSession();
      if (activeSession?.user) return activeSession.user;

      const saved = localStorage.getItem(STORAGE_KEYS.USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STUDENTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_STUDENTS;
  });

  const [trainers, setTrainers] = useState<Trainer[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TRAINERS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TRAINERS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CLASSES;
  });

  const [tests, setTests] = useState<TypingTest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TESTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_TESTS;
  });

  const [submissions, setSubmissions] = useState<TypingSubmission[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_SUBMISSIONS;
  });

  const [certificates, setCertificates] = useState<StudentCertificate[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CERTIFICATES);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [reports, setReports] = useState<TestReport[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.REPORTS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOUND);
      return saved !== null ? JSON.parse(saved) : true;
    } catch {
      return true;
    }
  });

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    soundController.enabled = enabled;
    localStorage.setItem(STORAGE_KEYS.SOUND, JSON.stringify(enabled));
  };

  // Sync state to LocalStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.USER);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRAINERS, JSON.stringify(trainers));
  }, [trainers]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  }, [tests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
  }, [submissions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CERTIFICATES, JSON.stringify(certificates));
  }, [certificates]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
  }, [reports]);

  // Unified Institutional Authentication
  const login = (identifier: string, pass: string): { success: boolean; message?: string } => {
    const result = authenticateCredentials(identifier, pass, trainers, students);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      return { success: true };
    }
    return {
      success: false,
      message: result.message || 'Invalid credentials. Please verify your username, roll number, and password.'
    };
  };

  const logout = () => {
    clearAuthSession();
    localStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.clear();
    setCurrentUser(null);
  };

  // Trainer Class Operations
  const createClass = (name: string, description?: string): ClassRoom => {
    const newClass: ClassRoom = {
      id: `class-${Date.now()}`,
      name: name.trim(),
      trainerId: currentUser?.id || 'trn-1',
      description: description?.trim() || '',
      studentIds: [],
      createdAt: new Date().toISOString().split('T')[0]
    };
    setClasses(prev => [newClass, ...prev]);
    return newClass;
  };

  const addStudentsToClass = (classId: string, studentIds: string[]) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id === classId) {
          const combined = Array.from(new Set([...c.studentIds, ...studentIds]));
          return { ...c, studentIds: combined };
        }
        return c;
      })
    );
    // Also update student's classId pointer
    setStudents(prev =>
      prev.map(s => {
        if (studentIds.includes(s.id)) {
          return { ...s, classId };
        }
        return s;
      })
    );
  };

  // Custom Test Assignment & Management Operations
  const createCustomTest = (testData: Omit<TypingTest, 'id' | 'isPrebuilt'>): TypingTest => {
    const newTest: TypingTest = {
      ...testData,
      id: `test-custom-${Date.now()}`,
      isPrebuilt: false,
      createdBy: currentUser?.id || 'trainer',
      createdAt: new Date().toISOString()
    };
    setTests(prev => [newTest, ...prev]);
    return newTest;
  };

  const updateCustomTest = (testId: string, updatedData: Partial<TypingTest>) => {
    setTests(prev =>
      prev.map(t => (t.id === testId ? { ...t, ...updatedData } : t))
    );
  };

  const deleteTest = (testId: string) => {
    setTests(prev => prev.filter(t => t.id !== testId));
  };

  const assignTestToClasses = (testId: string, classIds: string[]) => {
    setTests(prev =>
      prev.map(t => (t.id === testId ? { ...t, assignedClassIds: classIds } : t))
    );
  };

  const toggleTestAssignment = (testId: string, classId: string) => {
    setTests(prev =>
      prev.map(t => {
        if (t.id === testId) {
          const current = t.assignedClassIds || [];
          const exists = current.includes(classId);
          const updated = exists ? current.filter(id => id !== classId) : [...current, classId];
          return { ...t, assignedClassIds: updated };
        }
        return t;
      })
    );
  };

  // Student Directory Operations (Admin & Trainer)
  const addStudent = (studentData: Omit<Student, 'id' | 'createdAt'>): Student => {
    const newStudent: Student = {
      ...studentData,
      id: `std-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setStudents(prev => [newStudent, ...prev]);
    if (newStudent.classId) {
      addStudentsToClass(newStudent.classId, [newStudent.id]);
    }
    return newStudent;
  };

  const updateStudent = (studentId: string, updatedData: Partial<Student>) => {
    setStudents(prev =>
      prev.map(s => {
        if (s.id === studentId) {
          const updated = { ...s, ...updatedData };
          // If class changed, maintain class references
          if (updatedData.classId && updatedData.classId !== s.classId) {
            if (s.classId) {
              setClasses(cls =>
                cls.map(c =>
                  c.id === s.classId
                    ? { ...c, studentIds: c.studentIds.filter(id => id !== studentId) }
                    : c
                )
              );
            }
            addStudentsToClass(updatedData.classId, [studentId]);
          }
          return updated;
        }
        return s;
      })
    );
  };

  const deleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s.id !== studentId));
    // Remove from classes
    setClasses(prev =>
      prev.map(c => ({
        ...c,
        studentIds: c.studentIds.filter(id => id !== studentId)
      }))
    );
    // Remove submissions
    setSubmissions(prev => prev.filter(sub => sub.studentId !== studentId));
  };

  const bulkAddStudents = (newStudentsData: Omit<Student, 'id' | 'createdAt'>[]): number => {
    const created: Student[] = newStudentsData.map((data, idx) => ({
      ...data,
      id: `std-bulk-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString().split('T')[0]
    }));

    setStudents(prev => [...created, ...prev]);

    // Group by class if specified
    created.forEach(s => {
      if (s.classId) {
        addStudentsToClass(s.classId, [s.id]);
      }
    });

    return created.length;
  };

  // Trainer Management (Admin Full Authority)
  const addTrainer = (trainerData: Omit<Trainer, 'id' | 'createdAt'>): Trainer => {
    const newTrainer: Trainer = {
      ...trainerData,
      id: `trn-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTrainers(prev => [...prev, newTrainer]);
    return newTrainer;
  };

  const updateTrainer = (trainerId: string, updatedData: Partial<Trainer>) => {
    setTrainers(prev =>
      prev.map(t => (t.id === trainerId ? { ...t, ...updatedData } : t))
    );
  };

  const deleteTrainer = (trainerId: string) => {
    setTrainers(prev => prev.filter(t => t.id !== trainerId));
  };

  // Reset Student Attempt (Admin / Trainer Override)
  const resetStudentAttempt = (testId: string, studentId: string) => {
    setSubmissions(prev =>
      prev.filter(sub => !(sub.testId === testId && sub.studentId === studentId))
    );
  };

  // Certificate Evaluation Helper
  const checkAndAwardCertificate = (
    sub: TypingSubmission,
    allSubs: TypingSubmission[]
  ) => {
    if (sub.accuracy < 90 || sub.netWpm < 30) return;

    // Determine student's prior submissions
    const priorSubs = allSubs.filter(
      s => s.studentId === sub.studentId && s.id !== sub.id
    );
    const priorMaxWpm = priorSubs.length > 0 ? Math.max(...priorSubs.map(s => s.netWpm)) : 0;

    let milestoneTitle = '';
    if (sub.netWpm >= 100 && priorMaxWpm < 100) {
      milestoneTitle = 'Grandmaster Typist — 100+ WPM Achievement';
    } else if (sub.netWpm >= 80 && priorMaxWpm < 80) {
      milestoneTitle = 'Diamond Speed Typist — 80+ WPM Milestone';
    } else if (sub.netWpm >= 60 && priorMaxWpm < 60) {
      milestoneTitle = 'Gold Speed Typist — 60+ WPM Milestone';
    } else if (sub.netWpm >= 40 && priorMaxWpm < 40) {
      milestoneTitle = 'Silver Proficiency Typist — 40+ WPM Milestone';
    } else if (sub.netWpm > priorMaxWpm && sub.netWpm - priorMaxWpm >= 5) {
      milestoneTitle = `Personal Best Breakthrough — ${sub.netWpm} WPM Excellence`;
    }

    if (!milestoneTitle) return;

    // Check if duplicate certificate exists
    const existing = certificates.find(
      c => c.studentId === sub.studentId && c.achievementTitle === milestoneTitle
    );
    if (existing) return;

    const newCert: StudentCertificate = {
      id: `cert-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      studentId: sub.studentId,
      studentName: sub.studentName,
      rollNo: sub.rollNo,
      achievementTitle: milestoneTitle,
      wpm: sub.netWpm,
      accuracy: sub.accuracy,
      testTitle: sub.testTitle,
      issuedAt: new Date().toISOString().split('T')[0],
      issuingAuthority: 'Dept. of CSE',
      verificationCode: `TT-CSE-${Date.now().toString(36).toUpperCase()}`
    };

    setCertificates(prev => [newCert, ...prev]);
  };

  // Record Typing Submission (Enforces Single Attempt for Custom Tests & Anti-Cheat)
  const recordSubmission = (
    submissionData: Omit<TypingSubmission, 'id' | 'timestamp'>
  ): TypingSubmission | null => {
    // Check if test is a custom assignment
    const targetTest = tests.find(t => t.id === submissionData.testId);
    if (targetTest?.isCustomAssignment) {
      const alreadyAttempted = submissions.some(
        sub => sub.testId === submissionData.testId && sub.studentId === submissionData.studentId
      );
      if (alreadyAttempted) {
        console.warn('Student has already attempted this custom test. Single attempt enforced.');
        return null;
      }
    }

    // Backend anti-cheat sanity check
    if (submissionData.netWpm > 280 && submissionData.timeTaken < 5) {
      console.warn('Suspicious submission flagged for anti-cheat verification.');
    }

    const now = new Date();
    const formattedDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newSubmission: TypingSubmission = {
      ...submissionData,
      id: `sub-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedDate
    };

    const updatedSubmissions = [newSubmission, ...submissions];
    setSubmissions(updatedSubmissions);

    // Evaluate certificate award
    checkAndAwardCertificate(newSubmission, updatedSubmissions);

    return newSubmission;
  };

  // Professional Test Report Generation
  const generateTestReport = (testId: string): TestReport => {
    const test = tests.find(t => t.id === testId);
    const testTitle = test?.title || 'Typing Assessment';
    const testDuration = test?.timeLimit || 60;

    // Gather all assigned students
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

    // Map each assigned student with their result
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

    // Rank completed students by Net WPM desc, then Accuracy desc
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

  const resetAllData = () => {
    localStorage.removeItem(STORAGE_KEYS.STUDENTS);
    localStorage.removeItem(STORAGE_KEYS.TRAINERS);
    localStorage.removeItem(STORAGE_KEYS.CLASSES);
    localStorage.removeItem(STORAGE_KEYS.TESTS);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    localStorage.removeItem(STORAGE_KEYS.CERTIFICATES);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    setStudents(INITIAL_STUDENTS);
    setTrainers(INITIAL_TRAINERS);
    setClasses(INITIAL_CLASSES);
    setTests(INITIAL_TESTS);
    setSubmissions(INITIAL_SUBMISSIONS);
    setCertificates([]);
    setReports([]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        students,
        trainers,
        classes,
        tests,
        submissions,
        certificates,
        reports,
        soundEnabled,
        setSoundEnabled,
        login,
        logout,
        createClass,
        addStudentsToClass,
        createCustomTest,
        updateCustomTest,
        deleteTest,
        assignTestToClasses,
        toggleTestAssignment,
        addStudent,
        updateStudent,
        deleteStudent,
        bulkAddStudents,
        addTrainer,
        updateTrainer,
        deleteTrainer,
        recordSubmission,
        resetStudentAttempt,
        generateTestReport,
        deleteReport,
        getStudentCertificates,
        downloadReportCSV,
        resetAllData
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
