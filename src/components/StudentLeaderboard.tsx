import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Clock, Medal, Zap, Award, Star } from 'lucide-react';

export const StudentLeaderboard: React.FC = () => {
  const { students, submissions } = useApp();
  const [filter, setFilter] = useState<'all' | 'batch'>('all');

  // Aggregate stats per student based purely on typing performance
  const leaderboardData = useMemo(() => {
    const studentStats = new Map<string, {
      studentId: string;
      name: string;
      rollNo: string;
      classId?: string;
      bestWpm: number;
      sumWpm: number;
      sumAccuracy: number;
      testsTaken: number;
      totalTime: number;
    }>();

    students.forEach(s => {
      studentStats.set(s.id, {
        studentId: s.id,
        name: s.name,
        rollNo: s.rollNo,
        classId: s.classId,
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
      .filter(s => s.testsTaken > 0)
      .map(st => {
        const avgWpm = Math.round(st.sumWpm / st.testsTaken);
        const avgAccuracy = Math.round(st.sumAccuracy / st.testsTaken);
        const score = Math.round((avgWpm * avgAccuracy) / 100 * st.testsTaken);
        return { ...st, avgWpm, avgAccuracy, score };
      })
      .sort((a, b) => b.score - a.score);
  }, [students, submissions]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Global Leaderboard</h2>
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === 'all' ? 'bg-white shadow text-blue-600' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            All Students
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-sm border-b border-slate-200">
                <th className="p-4 font-semibold w-16 text-center">Rank</th>
                <th className="p-4 font-semibold">Student</th>
                <th className="p-4 font-semibold text-right">Best WPM</th>
                <th className="p-4 font-semibold text-right">Avg WPM</th>
                <th className="p-4 font-semibold text-right">Accuracy</th>
                <th className="p-4 font-semibold text-right">Tests Taken</th>
                <th className="p-4 font-semibold text-right">Score</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((student, idx) => (
                <tr key={student.studentId} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-center font-bold text-slate-400">
                    {idx === 0 ? <Trophy className="w-5 h-5 text-amber-500 mx-auto" /> :
                     idx === 1 ? <Trophy className="w-5 h-5 text-slate-400 mx-auto" /> :
                     idx === 2 ? <Trophy className="w-5 h-5 text-amber-700 mx-auto" /> :
                     `#${idx + 1}`}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{student.name}</div>
                    <div className="text-xs text-slate-500">{student.rollNo}</div>
                  </td>
                  <td className="p-4 text-right font-mono text-emerald-600 font-bold">{student.bestWpm}</td>
                  <td className="p-4 text-right font-mono font-semibold text-slate-700">{student.avgWpm}</td>
                  <td className="p-4 text-right font-mono text-slate-600">{student.avgAccuracy}%</td>
                  <td className="p-4 text-right font-mono text-slate-500">{student.testsTaken}</td>
                  <td className="p-4 text-right font-bold text-blue-600 font-mono">{student.score}</td>
                </tr>
              ))}
              {leaderboardData.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No typing data available yet.
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
