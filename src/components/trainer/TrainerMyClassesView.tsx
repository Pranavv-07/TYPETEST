import React, { useState, useMemo } from 'react';
import { ClassRoom, Student, TypingSubmission, StudentCertificate } from '../../types';
import {
  Users,
  School,
  Building2,
  Calendar,
  Award,
  Activity,
  CheckCircle2,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import { formatISTDate } from '../../utils/dateUtils';

interface TrainerMyClassesViewProps {
  classes: ClassRoom[];
  students: Student[];
  submissions: TypingSubmission[];
  certificates: StudentCertificate[];
  onSelectClass: (cls: ClassRoom) => void;
}

export const TrainerMyClassesView: React.FC<TrainerMyClassesViewProps> = ({
  classes,
  students,
  submissions,
  certificates,
  onSelectClass
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'wpm' | 'accuracy' | 'activity'>('name');

  const processedClasses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return classes
      .filter(cls => {
        if (!q) return true;
        return (
          cls.name.toLowerCase().includes(q) ||
          (cls.code && cls.code.toLowerCase().includes(q)) ||
          (cls.section && cls.section.toLowerCase().includes(q))
        );
      })
      .map(cls => {
        const classStudents = students.filter(
          s => s.classId === cls.id || (cls.studentIds && cls.studentIds.includes(s.id))
        );
        const studentIds = new Set(classStudents.map(s => s.id));

        const classSubmissions = submissions.filter(
          sub => studentIds.has(sub.studentId) && !sub.isPractice && sub.netWpm !== undefined
        );

        const practiceSubmissions = submissions.filter(
          sub => studentIds.has(sub.studentId) && sub.isPractice
        );

        const studentsWithAttempts = new Set(classSubmissions.map(sub => sub.studentId));
        const studentsNeverAttempted = classStudents.length - studentsWithAttempts.size;

        // Active within last 7 days
        const now = Date.now();
        const sevenDaysAgo = now - 7 * 86400000;
        const activeStudentsLast7Days = classStudents.filter(s => {
          const sSubs = submissions.filter(sub => sub.studentId === s.id);
          if (sSubs.length === 0) return false;
          const latest = Math.max(...sSubs.map(sub => new Date(sub.timestamp || 0).getTime()));
          return latest >= sevenDaysAgo;
        }).length;

        // Averages
        const totalWpm = classSubmissions.reduce((acc, sub) => acc + (sub.netWpm || 0), 0);
        const totalAccuracy = classSubmissions.reduce((acc, sub) => acc + (sub.accuracy || 0), 0);
        const avgWpm = classSubmissions.length > 0 ? Math.round(totalWpm / classSubmissions.length) : 0;
        const avgAccuracy = classSubmissions.length > 0 ? Math.round(totalAccuracy / classSubmissions.length) : 0;

        // Latest activity
        let latestTimestamp: string | null = null;
        if (classSubmissions.length > 0) {
          const sorted = [...classSubmissions].sort(
            (a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime()
          );
          latestTimestamp = sorted[0].timestamp || null;
        }

        return {
          room: cls,
          enrolledCount: classStudents.length,
          attemptedCount: studentsWithAttempts.size,
          neverAttemptedCount: Math.max(0, studentsNeverAttempted),
          completedAttempts: classSubmissions.length,
          practiceSessionsCount: practiceSubmissions.length,
          avgWpm,
          avgAccuracy,
          activeLast7Days: activeStudentsLast7Days,
          latestTimestamp
        };
      })
      .sort((a, b) => {
        if (sortBy === 'size') return b.enrolledCount - a.enrolledCount;
        if (sortBy === 'wpm') return b.avgWpm - a.avgWpm;
        if (sortBy === 'accuracy') return b.avgAccuracy - a.avgAccuracy;
        if (sortBy === 'activity') {
          const timeA = a.latestTimestamp ? new Date(a.latestTimestamp).getTime() : 0;
          const timeB = b.latestTimestamp ? new Date(b.latestTimestamp).getTime() : 0;
          return timeB - timeA;
        }
        return a.room.name.localeCompare(b.room.name);
      });
  }, [classes, students, submissions, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
              Faculty Class Management
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 mt-2">
            <School className="w-5 h-5 text-cyan-400" />
            <span>My Assigned Classes & Student Analytics</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Select an academic cohort below to inspect detailed student rosters, assessment attempts, time-series performance charts, practice histories, and activity logs.
          </p>
        </div>

        {/* Search & Sort */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search classes or codes..."
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
              <option value="name" className="bg-slate-900">Name (A-Z)</option>
              <option value="size" className="bg-slate-900">Class Size</option>
              <option value="wpm" className="bg-slate-900">Avg Speed (WPM)</option>
              <option value="accuracy" className="bg-slate-900">Avg Accuracy</option>
              <option value="activity" className="bg-slate-900">Latest Activity</option>
            </select>
          </div>
        </div>
      </div>

      {/* Classes Grid */}
      {processedClasses.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <School className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-200">No Assigned Classes Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {searchQuery
              ? `No classes match your search query "${searchQuery}". Try clearing the search filter.`
              : 'You currently have no classes assigned to your trainer profile. Please contact the academic administrator to assign classes.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {processedClasses.map(({ room, enrolledCount, attemptedCount, neverAttemptedCount, completedAttempts, practiceSessionsCount, avgWpm, avgAccuracy, activeLast7Days, latestTimestamp }) => (
            <div
              key={room.id}
              onClick={() => onSelectClass(room)}
              className="bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded-3xl p-6 flex flex-col justify-between gap-5 shadow-xl transition-all cursor-pointer group"
            >
              {/* Card Top */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    {room.code || 'SECTION'}
                  </span>
                  <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{enrolledCount} Enrolled</span>
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-100 group-hover:text-cyan-400 transition-colors">
                    {room.name}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                    {room.description || 'Institutional Typing Cohort'}
                  </p>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl space-y-0.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Avg Speed</div>
                    <div className="text-lg font-black font-mono text-cyan-400">{avgWpm} <span className="text-xs font-normal text-slate-400">WPM</span></div>
                  </div>
                  <div className="bg-slate-950/80 border border-slate-800/80 p-3 rounded-2xl space-y-0.5">
                    <div className="text-[10px] font-mono text-slate-400 uppercase">Avg Accuracy</div>
                    <div className="text-lg font-black font-mono text-emerald-400">{avgAccuracy}%</div>
                  </div>
                </div>

                {/* Secondary stats row */}
                <div className="space-y-1.5 text-xs text-slate-300 font-mono pt-1">
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Tests Completed:</span>
                    <span className="font-bold text-slate-200">{completedAttempts} attempts</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Practice Sessions:</span>
                    <span className="font-bold text-slate-200">{practiceSessionsCount} recorded</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                    <span className="text-slate-400">Active (7 Days):</span>
                    <span className="font-bold text-emerald-400">{activeLast7Days} students</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400">Never Attempted:</span>
                    <span className={`font-bold ${neverAttemptedCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {neverAttemptedCount} students
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono">
                <span className="text-[11px] text-slate-400 truncate max-w-[180px]">
                  {latestTimestamp ? `Active: ${formatISTDate(latestTimestamp)}` : 'No recent activity'}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 font-bold transition-all flex items-center gap-1 group-hover:translate-x-0.5">
                  <span>View Roster</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
