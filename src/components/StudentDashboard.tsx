import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Trophy,
  Clock,
  Target,
  Zap,
  Activity,
  Calendar,
  Flame,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { PerformanceOverTimeChart } from './PerformanceOverTimeChart';
import {
  getStudentAcademyProfile,
  getActiveCurriculum,
  getStudentAttemptHistory,
  calculateStreakFromDates
} from '../services/academyService';

interface StudentDashboardProps {
  onOpenAcademy?: () => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ onOpenAcademy }) => {
  const { currentUser, submissions } = useApp();

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
      currentLevel:
        curriculum.levels.find(l => l.id === academyProfile.currentLevelId) || curriculum.levels[0],
    };
  }, [curriculum, academyProfile]);

  const mySubmissions = useMemo(
    () =>
      submissions.filter(
        s =>
          s.studentId === currentUser?.id ||
          (currentUser?.rollNo &&
            s.rollNo &&
            s.rollNo.trim().toUpperCase() === currentUser.rollNo.trim().toUpperCase()) ||
          (currentUser?.username &&
            s.rollNo &&
            s.rollNo.trim().toUpperCase() === currentUser.username.trim().toUpperCase()) ||
          (currentUser?.name &&
            s.studentName &&
            s.studentName.trim().toLowerCase() === currentUser.name.trim().toLowerCase())
      ),
    [submissions, currentUser]
  );

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
      totalTime += sub.timeSpentSeconds || 0;
      if (sub.netWpm > bestWpm) bestWpm = sub.netWpm;
    });

    const avgWpm = testsCompleted ? Math.round(sumWpm / testsCompleted) : 0;
    const avgAccuracy = testsCompleted ? Math.round(sumAccuracy / testsCompleted) : 0;
    const totalScore = Math.round(((avgWpm * avgAccuracy) / 100) * testsCompleted);

    const dates: string[] = [];
    mySubmissions.forEach(s => {
      if (s.timestamp) dates.push(s.timestamp);
    });
    if (currentUser?.id) {
      const attempts = getStudentAttemptHistory(currentUser.id);
      attempts.forEach(a => {
        if (a.timestamp) dates.push(a.timestamp);
      });
    }
    const streakResult = calculateStreakFromDates(dates);

    return {
      bestWpm,
      avgWpm,
      avgAccuracy,
      testsCompleted,
      totalTime,
      totalScore,
      currentStreak: streakResult.currentStreak,
      practicedToday: streakResult.practicedToday
    };
  }, [mySubmissions, currentUser?.id]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100">Performance Summary</h2>
        <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
          DOTT Verified Record
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Streak Card */}
        <div className="bg-gradient-to-br from-orange-500/15 via-orange-500/10 to-transparent border border-orange-500/30 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-500/20 text-orange-400 rounded-xl">
              <Flame size={18} className="fill-orange-400 animate-pulse" />
            </div>
            <h3 className="text-xs font-bold text-orange-300 uppercase tracking-wider">Current Streak</h3>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black text-slate-100">{stats.currentStreak}</span>
            <span className="text-xs font-medium text-slate-400">days</span>
          </div>
        </div>

        {/* Best WPM */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Best WPM</span>
          </div>
          <div className="text-3xl font-black text-emerald-400">{stats.bestWpm}</div>
        </div>

        {/* Avg WPM */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Avg WPM</span>
          </div>
          <div className="text-3xl font-black text-slate-100">{stats.avgWpm}</div>
        </div>

        {/* Accuracy */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <Target className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Accuracy</span>
          </div>
          <div className="text-3xl font-black text-amber-400">{stats.avgAccuracy || 100}%</div>
        </div>

        {/* Tests Completed */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center space-x-2 text-slate-400 mb-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs uppercase tracking-wider">Completed</span>
          </div>
          <div className="text-3xl font-black text-slate-100">{stats.testsCompleted}</div>
        </div>
      </div>

      {/* Typing Academy Curriculum Featured Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" /> Typing Academy
            </span>
            <span className="text-xs font-mono text-slate-300 font-semibold">
              {academyStats.mastered} of {academyStats.total} Lessons Mastered ({academyStats.percent}%)
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-100">
            {academyStats.currentLevel.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {academyStats.currentLevel.tagline} — Progressive touch-typing mastery with guided anatomical finger cues, rhythmic bigrams, and strict 95% accuracy assessments.
          </p>

          <div className="w-full max-w-md h-2.5 bg-slate-950 rounded-full overflow-hidden mt-2 border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${academyStats.percent}%` }}
            />
          </div>
        </div>

        {onOpenAcademy && (
          <button
            onClick={onOpenAcademy}
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>Open Academy</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Speed & Accuracy Over Time Chart */}
      <PerformanceOverTimeChart submissions={mySubmissions} />
    </div>
  );
};
