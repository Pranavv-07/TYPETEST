import React, { useState, useMemo } from 'react';
import { ClassRoom, Student, TypingSubmission, StudentCertificate } from '../../types';
import {
  ArrowLeft,
  Users,
  Search,
  Filter,
  Award,
  Activity,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Download,
  School
} from 'lucide-react';
import { formatISTDate } from '../../utils/dateUtils';

interface TrainerClassRosterViewProps {
  classRoom: ClassRoom;
  students: Student[];
  submissions: TypingSubmission[];
  certificates: StudentCertificate[];
  onBack: () => void;
  onSelectStudent: (student: Student) => void;
}

export const TrainerClassRosterView: React.FC<TrainerClassRosterViewProps> = ({
  classRoom,
  students,
  submissions,
  certificates,
  onBack,
  onSelectStudent
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<'7' | '30' | '90' | 'all'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'roll' | 'wpm' | 'accuracy' | 'tests' | 'activity'>('roll');

  const classStudents = useMemo(() => {
    return students.filter(
      s => s.classId === classRoom.id || (classRoom.studentIds && classRoom.studentIds.includes(s.id))
    );
  }, [students, classRoom]);

  const studentIds = useMemo(() => new Set(classStudents.map(s => s.id)), [classStudents]);

  // Date filtering cutoff
  const cutoffTime = useMemo(() => {
    if (dateRange === '7') return Date.now() - 7 * 86400000;
    if (dateRange === '30') return Date.now() - 30 * 86400000;
    if (dateRange === '90') return Date.now() - 90 * 86400000;
    return 0; // all time
  }, [dateRange]);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter(sub => {
      if (!studentIds.has(sub.studentId)) return false;
      if (cutoffTime > 0) {
        const subTime = new Date(sub.timestamp || 0).getTime();
        if (subTime < cutoffTime) return false;
      }
      return true;
    });
  }, [submissions, studentIds, cutoffTime]);

  // Class-level summary metrics
  const summaryMetrics = useMemo(() => {
    const formalSubs = filteredSubmissions.filter(sub => !sub.isPractice && sub.netWpm !== undefined);
    const practiceSubs = filteredSubmissions.filter(sub => sub.isPractice);

    const studentsWithTests = new Set(formalSubs.map(sub => sub.studentId));
    const studentsNeverAttempted = classStudents.filter(s => !studentsWithTests.has(s.id)).length;

    const sevenDaysAgo = Date.now() - 7 * 86400000;
    const activeCount = classStudents.filter(s => {
      const sSubs = submissions.filter(sub => sub.studentId === s.id);
      if (sSubs.length === 0) return false;
      const latest = Math.max(...sSubs.map(sub => new Date(sub.timestamp || 0).getTime()));
      return latest >= (cutoffTime > 0 ? cutoffTime : sevenDaysAgo);
    }).length;

    const totalWpm = formalSubs.reduce((acc, sub) => acc + (sub.netWpm || 0), 0);
    const totalAccuracy = formalSubs.reduce((acc, sub) => acc + (sub.accuracy || 0), 0);
    const avgWpm = formalSubs.length > 0 ? Math.round(totalWpm / formalSubs.length) : 0;
    const avgAccuracy = formalSubs.length > 0 ? Math.round(totalAccuracy / formalSubs.length) : 0;

    return {
      enrolled: classStudents.length,
      completedTestsStudents: studentsWithTests.size,
      totalFormalAttempts: formalSubs.length,
      totalPracticeSessions: practiceSubs.length,
      avgWpm,
      avgAccuracy,
      noTestAttempts: studentsNeverAttempted,
      activeCount
    };
  }, [classStudents, filteredSubmissions, submissions, cutoffTime]);

  // Process student roster rows
  const rosterRows = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return classStudents
      .filter(s => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.rollNo.toLowerCase().includes(q) ||
          (s.username && s.username.toLowerCase().includes(q))
        );
      })
      .map(student => {
        const sSubs = filteredSubmissions.filter(sub => sub.studentId === student.id);
        const formal = sSubs.filter(sub => !sub.isPractice && sub.netWpm !== undefined);
        const practice = sSubs.filter(sub => sub.isPractice);

        const attempted = formal.length;
        const completed = formal.filter(sub => sub.passed !== false).length;

        const wpmSum = formal.reduce((acc, sub) => acc + (sub.netWpm || 0), 0);
        const accSum = formal.reduce((acc, sub) => acc + (sub.accuracy || 0), 0);
        const avgWpm = formal.length > 0 ? Math.round(wpmSum / formal.length) : 0;
        const avgAccuracy = formal.length > 0 ? Math.round(accSum / formal.length) : 0;

        let lastActiveTimestamp: string | null = null;
        const allStudentSubs = submissions.filter(sub => sub.studentId === student.id);
        if (allStudentSubs.length > 0) {
          const sorted = [...allStudentSubs].sort(
            (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
          lastActiveTimestamp = sorted[0].timestamp || null;
        }

        // Activity status
        let statusLabel = 'No activity recorded';
        let statusColor = 'text-slate-500 bg-slate-800/50 border-slate-700';
        if (lastActiveTimestamp) {
          const diffDays = (Date.now() - new Date(lastActiveTimestamp).getTime()) / 86400000;
          if (diffDays <= 3) {
            statusLabel = 'Active recently';
            statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
          } else if (diffDays <= 14) {
            statusLabel = 'Active earlier';
            statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
          } else {
            statusLabel = 'Inactive (>2 weeks)';
            statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
          }
        } else if (attempted === 0) {
          statusLabel = 'No test attempts';
          statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/30';
        }

        return {
          student,
          attempted,
          completed,
          practiceCount: practice.length,
          avgWpm,
          avgAccuracy,
          lastActiveTimestamp,
          statusLabel,
          statusColor
        };
      })
      .sort((a, b) => {
        if (sortBy === 'roll') return a.student.rollNo.localeCompare(b.student.rollNo);
        if (sortBy === 'name') return a.student.name.localeCompare(b.student.name);
        if (sortBy === 'wpm') return b.avgWpm - a.avgWpm;
        if (sortBy === 'accuracy') return b.avgAccuracy - a.avgAccuracy;
        if (sortBy === 'tests') return b.completed - a.completed;
        if (sortBy === 'activity') {
          const timeA = a.lastActiveTimestamp ? new Date(a.lastActiveTimestamp).getTime() : 0;
          const timeB = b.lastActiveTimestamp ? new Date(b.lastActiveTimestamp).getTime() : 0;
          return timeB - timeA;
        }
        return 0;
      });
  }, [classStudents, filteredSubmissions, submissions, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to My Classes</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                {classRoom.code || 'COHORT'}
              </span>
              <span className="text-xs font-mono text-slate-400">Class Roster & Analytics</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-3">
              <School className="w-6 h-6 text-cyan-400" />
              <span>{classRoom.name}</span>
            </h2>
            <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
              {classRoom.description || 'Institutional class section displaying student progress, test attempts, speed averages, and activity history.'}
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1.5 rounded-2xl shrink-0">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
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
                {range === 'all' ? 'All Time' : `${range} Days`}
              </button>
            ))}
          </div>
        </div>

        {/* Summary Metric Cards (8 KPIs) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 pt-2">
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Enrolled</div>
            <div className="text-xl font-black font-mono text-cyan-400 mt-1">{summaryMetrics.enrolled}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Tested</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">{summaryMetrics.completedTestsStudents}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Attempts</div>
            <div className="text-xl font-black font-mono text-slate-100 mt-1">{summaryMetrics.totalFormalAttempts}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Practice</div>
            <div className="text-xl font-black font-mono text-purple-400 mt-1">{summaryMetrics.totalPracticeSessions}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Avg WPM</div>
            <div className="text-xl font-black font-mono text-cyan-400 mt-1">{summaryMetrics.avgWpm}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Avg Acc</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">{summaryMetrics.avgAccuracy}%</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Untested</div>
            <div className="text-xl font-black font-mono text-amber-400 mt-1">{summaryMetrics.noTestAttempts}</div>
          </div>
          <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Active</div>
            <div className="text-xl font-black font-mono text-emerald-400 mt-1">{summaryMetrics.activeCount}</div>
          </div>
        </div>
      </div>

      {/* Roster Table Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-slate-100">
              Student Roster ({rosterRows.length} Candidates)
            </h3>
          </div>

          {/* Search & Sort Table Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search name or roll no..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-slate-500">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="bg-transparent text-slate-200 focus:outline-none font-medium cursor-pointer"
              >
                <option value="roll" className="bg-slate-900">Roll Number</option>
                <option value="name" className="bg-slate-900">Student Name</option>
                <option value="wpm" className="bg-slate-900">Speed (WPM)</option>
                <option value="accuracy" className="bg-slate-900">Accuracy</option>
                <option value="tests" className="bg-slate-900">Tests Completed</option>
                <option value="activity" className="bg-slate-900">Last Active</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        {rosterRows.length === 0 ? (
          <div className="text-center py-12 text-slate-500 font-mono text-xs">
            No students found matching your search in this class roster.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Roll Number</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Tests Attempted</th>
                  <th className="py-3 px-4 text-center">Completed</th>
                  <th className="py-3 px-4 text-center">Practice</th>
                  <th className="py-3 px-4 text-right">Avg Net WPM</th>
                  <th className="py-3 px-4 text-right">Avg Accuracy</th>
                  <th className="py-3 px-4">Last Active</th>
                  <th className="py-3 px-4">Activity Status</th>
                  <th className="py-3 px-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {rosterRows.map(({ student, attempted, completed, practiceCount, avgWpm, avgAccuracy, lastActiveTimestamp, statusLabel, statusColor }) => (
                  <tr
                    key={student.id}
                    onClick={() => onSelectStudent(student)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                      {student.rollNo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {student.name}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-slate-300">
                      {attempted}
                    </td>
                    <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                      {completed}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-purple-400">
                      {practiceCount}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-cyan-400">
                      {avgWpm > 0 ? `${avgWpm} WPM` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      {avgAccuracy > 0 ? `${avgAccuracy}%` : '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {lastActiveTimestamp ? formatISTDate(lastActiveTimestamp) : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border inline-block ${statusColor}`}>
                        {statusLabel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStudent(student);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-800 group-hover:bg-cyan-500/20 group-hover:text-cyan-300 text-slate-300 border border-slate-700 text-xs font-mono font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>View</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
