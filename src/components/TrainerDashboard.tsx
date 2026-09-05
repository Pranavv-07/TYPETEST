import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest, TestCategory, ProgrammingLanguage, TestReport, Student } from '../types';
import { LeaderboardModal } from './LeaderboardModal';
import { ReportModal } from './ReportModal';
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
  ExternalLink
} from 'lucide-react';

interface TrainerDashboardProps {
  onLaunchTest?: (test: TypingTest) => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({ onLaunchTest }) => {
  const {
    classes,
    createClass,
    addStudentsToClass,
    students,
    tests,
    createCustomTest,
    deleteTest,
    submissions,
    reports,
    generateTestReport,
    deleteReport,
    resetStudentAttempt,
    downloadReportCSV
  } = useApp();

  const [activeTab, setActiveTab] = useState<'monitoring' | 'tests' | 'reports' | 'classes'>('monitoring');

  // Modal states
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassDesc, setNewClassDesc] = useState('');

  const [selectedClassForStudents, setSelectedClassForStudents] = useState<string | null>(null);
  const [studentSearchTerm, setStudentSearchTerm] = useState('');
  const [manualRosterInput, setManualRosterInput] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  // Custom Test creation state
  const [showCreateTestModal, setShowCreateTestModal] = useState(false);
  const [testTitle, setTestTitle] = useState('');
  const [testCategory, setTestCategory] = useState<TestCategory>('code');
  const [testLang, setTestLang] = useState<ProgrammingLanguage>('python');
  const [testTimeLimit, setTestTimeLimit] = useState(120);
  const [testMinAccuracy, setTestMinAccuracy] = useState(90);
  const [testDescription, setTestDescription] = useState('');
  const [testContent, setTestContent] = useState('');
  const [testAssignedClasses, setTestAssignedClasses] = useState<string[]>([]);
  const [testAssignedStudents, setTestAssignedStudents] = useState<string[]>([]);
  const [testStartAt, setTestStartAt] = useState<string>('');
  const [testEndAt, setTestEndAt] = useState<string>('');
  const [assignMode, setAssignMode] = useState<'classes' | 'individual'>('classes');
  const [studentPickerSearch, setStudentPickerSearch] = useState('');

  // Monitoring filter states
  const [selectedMonitorTestId, setSelectedMonitorTestId] = useState<string>('all');
  const [monitorStatusFilter, setMonitorStatusFilter] = useState<'all' | 'completed' | 'not-attempted'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals for Leaderboard & Reports
  const [selectedLeaderboardTest, setSelectedLeaderboardTest] = useState<TypingTest | null>(null);
  const [selectedViewReport, setSelectedViewReport] = useState<TestReport | null>(null);

  // Class creation
  const handleCreateClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    createClass(newClassName, newClassDesc);
    setNewClassName('');
    setNewClassDesc('');
    setShowCreateClassModal(false);
  };

  // Add students to class
  const handleAddStudentsSubmit = () => {
    if (!selectedClassForStudents) return;

    let toAddIds = [...selectedStudentIds];

    if (manualRosterInput.trim()) {
      const lines = manualRosterInput.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        const matched = students.find(
          s =>
            s.rollNo.toLowerCase() === trimmed.toLowerCase() ||
            s.name.toLowerCase().includes(trimmed.toLowerCase())
        );
        if (matched && !toAddIds.includes(matched.id)) {
          toAddIds.push(matched.id);
        }
      });
    }

    addStudentsToClass(selectedClassForStudents, toAddIds);
    setSelectedClassForStudents(null);
    setSelectedStudentIds([]);
    setManualRosterInput('');
  };

  // Custom Test creation with start/end windows and student assignments
  const handleCreateTestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testTitle.trim() || !testContent.trim()) return;

    // Resolve assigned student IDs
    let resolvedStudentIds = [...testAssignedStudents];
    if (assignMode === 'classes' && testAssignedClasses.length > 0) {
      const classStudents = students
        .filter(s => s.classId && testAssignedClasses.includes(s.classId))
        .map(s => s.id);
      resolvedStudentIds = Array.from(new Set([...resolvedStudentIds, ...classStudents]));
    }

    const created = createCustomTest({
      title: testTitle.trim(),
      category: testCategory,
      language: testCategory === 'code' ? testLang : 'none',
      timeLimit: Number(testTimeLimit),
      minAccuracy: Number(testMinAccuracy),
      description: testDescription.trim(),
      content: testContent.trim(),
      assignedClassIds: testAssignedClasses,
      assignedStudentIds: resolvedStudentIds,
      isCustomAssignment: true,
      startAt: testStartAt || undefined,
      endAt: testEndAt || undefined,
      attemptLimit: 1,
      createdBy: 'trainer'
    });

    // Automatically generate initial report structure
    generateTestReport(created.id);

    setShowCreateTestModal(false);
    setTestTitle('');
    setTestContent('');
    setTestDescription('');
    setTestAssignedClasses([]);
    setTestAssignedStudents([]);
    setTestStartAt('');
    setTestEndAt('');
  };

  // Resolve active candidates for monitoring
  const activeMonitorTest = tests.find(t => t.id === selectedMonitorTestId);

  let targetStudents: Student[] = students;
  if (activeMonitorTest) {
    if (activeMonitorTest.assignedStudentIds && activeMonitorTest.assignedStudentIds.length > 0) {
      targetStudents = students.filter(s => activeMonitorTest.assignedStudentIds?.includes(s.id));
    } else if (activeMonitorTest.assignedClassIds && activeMonitorTest.assignedClassIds.length > 0) {
      targetStudents = students.filter(
        s => s.classId && activeMonitorTest.assignedClassIds.includes(s.classId)
      );
    }
  }

  // Compile monitoring rows
  const monitoringRows = targetStudents.map(std => {
    const studentSub = submissions.find(
      s =>
        (selectedMonitorTestId === 'all' || s.testId === selectedMonitorTestId) &&
        (s.studentId === std.id || s.rollNo.toUpperCase() === std.rollNo.toUpperCase())
    );

    const isCompleted = Boolean(studentSub);
    const status: 'completed' | 'not-attempted' = isCompleted ? 'completed' : 'not-attempted';

    return {
      student: std,
      status,
      submission: studentSub
    };
  });

  // Filter monitoring rows
  const filteredMonitoringRows = monitoringRows.filter(row => {
    if (monitorStatusFilter !== 'all' && row.status !== monitorStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        row.student.name.toLowerCase().includes(q) ||
        row.student.rollNo.toLowerCase().includes(q) ||
        (row.submission && row.submission.testTitle.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const totalAssignedCount = targetStudents.length;
  const totalCompletedCount = monitoringRows.filter(r => r.status === 'completed').length;
  const totalNotAttemptedCount = totalAssignedCount - totalCompletedCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Dashboard Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Proctor & Trainer Command
            </span>
            <span className="text-xs text-slate-400 font-mono">Real-time Supervision Mode</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">Classroom & Testing Hub</h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Create scheduled custom tests, enforce single-attempt windows, monitor real-time candidate scores, and export institutional assessment reports.
          </p>
        </div>

        {/* Action button pills */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateClassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>New Class</span>
          </button>

          <button
            onClick={() => setShowCreateTestModal(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/10"
          >
            <Sparkles className="w-4 h-4" />
            <span>Create Custom Test</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('monitoring')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'monitoring'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Test Monitoring & Results</span>
        </button>

        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'tests'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Custom Tests & Bank ({tests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'reports'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Assessment Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'classes'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Cohorts & Rosters ({classes.length})</span>
        </button>
      </div>

      {/* TAB 1: TEST MONITORING & RESULTS */}
      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Assigned Candidates</div>
                <div className="text-3xl font-black font-mono text-slate-100 mt-1">
                  {totalAssignedCount}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">Enrolled for active assessment</div>
              </div>
              <Users className="w-8 h-8 text-cyan-500/40" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Completed Tests</div>
                <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
                  {totalCompletedCount}
                </div>
                <div className="text-xs text-emerald-500/80 mt-0.5">
                  {totalAssignedCount > 0 ? Math.round((totalCompletedCount / totalAssignedCount) * 100) : 0}% Turnout
                </div>
              </div>
              <CheckCircle2 className="w-8 h-8 text-emerald-500/40" />
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase">Not Attempted</div>
                <div className="text-3xl font-black font-mono text-amber-400 mt-1">
                  {totalNotAttemptedCount}
                </div>
                <div className="text-xs text-amber-500/80 mt-0.5">Awaiting candidate submission</div>
              </div>
              <Clock className="w-8 h-8 text-amber-500/40" />
            </div>
          </div>

          {/* Monitoring Controls Bar */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Filter Test</label>
                <select
                  value={selectedMonitorTestId}
                  onChange={e => setSelectedMonitorTestId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60 max-w-[240px]"
                >
                  <option value="all">All Assessments Combined</option>
                  {tests.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.title} {t.isCustomAssignment ? '(Custom)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase mb-1">Status</label>
                <select
                  value={monitorStatusFilter}
                  onChange={e => setMonitorStatusFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/60"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed Only</option>
                  <option value="not-attempted">Not Attempted Only</option>
                </select>
              </div>

              <div className="relative pt-4">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-7" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search student or roll no..."
                  className="bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 w-52"
                />
              </div>
            </div>

            {activeMonitorTest && (
              <div className="flex items-center gap-2 pt-4">
                <button
                  onClick={() => setSelectedLeaderboardTest(activeMonitorTest)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>View Leaderboard</span>
                </button>

                <button
                  onClick={() => {
                    const rep = generateTestReport(activeMonitorTest.id);
                    setSelectedViewReport(rep);
                  }}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center gap-1.5 transition-colors"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Report</span>
                </button>
              </div>
            )}
          </div>

          {/* Student Performance Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0 z-10 backdrop-blur">
                  <tr>
                    <th className="py-3 px-4">Roll Number</th>
                    <th className="py-3 px-4">Candidate Name</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Net WPM</th>
                    <th className="py-3 px-4 text-right">Raw WPM</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Errors</th>
                    <th className="py-3 px-4 text-right">Duration</th>
                    <th className="py-3 px-4 text-right">Attempt Time</th>
                    <th className="py-3 px-4 text-center">Proctor Flags</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredMonitoringRows.map(row => {
                    const sub = row.submission;

                    return (
                      <tr key={row.student.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                          {row.student.rollNo}
                        </td>

                        <td className="py-3 px-4 font-bold uppercase text-slate-100">
                          {row.student.name}
                        </td>

                        <td className="py-3 px-4">
                          {row.status === 'completed' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Completed</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>Not Attempted</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-100 text-sm">
                          {sub ? sub.netWpm : '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {sub ? sub.rawWpm : '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-300">
                          {sub ? `${sub.accuracy}%` : '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {sub ? sub.errors : '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-400">
                          {sub ? `${sub.timeTaken}s` : '-'}
                        </td>

                        <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                          {sub ? sub.timestamp : '-'}
                        </td>

                        <td className="py-3 px-4 text-center font-mono">
                          {sub && sub.proctorBlurFlags > 0 ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              {sub.proctorBlurFlags} blur
                            </span>
                          ) : (
                            <span className="text-slate-600 text-[10px]">0</span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-center">
                          {sub && activeMonitorTest && (
                            <button
                              onClick={() => {
                                if (confirm(`Reset test attempt for ${row.student.name}? This will allow the student to retake the test once.`)) {
                                  resetStudentAttempt(activeMonitorTest.id, row.student.id);
                                }
                              }}
                              className="px-2 py-1 rounded text-[10px] font-semibold text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition-colors"
                              title="Reset student's attempt to allow retake"
                            >
                              Reset
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEST BANK & CUSTOM ASSIGNMENTS */}
      {activeTab === 'tests' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-400">
              Manage pre-built modules and scheduled custom assessments.
            </div>
            <button
              onClick={() => setShowCreateTestModal(true)}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Custom Test</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {tests.map(test => {
              const testSubmissions = submissions.filter(s => s.testId === test.id);
              const now = new Date();
              const isScheduled = test.startAt && new Date(test.startAt) > now;
              const isExpired = test.endAt && new Date(test.endAt) < now;
              const isActive = (!test.startAt || new Date(test.startAt) <= now) && (!test.endAt || new Date(test.endAt) >= now);

              return (
                <div
                  key={test.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-slate-800 text-slate-300">
                          {test.category}
                        </span>
                        {test.isCustomAssignment && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                            Custom
                          </span>
                        )}
                        {test.language && test.language !== 'none' && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                            {test.language}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 text-xs font-mono">
                        {isScheduled && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30">
                            Scheduled
                          </span>
                        )}
                        {isActive && test.isCustomAssignment && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            Active Window
                          </span>
                        )}
                        {isExpired && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                            Expired
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{test.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{test.description || test.content}</p>

                    {/* Window times if present */}
                    {(test.startAt || test.endAt) && (
                      <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80 space-y-0.5">
                        {test.startAt && <div>Start: <span className="text-slate-200">{test.startAt.replace('T', ' ')}</span></div>}
                        {test.endAt && <div>End: <span className="text-slate-200">{test.endAt.replace('T', ' ')}</span></div>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>{test.timeLimit}s • Target {test.minAccuracy}%</span>
                      <span>{testSubmissions.length} Submissions</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedLeaderboardTest(test)}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Trophy className="w-3.5 h-3.5" />
                        <span>Leaderboard</span>
                      </button>

                      <button
                        onClick={() => {
                          const rep = generateTestReport(test.id);
                          setSelectedViewReport(rep);
                        }}
                        className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Report</span>
                      </button>

                      {test.isCustomAssignment && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete custom test "${test.title}"?`)) {
                              deleteTest(test.id);
                            }
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete test"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: ASSESSMENT REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Institutional Performance Reports
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Saved examination reports with full rankings, accuracy scores, and error breakdowns.
              </p>
            </div>

            <button
              onClick={() => {
                if (tests.length > 0) {
                  const rep = generateTestReport(tests[0].id);
                  setSelectedViewReport(rep);
                }
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Latest Report</span>
            </button>
          </div>

          {reports.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <FileText className="w-10 h-10 mx-auto text-slate-700" />
              <p className="text-sm font-semibold text-slate-300">No Assessment Reports Generated Yet</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Reports are automatically compiled when custom tests conclude, or you can generate a report at any time.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                        Assessment Report
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">{rep.generatedAt}</span>
                    </div>

                    <h3 className="text-base font-bold text-slate-100">{rep.testTitle}</h3>

                    {/* Stats pills */}
                    <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-500">TURNOUT</div>
                        <div className="text-base font-bold text-slate-200 mt-0.5">
                          {rep.totalCompleted}/{rep.totalAssigned}
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-500">AVG SPEED</div>
                        <div className="text-base font-bold text-cyan-400 mt-0.5">
                          {rep.averageWpm} WPM
                        </div>
                      </div>

                      <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800/60">
                        <div className="text-[10px] text-slate-500">ACCURACY</div>
                        <div className="text-base font-bold text-emerald-400 mt-0.5">
                          {rep.averageAccuracy}%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setSelectedViewReport(rep)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Report</span>
                    </button>

                    <button
                      onClick={() => downloadReportCSV(rep)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/40 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export CSV</span>
                    </button>

                    <button
                      onClick={() => deleteReport(rep.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete saved report"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CLASSES & ROSTERS */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-xs text-slate-400">
              Organize student batches into classrooms and assign modular curriculum.
            </div>
            <button
              onClick={() => setShowCreateClassModal(true)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Create Class</span>
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {classes.map(cls => {
              const enrolledStudents = students.filter(s => cls.studentIds.includes(s.id));

              return (
                <div
                  key={cls.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                        {cls.id}
                      </span>
                      <span className="text-xs font-mono text-cyan-400 font-bold">
                        {cls.studentIds.length} Enrolled
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-100">{cls.name}</h3>
                    <p className="text-xs text-slate-400">{cls.description || 'Institutional class cohort.'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-[11px] font-mono text-slate-500">
                      Created: {cls.createdAt}
                    </div>

                    <button
                      onClick={() => {
                        setSelectedClassForStudents(cls.id);
                        setSelectedStudentIds(cls.studentIds);
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5"
                    >
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Manage Roster</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CREATE CUSTOM TEST MODAL (With Scheduling, Windows & Student Assign) */}
      {showCreateTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-bold text-slate-100">Create & Assign Custom Test</h3>
              </div>
              <button
                onClick={() => setShowCreateTestModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTestSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Test Title *</label>
                <input
                  type="text"
                  required
                  value={testTitle}
                  onChange={e => setTestTitle(e.target.value)}
                  placeholder="e.g. CSE 2nd Year Speed Benchmark Exam"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={testCategory}
                    onChange={e => setTestCategory(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                  >
                    <option value="code">Code Snippet</option>
                    <option value="story">Story Passage</option>
                    <option value="standard">Standard Words</option>
                  </select>
                </div>

                {testCategory === 'code' ? (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Language</label>
                    <select
                      value={testLang}
                      onChange={e => setTestLang(e.target.value as any)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      value={testTimeLimit}
                      onChange={e => setTestTimeLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60 font-mono"
                    />
                  </div>
                )}
              </div>

              {testCategory === 'code' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Duration (Seconds)</label>
                    <input
                      type="number"
                      min={10}
                      max={600}
                      value={testTimeLimit}
                      onChange={e => setTestTimeLimit(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Target Accuracy (%)</label>
                    <input
                      type="number"
                      min={50}
                      max={100}
                      value={testMinAccuracy}
                      onChange={e => setTestMinAccuracy(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Start and End Window Configuration */}
              <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-1.5 font-semibold text-cyan-400">
                  <Calendar className="w-4 h-4" />
                  <span>Availability Window & Access Control</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  The test will remain completely invisible to students before the start time, and automatically locks after the end time. Each student can attempt it only once.
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Start Date & Time</label>
                    <input
                      type="datetime-local"
                      value={testStartAt}
                      onChange={e => setTestStartAt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-slate-400 mb-1">End Date & Time</label>
                    <input
                      type="datetime-local"
                      value={testEndAt}
                      onChange={e => setTestEndAt(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyan-500/60"
                    />
                  </div>
                </div>
              </div>

              {/* Assigned Students / Classes */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-300">Assign To:</label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setAssignMode('classes')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        assignMode === 'classes'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      Entire Classes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignMode('individual')}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        assignMode === 'individual'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      Selected Students ({testAssignedStudents.length})
                    </button>
                  </div>
                </div>

                {assignMode === 'classes' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {classes.map(c => {
                      const selected = testAssignedClasses.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            setTestAssignedClasses(prev =>
                              selected ? prev.filter(id => id !== c.id) : [...prev, c.id]
                            );
                          }}
                          className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                            selected
                              ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                              : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <span className="font-semibold">{c.name}</span>
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/80 space-y-2">
                    <input
                      type="text"
                      placeholder="Search students to assign..."
                      value={studentPickerSearch}
                      onChange={e => setStudentPickerSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
                    />
                    <div className="max-h-36 overflow-y-auto space-y-1">
                      {students
                        .filter(
                          s =>
                            s.name.toLowerCase().includes(studentPickerSearch.toLowerCase()) ||
                            s.rollNo.toLowerCase().includes(studentPickerSearch.toLowerCase())
                        )
                        .map(s => {
                          const isAssigned = testAssignedStudents.includes(s.id);
                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                setTestAssignedStudents(prev =>
                                  isAssigned ? prev.filter(id => id !== s.id) : [...prev, s.id]
                                );
                              }}
                              className={`p-1.5 px-2 rounded-lg cursor-pointer flex items-center justify-between text-[11px] ${
                                isAssigned
                                  ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                                  : 'text-slate-400 hover:bg-slate-900'
                              }`}
                            >
                              <span>
                                <strong className="text-slate-200">{s.rollNo}</strong> - {s.name}
                              </span>
                              {isAssigned && <Check className="w-3 h-3 text-cyan-400" />}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Test Content * (The text or code the student must type)
                </label>
                <textarea
                  required
                  rows={4}
                  value={testContent}
                  onChange={e => setTestContent(e.target.value)}
                  placeholder="Paste or type the exact text passage or code block here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 font-mono text-xs focus:outline-none focus:border-cyan-500/60 leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Instructions / Description</label>
                <input
                  type="text"
                  value={testDescription}
                  onChange={e => setTestDescription(e.target.value)}
                  placeholder="Optional brief notes or instructions for candidates..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateTestModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md shadow-cyan-500/20"
                >
                  Create & Lock Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">Create New Class Cohort</h3>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Class Name *</label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={e => setNewClassName(e.target.value)}
                  placeholder="e.g. CSE Gamma (2024-28)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={newClassDesc}
                  onChange={e => setNewClassDesc(e.target.value)}
                  placeholder="e.g. Advanced Data Structures Lab Batch"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Create Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE ROSTER MODAL */}
      {selectedClassForStudents && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-100">
                Manage Roster for {classes.find(c => c.id === selectedClassForStudents)?.name}
              </h3>
              <button
                onClick={() => setSelectedClassForStudents(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Search & Toggle Enrolled Students
                </label>
                <input
                  type="text"
                  value={studentSearchTerm}
                  onChange={e => setStudentSearchTerm(e.target.value)}
                  placeholder="Filter by roll no or name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-cyan-500/60 mb-2"
                />

                <div className="max-h-48 overflow-y-auto border border-slate-800 rounded-xl p-2 bg-slate-950 space-y-1">
                  {students
                    .filter(
                      s =>
                        s.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
                        s.rollNo.toLowerCase().includes(studentSearchTerm.toLowerCase())
                    )
                    .map(s => {
                      const isSelected = selectedStudentIds.includes(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedStudentIds(prev =>
                              isSelected ? prev.filter(id => id !== s.id) : [...prev, s.id]
                            );
                          }}
                          className={`p-2 rounded-lg cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'bg-cyan-500/15 text-cyan-300 font-bold'
                              : 'text-slate-400 hover:bg-slate-900'
                          }`}
                        >
                          <span>
                            <strong className="text-slate-200">{s.rollNo}</strong> - {s.name}
                          </span>
                          {isSelected && <Check className="w-4 h-4 text-cyan-400" />}
                        </div>
                      );
                    })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Or Paste Roll Numbers / Names (one per line)
                </label>
                <textarea
                  rows={3}
                  value={manualRosterInput}
                  onChange={e => setManualRosterInput(e.target.value)}
                  placeholder="24CS001, John Doe&#10;24CS002, Jane Smith"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-slate-100 font-mono text-xs focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedClassForStudents(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-slate-200 bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddStudentsSubmit}
                  className="px-4 py-2 rounded-xl font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950"
                >
                  Save Roster
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {selectedLeaderboardTest && (
        <LeaderboardModal
          test={selectedLeaderboardTest}
          isOpen={Boolean(selectedLeaderboardTest)}
          onClose={() => setSelectedLeaderboardTest(null)}
        />
      )}

      {/* REPORT MODAL */}
      {selectedViewReport && (
        <ReportModal
          report={selectedViewReport}
          isOpen={Boolean(selectedViewReport)}
          onClose={() => setSelectedViewReport(null)}
        />
      )}
    </div>
  );
};
