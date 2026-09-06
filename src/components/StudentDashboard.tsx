import { CheckCircle2 } from "lucide-react";
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Trophy, Clock, Target, Zap, Activity, Calendar } from 'lucide-react';

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

    return { bestWpm, avgWpm, avgAccuracy, testsCompleted, totalTime, totalScore };
  }, [mySubmissions]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-2xl font-bold text-slate-800">My Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
