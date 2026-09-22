import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  Users,
  Globe,
  Medal,
  Zap,
  Target,
  Clock,
  Search,
  CheckCircle2,
  Sparkles,
  Layers,
  GraduationCap
} from 'lucide-react';

export const StudentLeaderboard: React.FC = () => {
  const { students, submissions, classes, currentUser } = useApp();
  
  // Leaderboard mode: 'batch' (Batch-Wise) or 'overall' (All Students Website-wide)
  const [leaderboardMode, setLeaderboardMode] = useState<'batch' | 'overall'>('batch');
  
  // Find current student's enrolled class
  const currentStudentClassId = useMemo(() => {
    if (!currentUser) return classes[0]?.id || '';
    const st = students.find(s => s.id === currentUser.id || s.rollNo === (currentUser as any).rollNo);
    return st?.classId || classes[0]?.id || '';
  }, [currentUser, students, classes]);

  const [selectedClassId, setSelectedClassId] = useState<string>(currentStudentClassId || (classes[0]?.id || ''));
  const [searchQuery, setSearchQuery] = useState('');

  // Update selected class if student class is resolved
  React.useEffect(() => {
    if (currentStudentClassId && !selectedClassId) {
      setSelectedClassId(currentStudentClassId);
    }
  }, [currentStudentClassId, selectedClassId]);

  // Aggregate student typing statistics
  const allStudentStats = useMemo(() => {
    const studentStats = new Map<string, {
      studentId: string;
      name: string;
      rollNo: string;
      classId?: string;
      className?: string;
      bestWpm: number;
      sumWpm: number;
      sumAccuracy: number;
      testsTaken: number;
      totalTime: number;
    }>();

    const classMap = new Map<string, string>(classes.map(c => [c.id, c.name]));

    students.forEach(s => {
      studentStats.set(s.id, {
        studentId: s.id,
        name: s.name,
        rollNo: s.rollNo,
        classId: s.classId,
        className: s.classId ? (classMap.get(s.classId) || 'Unassigned Batch') : 'General',
        bestWpm: 0,
        sumWpm: 0,
        sumAccuracy: 0,
        testsTaken: 0,
        totalTime: 0
      });
    });

    submissions.forEach(sub => {
      const st = studentStats.get(sub.studentId);
      if (st) {
        st.testsTaken++;
        st.sumWpm += sub.netWpm;
        st.sumAccuracy += sub.accuracy;
        st.totalTime += sub.timeTaken || 0;
        if (sub.netWpm > st.bestWpm) st.bestWpm = sub.netWpm;
      }
    });

    return Array.from(studentStats.values())
      .map(st => {
        const avgWpm = st.testsTaken > 0 ? Math.round(st.sumWpm / st.testsTaken) : 0;
        const avgAccuracy = st.testsTaken > 0 ? Math.round(st.sumAccuracy / st.testsTaken) : 0;
        const score = st.testsTaken > 0 ? Math.round((avgWpm * avgAccuracy) / 100 * st.testsTaken) : 0;
        return { ...st, avgWpm, avgAccuracy, score };
      })
      .filter(s => s.testsTaken > 0 || leaderboardMode === 'batch')
      .sort((a, b) => b.score - a.score || b.bestWpm - a.bestWpm);
  }, [students, submissions, classes, leaderboardMode]);

  // Filter based on active mode (batch vs overall) and search query
  const filteredLeaderboard = useMemo(() => {
    let list = allStudentStats;

    if (leaderboardMode === 'batch' && selectedClassId) {
      list = list.filter(s => s.classId === selectedClassId);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        s => s.name.toLowerCase().includes(q) || s.rollNo.toLowerCase().includes(q)
      );
    }

    return list;
  }, [allStudentStats, leaderboardMode, selectedClassId, searchQuery]);

  const selectedClassName = classes.find(c => c.id === selectedClassId)?.name || 'Selected Batch';
  const isViewingMyBatch = selectedClassId === currentStudentClassId;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header with Dual Leaderboard Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Rankings & Benchmarks
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-1">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Leaderboard</span>
          </h2>
          <p className="text-xs text-slate-400">
            {leaderboardMode === 'batch'
              ? `Displaying performance rankings for batch: ${selectedClassName}`
              : 'Displaying overall website-wide rankings across all students and batches'}
          </p>
        </div>

        {/* 2 Primary Mode Buttons */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setLeaderboardMode('batch')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              leaderboardMode === 'batch'
                ? 'bg-cyan-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Batch Leaderboard</span>
          </button>
          <button
            onClick={() => setLeaderboardMode('overall')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
              leaderboardMode === 'overall'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Overall Website</span>
          </button>
        </div>
      </div>

      {/* Filter and Selection Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-4">
        {leaderboardMode === 'batch' ? (
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Select Classroom / Batch:</span>
            </label>
            <select
              value={selectedClassId}
              onChange={e => setSelectedClassId(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.id === currentStudentClassId ? '(My Batch)' : ''}
                </option>
              ))}
            </select>
            {isViewingMyBatch && (
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono font-bold">
                My Enrolled Class
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>All Enrolled Batches • {students.length} Total Students</span>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search student or roll no..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 text-slate-400 text-xs font-mono border-b border-slate-800">
                <th className="p-4 font-bold w-16 text-center">Rank</th>
                <th className="p-4 font-bold">Student</th>
                {leaderboardMode === 'overall' && (
                  <th className="p-4 font-bold">Batch / Class</th>
                )}
                <th className="p-4 font-bold text-right">Best WPM</th>
                <th className="p-4 font-bold text-right">Avg WPM</th>
                <th className="p-4 font-bold text-right">Accuracy</th>
                <th className="p-4 font-bold text-right">Tests Taken</th>
                <th className="p-4 font-bold text-right">Performance Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredLeaderboard.map((student, idx) => {
                const isCurrent = currentUser?.id === student.studentId || (currentUser as any)?.rollNo === student.rollNo;

                return (
                  <tr
                    key={student.studentId}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-cyan-950/30 border-l-2 border-l-cyan-400 hover:bg-cyan-950/40'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="p-4 text-center font-mono font-bold">
                      {idx === 0 ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center mx-auto">
                          <Trophy className="w-4 h-4" />
                        </div>
                      ) : idx === 1 ? (
                        <div className="w-8 h-8 rounded-xl bg-slate-400/20 border border-slate-400/40 text-slate-300 flex items-center justify-center mx-auto">
                          <Medal className="w-4 h-4" />
                        </div>
                      ) : idx === 2 ? (
                        <div className="w-8 h-8 rounded-xl bg-amber-700/20 border border-amber-700/40 text-amber-600 flex items-center justify-center mx-auto">
                          <Medal className="w-4 h-4" />
                        </div>
                      ) : (
                        <span className="text-slate-500 font-mono">#{idx + 1}</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{student.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                            YOU
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{student.rollNo}</span>
                    </td>

                    {leaderboardMode === 'overall' && (
                      <td className="p-4">
                        <span className="px-2 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                          {student.className}
                        </span>
                      </td>
                    )}

                    <td className="p-4 text-right font-mono font-black text-cyan-400 text-sm">
                      {student.bestWpm > 0 ? `${student.bestWpm} WPM` : '—'}
                    </td>
                    <td className="p-4 text-right font-mono font-semibold text-slate-300">
                      {student.avgWpm > 0 ? `${student.avgWpm} WPM` : '—'}
                    </td>
                    <td className="p-4 text-right font-mono text-emerald-400 font-bold">
                      {student.avgAccuracy > 0 ? `${student.avgAccuracy}%` : '—'}
                    </td>
                    <td className="p-4 text-right font-mono text-slate-400">
                      {student.testsTaken}
                    </td>
                    <td className="p-4 text-right font-mono font-black text-amber-400 text-sm">
                      {student.score.toLocaleString()}
                    </td>
                  </tr>
                );
              })}

              {filteredLeaderboard.length === 0 && (
                <tr>
                  <td colSpan={leaderboardMode === 'overall' ? 8 : 7} className="p-12 text-center text-slate-500">
                    <Trophy className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                    <p className="font-mono text-xs">No student test records found for this view.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
