import { CheckCircle2 } from "lucide-react";
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Clock, Target, Zap, Activity, Calendar, Flame } from 'lucide-react';

export const StudentDashboard: React.FC = () => {
  const { currentUser, submissions, students } = useApp();

  const mySubmissions = useMemo(() => submissions.filter(s => s.studentId === currentUser?.id), [submissions, currentUser]);
  
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
    </div>
  );
};
