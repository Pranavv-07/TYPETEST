import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AcademyLesson,
  AcademyLevel,
  StudentAcademyProfile,
  StudentLessonAttempt,
  GuidedDrill
} from '../../types';
import {
  FINGER_PALETTE
} from '../../data/academyCurriculum';
import {
  recordStudentLessonAttempt,
  recordStudentDrillCompletion,
  recordConceptRead,
  getActiveCurriculum
} from '../../services/academyService';
import { soundController } from '../../utils/audio';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CheckCircle2,
  Lock,
  Trophy,
  RotateCcw,
  Sparkles,
  BookOpen,
  Keyboard,
  Target,
  Zap,
  Clock,
  ChevronRight,
  AlertCircle,
  Volume2,
  VolumeX,
  Layers,
  Award,
  Flame,
  Check,
  ArrowRight
} from 'lucide-react';

interface LessonViewProps {
  lesson: AcademyLesson;
  level: AcademyLevel;
  profile: StudentAcademyProfile;
  studentId: string;
  onBack: () => void;
  onNextLesson?: (nextLessonId: string) => void;
  onProfileUpdated: (updated: StudentAcademyProfile) => void;
}

// Generate 3 progressive drills for any lesson
export function resolveLessonDrills(lesson: AcademyLesson): GuidedDrill[] {
  if (lesson.drills && lesson.drills.length >= 2) {
    return lesson.drills;
  }

  const keysStr = lesson.keysIntroduced.length > 0
    ? lesson.keysIntroduced.slice(0, 4).join(' ')
    : 'home row keys';

  return [
    {
      id: `${lesson.id}-drill-1`,
      drillNumber: 1,
      title: 'Key Isolates & Bigrams',
      subtitle: 'Build raw muscle memory for target keys & finger anchors',
      drillType: 'bigram',
      targetText: lesson.guidedText || `${keysStr} ${keysStr} ${keysStr}`,
      focusHint: 'Focus on clean anatomical finger placement. Do not rush.'
    },
    {
      id: `${lesson.id}-drill-2`,
      drillNumber: 2,
      title: 'Rhythmic Words & Cadence',
      subtitle: 'Chain keystrokes into fluid multi-letter word chunks',
      drillType: 'words',
      targetText: lesson.practiceText || `${lesson.guidedText} ${lesson.guidedText}`,
      focusHint: 'Maintain steady metronome rhythm between alternating hands.'
    },
    {
      id: `${lesson.id}-drill-3`,
      drillNumber: 3,
      title: 'Contextual Phrasing & Flow',
      subtitle: 'Realistic sentence transitions and continuous flow',
      drillType: 'phrasing',
      targetText: `${lesson.guidedText} ${lesson.practiceText}`.slice(0, 140),
      focusHint: 'Keep eyes strictly on the text. Never look down at the keyboard.'
    }
  ];
}

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  level,
  profile,
  studentId,
  onBack,
  onNextLesson,
  onProfileUpdated,
}) => {
  // Resolve 3 progressive drills
  const drills = useMemo(() => resolveLessonDrills(lesson), [lesson]);

  // Current lesson progress from profile
  const lessonProgress = profile.lessonProgress[lesson.id];
  const isMastered = lessonProgress?.status === 'mastered';

  // Sequential Phase State: 'learn' | 'drills' | 'assessment'
  // When opening any new lesson, default strictly to 'learn' (Concept phase)
  const [activeTab, setActiveTab] = useState<'learn' | 'drills' | 'assessment'>('learn');

  // Active sub-drill index (0 = Drill 1, 1 = Drill 2, 2 = Drill 3)
  const [activeDrillIndex, setActiveDrillIndex] = useState<number>(0);

  // Track completed drills in local session + profile
  const [completedDrillsMap, setCompletedDrillsMap] = useState<Record<number, boolean>>(() => {
    const map: Record<number, boolean> = {};
    if (lessonProgress?.completedDrillNumbers) {
      lessonProgress.completedDrillNumbers.forEach(num => {
        map[num - 1] = true; // 1-indexed to 0-indexed
      });
    }
    if (lessonProgress?.guidedCompleted || isMastered || profile.trainerOverrideUnlockAll) {
      map[0] = true;
      map[1] = true;
      map[2] = true;
    }
    return map;
  });

  // Sound toggle
  const [soundOn, setSoundOn] = useState(true);

  // Typing engine states
  const [inputText, setInputText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [currentKeystrokeErrors, setCurrentKeystrokeErrors] = useState<string[]>([]);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<StudentLessonAttempt | null>(null);
  const [isNewlyMastered, setIsNewlyMastered] = useState(false);
  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  // Check if all 3 drills are done
  const allDrillsCompleted = Boolean(
    (completedDrillsMap[0] && completedDrillsMap[1] && completedDrillsMap[2]) ||
    lessonProgress?.guidedCompleted ||
    isMastered ||
    profile.trainerOverrideUnlockAll
  );

  // Find next lesson in curriculum
  const nextLessonInfo = useMemo(() => {
    const curriculum = getActiveCurriculum();
    let currentFound = false;
    for (const lvl of curriculum.levels) {
      for (const lsn of lvl.lessons) {
        if (currentFound) {
          return { lesson: lsn, level: lvl };
        }
        if (lsn.id === lesson.id) {
          currentFound = true;
        }
      }
    }
    return null;
  }, [lesson.id]);

  // When lesson prop changes (e.g. student clicked next lesson), reset strictly to Step 1 (Learn Concept)
  useEffect(() => {
    setActiveTab('learn');
    setActiveDrillIndex(0);
    setInputText('');
    setStartTime(null);
    setEndTime(null);
    setCurrentKeystrokeErrors([]);
    setShowResultsModal(false);
    setLockedNotice(null);

    // Re-initialize completed drills map
    const prog = profile.lessonProgress[lesson.id];
    const map: Record<number, boolean> = {};
    if (prog?.completedDrillNumbers) {
      prog.completedDrillNumbers.forEach(num => {
        map[num - 1] = true;
      });
    }
    if (prog?.guidedCompleted || prog?.status === 'mastered' || profile.trainerOverrideUnlockAll) {
      map[0] = true;
      map[1] = true;
      map[2] = true;
    }
    setCompletedDrillsMap(map);
  }, [lesson.id]);

  // Target text calculation
  const activeTargetText = useMemo(() => {
    if (activeTab === 'drills') {
      const drill = drills[activeDrillIndex] || drills[0];
      return drill.targetText;
    }
    if (activeTab === 'assessment') {
      return lesson.assessmentText;
    }
    return drills[0].targetText;
  }, [activeTab, activeDrillIndex, drills, lesson]);

  // Reset typing input when changing active drill or tab
  useEffect(() => {
    setInputText('');
    setStartTime(null);
    setEndTime(null);
    setCurrentKeystrokeErrors([]);
    setShowResultsModal(false);
    if (activeTab !== 'learn') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab, activeDrillIndex]);

  // Handle keystroke typing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const target = activeTargetText;

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    // Audio acoustic feedback & error tracking
    if (val.length > inputText.length) {
      const idx = val.length - 1;
      const expectedChar = target[idx];
      const typedChar = val[idx];

      if (expectedChar !== typedChar) {
        if (soundOn) soundController.playErrorSound();
        if (expectedChar) {
          setCurrentKeystrokeErrors(prev => [...prev, expectedChar]);
        }
      } else {
        if (soundOn) soundController.playKeySound(typedChar);
      }
    }

    setInputText(val);

    // When typing completed
    if (val.length >= target.length) {
      finishAttempt(val);
    }
  };

  // Evaluate & finish attempt
  const finishAttempt = (typedVal: string) => {
    const finishTimestamp = Date.now();
    setEndTime(finishTimestamp);

    const elapsedSeconds = startTime
      ? Math.max(1, Math.round((finishTimestamp - startTime) / 1000))
      : 1;
    const elapsedMinutes = elapsedSeconds / 60;

    const target = activeTargetText;
    let correctChars = 0;
    let incorrectChars = 0;
    const detectedErrors: string[] = [];

    for (let i = 0; i < typedVal.length; i++) {
      if (typedVal[i] === target[i]) {
        correctChars++;
      } else {
        incorrectChars++;
        if (target[i]) {
          detectedErrors.push(target[i]);
        }
      }
    }

    const rawWpm = Math.max(0, Math.round((typedVal.length / 5) / elapsedMinutes));
    const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
    const accuracy = typedVal.length > 0
      ? Math.max(0, Math.round((correctChars / typedVal.length) * 100))
      : 100;

    const isAssessment = activeTab === 'assessment';
    const strictMinAcc = Math.max(95, lesson.minAccuracy || 95);
    const passed = isAssessment
      ? accuracy >= strictMinAcc && netWpm >= lesson.minWpm
      : accuracy >= 80;

    // If active tab was a guided drill, mark this drill completed!
    if (activeTab === 'drills') {
      const drillNum = activeDrillIndex + 1;
      setCompletedDrillsMap(prev => ({
        ...prev,
        [activeDrillIndex]: true
      }));
      recordStudentDrillCompletion(studentId, lesson.id, drillNum);
    }

    // Record attempt
    const { attempt, profile: updatedProfile, newlyMastered } = recordStudentLessonAttempt(
      studentId,
      {
        studentId,
        lessonId: lesson.id,
        levelId: level.id,
        phase: activeTab === 'drills' ? 'guided' : 'assessment',
        wpm: netWpm,
        rawWpm,
        accuracy,
        correctChars,
        incorrectChars,
        totalChars: typedVal.length,
        errors: incorrectChars,
        timeTakenSeconds: elapsedSeconds,
        passed,
        mastered: passed && isAssessment,
        weakKeysDetected: [...new Set(detectedErrors)],
      }
    );

    setLastAttempt(attempt);
    setIsNewlyMastered(newlyMastered);
    onProfileUpdated(updatedProfile);
    setShowResultsModal(true);

    if (newlyMastered) {
      try {
        confetti({
          particleCount: 160,
          spread: 100,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  // Transition from Step 1 (Learn) to Step 2 (Drills)
  const handleStartDrills = () => {
    recordConceptRead(studentId, lesson.id);
    setLockedNotice(null);
    setActiveTab('drills');
    setActiveDrillIndex(0);
  };

  // Transition to next sub-drill or final assessment
  const handleNextDrillOrAssessment = () => {
    setShowResultsModal(false);
    if (activeDrillIndex === 0) {
      setActiveDrillIndex(1); // Go to Drill 2
    } else if (activeDrillIndex === 1) {
      setActiveDrillIndex(2); // Go to Drill 3
    } else if (activeDrillIndex === 2) {
      // All 3 drills done! Open Step 3: Final Assessment
      setLockedNotice(null);
      setActiveTab('assessment');
    }
  };

  // Current target key & anatomical finger guide
  const currentTargetChar = activeTargetText[inputText.length] || '';
  const currentFingerGuide = lesson.targetFingers.find(
    tf => tf.key.toLowerCase() === currentTargetChar.toLowerCase()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Breadcrumb Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 transition-colors shadow-sm"
            title="Return to Curriculum Roadmap"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                Level {level.id} • Lesson {lesson.order}
              </span>
              {isMastered && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Mastered (95%+ Acc)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-0.5">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Strict Criteria & Sound Toggle */}
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Min Acc: <strong className="text-emerald-300">{Math.max(95, lesson.minAccuracy || 95)}%</strong></span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <span>Min Speed: <strong className="text-cyan-300">{lesson.minWpm} WPM</strong></span>
          </div>
          <button
            onClick={() => setSoundOn(!soundOn)}
            className={`p-2 rounded-xl border transition-colors ${
              soundOn
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
            title="Toggle typing acoustics"
          >
            {soundOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SEQUENTIAL 3-STEP WIZARD STEPPER */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/70 p-2.5 rounded-2xl border border-slate-800">
        
        {/* Step 1: Learn Concept */}
        <button
          onClick={() => {
            setLockedNotice(null);
            setActiveTab('learn');
          }}
          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
            activeTab === 'learn'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
              : 'text-slate-300 hover:text-slate-100 hover:bg-slate-900 bg-slate-900/60'
          }`}
        >
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span>Step 1: Learn Concept</span>
          </div>
          <span className="text-[10px] font-mono opacity-90">
            {lessonProgress?.conceptRead || allDrillsCompleted ? '✓ Done' : 'Start'}
          </span>
        </button>

        {/* Step 2: Guided Drills */}
        <button
          onClick={() => {
            setLockedNotice(null);
            setActiveTab('drills');
          }}
          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
            activeTab === 'drills'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
              : allDrillsCompleted
              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 bg-slate-900/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 bg-slate-900/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            <span>Step 2: Guided Drills</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-[10px]">
            {allDrillsCompleted ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 3/3 Done
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold">
                {Object.values(completedDrillsMap).filter(Boolean).length}/3 Drills
              </span>
            )}
          </div>
        </button>

        {/* Step 3: Final Assessment (Strictly Locked until Drills 1, 2, 3 are done) */}
        <button
          onClick={() => {
            if (!allDrillsCompleted) {
              setLockedNotice(
                'Final Assessment is strictly locked! You must complete all 3 Guided Drills (Key Isolates, Rhythmic Words, & Contextual Phrasing) to unlock this assessment.'
              );
            } else {
              setLockedNotice(null);
              setActiveTab('assessment');
            }
          }}
          className={`py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-between transition-all ${
            !allDrillsCompleted
              ? 'bg-slate-900/30 text-slate-500 border border-slate-800/80 cursor-not-allowed'
              : activeTab === 'assessment'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md font-black ring-2 ring-amber-400/50'
              : isMastered
              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900 bg-slate-900/60'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-900 bg-slate-900/60 font-bold'
          }`}
          title={!allDrillsCompleted ? 'Complete all 3 drills first to unlock' : 'Open Final Assessment'}
        >
          <div className="flex items-center gap-2">
            {!allDrillsCompleted ? (
              <Lock className="w-4 h-4 text-amber-500/80" />
            ) : (
              <Trophy className="w-4 h-4" />
            )}
            <span>Step 3: Final Assessment</span>
          </div>
          <div className="font-mono text-[10px]">
            {!allDrillsCompleted ? (
              <span className="bg-slate-800 text-amber-400/90 px-2 py-0.5 rounded font-bold">🔒 Locked</span>
            ) : isMastered ? (
              <span className="text-emerald-400 font-bold">Mastered</span>
            ) : (
              <span className="text-amber-300 font-bold">Strict 95% Acc</span>
            )}
          </div>
        </button>
      </div>

      {/* Locked Notice Alert */}
      {lockedNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200 font-medium leading-relaxed">
              {lockedNotice}
            </p>
          </div>
          <button
            onClick={() => {
              setLockedNotice(null);
              setActiveTab('drills');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors whitespace-nowrap self-end sm:self-auto flex items-center gap-1.5 shadow-md"
          >
            <span>Start Guided Drills Now</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* STEP 1: LEARN CONCEPT & FINGER POSITIONS */}
      {activeTab === 'learn' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Step 1: Learning Objective & Posture
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                {lesson.objective}
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm pt-2">
                {lesson.concept}
              </p>
            </div>

            {/* Target Keys Introduced */}
            {lesson.keysIntroduced.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Target Keys Introduced
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {lesson.keysIntroduced.map(key => (
                    <div
                      key={key}
                      className="px-4 py-2 rounded-xl bg-slate-950 border border-amber-500/40 text-amber-300 font-mono font-black text-lg shadow-md flex items-center gap-2"
                    >
                      <span>{key === ' ' ? 'Spacebar' : key.toUpperCase()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Anatomical Finger Assignment Table */}
            {lesson.targetFingers.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Tactile Finger Assignments & Motion Directives
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {lesson.targetFingers.map(tf => {
                    const palette = FINGER_PALETTE[tf.finger] || {
                      name: tf.finger,
                      color: '#f59e0b',
                    };
                    return (
                      <div
                        key={tf.key}
                        className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-base shadow"
                            style={{
                              backgroundColor: `${palette.color}25`,
                              borderColor: `${palette.color}60`,
                              borderWidth: '1px',
                              color: palette.color,
                            }}
                          >
                            {tf.key === ' ' ? '␣' : tf.key.toUpperCase()}
                          </span>
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">
                              {tf.key === ' ' ? 'Space' : `Key "${tf.key.toUpperCase()}"`}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono">
                              {tf.label || palette.name}
                            </span>
                          </div>
                        </div>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: palette.color }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Clear Primary Action Button to Proceed to Step 2: Guided Drills */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Concept reviewed • 3 Progressive Drills will unlock Step 3: Final Assessment
              </span>
              <button
                onClick={handleStartDrills}
                className="w-full sm:w-auto px-7 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Begin Step 2: Guided Drills (1/3)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: GUIDED DRILLS ARENA */}
      {activeTab === 'drills' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          
          {/* Sub-drill sequence bar (Drill 1 -> Drill 2 -> Drill 3) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-slate-100 uppercase tracking-wider font-mono">
                  Step 2: Guided Drills Sequence (Complete 1, 2, and 3 to unlock Assessment)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Active Drill: <strong className="text-amber-400">{activeDrillIndex + 1} of 3</strong>
              </span>
            </div>

            {/* 3 Sequential Drill Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {drills.map((d, idx) => {
                const isDone = completedDrillsMap[idx] || allDrillsCompleted;
                const isActive = activeDrillIndex === idx;
                const isLocked = idx > 0 && !completedDrillsMap[idx - 1] && !allDrillsCompleted;

                return (
                  <button
                    key={d.id}
                    disabled={isLocked}
                    onClick={() => {
                      if (!isLocked) {
                        setActiveDrillIndex(idx);
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/40 shadow-md'
                        : isDone
                        ? 'bg-slate-950 border-emerald-500/30 text-slate-300 hover:border-slate-700'
                        : isLocked
                        ? 'bg-slate-950/40 border-slate-900 text-slate-600 cursor-not-allowed opacity-60'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500">
                          Drill {idx + 1}
                        </span>
                        {isDone && (
                          <Check className="w-3.5 h-3.5 text-emerald-400 inline" />
                        )}
                        {isLocked && (
                          <Lock className="w-3 h-3 text-slate-600 inline" />
                        )}
                      </div>
                      <h4 className="font-bold text-xs mt-0.5 line-clamp-1">{d.title}</h4>
                    </div>

                    <span
                      className={`text-[9px] font-mono px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        isActive
                          ? 'bg-amber-500 text-slate-950'
                          : isDone
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : isLocked
                          ? 'bg-slate-900 text-slate-600'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isActive ? 'Active' : isDone ? 'Done' : isLocked ? 'Locked' : 'Ready'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Real-time Anatomical Finger Indicator */}
          {currentFingerGuide && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-2xl border shadow-inner"
                  style={{
                    backgroundColor: `${FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b'}25`,
                    borderColor: `${FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b'}60`,
                    color: FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b',
                  }}
                >
                  {currentTargetChar === ' ' ? '␣' : currentTargetChar.toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Drill {activeDrillIndex + 1} • {drills[activeDrillIndex]?.title}
                  </span>
                  <span className="text-sm font-bold text-slate-100">
                    Strike with{' '}
                    <strong
                      style={{
                        color: FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b',
                      }}
                    >
                      {currentFingerGuide.label}
                    </strong>
                  </span>
                </div>
              </div>

              <div className="text-right font-mono text-xs text-slate-400">
                <span>Progress: </span>
                <strong className="text-amber-400">
                  {Math.round((inputText.length / activeTargetText.length) * 100)}%
                </strong>
              </div>
            </div>
          )}

          {/* Interactive Typing Arena */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="relative bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 cursor-text select-none shadow-2xl min-h-[200px] flex flex-col justify-center transition-all"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              autoFocus
              className="absolute inset-0 opacity-0 cursor-default"
              aria-label="Typing drill input"
            />

            <div
              className="font-mono text-lg sm:text-2xl leading-relaxed tracking-wider text-left transition-all"
              style={{ fontFamily: "'Fira Code', monospace" }}
            >
              {activeTargetText.split('').map((char, idx) => {
                const isTyped = idx < inputText.length;
                const isCurrent = idx === inputText.length;
                const isCorrect = isTyped && inputText[idx] === char;
                const isWrong = isTyped && inputText[idx] !== char;

                return (
                  <span
                    key={idx}
                    className={`relative transition-colors ${
                      isCorrect
                        ? 'text-slate-100 font-medium'
                        : isWrong
                        ? 'text-rose-400 bg-rose-500/20 rounded px-0.5 underline'
                        : isCurrent
                        ? 'text-amber-400 font-bold bg-amber-500/10 rounded px-0.5'
                        : 'text-slate-600'
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute -top-1 left-0 bottom-0 w-0.5 bg-amber-400 animate-pulse" />
                    )}
                    {char === ' ' && isWrong ? '␣' : char}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Status & Restart */}
          <div className="flex items-center justify-between font-mono text-xs text-slate-400 px-2">
            <div className="flex items-center gap-4">
              <span>
                Typed: <strong className="text-slate-200">{inputText.length}</strong> / {activeTargetText.length}
              </span>
              <span>
                Errors: <strong className="text-rose-400">{currentKeystrokeErrors.length}</strong>
              </span>
            </div>

            <button
              onClick={() => {
                setInputText('');
                setStartTime(null);
                setCurrentKeystrokeErrors([]);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restart Drill</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: FINAL ASSESSMENT ARENA */}
      {activeTab === 'assessment' && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {!allDrillsCompleted ? (
            /* Locked Screen if accessed before completing Drills */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
                <Lock className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-slate-100">
                Final Assessment is Locked
              </h3>
              <p className="text-sm text-slate-400 max-w-md mx-auto">
                You must complete all 3 Guided Drills (Key Isolates, Rhythmic Words, & Contextual Phrasing) to unlock the Step 3 Final Assessment.
              </p>
              <button
                onClick={() => setActiveTab('drills')}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-2xl transition-all shadow-md inline-flex items-center gap-2"
              >
                <span>Go to Step 2: Guided Drills</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Unlocked Assessment Banner */}
              <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-slate-900 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                    <Trophy className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-300">
                      Step 3: Final Mastery Benchmark Assessment
                    </h3>
                    <p className="text-xs text-slate-400">
                      Institutional touch typing requires a <strong>strict minimum 95% accuracy</strong> and <strong>{lesson.minWpm} WPM</strong>.
                    </p>
                  </div>
                </div>

                <span className="px-3 py-1 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-mono font-bold self-start sm:self-auto">
                  Strict Benchmark: ≥95% Acc
                </span>
              </div>

              {/* Typing Arena */}
              <div
                onClick={() => inputRef.current?.focus()}
                className="relative bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 cursor-text select-none shadow-2xl min-h-[220px] flex flex-col justify-center transition-all"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={inputText}
                  onChange={handleInputChange}
                  autoFocus
                  className="absolute inset-0 opacity-0 cursor-default"
                  aria-label="Final assessment typing input"
                />

                <div
                  className="font-mono text-lg sm:text-2xl leading-relaxed tracking-wider text-left transition-all"
                  style={{ fontFamily: "'Fira Code', monospace" }}
                >
                  {activeTargetText.split('').map((char, idx) => {
                    const isTyped = idx < inputText.length;
                    const isCurrent = idx === inputText.length;
                    const isCorrect = isTyped && inputText[idx] === char;
                    const isWrong = isTyped && inputText[idx] !== char;

                    return (
                      <span
                        key={idx}
                        className={`relative transition-colors ${
                          isCorrect
                            ? 'text-slate-100 font-medium'
                            : isWrong
                            ? 'text-rose-400 bg-rose-500/20 rounded px-0.5 underline'
                            : isCurrent
                            ? 'text-amber-400 font-bold bg-amber-500/10 rounded px-0.5'
                            : 'text-slate-600'
                        }`}
                      >
                        {isCurrent && (
                          <span className="absolute -top-1 left-0 bottom-0 w-0.5 bg-amber-400 animate-pulse" />
                        )}
                        {char === ' ' && isWrong ? '␣' : char}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Status & Restart */}
              <div className="flex items-center justify-between font-mono text-xs text-slate-400 px-2">
                <div className="flex items-center gap-4">
                  <span>
                    Typed: <strong className="text-slate-200">{inputText.length}</strong> / {activeTargetText.length}
                  </span>
                  <span>
                    Errors: <strong className="text-rose-400">{currentKeystrokeErrors.length}</strong>
                  </span>
                </div>

                <button
                  onClick={() => {
                    setInputText('');
                    setStartTime(null);
                    setCurrentKeystrokeErrors([]);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restart Assessment</span>
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* RESULTS & TRANSITION MODAL */}
      {showResultsModal && lastAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center animate-in zoom-in duration-300">
            {/* Header Icon */}
            <div
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border shadow-xl ${
                isNewlyMastered || (isMastered && activeTab === 'assessment')
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-amber-500/20'
                  : activeTab === 'drills'
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-emerald-500/20'
                  : 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-rose-500/20'
              }`}
            >
              {isNewlyMastered || (isMastered && activeTab === 'assessment') ? (
                <Trophy className="w-10 h-10" />
              ) : activeTab === 'drills' ? (
                <CheckCircle2 className="w-10 h-10" />
              ) : (
                <AlertCircle className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-1.5">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                {activeTab === 'assessment'
                  ? 'Step 3: Final Assessment Results'
                  : `Step 2: Guided Drill ${activeDrillIndex + 1} of 3 Complete`}
              </span>
              <h2 className="text-2xl font-black text-slate-100">
                {activeTab === 'assessment'
                  ? isNewlyMastered || (lastAttempt.accuracy >= 95 && lastAttempt.wpm >= lesson.minWpm)
                    ? '🎉 Lesson Mastered!'
                    : 'Benchmark Not Met'
                  : `Drill ${activeDrillIndex + 1} Complete!`}
              </h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                {activeTab === 'assessment' ? (
                  lastAttempt.accuracy >= 95 && lastAttempt.wpm >= lesson.minWpm ? (
                    'Incredible work! You satisfied the strict 95% accuracy benchmark. The next lesson is now unlocked!'
                  ) : (
                    `Mastery mandates a strict minimum 95% accuracy (You scored ${lastAttempt.accuracy}%). Focus on eliminating errors and retry.`
                  )
                ) : activeDrillIndex < 2 ? (
                  `Great progress! Proceed to Drill ${activeDrillIndex + 2} of 3 to continue training your muscle memory.`
                ) : (
                  'All 3 Guided Drills completed successfully! Step 3: Final Assessment is now officially unlocked.'
                )}
              </p>
            </div>

            {/* Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase block">Speed</span>
                <span className="text-xl font-bold text-cyan-400">{lastAttempt.wpm} <span className="text-xs text-slate-500">WPM</span></span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
                <span
                  className={`text-xl font-bold ${
                    lastAttempt.accuracy >= 95
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {lastAttempt.accuracy}%
                </span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase block">Duration</span>
                <span className="text-xl font-bold text-slate-200">{lastAttempt.timeTakenSeconds}s</span>
              </div>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-500 uppercase block">Errors</span>
                <span className="text-xl font-bold text-rose-400">{lastAttempt.errors}</span>
              </div>
            </div>

            {/* Sequential Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                onClick={() => {
                  setShowResultsModal(false);
                  setInputText('');
                  setStartTime(null);
                  setCurrentKeystrokeErrors([]);
                  setTimeout(() => inputRef.current?.focus(), 100);
                }}
                className="w-full sm:w-1/2 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Retry Exercise</span>
              </button>

              {activeTab === 'drills' ? (
                <button
                  onClick={handleNextDrillOrAssessment}
                  className="w-full sm:w-1/2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>
                    {activeDrillIndex === 0
                      ? 'Proceed to Drill 2 (2/3)'
                      : activeDrillIndex === 1
                      ? 'Proceed to Drill 3 (3/3)'
                      : 'Unlock Final Assessment'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : isNewlyMastered && nextLessonInfo && onNextLesson ? (
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    onNextLesson(nextLessonInfo.lesson.id);
                  }}
                  className="w-full sm:w-1/2 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  <span>Next Lesson: Learn Concept</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setShowResultsModal(false)}
                  className="w-full sm:w-1/2 py-3 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-cyan-500/20"
                >
                  Continue
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
