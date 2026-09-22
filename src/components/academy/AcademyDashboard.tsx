import React, { useState, useEffect, useMemo } from 'react';
import {
  AcademyCurriculum,
  AcademyLevel,
  AcademyLesson,
  StudentAcademyProfile,
  User,
  StudentCertificate
} from '../../types';
import {
  getStudentAcademyProfile,
  getTopWeakKeys,
  getStudentAttemptHistory,
  issueAcademyCertificate,
  getActiveCurriculum
} from '../../services/academyService';
import { LessonView } from './LessonView';
import { DiagnosticModal } from './DiagnosticModal';
import { WeakKeysPracticeModal } from './WeakKeysPracticeModal';
import { AcademyCertificateModal } from './AcademyCertificateModal';
import { KEYBOARD_BADGES, KeyboardBadge } from '../../data/achievementBadges';
import {
  GraduationCap,
  Sparkles,
  Lock,
  CheckCircle2,
  Play,
  Trophy,
  Flame,
  Target,
  Zap,
  Clock,
  ArrowRight,
  Crosshair,
  Award,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  ShieldCheck,
  BookOpen,
  Keyboard
} from 'lucide-react';

interface AcademyDashboardProps {
  currentUser: User | null;
  onExit: () => void;
}

export const AcademyDashboard: React.FC<AcademyDashboardProps> = ({
  currentUser,
  onExit,
}) => {
  const studentId = currentUser?.id || 'guest_student';
  const studentName = currentUser?.name || 'Student';

  // Curriculum data
  const curriculum = useMemo(() => getActiveCurriculum(), []);

  // Profile state
  const [profile, setProfile] = useState<StudentAcademyProfile>(() =>
    getStudentAcademyProfile(studentId)
  );

  // Active expanded level in the roadmap
  const [expandedLevelId, setExpandedLevelId] = useState<number>(profile.currentLevelId || 1);

  // Selected active lesson to view/practice
  const [activeLesson, setActiveLesson] = useState<{
    lesson: AcademyLesson;
    level: AcademyLevel;
  } | null>(null);

  // Modals
  const [diagnosticOpen, setDiagnosticOpen] = useState(false);
  const [weakKeysOpen, setWeakKeysOpen] = useState(false);
  const [certificateModalOpen, setCertificateModalOpen] = useState(false);
  const [activeCertificate, setActiveCertificate] = useState<StudentCertificate | null>(null);

  // Refresh profile whenever student changes
  useEffect(() => {
    setProfile(getStudentAcademyProfile(studentId));
  }, [studentId]);

  // Overall statistics calculation
  const stats = useMemo(() => {
    let totalLessons = 0;
    let completedLessons = 0;
    let masteredLessons = 0;
    let sumWpm = 0;
    let countWpm = 0;
    let sumAcc = 0;
    let countAcc = 0;
    let highestWpm = 0;
    let highestAcc = 0;

    curriculum.levels.forEach(lvl => {
      lvl.lessons.forEach(lsn => {
        totalLessons++;
        const prog = profile.lessonProgress[lsn.id];
        if (prog?.status === 'mastered') {
          masteredLessons++;
          completedLessons++;
        } else if (prog?.status === 'completed' || prog?.status === 'in_progress') {
          completedLessons++;
        }

        if (prog?.bestWpm) {
          sumWpm += prog.bestWpm;
          countWpm++;
          highestWpm = Math.max(highestWpm, prog.bestWpm);
        }
        if (prog?.bestAccuracy) {
          sumAcc += prog.bestAccuracy;
          countAcc++;
          highestAcc = Math.max(highestAcc, prog.bestAccuracy);
        }
      });
    });

    const completionPercent = totalLessons > 0 ? Math.round((masteredLessons / totalLessons) * 100) : 0;
    const avgWpm = countWpm > 0 ? Math.round(sumWpm / countWpm) : 0;
    const avgAcc = countAcc > 0 ? Math.round(sumAcc / countAcc) : 100;

    return {
      totalLessons,
      completedLessons,
      masteredLessons,
      lockedLessons: Math.max(0, totalLessons - masteredLessons),
      completionPercent,
      avgWpm,
      highestWpm,
      avgAcc,
      highestAcc,
    };
  }, [curriculum, profile]);

  // Top weak keys
  const weakKeys = useMemo(() => getTopWeakKeys(studentId, 4), [studentId, profile]);

  // Find next pending lesson for the "Continue Learning" primary button
  const continueNextLesson = useMemo(() => {
    for (const lvl of curriculum.levels) {
      for (const lsn of lvl.lessons) {
        const prog = profile.lessonProgress[lsn.id];
        if (prog?.status === 'unlocked' || prog?.status === 'in_progress') {
          return { lesson: lsn, level: lvl };
        }
      }
    }
    // If all unlocked are mastered, return first lesson
    return { lesson: curriculum.levels[0].lessons[0], level: curriculum.levels[0] };
  }, [curriculum, profile]);

  // Handle Certificate Claim
  const handleClaimCertificate = () => {
    const cert = issueAcademyCertificate(
      { id: studentId, name: studentName, rollNo: currentUser?.rollNo },
      'Typing Academy International',
      stats.highestWpm || 42,
      stats.highestAcc || 98
    );
    setActiveCertificate(cert);
    setCertificateModalOpen(true);
    setProfile(getStudentAcademyProfile(studentId));
  };

  // If a lesson is actively being viewed/practiced, render the LessonView
  if (activeLesson) {
    return (
      <LessonView
        lesson={activeLesson.lesson}
        level={activeLesson.level}
        profile={profile}
        studentId={studentId}
        onBack={() => setActiveLesson(null)}
        onNextLesson={(nextId) => {
          for (const lvl of curriculum.levels) {
            const found = lvl.lessons.find(l => l.id === nextId);
            if (found) {
              setActiveLesson({ lesson: found, level: lvl });
              break;
            }
          }
        }}
        onProfileUpdated={(updated) => setProfile(updated)}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 animate-in fade-in duration-300">
      {/* Academy Hero Header & Continue Learning CTA */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" /> Typing Academy
              </span>
              <span className="text-xs font-mono text-slate-400">
                7 Progressive Mastery Levels
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-slate-100 tracking-tight">
              Touch Typing Curriculum
            </h1>

            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              Learn touch typing through structured pedagogical levels: concept explanation, anatomical finger guidance, repetitive guided drills, and strict accuracy benchmarks.
            </p>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => setDiagnosticOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {profile.diagnosticCompleted
                    ? `Diagnostic Score: ${profile.diagnosticWpm} WPM (Retake)`
                    : 'Take Diagnostic Assessment'}
                </span>
              </button>

              <button
                onClick={() => setWeakKeysOpen(true)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Crosshair className="w-3.5 h-3.5 text-rose-400" />
                <span>Weak Keys Practice Mode</span>
              </button>
            </div>
          </div>

          {/* Primary "Continue Learning" CTA Box */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between gap-4 min-w-[280px]">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block mb-1">
                Current Learning Target
              </span>
              <h2 className="text-lg font-bold text-slate-100 line-clamp-1">
                {continueNextLesson.lesson.title}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Level {continueNextLesson.level.id} • Lesson {continueNextLesson.lesson.order}
              </span>
            </div>

            <button
              onClick={() => setActiveLesson(continueNextLesson)}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Continue Learning</span>
            </button>
          </div>
        </div>

        {/* Course Progress Bar */}
        <div className="mt-8 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">
              Curriculum Mastery: <strong className="text-amber-300">{stats.masteredLessons}</strong> of {stats.totalLessons} Lessons
            </span>
            <span className="font-bold text-amber-400">{stats.completionPercent}% Complete</span>
          </div>
          <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-500 rounded-full"
              style={{ width: `${stats.completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Student Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Current & Best WPM */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Speed Benchmark</span>
            <Zap className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-cyan-400">
              {stats.avgWpm} <span className="text-xs text-slate-500 font-normal">AVG</span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block">
            Best Speed: <strong className="text-cyan-300">{stats.highestWpm} WPM</strong>
          </span>
        </div>

        {/* Current & Best Accuracy */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Accuracy</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400">
              {stats.avgAcc}%
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block">
            Best Accuracy: <strong className="text-emerald-300">{stats.highestAcc}%</strong>
          </span>
        </div>

        {/* Active Streak */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Practice Streak</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
              {profile.streakDays || 1} <span className="text-xs text-slate-500 font-normal">DAYS</span>
            </span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block">
            Daily touch typing habit
          </span>
        </div>

        {/* Weak Keys Identified */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-3xl space-y-1 shadow-md">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-mono uppercase font-bold">Weak Keys</span>
            <Crosshair className="w-4 h-4 text-rose-400" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            {weakKeys.length > 0 ? (
              weakKeys.map(k => (
                <span
                  key={k.key}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold"
                >
                  {k.key.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">None detected</span>
            )}
          </div>
          <span className="text-[11px] font-mono text-slate-400 block pt-1">
            Targeted calibration
          </span>
        </div>
      </div>

      {/* Graduation Certificate Banner (Unlocked when Level 7 completed) */}
      {stats.completionPercent >= 100 && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-amber-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 block">
                Graduation Milestone
              </span>
              <h2 className="text-xl font-black text-slate-100">
                Official Touch Typing Certificate Ready
              </h2>
              <p className="text-xs text-slate-300">
                You have satisfied all 7 progressive curriculum levels. Claim and download your institutional certificate!
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimCertificate}
            className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            <span>View & Print Certificate</span>
          </button>
        </div>
      )}

      {/* VISUAL CURRICULUM ROADMAP (LEVELS 1 - 7) */}
      <div className="space-y-4">
        {/* KEYBOARD EVOLUTION & ACHIEVEMENT BADGES */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Keyboard className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-100 flex items-center gap-2">
                  <span>Keyboard Evolution Badges</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono border border-amber-500/20">
                    7 Hardware Tiers
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Unlock specialized mechanical hardware badges as you conquer each curriculum level.
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-mono text-slate-400">
                Unlocked:{' '}
                <strong className="text-amber-400">
                  {KEYBOARD_BADGES.filter(b => {
                    const lvl = curriculum.levels.find(l => l.id === b.levelNumber);
                    return lvl && lvl.lessons.every(l => profile.lessonProgress[l.id]?.status === 'mastered');
                  }).length}
                </strong>{' '}
                / 7 Badges
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
            {KEYBOARD_BADGES.map(badge => {
              const lvl = curriculum.levels.find(l => l.id === badge.levelNumber);
              const isUnlocked = lvl ? lvl.lessons.every(l => profile.lessonProgress[l.id]?.status === 'mastered') : false;
              const lessonsCompleted = lvl ? lvl.lessons.filter(l => profile.lessonProgress[l.id]?.status === 'mastered').length : 0;
              const totalLessons = lvl ? lvl.lessons.length : 0;

              return (
                <div
                  key={badge.id}
                  className={`relative p-4 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
                    isUnlocked
                      ? `${badge.bgGlow} ${badge.accentBorder} bg-opacity-80`
                      : 'bg-slate-950/70 border-slate-800/80 opacity-60 hover:opacity-80'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="text-3xl filter drop-shadow-sm">{badge.icon}</span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isUnlocked
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-slate-800 border-slate-700 text-slate-500'
                        }`}
                      >
                        {isUnlocked ? 'Unlocked' : `Level ${badge.levelNumber}`}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-100 text-xs mt-2.5 line-clamp-1">
                      {badge.name}
                    </h4>
                    <p className="text-[11px] text-amber-300 font-medium mt-0.5 font-mono">
                      {badge.keyboardType}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {badge.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-slate-500">Switch: {badge.switchType}</span>
                    <span
                      className="font-bold uppercase"
                      style={{ color: badge.color }}
                    >
                      {badge.rarity}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-black text-slate-100">
              Curriculum Roadmap
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {curriculum.levels.length} Structured Levels
          </span>
        </div>

        {/* Levels Accordion List */}
        <div className="space-y-4">
          {curriculum.levels.map((level, idx) => {
            const isExpanded = expandedLevelId === level.id;
            const levelLessons = level.lessons;

            // Check if level is mastered or locked
            const isLevelMastered = levelLessons.every(
              l => profile.lessonProgress[l.id]?.status === 'mastered'
            );
            const isLevelLocked = level.prerequisiteLevelId
              ? !profile.trainerOverrideUnlockAll &&
                !curriculum.levels
                  .find(l => l.id === level.prerequisiteLevelId)
                  ?.lessons.every(l => profile.lessonProgress[l.id]?.status === 'mastered')
              : false;

            const completedInLevel = levelLessons.filter(
              l => profile.lessonProgress[l.id]?.status === 'mastered'
            ).length;

            return (
              <div
                key={level.id}
                className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all shadow-lg ${
                  isLevelMastered
                    ? 'border-emerald-500/30'
                    : isLevelLocked
                    ? 'border-slate-800/60 opacity-80'
                    : 'border-slate-800 hover:border-amber-500/30'
                }`}
              >
                {/* Level Header Bar */}
                <button
                  onClick={() => setExpandedLevelId(isExpanded ? 0 : level.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left transition-colors hover:bg-slate-800/40"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-base border ${
                        isLevelMastered
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : isLevelLocked
                          ? 'bg-slate-950 border-slate-800 text-slate-600'
                          : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      }`}
                    >
                      {isLevelMastered ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : isLevelLocked ? (
                        <Lock className="w-5 h-5" />
                      ) : (
                        `L${level.id}`
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                          Level {level.id}
                        </span>
                        {isLevelMastered && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Completed
                          </span>
                        )}
                        {isLevelLocked && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-950 text-slate-500 border border-slate-800">
                            Locked
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-black text-slate-100">
                        {level.title}
                      </h3>
                      <p className="text-xs text-slate-400 hidden sm:block">
                        {level.tagline}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right font-mono text-xs hidden sm:block">
                      <span className="text-slate-400">
                        {completedInLevel} / {levelLessons.length} Lessons
                      </span>
                    </div>

                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Level Lessons List */}
                {isExpanded && (
                  <div className="p-5 sm:p-6 pt-0 border-t border-slate-800/80 space-y-3 mt-2">
                    <p className="text-xs text-slate-400 pt-3 pb-2 leading-relaxed">
                      {level.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {levelLessons.map((lesson) => {
                        const progress = profile.lessonProgress[lesson.id];
                        const isMastered = progress?.status === 'mastered';
                        const isLocked = !profile.trainerOverrideUnlockAll && progress?.status === 'locked';

                        return (
                          <div
                            key={lesson.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              isMastered
                                ? 'bg-slate-950/60 border-emerald-500/30'
                                : isLocked
                                ? 'bg-slate-950/30 border-slate-800/50 opacity-60'
                                : 'bg-slate-950 border-slate-800 hover:border-amber-500/40 shadow-md'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                                  Lesson {lesson.order}
                                </span>
                                {isMastered ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Mastered
                                  </span>
                                ) : isLocked ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-slate-500 border border-slate-800 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Locked
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                                    Ready
                                  </span>
                                )}
                              </div>

                              <h4 className="text-sm font-bold text-slate-100">
                                {lesson.title}
                              </h4>
                              <p className="text-xs text-slate-400 line-clamp-2">
                                {lesson.objective}
                              </p>
                            </div>

                            {/* Benchmark Requirements or Lock Reason */}
                            {isLocked ? (
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                                <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                <span>{progress?.lockReason || 'Complete prerequisite lesson to unlock.'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                                  <span>Acc: <strong>{lesson.minAccuracy}%</strong></span>
                                  <span>•</span>
                                  <span>WPM: <strong>{lesson.minWpm}</strong></span>
                                </div>

                                <button
                                  onClick={() => setActiveLesson({ lesson, level })}
                                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow flex items-center gap-1.5"
                                >
                                  <span>{isMastered ? 'Review' : 'Start'}</span>
                                  <ArrowRight className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Diagnostic Modal */}
      <DiagnosticModal
        studentId={studentId}
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onPlacementApplied={(updated) => setProfile(updated)}
      />

      {/* Weak Keys Practice Modal */}
      <WeakKeysPracticeModal
        studentId={studentId}
        isOpen={weakKeysOpen}
        onClose={() => setWeakKeysOpen(false)}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      {/* Certificate Modal */}
      <AcademyCertificateModal
        certificate={activeCertificate}
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
      />
    </div>
  );
};
