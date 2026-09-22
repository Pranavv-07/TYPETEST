import { CheckCircle2, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Clock, Target, Zap, Activity, Calendar, Flame } from 'lucide-react';
import { PerformanceOverTimeChart } from './PerformanceOverTimeChart';
import { getStudentAcademyProfile, getActiveCurriculum } from '../services/academyService';

interface StudentDashboardProps {
  onOpenAcademy?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenAcademy }) => {
  const { currentUser, submissions, students } = useApp();

  // Academy Profile
  const academyProfile = useMemo(() => {
    return getStudentAcademyProfile(currentUser?.id || 'guest_student');
  }, [currentUser]);

  const curriculum = useMemo(() => getActiveCurriculum(), []);

  const academyStats = useMemo(() => {
    let total = 0;
    let mastered = 0;
    curriculum.levels.forEach(lvl => {
      lvl.lessons.forEach(lsn => {
        total++;
        if (academyProfile.lessonProgress[lsn.id]?.status === 'mastered') mastered++;
      });
    });
    return {
      mastered,
      total,
      percent: total > 0 ? Math.round((mastered / total) * 100) : 0,
      currentLevel: curriculum.levels.find(l => l.id === academyProfile.currentLevelId) || curriculum.levels[0],
    };
  }, [curriculum, academyProfile]);

  const mySubmissions = useMemo(() => submissions.filter(s =>
    s.studentId === currentUser?.id ||
    (currentUser?.rollNo && s.rollNo && s.rollNo.trim().toUpperCase() === currentUser.rollNo.trim().toUpperCase()) ||
    (currentUser?.username && s.rollNo && s.rollNo.trim().toUpperCase() === currentUser.username.trim().toUpperCase()) ||
    (currentUser?.name && s.studentName && s.studentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
  ), [submissions, currentUser]);
  
  const stats = useMemo(() => {
    let bestWpm = 0;
    let sumWpm = 0;
    let sumAccuracy = 0;
    let totalTime = 0;
    let testsCompleted = 0;
    
    mySubmissions.forEach(sub => {
      testsCompleted++;
      sumWpm += sub.netWpm;
      sumAccuracy += sub.accuracy;
      totalTime += sub.timeTaken || 0;
      if (sub.netWpm > bestWpm) bestWpm = sub.netWpm;
    });

    const avgWpm = testsCompleted ? Math.round(sumWpm / testsCompleted) : 0;
    const avgAccuracy = testsCompleted ? Math.round(sumAccuracy / testsCompleted) : 0;
    const totalScore = Math.round((avgWpm * avgAccuracy) / 100 * testsCompleted);

    let currentStreak = 0;
    if (mySubmissions.length > 0) {
      // Sort submissions by date descending
      const sortedDates = [...mySubmissions]
        .map(s => new Date(s.timestamp || new Date()).setHours(0, 0, 0, 0))
        .sort((a, b) => b - a);
      
      const uniqueDates = [...new Set(sortedDates)];
      const today = new Date().setHours(0, 0, 0, 0);
      const yesterday = today - 86400000;
      
      if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
        currentStreak = 1;
        let expectedDate = uniqueDates[0] - 86400000;
        for (let i = 1; i < uniqueDates.length; i++) {
          if (uniqueDates[i] === expectedDate) {
            currentStreak++;
            expectedDate -= 86400000;
          } else {
            break;
          }
        }
      }
    }


    return { bestWpm, avgWpm, avgAccuracy, testsCompleted, totalTime, totalScore, currentStreak };
  }, [mySubmissions]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800">My Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">

        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-orange-500/20 text-orange-600 rounded-xl">
              <Flame size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm font-semibold text-orange-800">Current Streak</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">{stats.currentStreak}</span>
            <span className="text-sm font-medium text-slate-500">days</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            <span className="font-medium text-sm">Best WPM</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.bestWpm}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Activity className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-sm">Avg WPM</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.avgWpm}</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <Target className="w-5 h-5 text-emerald-500" />
            <span className="font-medium text-sm">Accuracy</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.avgAccuracy}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-2 text-slate-500 mb-2">
            <CheckCircle2 className="w-5 h-5 text-purple-500" />
            <span className="font-medium text-sm">Completed</span>
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.testsCompleted}</div>
        </div>
      </div>

      {/* Typing Academy Curriculum Featured Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-cyan-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 border border-amber-500/30 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Typing Academy
            </span>
            <span className="text-xs font-mono text-slate-600 font-semibold">
              {academyStats.mastered} of {academyStats.total} Lessons Mastered ({academyStats.percent}%)
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900">
            {academyStats.currentLevel.title}
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            {academyStats.currentLevel.tagline} — Master touch typing with muscle memory, anatomical finger guidance, and progressive accuracy unlocks.
          </p>

          <div className="w-full max-w-md h-2 bg-slate-200 rounded-full overflow-hidden mt-2">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
              style={{ width: `${academyStats.percent}%` }}
            />
          </div>
        </div>

        {onOpenAcademy && (
          <button
            onClick={onOpenAcademy}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-2 shrink-0"
          >
            <span>Resume Academy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Recharts Performance Over Time line chart */}
      <PerformanceOverTimeChart submissions={mySubmissions} />
    </div>
  );
};
