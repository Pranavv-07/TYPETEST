import React, { useState, useMemo } from 'react';
import {
  ALL_ACHIEVEMENTS,
  AchievementCategory,
  EvaluatedBadge,
  evaluateStudentAchievements
} from '../data/achievementBadges';
import {
  Trophy,
  Award,
  Zap,
  Flame,
  GraduationCap,
  Target,
  Sparkles,
  Lock,
  CheckCircle2,
  Filter,
  Shield,
  Keyboard,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StudentAchievementsProps {
  studentProfile: {
    currentLevelId: number;
    streakDays: number;
    longestStreakDays?: number;
    lessonProgress: Record<string, { status: string }>;
  };
  submissions: Array<{ netWpm: number; accuracy: number; timestamp?: string }>;
  rollNo?: string;
  onOpenAcademy?: () => void;
  onOpenPractice?: () => void;
}

export const StudentAchievements: React.FC<StudentAchievementsProps> = ({
  studentProfile,
  submissions,
  rollNo,
  onOpenAcademy,
  onOpenPractice
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory | 'all'>('all');
  const [selectedBadge, setSelectedBadge] = useState<EvaluatedBadge | null>(null);

  const evaluatedData = useMemo(() => {
    return evaluateStudentAchievements(studentProfile, submissions, rollNo);
  }, [studentProfile, submissions, rollNo]);

  const filteredBadges = useMemo(() => {
    if (selectedCategory === 'all') return evaluatedData.badges;
    return evaluatedData.badges.filter(b => b.category === selectedCategory);
  }, [evaluatedData.badges, selectedCategory]);

  const handleBadgeClick = (badge: EvaluatedBadge) => {
    setSelectedBadge(badge);
    if (badge.isUnlocked) {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2 z-10 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
              <Trophy className="w-3.5 h-3.5" />
              Touch Typing Mastery Hall of Fame
            </span>
            <span className="text-xs font-mono text-emerald-400 font-bold">
              {evaluatedData.unlockedCount} / {evaluatedData.totalCount} Unlocked
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-100">
            Student Achievement Badges & Milestones
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            Unlock prestige badge credentials, artisan keyboard badges, and speed trophies across WPM speed barriers, daily streak consistency, curriculum tiers, and surgical precision.
          </p>

          <div className="w-full max-w-md pt-2 space-y-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-300 font-bold">
              <span>Overall Completion Progress</span>
              <span className="text-amber-400">{evaluatedData.completionPercent}%</span>
            </div>
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-amber-500 via-emerald-400 to-teal-300 rounded-full transition-all duration-700 shadow-[0_0_12px_rgba(234,179,8,0.4)]"
                style={{ width: `${evaluatedData.completionPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Quick Launch Buttons */}
        <div className="z-10 flex flex-wrap gap-2.5 shrink-0">
          {onOpenAcademy && (
            <button
              onClick={onOpenAcademy}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Academy Levels</span>
            </button>
          )}
          {onOpenPractice && (
            <button
              onClick={onOpenPractice}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Speed Drills</span>
            </button>
          )}
        </div>

        {/* Decorative corner glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'all', label: 'All Achievements', icon: Trophy, count: evaluatedData.totalCount },
          { id: 'wpm', label: 'WPM Milestones', icon: Zap, count: ALL_ACHIEVEMENTS.filter(b => b.category === 'wpm').length },
          { id: 'streak', label: 'Daily Streaks', icon: Flame, count: ALL_ACHIEVEMENTS.filter(b => b.category === 'streak').length },
          { id: 'curriculum', label: 'Keyboard Tiers (1-7)', icon: Keyboard, count: ALL_ACHIEVEMENTS.filter(b => b.category === 'curriculum').length },
          { id: 'accuracy', label: 'Precision Marksman', icon: Target, count: ALL_ACHIEVEMENTS.filter(b => b.category === 'accuracy').length },
          { id: 'experience', label: 'Exam Volume', icon: Shield, count: ALL_ACHIEVEMENTS.filter(b => b.category === 'experience').length }
        ].map(cat => {
          const Icon = cat.icon;
          const isActive = selectedCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer border ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-black border-emerald-400 shadow-lg shadow-emerald-500/20'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
              <span>{cat.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                isActive ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBadges.map(badge => {
          return (
            <div
              key={badge.id}
              onClick={() => handleBadgeClick(badge)}
              className={`rounded-3xl p-5 border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-4 group ${
                badge.isUnlocked
                  ? `bg-gradient-to-b ${badge.badgeBg} hover:scale-[1.02] shadow-xl hover:shadow-2xl`
                  : 'bg-slate-950/70 border-slate-800/80 opacity-70 hover:opacity-90'
              }`}
            >
              <div className="space-y-3">
                {/* Top status bar */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-950/80 border border-slate-800 text-slate-300">
                      {badge.tier}
                    </span>
                    {badge.keyboardType && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {badge.keyboardType.split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {badge.isUnlocked ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Unlocked
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-slate-400 border border-slate-700 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-slate-500" />
                      Locked
                    </span>
                  )}
                </div>

                {/* Badge Icon & Name */}
                <div className="flex items-start gap-3.5">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 border transition-transform group-hover:scale-110 ${
                    badge.isUnlocked
                      ? 'bg-slate-900/90 border-slate-700 shadow-inner'
                      : 'bg-slate-900/40 border-slate-800 grayscale'
                  }`}>
                    {badge.icon}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {badge.name}
                    </h3>
                    <p className="text-xs font-semibold text-slate-400">
                      {badge.tagline}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-300/90 line-clamp-2 leading-relaxed">
                  {badge.description}
                </p>

                {/* Hardware Spec callout if available */}
                {badge.switchType && (
                  <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 flex items-center gap-2">
                    <Keyboard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">Hardware: <strong className="text-slate-200">{badge.switchType}</strong></span>
                  </div>
                )}
              </div>

              {/* Progress Bar / Requirement */}
              <div className="space-y-1.5 pt-3 border-t border-slate-800/80">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">{badge.requirementText}</span>
                  <span className={`font-bold ${badge.isUnlocked ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {badge.isUnlocked ? '100%' : `${badge.currentProgress}%`}
                  </span>
                </div>

                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      badge.isUnlocked
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-300'
                        : 'bg-slate-700'
                    }`}
                    style={{ width: `${badge.isUnlocked ? 100 : badge.currentProgress}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-slate-950 border-2 border-slate-700 flex items-center justify-center text-4xl shadow-xl">
              {selectedBadge.icon}
            </div>

            <div className="space-y-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-emerald-400 border border-slate-700">
                {selectedBadge.tier} Tier • {selectedBadge.category.toUpperCase()}
              </span>
              <h3 className="text-xl font-black text-slate-100 mt-2">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-slate-400 font-semibold">
                {selectedBadge.tagline}
              </p>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800 text-left">
              {selectedBadge.description}
            </p>

            {selectedBadge.keyboardType && (
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 text-left space-y-1 text-xs font-mono">
                <div className="text-slate-500 text-[10px] uppercase">Reward Mechanical Chassis</div>
                <div className="font-bold text-slate-200">{selectedBadge.keyboardType}</div>
                {selectedBadge.switchType && (
                  <div className="text-[11px] text-emerald-400">Switches: {selectedBadge.switchType}</div>
                )}
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Status:</span>
              <span className={`font-bold ${selectedBadge.isUnlocked ? 'text-emerald-400' : 'text-amber-400'}`}>
                {selectedBadge.isUnlocked ? '✓ UNLOCKED & VERIFIED' : `IN PROGRESS (${selectedBadge.currentProgress}%)`}
              </span>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Close Showcase
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
