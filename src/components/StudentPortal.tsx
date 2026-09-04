import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest, StudentCertificate } from '../types';
import { CertificateModal } from './CertificateModal';
import { LeaderboardModal } from './LeaderboardModal';
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
  Check
} from 'lucide-react';

interface StudentPortalProps {
  onStartAssessment: (test: TypingTest) => void;
  onOpenPractice: () => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  onStartAssessment,
  onOpenPractice
}) => {
  const { currentUser, classes, tests, submissions, certificates } = useApp();
  const [activeTab, setActiveTab] = useState<'assigned' | 'history' | 'certificates'>('assigned');
  const [selectedCertificate, setSelectedCertificate] = useState<StudentCertificate | null>(null);
  const [selectedLeaderboardTest, setSelectedLeaderboardTest] = useState<TypingTest | null>(null);

  // Enrolled class
  const studentClass = classes.find(c => c.id === currentUser?.classId) || classes[0];

  // Current time for availability checking
  const now = new Date();

  // Filter assigned tests:
  // 1. Must be assigned to this student specifically OR their enrolled class
  // 2. Invisible before start time (startAt > now)
  // 3. Visible during startAt <= now <= endAt
  const visibleAssignedTests = tests.filter(t => {
    // Check assignment
    const isAssignedToStudent =
      (t.assignedStudentIds && currentUser && t.assignedStudentIds.includes(currentUser.id)) ||
      (t.assignedClassIds && studentClass && t.assignedClassIds.includes(studentClass.id));

    if (!isAssignedToStudent) return false;

    // Visibility window check:
    // "The test should be completely invisible to students before the start time."
    if (t.startAt && new Date(t.startAt) > now) {
      return false; // Invisible before start
    }

    return true;
  });

  // Filter submissions by this student
  const studentSubmissions = submissions.filter(
    s =>
      s.studentId === currentUser?.id ||
      s.rollNo.toUpperCase() === (currentUser?.rollNo || '').toUpperCase()
  );

  // Filter certificates for this student
  const studentCertificates = certificates.filter(
    c =>
      c.studentId === currentUser?.id ||
      c.rollNo.toUpperCase() === (currentUser?.rollNo || '').toUpperCase()
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

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Student Welcome & Profile Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Verified Candidate
            </span>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Roll No: {currentUser?.rollNo || currentUser?.username}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100">{currentUser?.name}</h1>
          <p className="text-xs text-slate-400">
            Enrolled in <strong className="text-slate-200">{studentClass?.name}</strong> • Mentor: Prof. Alex Vance
          </p>
        </div>

        {/* Quick Launch Practice */}
        <div className="z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onOpenPractice}
            className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-extrabold text-xs bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 transition-all shadow-md"
          >
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>Open Free Practice Arena</span>
          </button>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>ASSIGNED TESTS</span>
            <Target className="w-4 h-4 text-cyan-400" />
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
            <Flame className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-3xl font-black font-mono text-cyan-400 mt-1">{bestWpm} <span className="text-xs text-slate-400">WPM</span></div>
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
          onClick={() => setActiveTab('assigned')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'assigned'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-4 h-4" />
          <span>Assigned Assessments ({visibleAssignedTests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'history'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Target className="w-4 h-4" />
          <span>My Performance History ({studentSubmissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('certificates')}
          className={`pb-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'certificates'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>My Certificates ({studentCertificates.length})</span>
        </button>
      </div>

      {/* TAB 1: ASSIGNED ASSESSMENTS */}
      {activeTab === 'assigned' && (
        <div className="space-y-4">
          <div className="p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl text-xs text-slate-300 flex items-start gap-3">
            <GraduationCap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <strong>Trainer Proctor Rule:</strong> These tests are scheduled directly by your trainer. Anti-cheat monitoring is active — copying, pasting, and tab switching are strictly audited. Custom tests can be attempted <strong>only once</strong> within their active time window.
            </div>
          </div>

          {visibleAssignedTests.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {visibleAssignedTests.map(test => {
                const previousAttempt = studentSubmissions.find(s => s.testId === test.id);
                const hasCompleted = Boolean(previousAttempt);

                // Window expiry check
                const isExpired = test.endAt && new Date(test.endAt) < now;

                // Cannot take if already attempted or if expired
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
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              Single Attempt Exam
                            </span>
                          )}
                          {test.language && test.language !== 'none' && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
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

                      {/* Time Window Notice */}
                      {test.endAt && (
                        <div className="text-[11px] font-mono text-amber-300/80 bg-amber-500/5 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-amber-400" />
                          <span>Deadline: {test.endAt.replace('T', ' ')}</span>
                        </div>
                      )}
                    </div>

                    {/* Criteria and Action button */}
                    <div className="space-y-3 pt-3 border-t border-slate-800">
                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-500">Min Accuracy Target:</span>
                        <span className="font-bold text-cyan-400">{test.minAccuracy}%</span>
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
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/10"
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
                              className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 flex items-center gap-1.5 transition-colors"
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
                No assessments are currently active for your cohort. Check back during your scheduled test window or practice in the arena.
              </p>
              <button
                onClick={onOpenPractice}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                Go to Practice Arena
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY SUBMISSION HISTORY */}
      {activeTab === 'history' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Verified Institutional Attempts Log
            </h3>
            <span className="text-xs font-mono text-slate-400">{studentSubmissions.length} Tests Logged</span>
          </div>

          {studentSubmissions.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs">
              No attempts logged yet. Complete a practice or assigned test to view your speed metrics here.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Test Title</th>
                    <th className="py-3 px-4 text-right">Net WPM</th>
                    <th className="py-3 px-4 text-right">Raw WPM</th>
                    <th className="py-3 px-4 text-right">Accuracy</th>
                    <th className="py-3 px-4 text-right">Errors</th>
                    <th className="py-3 px-4 text-right">Duration</th>
                    <th className="py-3 px-4 text-right">Timestamp</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {studentSubmissions.map(sub => (
                    <tr key={sub.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-200">{sub.testTitle}</td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400 text-sm">
                        {sub.netWpm}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.rawWpm}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">{sub.accuracy}%</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.errors}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">{sub.timeTaken}s</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-500 text-[11px]">
                        {sub.timestamp}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" /> Passed
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

      {/* TAB 3: MY CERTIFICATES */}
      {activeTab === 'certificates' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-xs text-slate-300 flex items-start gap-3">
            <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Speed Milestone Credentials:</strong> Certificates are automatically awarded upon achieving new speed benchmarks and verified test scores. You can view, verify, and print or download your certificate anytime.
            </div>
          </div>

          {studentCertificates.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center space-y-3">
              <Award className="w-12 h-12 mx-auto text-slate-700" />
              <h3 className="text-base font-bold text-slate-200">No Certificates Awarded Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Push your speed above 40 WPM, 60 WPM, 80 WPM, or complete custom assessments with top accuracy to earn your institutional credentials!
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
                      Official Certificate
                    </span>
                    <span className="text-xs font-mono text-slate-400">{cert.awardedAt}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100">{cert.achievementTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1">{cert.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2 text-xs font-mono">
                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500">SPEED ACHIEVED</div>
                      <div className="text-xl font-black text-amber-300 mt-0.5">{cert.wpm} WPM</div>
                    </div>

                    <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                      <div className="text-[10px] text-slate-500">PRECISION ACCURACY</div>
                      <div className="text-xl font-black text-emerald-400 mt-0.5">{cert.accuracy}%</div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] font-mono text-slate-500">
                      ID: {cert.certificateNumber}
                    </span>

                    <button
                      onClick={() => setSelectedCertificate(cert)}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition-colors flex items-center gap-1.5"
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
