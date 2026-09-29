import { useServerTime } from "../hooks/useServerTime";
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest, StudentCertificate } from '../types';
import { CertificateModal } from './CertificateModal';
import { LeaderboardModal } from './LeaderboardModal';
import { StudentDashboard } from './StudentDashboard';
import { StudentLeaderboard } from './StudentLeaderboard';
import { PerformanceOverTimeChart } from './PerformanceOverTimeChart';
import { getStudentAttemptHistory, calculateStreakFromDates } from '../services/academyService';
import { formatISTDateTime, formatISTDate } from '../utils/dateUtils';
import {
  GraduationCap,
  Play,
  CheckCircle2,
  Clock,
  Code2,
  BookOpen,
  Award,
  AlertTriangle,
  Flame,
  Zap,
  Target,
  Trophy,
  Lock,
  Download,
  Calendar,
  Sparkles,
  Check,
  LayoutDashboard,
  Swords,
  User
} from 'lucide-react';

interface StudentPortalProps {
  onStartAssessment: (test: TypingTest) => void;
  onOpenPractice: () => void;
  onOpenMultiplayer?: () => void;
  onOpenAcademy?: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onStartAssessment,
  onOpenPractice,
  onOpenMultiplayer,
  onOpenAcademy
}) => {
  const { currentUser, classes, tests, submissions, certificates } = useApp();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'assigned' | 'leaderboard' | 'history' | 'certificates'>('dashboard');
  const [selectedCertificate, setSelectedCertificate] = useState<StudentCertificate | null>(null);
  const [selectedLeaderboardTest, setSelectedLeaderboardTest] = useState<TypingTest | null>(null);

  // Enrolled class
  const studentClass = classes.find(c => c.id === currentUser?.classId) || classes[0];

  // Current time for availability checking
  const getServerDate = useServerTime();
  const now = getServerDate();

  // Filter assigned tests:
  // 1. Must be assigned to this student specifically OR their enrolled class
  // 2. Invisible before start time (startAt > now)
  const visibleAssignedTests = tests.filter(t => {
    const isAssignedToStudent =
      (t.assignedStudentIds && currentUser && t.assignedStudentIds.includes(currentUser.id)) ||
      (t.assignedClassIds && studentClass && t.assignedClassIds.includes(studentClass.id));

    if (!isAssignedToStudent) return false;

    if (t.startAt && new Date(t.startAt) > now) {
      return false; // Invisible before start
    }

    return true;
  });

  // Filter submissions by this student
  const studentSubmissions = submissions.filter(
    s =>
      s.studentId === currentUser?.id ||
      (currentUser?.rollNo && s.rollNo && s.rollNo.trim().toUpperCase() === currentUser.rollNo.trim().toUpperCase()) ||
      (currentUser?.username && s.rollNo && s.rollNo.trim().toUpperCase() === currentUser.username.trim().toUpperCase()) ||
      (currentUser?.name && s.studentName && s.studentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  // Filter certificates for this student
  const studentCertificates = certificates.filter(
    c =>
      c.studentId === currentUser?.id ||
      (currentUser?.rollNo && c.rollNo && c.rollNo.trim().toUpperCase() === currentUser.rollNo.trim().toUpperCase()) ||
      (currentUser?.username && c.rollNo && c.rollNo.trim().toUpperCase() === currentUser.username.trim().toUpperCase()) ||
      (currentUser?.name && c.studentName && c.studentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  );

  // Performance calculations
  const bestWpm = studentSubmissions.length > 0
    ? Math.max(...studentSubmissions.map(s => s.netWpm))
    : 0;

  const avgAccuracy = studentSubmissions.length > 0
    ? Math.round(
        (studentSubmissions.reduce((acc, s) => acc + s.accuracy, 0) / studentSubmissions.length) * 10
      ) / 10
    : 100;

  // Daily Streak calculation
  const streakStats = useMemo(() => {
    const dates: string[] = [];
    studentSubmissions.forEach(s => {
      if (s.timestamp) dates.push(s.timestamp);
    });
    if (currentUser?.id) {
      const attempts = getStudentAttemptHistory(currentUser.id);
      attempts.forEach(a => {
        if (a.timestamp) dates.push(a.timestamp);
      });
    }
    return calculateStreakFromDates(dates);
  }, [studentSubmissions, currentUser?.id]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Student Welcome & Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Verified Candidate
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              Roll No: {currentUser?.rollNo || currentUser?.username}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
              <span>{streakStats.currentStreak} Day Streak</span>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">{currentUser?.name}</h1>
          <p className="text-xs text-slate-400">
            Department of Technical Training (DOTT) • <strong className="text-slate-200">{studentClass?.name || 'CSE Alpha (2024-28)'}</strong>
          </p>
        </div>

        {/* Quick Launch Practice */}
        <div className="z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onOpenPractice}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all shadow-md cursor-pointer"
          >
            <Zap className="w-4 h-4 text-emerald-400" />
            <span>Open Practice Arena</span>
          </button>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {/* Daily Streak Card */}
        <div className="bg-gradient-to-br from-orange-500/15 via-slate-900 to-slate-900 border border-orange-500/30 p-4 rounded-2xl relative overflow-hidden shadow-md col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-orange-400 font-bold">
            <span>DAILY STREAK</span>
            <div className="p-1 rounded-lg bg-orange-500/20 text-orange-400">
              <Flame className="w-4 h-4 fill-orange-400 animate-pulse" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-black font-mono text-orange-400">
              {streakStats.currentStreak}
            </span>
            <span className="text-xs text-slate-400 font-mono font-bold">DAYS</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
            {streakStats.practicedToday ? (
              <span className="text-emerald-400 font-medium">✓ Practiced today</span>
            ) : (
              <span className="text-amber-300">Practice today to extend</span>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>ASSIGNED TESTS</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100 mt-1">{visibleAssignedTests.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Active curriculum</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>COMPLETED</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-1">
            {studentSubmissions.length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Recorded submissions</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>BEST SPEED</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mt-1">{bestWpm} <span className="text-xs text-slate-400">WPM</span></div>
          <div className="text-[10px] text-slate-500 mt-0.5">Net verified speed</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>CERTIFICATES</span>
            <Award className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 mt-1">{studentCertificates.length}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Milestone credentials</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 gap-6 text-sm font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'dashboard'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'assigned'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Assigned Tests ({visibleAssignedTests.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'leaderboard'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Leaderboard</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'history'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>History ({studentSubmissions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all cursor-pointer ${
            activeTab === 'certificates'
              ? 'border-emerald-400 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Certificates ({studentCertificates.length})</span>
        </button>
        {onOpenMultiplayer && (
          <button
            onClick={onOpenMultiplayer}
            className="pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all border-transparent text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            <Swords className="w-4 h-4" />
            <span>Multiplayer Arena</span>
          </button>
        )}
      </div>

      <div className="pt-2">
        {activeTab === 'dashboard' && <StudentDashboard onOpenAcademy={onOpenAcademy} />}
        {activeTab === 'leaderboard' && <StudentLeaderboard />}
      </div>

      {/* TAB 1: ASSIGNED ASSESSMENTS */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl text-xs text-slate-300 flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <strong>Trainer Scheduled Tests:</strong> These tests are assigned directly by your faculty. Anti-cheat monitoring is active — copying, pasting, and window switching are audited. Custom tests can be attempted <strong>only once</strong> within their active time window (in IST).
            </div>
          </div>

          {visibleAssignedTests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleAssignedTests.map(test => {
                const previousAttempt = studentSubmissions.find(s => s.testId === test.id);
                const hasCompleted = Boolean(previousAttempt);
                const isExpired = test.endAt && new Date(test.endAt) < now;
                const canStart = !hasCompleted && !isExpired;

                return (
                  <div
                    key={test.id}
                    className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 space-y-4 flex flex-col justify-between transition-all shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-slate-800 text-slate-300">
                            {test.category}
                          </span>
                          {test.isCustomAssignment && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Single Attempt Exam
                            </span>
                          )}
                          {test.language && test.language !== 'none' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-800">
                              {test.language}
                            </span>
                          )}
                        </div>

                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          {test.timeLimit}s limit
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-100">{test.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{test.description || 'Proctored test module.'}</p>

                      {/* Time Window Notice (IST) */}
                      {test.endAt && (
                        <div className="text-[11px] font-mono text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Deadline: {formatISTDateTime(test.endAt)}</span>
                        </div>
                      )}
                    </div>

                    {/* Criteria and Action button */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">Min Accuracy Target:</span>
                        <span className="font-bold text-emerald-400">{test.minAccuracy}%</span>
                      </div>

                      {hasCompleted && previousAttempt && (
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">Attempt Recorded:</span>
                          <span className="text-emerald-400 font-bold">
                            {previousAttempt.netWpm} WPM ({previousAttempt.accuracy}%)
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        {canStart ? (
                          <button
                            onClick={() => onStartAssessment(test)}
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
                          >
                            <Play className="w-4 h-4 fill-current" />
                            <span>Start Test</span>
                          </button>
                        ) : hasCompleted ? (
                          <div className="flex-1 flex items-center gap-2">
                            <div className="flex-1 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 text-emerald-400 border border-slate-700/60 flex items-center justify-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Attempt Submitted</span>
                            </div>
                            <button
                              onClick={() => setSelectedLeaderboardTest(test)}
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Trophy className="w-3.5 h-3.5" />
                              <span>Leaderboard</span>
                            </button>
                          </div>
                        ) : (
                          <div className="w-full py-2.5 rounded-xl font-semibold text-xs bg-slate-800 text-slate-500 text-center flex items-center justify-center gap-1.5">
                            <Lock className="w-3.5 h-3.5" />
                            <span>Test Window Expired</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800 mx-auto flex items-center justify-center text-slate-400">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-200">No Assessments Active Right Now</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No examinations are scheduled right now for your batch. Practice in the Typing Arena or check back during your designated test window.
              </p>
              <button
                onClick={onOpenPractice}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 text-slate-950 hover:bg-emerald-400 cursor-pointer"
              >
                Go to Practice Arena
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUBMISSION HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          <PerformanceOverTimeChart submissions={studentSubmissions} />

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Verified Institutional Attempts Log (IST)
              </h3>
              <span className="text-xs font-mono text-slate-400">{studentSubmissions.length} Tests Logged</span>
            </div>

            {studentSubmissions.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No attempts logged yet. Complete a test in the arena or an assigned test to view your metrics here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Test Title</th>
                      <th className="py-3 px-4 text-right">Net WPM</th>
                      <th className="py-3 px-4 text-right">Gross WPM</th>
                      <th className="py-3 px-4 text-right">Accuracy</th>
                      <th className="py-3 px-4 text-right">Errors</th>
                      <th className="py-3 px-4 text-right">Duration</th>
                      <th className="py-3 px-4 text-right">Timestamp (IST)</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {studentSubmissions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">{sub.testTitle}</td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                          {sub.netWpm}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.grossWpm}</td>
                        <td className="py-3 px-4 text-right font-mono text-amber-400">{sub.accuracy}%</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.errorCount}</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.timeSpentSeconds || 60}s</td>
                        <td className="py-3 px-4 text-right font-mono text-slate-400 text-[11px]">
                          {formatISTDateTime(sub.timestamp)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-3 h-3" /> {sub.passed ? 'PASSED' : 'COMPLETED'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MY CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-slate-300 flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>DOTT Official Credentials:</strong> Certificates are issued by the Department of Technical Training (DOTT), Aditya University with verification signatures from Dr. G Ramu, Dean Technical Trainings.
            </div>
          </div>

          {studentCertificates.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Award className="w-12 h-12 mx-auto text-slate-700" />
              <h3 className="text-base font-bold text-slate-200">No Certificates Awarded Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Push your speed above benchmarks or complete the 7 levels of Typing Academy to earn your institutional credentials!
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {studentCertificates.map(cert => (
                <div
                  key={cert.id}
                  className="bg-slate-900 border border-amber-500/30 rounded-2xl p-6 space-y-4 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      DOTT Credential
                    </span>
                    <span className="text-xs font-mono text-slate-400">{formatISTDate(cert.issuedAt)}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{cert.achievementTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Department of Technical Training (DOTT), Aditya University
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Speed Achieved</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">{cert.wpm} WPM</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500 uppercase font-bold">Accuracy</div>
                      <div className="text-xl font-black text-amber-400 mt-0.5">{cert.accuracy}%</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      Code: {cert.verificationCode}
                    </span>

                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>View & Download</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CERTIFICATE MODAL */}
      {selectedCertificate && (
        <CertificateModal
          certificate={selectedCertificate}
          isOpen={Boolean(selectedCertificate)}
          onClose={() => setSelectedCertificate(null)}
        />
      )}

      {/* LEADERBOARD MODAL */}
      {selectedLeaderboardTest && (
        <LeaderboardModal
          test={selectedLeaderboardTest}
          isOpen={Boolean(selectedLeaderboardTest)}
          onClose={() => setSelectedLeaderboardTest(null)}
        />
      )}
    </div>
  );
};
