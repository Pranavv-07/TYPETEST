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
  getActiveCurriculum,
  checkLessonAccess,
  getAcademyAssignments,
  isAcademyGloballyOpen,
  setAcademyGloballyOpen
} from '../../services/academyService';
import { LessonView } from './LessonView';
import { DiagnosticModal } from './DiagnosticModal';
import { WeakKeysPracticeModal } from './WeakKeysPracticeModal';
import { AcademyCertificateModal } from './AcademyCertificateModal';
import { KEYBOARD_BADGES, CertificationBadge } from '../../data/achievementBadges';
import { CertificationMedallion } from './CertificationMedallion';
import { formatISTDate, formatISTDateTime } from '../../utils/dateUtils';
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
  Keyboard,
  X,
  Calendar,
  AlertCircle,
  Unlock
} from 'lucide-react';

interface AcademyDashboardProps {
  currentUser: User | null;
  onExit: () => void;
}

export const AcademyDashboard: React.FC<AcademyDashboardProps> = ({
  currentUser,
  onExit,
}) => {
  const studentId = currentUser?.id || currentUser?.username || '24B11CS355';
  const studentName = currentUser?.name || 'Candidate';

  // Curriculum data
  const curriculum = useMemo(() => getActiveCurriculum(), []);

  // Profile state
  const [profile, setProfile] = useState<StudentAcademyProfile>(() =>
    getStudentAcademyProfile(studentId)
  );

  const [globallyOpen, setGloballyOpenState] = useState(() => isAcademyGloballyOpen());
  const [assignments, setAssignments] = useState(() => getAcademyAssignments());

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
  const [selectedBadge, setSelectedBadge] = useState<CertificationBadge | null>(null);

  // Refresh profile whenever student changes
  useEffect(() => {
    setProfile(getStudentAcademyProfile(studentId));
  }, [studentId]);

  const toggleGlobalOpen = () => {
    const next = !globallyOpen;
    setGloballyOpenState(next);
    setAcademyGloballyOpen(next);
  };

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

  // Handle Certificate Claim
  const handleClaimCertificate = () => {
    const cert = issueAcademyCertificate(
      { id: studentId, name: studentName, rollNo: currentUser?.rollNo || '24B11CS355' },
      'Department of Technical Training (DOTT), Aditya University',
      stats.highestWpm || 85,
      stats.avgAcc || 99
    );
    setActiveCertificate(cert);
    setCertificateModalOpen(true);
  };

  // If viewing/practicing a specific lesson, render full LessonView
  if (activeLesson) {
    return (
      <LessonView
        lesson={activeLesson.lesson}
        level={activeLesson.level}
        studentId={studentId}
        onBack={() => {
          setActiveLesson(null);
          setProfile(getStudentAcademyProfile(studentId));
        }}
        onLessonCompleted={() => {
          const updated = getStudentAcademyProfile(studentId);
          setProfile(updated);
        }}
      />
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Academy Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
              DOTT Touch Typing Academy
            </span>
            <span className="text-xs font-mono text-slate-400">
              Department of Technical Training, Aditya University
            </span>
            {profile.streakDays > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400 animate-pulse" />
                {profile.streakDays} Day Streak
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Touch Typing Mastery Curriculum
          </h1>
          <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
            Progressive 7-level touch-typing program designed for engineering candidates. Build blind tactile muscle memory, key reach agility, and ergonomic keystroke chaining.
          </p>
        </div>

        {/* Action controls */}
        <div className="flex flex-wrap items-center gap-3 z-10">
          {(currentUser?.role === 'trainer' || currentUser?.role === 'admin') && (
            <button
              onClick={toggleGlobalOpen}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all border flex items-center gap-2 cursor-pointer ${
                globallyOpen
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {globallyOpen ? <Unlock className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-amber-400" />}
              <span>{globallyOpen ? 'Academy Open for All' : 'Strict Assignment Mode'}</span>
            </button>
          )}

          <button
            onClick={() => setDiagnosticOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Crosshair className="w-4 h-4 text-emerald-400" />
            <span>Placement Test</span>
          </button>

          {weakKeys.length > 0 && (
            <button
              onClick={() => setWeakKeysOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Zap className="w-4 h-4 text-rose-400" />
              <span>Target Weak Keys</span>
            </button>
          )}

          <button
            onClick={onExit}
            className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 border border-slate-700 font-bold text-xs transition-all cursor-pointer"
          >
            Exit Academy
          </button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Active Faculty Schedule / Assignments Banner */}
      {assignments.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Active Faculty Schedule & Assignments (IST)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Aditya University DOTT
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignments.map(assign => (
              <div
                key={assign.id}
                className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-100">{assign.title}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded">
                    ACTIVE
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Target: {assign.className || 'All Students'}</span>
                  <span>Due: {formatISTDateTime(assign.dueDate)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OVERVIEW METRICS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>CURRICULUM MASTERY</span>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100 pt-1">
            {stats.completionPercent}%
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            {stats.masteredLessons} of {stats.totalLessons} Lessons Mastered
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PEAK SPEED</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 pt-1">
            {stats.highestWpm} <span className="text-xs text-slate-400 font-normal">WPM</span>
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Avg: {stats.avgWpm} WPM
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>PEAK ACCURACY</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 pt-1">
            {stats.highestAcc}%
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Target benchmark: &ge;95%
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span>WEAK KEY TARGETS</span>
            <Crosshair className="w-4 h-4 text-rose-400" />
          </div>
          <div className="pt-1 flex items-center gap-1.5 flex-wrap">
            {weakKeys.length > 0 ? (
              weakKeys.map(k => (
                <span
                  key={k.key}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30"
                >
                  {k.key.toUpperCase()}
                </span>
              ))
            ) : (
              <span className="text-xs text-slate-500 font-mono">None detected</span>
            )}
          </div>
          <div className="text-[11px] font-mono text-slate-500">
            Calibrated focus
          </div>
        </div>
      </div>

      {/* Graduation Certificate Banner (Unlocked when completed) */}
      {(stats.completionPercent >= 100 || profile.certificateEarned) && (
        <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 block">
                DOTT Graduation Milestone
              </span>
              <h2 className="text-xl font-black text-slate-100">
                Official Touch Typing Certificate Ready
              </h2>
              <p className="text-xs text-slate-300">
                Issued by Department of Technical Training, Aditya University with official endorsement from Dr. G Ramu, Dean Technical Trainings.
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimCertificate}
            className="px-6 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
          >
            <Award className="w-4 h-4" />
            <span>View & Download Certificate</span>
          </button>
        </div>
      )}

      {/* 7-TIER CERTIFICATION MEDALLIONS */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-md">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-100">
                  Official Certification Medallions
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-mono font-bold border border-amber-500/20">
                  7-Tier Hierarchy
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Progression from Level 1 Foundations to the Grandmaster Titanium Apex Medallion.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-950 px-4 py-2 rounded-2xl border border-slate-800 text-xs font-mono">
            <span className="text-slate-400">Mastered:</span>
            <strong className="text-amber-400 text-sm">
              {KEYBOARD_BADGES.filter(b => {
                const lvl = curriculum.levels.find(l => l.id === b.levelNumber);
                return lvl && lvl.lessons.every(l => profile.lessonProgress[l.id]?.status === 'mastered');
              }).length}
            </strong>
            <span className="text-slate-500">/ 7 Badges</span>
          </div>
        </div>

        {/* Medallions Display Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-6 py-2 justify-items-center">
          {KEYBOARD_BADGES.map(badge => {
            const lvl = curriculum.levels.find(l => l.id === badge.levelNumber);
            const isUnlocked = lvl ? lvl.lessons.every(l => profile.lessonProgress[l.id]?.status === 'mastered') : false;
            const lessonsCompleted = lvl ? lvl.lessons.filter(l => profile.lessonProgress[l.id]?.status === 'mastered').length : 0;
            const totalLessons = lvl ? lvl.lessons.length : 5;

            return (
              <CertificationMedallion
                key={badge.id}
                badge={badge}
                isUnlocked={isUnlocked}
                lessonsCompleted={lessonsCompleted}
                totalLessons={totalLessons}
                size="md"
                onClick={() => setSelectedBadge(badge)}
              />
            );
          })}
        </div>
      </div>

      {/* BADGE INSPECTION DETAIL MODAL */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center animate-in zoom-in duration-300">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex justify-center pt-2">
              <CertificationMedallion
                badge={selectedBadge}
                isUnlocked={Boolean(
                  curriculum.levels.find(l => l.id === selectedBadge.levelNumber)?.lessons.every(
                    l => profile.lessonProgress[l.id]?.status === 'mastered'
                  )
                )}
                size="lg"
              />
            </div>

            <div className="space-y-2 text-left bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold uppercase text-amber-400">
                  Credential Specification
                </span>
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold"
                  style={{
                    backgroundColor: `${selectedBadge.color}20`,
                    color: selectedBadge.color
                  }}
                >
                  {selectedBadge.rarity}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-100">
                {selectedBadge.name}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {selectedBadge.description}
              </p>
              
              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-800/80 text-[11px] font-mono">
                <div>
                  <span className="text-slate-500 block">Hardware Tier:</span>
                  <span className="text-slate-200 font-bold">{selectedBadge.keyboardType}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Switch Dynamics:</span>
                  <span className="text-slate-200 font-bold">{selectedBadge.switchType}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedBadge(null)}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md cursor-pointer"
            >
              Close Inspector
            </button>
          </div>
        </div>
      )}

      {/* CURRICULUM ROADMAP (LEVELS 1 - 7) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xl font-black text-slate-100">
              Curriculum Roadmap
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {curriculum.levels.length} Progressive Levels
          </span>
        </div>

        {/* Levels Accordion List */}
        <div className="space-y-4">
          {curriculum.levels.map((level) => {
            const isExpanded = expandedLevelId === level.id;
            const levelLessons = level.lessons;

            const isLevelMastered = levelLessons.every(
              l => profile.lessonProgress[l.id]?.status === 'mastered'
            );

            const completedInLevel = levelLessons.filter(
              l => profile.lessonProgress[l.id]?.status === 'mastered'
            ).length;

            return (
              <div
                key={level.id}
                className={`bg-slate-900 border rounded-3xl overflow-hidden transition-all shadow-lg ${
                  isLevelMastered
                    ? 'border-emerald-500/40'
                    : 'border-slate-800 hover:border-emerald-500/30'
                }`}
              >
                {/* Level Header Bar */}
                <button
                  onClick={() => setExpandedLevelId(isExpanded ? 0 : level.id)}
                  className="w-full p-5 sm:p-6 flex items-center justify-between text-left transition-colors hover:bg-slate-800/40 cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-base border ${
                        isLevelMastered
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300'
                      }`}
                    >
                      {isLevelMastered ? (
                        <CheckCircle2 className="w-6 h-6" />
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
                        const accessCheck = checkLessonAccess(level.id, lesson.id, currentUser);
                        const isAccessible = accessCheck.isAccessible;

                        return (
                          <div
                            key={lesson.id}
                            className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                              isMastered
                                ? 'bg-slate-950/80 border-emerald-500/30'
                                : !isAccessible
                                ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                                : 'bg-slate-950 border-slate-800 hover:border-emerald-500/40 shadow-md'
                            }`}
                          >
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                                  Lesson {lesson.order}
                                </span>
                                {isMastered ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Mastered
                                  </span>
                                ) : !isAccessible ? (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-900 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                    <Lock className="w-3 h-3" /> Faculty Assigned Only
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
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

                            {/* Benchmark Requirements or Access Lock Notice */}
                            {!isAccessible ? (
                              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-amber-300/80 flex items-start gap-2">
                                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span>{accessCheck.reason || 'Assigned by Trainer Only. Contact your mentor to unlock.'}</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                                  <span>Acc: <strong className="text-emerald-400">{lesson.minAccuracy}%</strong></span>
                                  <span>•</span>
                                  <span>WPM: <strong className="text-slate-200">{lesson.minWpm}</strong></span>
                                </div>

                                <button
                                  onClick={() => setActiveLesson({ lesson, level })}
                                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow flex items-center gap-1.5 cursor-pointer"
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

      {/* Modals */}
      <DiagnosticModal
        studentId={studentId}
        isOpen={diagnosticOpen}
        onClose={() => setDiagnosticOpen(false)}
        onPlacementApplied={(updated) => setProfile(updated)}
      />

      <WeakKeysPracticeModal
        studentId={studentId}
        isOpen={weakKeysOpen}
        onClose={() => setWeakKeysOpen(false)}
        onProfileUpdated={(updated) => setProfile(updated)}
      />

      <AcademyCertificateModal
        certificate={activeCertificate}
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
      />
    </div>
  );
};
