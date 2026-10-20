import React, { useState, useMemo } from 'react';
import { ClassRoom, Student, TypingSubmission, StudentCertificate, ViolationRecord, TypingTest } from '../../types';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  User,
  Award,
  Activity,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  Target,
  Zap,
  BarChart2,
  BookOpen,
  Lock,
  ExternalLink
} from 'lucide-react';
import { formatISTDate, formatISTDateTime } from '../../utils/dateUtils';
import { StudentAvatar } from '../StudentAvatar';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

interface StudentDetailProfileViewProps {
  student: Student;
  classRoom: ClassRoom;
  studentsInClass: Student[];
  submissions: TypingSubmission[];
  certificates: StudentCertificate[];
  violations: ViolationRecord[];
  tests: TypingTest[];
  onBackToRoster: () => void;
  onSelectStudent: (student: Student) => void;
  onOpenVerification?: (certId: string) => void;
}

export const StudentDetailProfileView: React.FC<StudentDetailProfileViewProps> = ({
  student,
  classRoom,
  studentsInClass,
  submissions,
  certificates,
  violations,
  tests,
  onBackToRoster,
  onSelectStudent,
  onOpenVerification
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'tests' | 'practice' | 'performance' | 'activity' | 'achievements'
  >('overview');

  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('all');

  // Calendar state for Activity tab
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth()); // 0-11
  const [selectedDayStr, setSelectedDayStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Previous / Next student navigation within class
  const studentIndex = useMemo(() => {
    return studentsInClass.findIndex(s => s.id === student.id);
  }, [studentsInClass, student.id]);

  const prevStudent = studentIndex > 0 ? studentsInClass[studentIndex - 1] : null;
  const nextStudent = studentIndex >= 0 && studentIndex < studentsInClass.length - 1 ? studentsInClass[studentIndex + 1] : null;

  // Student specific submissions & certificates & violations
  const studentSubmissions = useMemo(() => {
    return submissions.filter(sub => sub.studentId === student.id);
  }, [submissions, student.id]);

  const formalSubmissions = useMemo(() => {
    return studentSubmissions.filter(sub => !sub.isPractice && sub.netWpm !== undefined);
  }, [studentSubmissions]);

  const practiceSubmissions = useMemo(() => {
    return studentSubmissions.filter(sub => sub.isPractice);
  }, [studentSubmissions]);

  const studentCertificates = useMemo(() => {
    return certificates.filter(c => c.studentId === student.id);
  }, [certificates, student.id]);

  const studentViolations = useMemo(() => {
    return violations.filter(v => v.studentId === student.id);
  }, [violations, student.id]);

  // Date filtering cutoff
  const cutoffTime = useMemo(() => {
    if (dateRange === '7') return Date.now() - 7 * 86400000;
    if (dateRange === '30') return Date.now() - 30 * 86400000;
    if (dateRange === '90') return Date.now() - 90 * 86400000;
    return 0;
  }, [dateRange]);

  const filteredFormalSubs = useMemo(() => {
    if (cutoffTime === 0) return formalSubmissions;
    return formalSubmissions.filter(sub => new Date(sub.timestamp || 0).getTime() >= cutoffTime);
  }, [formalSubmissions, cutoffTime]);

  // Summary Metrics calculations
  const metrics = useMemo(() => {
    const assignedTestsCount = tests.filter(
      t => (t.assignedClassIds || []).includes(classRoom.id) || (t.assignedStudentIds || []).includes(student.id)
    ).length;

    const attemptedCount = new Set(formalSubmissions.map(sub => sub.testId)).size;
    const completedCount = formalSubmissions.filter(sub => sub.passed !== false).length;
    const pendingCount = Math.max(0, assignedTestsCount - attemptedCount);

    const wpms = formalSubmissions.map(sub => sub.netWpm || 0).filter(n => n > 0);
    const accs = formalSubmissions.map(sub => sub.accuracy || 100).filter(n => n > 0);

    const avgWpm = wpms.length > 0 ? Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length) : 0;
    const bestWpm = wpms.length > 0 ? Math.max(...wpms) : 0;
    const avgAccuracy = accs.length > 0 ? Math.round(accs.reduce((a, b) => a + b, 0) / accs.length) : 0;
    const bestAccuracy = accs.length > 0 ? Math.max(...accs) : 0;

    const practiceTimeMinutes = practiceSubmissions.reduce((acc, sub) => acc + Math.round((sub.timeSpentSeconds || 60) / 60), 0);

    let lastActivityTimestamp: string | null = null;
    if (studentSubmissions.length > 0) {
      const sorted = [...studentSubmissions].sort(
        (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
      );
      lastActivityTimestamp = sorted[0].timestamp || null;
    }

    return {
      assignedCount: assignedTestsCount || tests.length,
      attemptedCount,
      completedCount,
      pendingCount,
      practiceSessions: practiceSubmissions.length,
      practiceTimeMinutes,
      avgWpm,
      bestWpm,
      avgAccuracy,
      bestAccuracy,
      certificatesEarned: studentCertificates.length,
      lastActivityTimestamp
    };
  }, [tests, classRoom.id, student.id, formalSubmissions, practiceSubmissions, studentSubmissions, studentCertificates]);

  // Performance Chart Data (Recharts)
  const chartData = useMemo(() => {
    const sorted = [...filteredFormalSubs].sort(
      (a, b) => new Date(a.timestamp || 0).getTime() - new Date(b.timestamp || 0).getTime()
    );

    return sorted.map((sub, idx) => {
      const d = new Date(sub.timestamp || Date.now());
      return {
        index: idx + 1,
        dateLabel: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        netWpm: Number(sub.netWpm) || 0,
        rawWpm: Number(sub.rawWpm) || Number(sub.netWpm) || 0,
        accuracy: Number(sub.accuracy) || 100,
        errors: sub.errorCount ?? sub.errors ?? 0,
        testTitle: sub.testTitle || 'Assessment'
      };
    });
  }, [filteredFormalSubs]);

  // Calendar calculations for Activity tab
  const calendarDays = useMemo(() => {
    const firstDay = new Date(calendarYear, calendarMonth, 1);
    const lastDay = new Date(calendarYear, calendarMonth + 1, 0);
    const startDayOfWeek = firstDay.getDay(); // 0 (Sun) - 6 (Sat)
    const totalDays = lastDay.getDate();

    const days = [];
    // Padding for previous month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push({ dayNum: null, dateStr: null, hasActivity: false, count: 0 });
    }

    for (let d = 1; d <= totalDays; d++) {
      const monthStr = String(calendarMonth + 1).padStart(2, '0');
      const dayStr = String(d).padStart(2, '0');
      const dateStr = `${calendarYear}-${monthStr}-${dayStr}`;

      const daySubs = studentSubmissions.filter(sub => {
        if (!sub.timestamp) return false;
        return sub.timestamp.startsWith(dateStr);
      });

      days.push({
        dayNum: d,
        dateStr,
        hasActivity: daySubs.length > 0,
        count: daySubs.length
      });
    }

    return days;
  }, [calendarYear, calendarMonth, studentSubmissions]);

  const selectedDaySubmissions = useMemo(() => {
    if (!selectedDayStr) return [];
    return studentSubmissions.filter(sub => sub.timestamp && sub.timestamp.startsWith(selectedDayStr));
  }, [studentSubmissions, selectedDayStr]);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <button
                onClick={onBackToRoster}
                className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Class Roster</span>
              </button>
              <span className="text-slate-700">|</span>
              <span className="text-xs font-mono text-slate-400">
                Class: <strong className="text-slate-200">{classRoom.name}</strong> ({classRoom.code || 'COHORT'})
              </span>
            </div>

            <div className="flex items-center gap-4">
              {/* Student Photo / Avatar */}
              <StudentAvatar
                rollNo={student.rollNo}
                name={student.name}
                avatarUrl={student.avatarUrl}
                size="lg"
                rounded="rounded-2xl"
                border={true}
                borderColor="border-cyan-500/40"
              />

              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-slate-100">{student.name}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                    {student.status || 'Active'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                  <span>Roll No: <strong className="text-cyan-400">{student.rollNo}</strong></span>
                  {student.email && (
                    <>
                      <span>·</span>
                      <span>{student.email}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>Last Active: <strong className="text-slate-300">{metrics.lastActivityTimestamp ? formatISTDateTime(metrics.lastActivityTimestamp) : 'No activity'}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Student Navigation Controls (Prev / Next within class) */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            <button
              type="button"
              onClick={() => prevStudent && onSelectStudent(prevStudent)}
              disabled={!prevStudent}
              className={`px-3 py-2 rounded-xl text-xs font-mono transition-all border flex items-center gap-1 ${
                prevStudent
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev Student</span>
            </button>

            <button
              type="button"
              onClick={() => nextStudent && onSelectStudent(nextStudent)}
              disabled={!nextStudent}
              className={`px-3 py-2 rounded-xl text-xs font-mono transition-all border flex items-center gap-1 ${
                nextStudent
                  ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200 cursor-pointer'
                  : 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>Next Student</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Summary Metric Cards (12 Key Metrics) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tests Attempted</div>
            <div className="text-xl font-black font-mono text-cyan-400 mt-1">{metrics.attemptedCount} / {metrics.assignedCount}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Completed Passed</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">{metrics.completedCount}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Average Speed</div>
            <div className="text-xl font-black font-mono text-cyan-400 mt-1">{metrics.avgWpm} <span className="text-xs text-slate-400">WPM</span></div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Best Speed</div>
            <div className="text-xl font-black font-mono text-amber-400 mt-1">{metrics.bestWpm} <span className="text-xs text-slate-400">WPM</span></div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Average Accuracy</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">{metrics.avgAccuracy}%</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Certificates</div>
            <div className="text-xl font-black font-mono text-purple-400 mt-1">{metrics.certificatesEarned}</div>
          </div>
        </div>

        {/* Profile Navigation Tabs (Zero-Pill Discipline, Clean Segmented Controls) */}
        <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold overflow-x-auto pt-2">
          {[
            { id: 'overview', label: 'Overview', icon: User },
            { id: 'tests', label: `Test History (${formalSubmissions.length})`, icon: FileText },
            { id: 'practice', label: `Practice Activity (${practiceSubmissions.length})`, icon: Activity },
            { id: 'performance', label: 'Performance Analytics', icon: TrendingUp },
            { id: 'activity', label: 'Activity Calendar', icon: Calendar },
            { id: 'achievements', label: `Achievements & Certs (${studentCertificates.length})`, icon: Award }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-3 px-1 flex items-center gap-2 border-b-2 whitespace-nowrap text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'border-cyan-400 text-cyan-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Summary & Recent Activity / Highlights */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Performance & Engagement Summary</span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Candidate is enrolled in <strong className="text-slate-200">{classRoom.name}</strong>. Over the training period, they have completed <strong className="text-emerald-400">{metrics.completedCount} formal institutional assessments</strong> with an average typing speed of <strong className="text-cyan-400">{metrics.avgWpm} WPM</strong> at <strong className="text-emerald-400">{metrics.avgAccuracy}% accuracy</strong>.
              </p>

              {/* Recent Tests Preview */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">Recent Assessment Attempts</h4>
                {formalSubmissions.length === 0 ? (
                  <div className="text-xs font-mono text-slate-500 py-3">No institutional assessments attempted yet.</div>
                ) : (
                  <div className="space-y-2">
                    {formalSubmissions.slice(0, 3).map(sub => (
                      <div key={sub.id} className="bg-slate-950 border border-slate-800 p-3 rounded-2xl flex items-center justify-between text-xs font-mono">
                        <div>
                          <div className="font-bold text-slate-200">{sub.testTitle}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{formatISTDateTime(sub.timestamp)}</div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <div className="text-cyan-400 font-bold">{sub.netWpm} WPM</div>
                            <div className="text-emerald-400 text-[10px]">{sub.accuracy}% acc</div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sub.passed !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                            {sub.passed !== false ? 'PASSED' : 'ATTEMPTED'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Violations / Security Log if any */}
            {studentViolations.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-500/40 rounded-3xl p-6 space-y-3 shadow-xl">
                <h3 className="text-base font-bold text-amber-300 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-400" />
                  <span>Proctoring & Security Audit Flags ({studentViolations.length})</span>
                </h3>
                <div className="space-y-2">
                  {studentViolations.map(v => (
                    <div key={v.id} className="bg-slate-950 border border-amber-500/30 p-3 rounded-xl text-xs font-mono flex justify-between items-center">
                      <div>
                        <span className="text-amber-400 font-bold uppercase">{v.violationType.replace('_', ' ')}</span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{v.testTitle || 'Exam Attempt'}</div>
                      </div>
                      <span className="text-slate-400 text-[11px]">{formatISTDateTime(v.timestamp)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Col: Quick Info & Certificates Preview */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-400" />
                <span>Earned Certificates ({studentCertificates.length})</span>
              </h3>
              {studentCertificates.length === 0 ? (
                <div className="text-xs font-mono text-slate-500 py-6 text-center">
                  No verified certificates issued yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentCertificates.map(cert => (
                    <div key={cert.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-xs font-bold text-slate-200">{cert.achievementTitle}</div>
                          <div className="text-[10px] font-mono text-cyan-400 mt-0.5">{cert.id}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 text-[10px] font-mono font-bold">
                          {cert.wpm} WPM
                        </span>
                      </div>
                      {onOpenVerification && (
                        <button
                          onClick={() => onOpenVerification(cert.id)}
                          className="w-full py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Verify Certificate</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TEST HISTORY */}
      {activeTab === 'tests' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <span>Institutional Test History & Attempts ({formalSubmissions.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Authoritative Examination Log</span>
          </div>

          {formalSubmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              This student has not completed any formal institutional test attempts yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Net WPM</th>
                    <th className="py-3 px-4 text-right">Raw WPM</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Errors</th>
                    <th className="py-3 px-4 text-right">Duration</th>
                    <th className="py-3 px-4 text-right">Timestamp (IST)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {formalSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{sub.testTitle}</td>
                      <td className="py-3 px-4 font-mono uppercase text-[10px] text-slate-400">{sub.testCategory || 'standard'}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">{sub.netWpm} WPM</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.rawWpm || sub.netWpm} WPM</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{sub.accuracy}%</td>
                      <td className="py-3 px-4 text-right font-mono text-rose-400">{sub.errorCount ?? sub.errors ?? 0}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.timeSpentSeconds || sub.timeTaken || 60}s</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">{formatISTDateTime(sub.timestamp)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${sub.passed !== false ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
                          {sub.passed !== false ? 'PASSED' : 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PRACTICE ACTIVITY */}
      {activeTab === 'practice' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              <span>Practice Sessions & Drill History ({practiceSubmissions.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Total Practice Time: {metrics.practiceTimeMinutes} mins</span>
          </div>

          {practiceSubmissions.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-mono text-xs">
              No recorded practice sessions or drill attempts found for this student.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Session Title</th>
                    <th className="py-3 px-4 text-right">Net WPM</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Time Spent</th>
                    <th className="py-3 px-4 text-right">Timestamp (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {practiceSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{sub.testTitle}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">{sub.netWpm} WPM</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">{sub.accuracy}%</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.timeSpentSeconds || 60}s</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">{formatISTDateTime(sub.timestamp)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: PERFORMANCE ANALYTICS (RECHARTS) */}
      {activeTab === 'performance' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <span>Typing Speed & Accuracy Over Time</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Chronological progression curves across institutional assessments.</p>
            </div>

            {/* Date filter buttons */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-2xl">
              {(['7', '30', '90', 'all'] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    dateRange === range
                      ? 'bg-cyan-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {range === 'all' ? 'All Time' : `${range}D`}
                </button>
              ))}
            </div>
          </div>

          {chartData.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              Insufficient assessment history to render time-series performance charts.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Chart 1: WPM Progression */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">Net Speed (WPM) Trajectory</h4>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dateLabel" stroke="#64748b" textAnchor="end" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[0, (dataMax: number) => Math.max(80, Math.ceil(dataMax * 1.15))]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        labelStyle={{ color: '#38bdf8', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="netWpm" name="Net WPM" stroke="#22d3ee" strokeWidth={3} dot={{ r: 4, fill: '#22d3ee' }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="rawWpm" name="Raw WPM" stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Accuracy Progression */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">Accuracy Progression (%)</h4>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="dateLabel" stroke="#64748b" fontSize={11} />
                      <YAxis stroke="#64748b" fontSize={11} domain={[70, 100]} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                        labelStyle={{ color: '#34d399', fontWeight: 'bold' }}
                      />
                      <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#34d399" strokeWidth={3} dot={{ r: 4, fill: '#34d399' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: ACTIVITY CALENDAR (TYPING.COM INSPIRED) */}
      {activeTab === 'activity' && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Calendar Left (8 Cols) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-slate-100">
                  Activity Tracker Calendar ({new Date(calendarYear, calendarMonth).toLocaleString('default', { month: 'long', year: 'numeric' })})
                </h3>
              </div>

              {/* Month Navigation */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (calendarMonth === 0) {
                      setCalendarMonth(11);
                      setCalendarYear(y => y - 1);
                    } else {
                      setCalendarMonth(m => m - 1);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (calendarMonth === 11) {
                      setCalendarMonth(0);
                      setCalendarYear(y => y + 1);
                    } else {
                      setCalendarMonth(m => m + 1);
                    }
                  }}
                  className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-cyan-400 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-mono text-slate-500 uppercase">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>

            {/* Calendar Days Grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, idx) => {
                if (!day.dayNum) {
                  return <div key={`empty-${idx}`} className="h-14 sm:h-16 rounded-2xl bg-slate-950/20 border border-transparent" />;
                }

                const isSelected = selectedDayStr === day.dateStr;

                return (
                  <div
                    key={day.dateStr}
                    onClick={() => day.dateStr && setSelectedDayStr(day.dateStr)}
                    className={`h-14 sm:h-16 rounded-2xl p-2 flex flex-col justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/30 ring-2 ring-cyan-500/20'
                        : day.hasActivity
                        ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-400'
                        : 'bg-slate-950 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex justify-between items-center text-xs font-mono">
                      <span className={isSelected ? 'text-cyan-400 font-bold' : 'text-slate-400'}>{day.dayNum}</span>
                      {day.hasActivity && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      )}
                    </div>
                    {day.hasActivity && (
                      <div className="text-[10px] font-mono text-emerald-300 truncate">
                        {day.count} act
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-800 flex items-center gap-6 text-xs font-mono text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-emerald-950 border border-emerald-500/50" />
                <span>Recorded Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-slate-950 border border-slate-800" />
                <span>No Recorded Activity</span>
              </div>
            </div>
          </div>

          {/* Right Col: Selected Day Details Panel (4 Cols) */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Activity on {selectedDayStr}</span>
            </h3>

            {selectedDaySubmissions.length === 0 ? (
              <div className="text-center py-12 text-slate-500 font-mono text-xs">
                No recorded tests or practice sessions on this date.
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {selectedDaySubmissions.map(sub => (
                  <div key={sub.id} className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl space-y-1.5 font-mono text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-200">{sub.testTitle}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${sub.isPractice ? 'bg-purple-500/15 text-purple-300' : 'bg-cyan-500/15 text-cyan-300'}`}>
                        {sub.isPractice ? 'Practice' : 'Exam'}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Speed: <strong className="text-cyan-400">{sub.netWpm} WPM</strong></span>
                      <span>Accuracy: <strong className="text-emerald-400">{sub.accuracy}%</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 6: ACHIEVEMENTS & CERTIFICATES */}
      {activeTab === 'achievements' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <span>Verified Certificates & Achievements ({studentCertificates.length})</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Official Institutional Credentials</span>
          </div>

          {studentCertificates.length === 0 ? (
            <div className="text-center py-16 text-slate-500 font-mono text-xs">
              No official certificates have been issued to this student yet.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {studentCertificates.map(cert => (
                <div key={cert.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-bold text-slate-100">{cert.achievementTitle}</div>
                      <div className="text-xs font-mono text-cyan-400 mt-0.5">Token ID: {cert.id}</div>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-purple-500/15 text-purple-300 text-xs font-mono font-bold">
                      {cert.wpm} WPM
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono py-2 border-t border-b border-slate-800/80 text-slate-400">
                    <div>Accuracy: <strong className="text-emerald-400">{cert.accuracy}%</strong></div>
                    <div>Issued: <strong className="text-slate-200">{formatISTDate(cert.issuedAt)}</strong></div>
                  </div>

                  {onOpenVerification && (
                    <button
                      onClick={() => onOpenVerification(cert.id)}
                      className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono font-bold text-cyan-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Public Verification Portal</span>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
