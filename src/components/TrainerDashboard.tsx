import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  TypingTest,
  TestCategory,
  ProgrammingLanguage,
  TestReport,
  Student,
  StudentCertificate,
  ClassRoom
} from '../types';
import { LeaderboardModal } from './LeaderboardModal';
import { ReportModal } from './ReportModal';
import { CertificateGeneratorModal } from './CertificateGeneratorModal';
import { CertificateModal } from './CertificateModal';
import { TrainerAcademyManagement } from './academy/TrainerAcademyManagement';
import { formatISTDateTime, formatISTDate } from '../utils/dateUtils';
import {
  downloadStudentImportTemplate,
  parseStudentSpreadsheet,
  exportStudentsToExcel,
  exportSubmissionsToExcel,
  ParsedStudentRow
} from '../utils/excelUtils';
import {
  Users,
  Plus,
  BookOpen,
  Code2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  Sparkles,
  Search,
  Filter,
  Eye,
  Check,
  X,
  Play,
  Calendar,
  Clock,
  Trophy,
  RotateCcw,
  FileText,
  ShieldCheck,
  Share2,
  UserCheck,
  ExternalLink,
  Award,
  GraduationCap,
  Upload,
  Edit2,
  Trash2,
  Activity,
  Zap,
  Target,
  Send
} from 'lucide-react';

interface TrainerDashboardProps {
  onLaunchTest?: (test: TypingTest) => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onLaunchTest }) => {
  const {
    currentUser,
    classes,
    createClass,
    addStudentsToClass,
    students,
    addStudent,
    updateStudent,
    deleteStudent,
    bulkAddStudents,
    tests,
    createCustomTest,
    updateCustomTest,
    deleteTest,
    submissions,
    reports,
    certificates,
    addCertificate,
    generateTestReport,
    deleteReport,
    resetStudentAttempt,
    downloadReportCSV
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    'monitoring' | 'testbank' | 'students' | 'classes' | 'reports' | 'certificates' | 'academy'
  >('monitoring');

  // Modals & UI States
  const [selectedLeaderboardTest, setSelectedLeaderboardTest] = useState<TypingTest | null>(null);
  const [selectedViewReport, setSelectedViewReport] = useState<TestReport | null>(null);
  const [selectedViewCert, setSelectedViewCert] = useState<StudentCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [showGenCertModal, setShowGenCertModal] = useState(false);

  // Monitoring Filters
  const [selectedMonitorTestId, setSelectedMonitorTestId] = useState<string>('all');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<'all' | 'completed' | 'not-attempted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Test Bank & Assignment Creation Modal
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [showAssignTestModal, setShowAssignTestModal] = useState<TypingTest | null>(null);
  const [testTitle, setTestTitle] = useState('');
  const [testCategory, setTestCategory] = useState<TestCategory>('code');
  const [testLang, setTestLang] = useState<ProgrammingLanguage>('python');
  const [testDifficulty, setTestDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [testTimeLimit, setTestTimeLimit] = useState(120);
  const [testMinAccuracy, setTestMinAccuracy] = useState(90);
  const [testDescription, setTestDescription] = useState('');
  const [testContent, setTestContent] = useState('');
  const [testBankSearch, setTestBankSearch] = useState('');

  // Assignment Scheduling Dialog
  const [assignTargetClassIds, setAssignTargetClassIds] = useState<string[]>([]);
  const [assignStartAt, setAssignStartAt] = useState('');
  const [assignEndAt, setAssignEndAt] = useState('');
  const [assignDuration, setAssignDuration] = useState(120);

  // Student Management & Excel Import
  const [studentSearch, setStudentSearch] = useState('');
  const [studentClassFilter, setStudentClassFilter] = useState('all');
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [newRollNo, setNewRollNo] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newClassId, setNewClassId] = useState(classes[0]?.id || '');
  const [newPassword, setNewPassword] = useState('1234');

  // Excel Bulk Import Modal
  const [showExcelImportModal, setShowExcelImportModal] = useState(false);
  const [parsedRows, setParsedRows] = useState<ParsedStudentRow[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importErrorMsg, setImportErrorMsg] = useState('');

  // Class Management Modal
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');

  // Handle Save to Test Bank
  const handleSaveToTestBank = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testContent.trim()) return;

    createCustomTest({
      title: testTitle.trim(),
      category: testCategory,
      language: testCategory === 'code' ? testLang : 'none',
      difficulty: testDifficulty,
      timeLimit: Number(testTimeLimit),
      minAccuracy: Number(testMinAccuracy),
      description: testDescription.trim(),
      content: testContent.trim(),
      assignedClassIds: [],
      assignedStudentIds: [],
      isCustomAssignment: true,
      createdBy: currentUser?.id || 'trainer'
    });

    setShowCreateTestModal(false);
    setTestTitle('');
    setTestContent('');
    setTestDescription('');
  };

  // Handle Assigning a Saved Test to Batches
  const handleConfirmAssignTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignTestModal) return;

    updateCustomTest(showAssignTestModal.id, {
      assignedClassIds: assignTargetClassIds,
      timeLimit: Number(assignDuration),
      startAt: assignStartAt ? new Date(assignStartAt).toISOString() : undefined,
      endAt: assignEndAt ? new Date(assignEndAt).toISOString() : undefined
    });

    generateTestReport(showAssignTestModal.id);
    setShowAssignTestModal(null);
    setAssignTargetClassIds([]);
    setAssignStartAt('');
    setAssignEndAt('');
  };

  // Handle Add Single Student
  const handleAddStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRollNo.trim() || !newName.trim()) return;

    addStudent({
      rollNo: newRollNo.trim().toUpperCase(),
      name: newName.trim(),
      email: newEmail.trim() || `${newRollNo.trim().toLowerCase()}@aditya.ac.in`,
      classId: newClassId,
      batch: 'Batch 2024-28',
      status: 'active',
      password: newPassword.trim() || '1234'
    });

    setShowAddStudentModal(false);
    setNewRollNo('');
    setNewName('');
    setNewEmail('');
    setNewPassword('1234');
  };

  // Handle Edit Student
  const handleEditStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    updateStudent(editingStudent.id, {
      rollNo: editingStudent.rollNo,
      name: editingStudent.name,
      email: editingStudent.email,
      classId: editingStudent.classId,
      status: editingStudent.status,
      password: editingStudent.password
    });

    setEditingStudent(null);
  };

  // Handle Excel Upload
  const handleExcelFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setImportErrorMsg('');
    setImportSuccessMsg('');

    try {
      const result = await parseStudentSpreadsheet(file);
      setParsedRows(result.rows);
    } catch (err: any) {
      setImportErrorMsg('Failed to parse Excel file. Please ensure it follows the template.');
    } finally {
      setIsParsingExcel(false);
    }
  };

  // Commit Parsed Excel Students to Database
  const handleCommitExcelImport = async () => {
    const validRows = parsedRows.filter(r => r.isValid);
    if (validRows.length === 0) return;

    const toImport = validRows.map(r => ({
      rollNo: r.rollNo,
      name: r.name,
      email: r.email,
      classId: classes[0]?.id || '',
      batch: r.batch,
      status: r.status,
      password: r.password || '1234'
    }));

    try {
      await bulkAddStudents(toImport);
      setImportSuccessMsg(`Successfully imported ${toImport.length} students into the database!`);
      setTimeout(() => {
        setShowExcelImportModal(false);
        setParsedRows([]);
        setImportSuccessMsg('');
      }, 1500);
    } catch (err: any) {
      setImportErrorMsg(err.message || 'Failed to save imported students.');
    }
  };

  // Class Creation
  const handleCreateClassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClass(newClassName.trim(), newClassDesc.trim());
    setShowCreateClassModal(false);
    setNewClassName('');
    setNewClassDesc('');
  };

  // Monitoring Rows
  const activeMonitorTest = tests.find(t => t.id === selectedMonitorTestId);
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      if (studentClassFilter !== 'all' && s.classId !== studentClassFilter) return false;
      if (studentSearch.trim()) {
        const q = studentSearch.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q);
      }
      return true;
    });
  }, [students, studentClassFilter, studentSearch]);

  const monitoringRows = useMemo(() => {
    let targetStudents = students;
    if (activeMonitorTest) {
      if (activeMonitorTest.assignedClassIds && activeMonitorTest.assignedClassIds.length > 0) {
        targetStudents = students.filter(
          s => s.classId && activeMonitorTest.assignedClassIds.includes(s.classId)
        );
      }
    }

    return targetStudents.map(std => {
      const studentSub = submissions.find(
        s =>
          (selectedMonitorTestId === 'all' || s.testId === selectedMonitorTestId) &&
          (s.studentId === std.id ||
            s.rollNo?.toUpperCase() === std.rollNo.toUpperCase() ||
            s.studentUsername?.toUpperCase() === std.rollNo.toUpperCase())
      );
      return {
        student: std,
        status: studentSub ? ('completed' as const) : ('not-attempted' as const),
        submission: studentSub
      };
    });
  }, [students, activeMonitorTest, submissions, selectedMonitorTestId]);

  const filteredMonitoringRows = useMemo(() => {
    return monitoringRows.filter(row => {
      if (monitorStatusFilter !== 'all' && row.status !== monitorStatusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          row.student.name.toLowerCase().includes(q) ||
          row.student.rollNo.toLowerCase().includes(q) ||
          (row.submission && row.submission.testTitle?.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [monitoringRows, monitorStatusFilter, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Department of Technical Training
            </span>
            <span className="text-xs text-slate-400 font-mono">DOTT Aditya University</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">Faculty Examination Portal</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Create test banks, assign timed assessments on-demand in IST, import students via Excel, and monitor candidate speed metrics in real-time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <button
            onClick={() => setShowExcelImportModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel Student Import</span>
          </button>

          <button
            onClick={() => setShowCreateTestModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Test (Saved Bank)</span>
          </button>
        </div>

        <div className="absolute -right-16 -top-16 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'monitoring'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Live Examination Monitoring</span>
        </button>

        <button
          onClick={() => setActiveTab('testbank')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'testbank'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Saved Test Bank ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'students'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Students & Excel CRUD ({students.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'classes'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Classes ({classes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'reports'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Submissions & Reports ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('academy')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'academy'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-amber-400/80 hover:text-amber-300'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-400" />
          <span>Academy Assignments</span>
        </button>
      </div>

      {/* TAB 1: LIVE EXAMINATION MONITORING */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-mono text-slate-400 uppercase">Assigned Candidates</div>
              <div className="text-3xl font-black text-slate-100 mt-1">{monitoringRows.length}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-mono text-emerald-400 uppercase">Completed Attempts</div>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                {monitoringRows.filter(r => r.status === 'completed').length}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-mono text-amber-400 uppercase">Pending Submissions</div>
              <div className="text-3xl font-black text-amber-400 mt-1">
                {monitoringRows.filter(r => r.status === 'not-attempted').length}
              </div>
            </div>
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-sm">
              <div className="text-xs font-mono text-emerald-400 uppercase">Average Cohort WPM</div>
              <div className="text-3xl font-black text-emerald-400 mt-1">
                {submissions.length > 0
                  ? Math.round(submissions.reduce((a, b) => a + b.netWpm, 0) / submissions.length)
                  : 0}
              </div>
            </div>
          </div>

          {/* Monitoring Controls */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedMonitorTestId}
                onChange={e => setSelectedMonitorTestId(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Assessments</option>
                {tests.map(t => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.category})
                  </option>
                ))}
              </select>

              <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1 text-xs">
                <button
                  onClick={() => setMonitorStatusFilter('all')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    monitorStatusFilter === 'all'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setMonitorStatusFilter('completed')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    monitorStatusFilter === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Completed
                </button>
                <button
                  onClick={() => setMonitorStatusFilter('not-attempted')}
                  className={`px-3 py-1 rounded-lg font-semibold transition-colors cursor-pointer ${
                    monitorStatusFilter === 'not-attempted'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pending
                </button>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate or roll..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Candidate Monitoring Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4 text-right">Net WPM</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Submitted At (IST)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredMonitoringRows.map(row => (
                    <tr key={row.student.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {row.student.rollNo}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{row.student.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">
                        {classes.find(c => c.id === row.student.classId)?.name || 'CSE Alpha'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        {row.submission ? `${row.submission.netWpm} WPM` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {row.submission ? `${row.submission.accuracy}%` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                        {row.submission ? formatISTDateTime(row.submission.timestamp) : 'Not Started'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {row.status === 'completed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> Submitted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-400 border border-slate-700">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {row.submission && (
                          <button
                            onClick={() =>
                              resetStudentAttempt(
                                row.submission!.testId,
                                row.student.id,
                                'Reset requested by faculty mentor'
                              )
                            }
                            title="Reset attempt for re-take"
                            className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono transition-colors cursor-pointer"
                          >
                            Reset Attempt
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED TEST BANK & ON-DEMAND ASSIGNMENT */}
      {activeTab === 'testbank' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Faculty Saved Test Bank</h2>
              <p className="text-xs text-slate-400">
                Create and stockpile custom typing exams in advance. Whenever needed, click "Assign to Students" to launch with custom IST start and due times.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCreateTestModal(true)}
                className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Test</span>
              </button>
            </div>
          </div>

          {/* Test Bank Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tests.map(test => {
              const assignedClassNames = (test.assignedClassIds || [])
                .map(cId => classes.find(c => c.id === cId)?.name)
                .filter(Boolean);

              const isAssigned = (test.assignedClassIds && test.assignedClassIds.length > 0) || (test.assignedStudentIds && test.assignedStudentIds.length > 0);

              return (
                <div
                  key={test.id}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl p-6 flex flex-col justify-between gap-4 shadow-xl transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-slate-800 text-slate-300">
                        {test.category}
                      </span>
                      <span className="text-xs font-mono text-slate-400">{test.timeLimit}s limit</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{test.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">
                      {test.description || 'Pre-saved institutional examination passage.'}
                    </p>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Min Accuracy:</span>
                        <span className="text-emerald-400 font-bold">{test.minAccuracy}%</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Assignment Status:</span>
                        <span className={`font-bold ${isAssigned ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isAssigned ? `Active (${assignedClassNames.length || 1} Batch)` : 'Saved in Bank (Unassigned)'}
                        </span>
                      </div>
                      {test.endAt && (
                        <div className="text-[10px] text-amber-300">
                          Deadline (IST): {formatISTDateTime(test.endAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setShowAssignTestModal(test);
                        setAssignTargetClassIds(test.assignedClassIds || []);
                        setAssignDuration(test.timeLimit || 120);
                      }}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAssigned ? 'Re-Assign / Edit' : 'Assign to Batches'}</span>
                    </button>

                    <button
                      onClick={() => deleteTest(test.id)}
                      title="Delete Test"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors border border-slate-700 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: STUDENTS & EXCEL CRUD */}
      {activeTab === 'students' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Student Directory & Database Management</h2>
              <p className="text-xs text-slate-400">
                Manage candidate enrollments, passwords, and batch assignments. Upload or download full rosters via Excel (.xlsx).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => downloadStudentImportTemplate('xlsx')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download Excel Template</span>
              </button>

              <button
                onClick={() => exportStudentsToExcel(students)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Export Students (.xlsx)</span>
              </button>

              <button
                onClick={() => setShowAddStudentModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Student</span>
              </button>
            </div>
          </div>

          {/* Student Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={studentClassFilter}
                onChange={e => setStudentClassFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-200 rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Classes & Sections</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search roll number or name..."
                value={studentSearch}
                onChange={e => setStudentSearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredStudents.map(std => (
                    <tr key={std.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">{std.rollNo}</td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{std.name}</td>
                      <td className="py-3 px-4 font-mono text-slate-400">{std.email || '—'}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {classes.find(c => c.id === std.classId)?.name || 'CSE Alpha'}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-400">{std.password || '1234'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          {std.status || 'active'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => setEditingStudent(std)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteStudent(std.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLASSES */}
      {activeTab === 'classes' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Academic Cohorts & Sections</h2>
              <p className="text-xs text-slate-400">Manage class sections and assigned mentor faculty.</p>
            </div>
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Class</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {classes.map(cls => {
              const enrolledStudents = students.filter(s => s.classId === cls.id);
              return (
                <div
                  key={cls.id}
                  className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      Active Section
                    </span>
                    <span className="text-xs font-mono text-slate-400">{enrolledStudents.length} Students</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-100">{cls.name}</h3>
                  <p className="text-xs text-slate-400">{cls.description || 'Department section'}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: SUBMISSIONS & REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div>
              <h2 className="text-lg font-bold text-slate-100">Official Submissions Report Log (IST)</h2>
              <p className="text-xs text-slate-400">
                Authoritative examination records with net speed, gross speed, accuracy, and proctoring audit log.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => exportSubmissionsToExcel(submissions)}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Export Submissions (.xlsx)</span>
              </button>
            </div>
          </div>

          {/* Submissions Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4 text-right">Net WPM</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Timestamp (IST)</th>
                    <th className="py-3 px-4 text-center">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {submissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        {sub.rollNo || sub.studentUsername || '—'}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-200">{sub.studentName || '—'}</td>
                      <td className="py-3 px-4 text-slate-300">{sub.testTitle}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                        {sub.netWpm} WPM
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-amber-400">
                        {sub.accuracy}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                        {formatISTDateTime(sub.timestamp)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          PASSED
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: ACADEMY ASSIGNMENTS */}
      {activeTab === 'academy' && (
        <TrainerAcademyManagement
          classes={classes}
          students={students}
          trainerId={currentUser?.id || 'trn-1'}
          onOpenCertificateModal={() => setShowGenCertModal(true)}
        />
      )}

      {/* MODAL 1: CREATE TEST BANK ITEM */}
      {showCreateTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <Code2 className="w-5 h-5 text-emerald-400" />
                Create New Test (Saved Test Bank)
              </h2>
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveToTestBank} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Test Title</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder="e.g. Python: Hash Map Indexing & Two Sum"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={testCategory}
                    onChange={e => setTestCategory(e.target.value as TestCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="code">Coding Assessment</option>
                    <option value="story">Contextual Story Passage</option>
                    <option value="standard">Standard Speed Benchmark</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Programming Language
                  </label>
                  <select
                    disabled={testCategory !== 'code'}
                    value={testLang}
                    onChange={e => setTestLang(e.target.value as ProgrammingLanguage)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono disabled:opacity-50"
                  >
                    <option value="python">Python</option>
                    <option value="javascript">JavaScript</option>
                    <option value="java">Java</option>
                    <option value="cpp">C++</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Default Time Limit (Seconds)
                  </label>
                  <input
                    type="number"
                    min={15}
                    max={600}
                    value={testTimeLimit}
                    onChange={e => setTestTimeLimit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Minimum Target Accuracy (%)
                  </label>
                  <input
                    type="number"
                    min={70}
                    max={100}
                    value={testMinAccuracy}
                    onChange={e => setTestMinAccuracy(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={testDescription}
                  onChange={e => setTestDescription(e.target.value)}
                  placeholder="Objective or algorithm concept summary..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Passage / Code Content
                </label>
                <textarea
                  required
                  rows={6}
                  value={testContent}
                  onChange={e => setTestContent(e.target.value)}
                  placeholder="Enter the exact passage or code snippet for examinees to type..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Save to Test Bank
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ASSIGN TEST TO BATCHES DIALOG */}
      {showAssignTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-slate-100">Assign Test to Batches</h2>
                <p className="text-xs text-emerald-400 font-mono">{showAssignTestModal.title}</p>
              </div>
              <button
                onClick={() => setShowAssignTestModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAssignTest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Select Target Classes / Sections
                </label>
                <div className="space-y-2 max-h-36 overflow-y-auto p-3 bg-slate-950 rounded-2xl border border-slate-800">
                  {classes.map(cls => {
                    const isChecked = assignTargetClassIds.includes(cls.id);
                    return (
                      <label
                        key={cls.id}
                        className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer select-none"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setAssignTargetClassIds(assignTargetClassIds.filter(id => id !== cls.id));
                            } else {
                              setAssignTargetClassIds([...assignTargetClassIds, cls.id]);
                            }
                          }}
                          className="rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500"
                        />
                        <span>{cls.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <label className="block font-sans text-xs font-semibold text-slate-300 mb-1">
                    Start Window (IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={assignStartAt}
                    onChange={e => setAssignStartAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block font-sans text-xs font-semibold text-slate-300 mb-1">
                    Deadline (IST)
                  </label>
                  <input
                    type="datetime-local"
                    value={assignEndAt}
                    onChange={e => setAssignEndAt(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Test Duration (Seconds per attempt)
                </label>
                <input
                  type="number"
                  min={15}
                  max={600}
                  value={assignDuration}
                  onChange={e => setAssignDuration(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAssignTestModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Confirm & Activate Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: EXCEL BULK IMPORT MODAL */}
      {showExcelImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                Bulk Student Import via Excel (.xlsx / .csv)
              </h2>
              <button
                onClick={() => {
                  setShowExcelImportModal(false);
                  setParsedRows([]);
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-slate-300 flex items-center justify-between">
                <div>
                  <strong>Need the format?</strong> Download the sample Excel template with pre-filled headers and sample rows.
                </div>
                <button
                  onClick={() => downloadStudentImportTemplate('xlsx')}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow"
                >
                  Download Template
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Upload Excel or CSV File
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleExcelFileUpload}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3 text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500 file:text-slate-950 cursor-pointer"
                />
              </div>

              {importErrorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  {importErrorMsg}
                </div>
              )}

              {importSuccessMsg && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                  {importSuccessMsg}
                </div>
              )}

              {/* Parsed Rows Preview Table */}
              {parsedRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">
                      Parsed Preview: {parsedRows.length} Rows (Valid: {parsedRows.filter(r => r.isValid).length})
                    </span>
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 max-h-56 overflow-y-auto p-2">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="text-[10px] font-mono text-slate-400 uppercase border-b border-slate-800">
                        <tr>
                          <th className="py-2 px-3">Roll No</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Batch</th>
                          <th className="py-2 px-3 text-center">Valid</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                        {parsedRows.map((r, idx) => (
                          <tr key={idx} className={r.isValid ? '' : 'bg-rose-500/10'}>
                            <td className="py-1.5 px-3 font-bold text-emerald-400">{r.rollNo}</td>
                            <td className="py-1.5 px-3 text-slate-200">{r.name}</td>
                            <td className="py-1.5 px-3 text-slate-400">{r.email}</td>
                            <td className="py-1.5 px-3 text-slate-400">{r.batch}</td>
                            <td className="py-1.5 px-3 text-center">
                              {r.isValid ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 inline" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-rose-400 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleCommitExcelImport}
                    className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-emerald-500/20"
                  >
                    Commit & Save {parsedRows.filter(r => r.isValid).length} Students to Database
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD SINGLE STUDENT */}
      {showAddStudentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">Add Student Examinee</h2>
              <button
                onClick={() => setShowAddStudentModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 24B11CS355"
                  value={newRollNo}
                  onChange={e => setNewRollNo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono uppercase focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pranav Vedula"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Class Section</label>
                <select
                  value={newClassId}
                  onChange={e => setNewClassId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-100 focus:border-emerald-500 font-mono"
                >
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddStudentModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: EDIT STUDENT */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">Edit Student Record</h2>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={editingStudent.rollNo}
                  onChange={e => setEditingStudent({ ...editingStudent, rollNo: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editingStudent.name}
                  onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
                <input
                  type="text"
                  value={editingStudent.password || '1234'}
                  onChange={e => setEditingStudent({ ...editingStudent, password: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: CREATE CLASS */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-lg font-bold text-slate-100">Create Academic Section</h2>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClassSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Section Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Section A (2024-28)"
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Department & Track Details..."
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CERTIFICATE GENERATOR MODAL */}
      {showGenCertModal && (
        <CertificateGeneratorModal
          onClose={() => setShowGenCertModal(false)}
          students={students}
          onGenerate={cert => {
            addCertificate(cert);
            setSelectedViewCert(cert);
            setIsCertModalOpen(true);
          }}
        />
      )}

      {/* VIEW CERTIFICATE MODAL */}
      {selectedViewCert && (
        <CertificateModal
          certificate={selectedViewCert}
          isOpen={isCertModalOpen}
          onClose={() => {
            setIsCertModalOpen(false);
            setSelectedViewCert(null);
          }}
        />
      )}
    </div>
  );
};
