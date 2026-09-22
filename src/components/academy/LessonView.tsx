import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  AcademyLesson,
  AcademyLevel,
  StudentAcademyProfile,
  StudentLessonAttempt,
  FingerAssignment
} from '../../types';
import {
  FINGER_PALETTE
} from '../../data/academyCurriculum';
import {
  recordStudentLessonAttempt,
  getTopWeakKeys,
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
  HelpCircle,
  Volume2,
  VolumeX,
  Gauge
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

export const LessonView: React.FC<LessonViewProps> = ({
  lesson,
  level,
  profile,
  studentId,
  onBack,
  onNextLesson,
  onProfileUpdated,
}) => {
  // Lesson phase: 'learn' | 'guided' | 'practice' | 'assessment'
  const [activeTab, setActiveTab] = useState<'learn' | 'guided' | 'practice' | 'assessment'>('learn');

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

  // Input ref
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine current target text based on active tab
  const activeTargetText = useMemo(() => {
    switch (activeTab) {
      case 'guided':
        return lesson.guidedText;
      case 'practice':
        return lesson.practiceText;
      case 'assessment':
        return lesson.assessmentText;
      default:
        return lesson.guidedText;
    }
  }, [activeTab, lesson]);

  // Current lesson progress
  const lessonProgress = profile.lessonProgress[lesson.id];
  const isMastered = lessonProgress?.status === 'mastered';
  const isGuidedCompleted = Boolean(
    lessonProgress?.guidedCompleted ||
    isMastered ||
    profile.trainerOverrideUnlockAll
  );

  const [lockedNotice, setLockedNotice] = useState<string | null>(null);

  // Find next lesson
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

  // Reset typing state when tab changes
  useEffect(() => {
    setInputText('');
    setStartTime(null);
    setEndTime(null);
    setCurrentKeystrokeErrors([]);
    setShowResultsModal(false);
    if (activeTab !== 'learn') {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [activeTab, lesson.id]);

  // Handle keystroke input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const target = activeTargetText;

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    // Identify mistake in latest character
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

    // Check completion
    if (val.length >= target.length) {
      finishAttempt(val);
    }
  };

  // Finish Attempt calculation
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

    // Standard metric: 5 chars = 1 word
    const rawWpm = Math.max(0, Math.round((typedVal.length / 5) / elapsedMinutes));
    const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
    const accuracy = typedVal.length > 0
      ? Math.max(0, Math.round((correctChars / typedVal.length) * 100))
      : 100;

    // Record attempt
    const { attempt, profile: updatedProfile, newlyMastered } = recordStudentLessonAttempt(
      studentId,
      {
        studentId,
        lessonId: lesson.id,
        levelId: level.id,
        phase: activeTab === 'learn' ? 'guided' : activeTab,
        wpm: netWpm,
        rawWpm,
        accuracy,
        correctChars,
        incorrectChars,
        totalChars: typedVal.length,
        errors: incorrectChars,
        timeTakenSeconds: elapsedSeconds,
        passed: netWpm >= lesson.minWpm && accuracy >= lesson.minAccuracy,
        mastered: netWpm >= lesson.minWpm && accuracy >= lesson.minAccuracy,
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
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {}
    }
  };

  // Current target character & finger guide for guided mode
  const currentTargetChar = activeTargetText[inputText.length] || '';
  const currentFingerGuide = lesson.targetFingers.find(
    tf => tf.key.toLowerCase() === currentTargetChar.toLowerCase()
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
      {/* Top Navigation & Status Bar */}
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
                  <CheckCircle2 className="w-3 h-3" /> Mastered
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2 mt-0.5">
              {lesson.title}
            </h1>
          </div>
        </div>

        {/* Lesson Criteria Requirements */}
        <div className="flex items-center gap-3 self-end sm:self-auto font-mono text-xs">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-emerald-400" />
            <span>Min Acc: <strong className="text-emerald-300">{lesson.minAccuracy}%</strong></span>
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

      {/* Strict Step Progression: Step 1 Learn -> Step 2 Guided Drill -> Step 3 Mini Assessment (Locked until Guided Drill is complete) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950/60 p-1.5 rounded-2xl border border-slate-800/80">
        <button
          onClick={() => {
            setLockedNotice(null);
            setActiveTab('learn');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'learn'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>1. Learn Concept</span>
        </button>

        <button
          onClick={() => {
            setLockedNotice(null);
            setActiveTab('guided');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'guided'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : isGuidedCompleted
              ? 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-900'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Keyboard className="w-4 h-4" />
          <span>2. Guided Drill</span>
          {isGuidedCompleted && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
        </button>

        <button
          onClick={() => {
            setLockedNotice(null);
            setActiveTab('practice');
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            activeTab === 'practice'
              ? 'bg-amber-500 text-slate-950 shadow-md font-black'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Free Practice</span>
        </button>

        <button
          onClick={() => {
            if (!isGuidedCompleted) {
              setLockedNotice("Mini Assessment is Locked! You must complete Step 2: Guided Drill first before taking this assessment.");
            } else {
              setLockedNotice(null);
              setActiveTab('assessment');
            }
          }}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            !isGuidedCompleted
              ? 'bg-slate-900/40 text-slate-500 border border-slate-800/80 cursor-not-allowed opacity-75'
              : activeTab === 'assessment'
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 shadow-md font-black'
              : isMastered
              ? 'text-amber-400 hover:text-amber-300 hover:bg-slate-900'
              : 'text-cyan-400 hover:text-cyan-300 hover:bg-slate-900 font-bold'
          }`}
          title={!isGuidedCompleted ? 'Complete Guided Drill to unlock' : 'Open Mini Assessment'}
        >
          {!isGuidedCompleted ? (
            <Lock className="w-3.5 h-3.5 text-amber-500/80" />
          ) : (
            <Trophy className="w-4 h-4" />
          )}
          <span>3. Mini Assessment</span>
          {!isGuidedCompleted && (
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              Locked
            </span>
          )}
        </button>
      </div>

      {/* Locked Notice Banner */}
      {lockedNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-amber-200 font-medium">
              {lockedNotice}
            </p>
          </div>
          <button
            onClick={() => {
              setLockedNotice(null);
              setActiveTab('guided');
            }}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl transition-colors whitespace-nowrap self-end sm:self-auto flex items-center gap-1.5"
          >
            <span>Start Step 2: Guided Drill</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* TAB 1: LEARN & FINGER GUIDE */}
      {activeTab === 'learn' && (
        <div className="space-y-6">
          {/* Objective & Concept Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="space-y-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                Learning Objective
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">
                {lesson.objective}
              </h2>
              <p className="text-slate-400 leading-relaxed text-sm pt-2">
                {lesson.concept}
              </p>
            </div>

            {/* Keys Introduced in this lesson */}
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

            {/* Finger & Hand Position Guide Table */}
            {lesson.targetFingers.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-800">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Anatomical Finger Assignments
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
                              {palette.name}
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

            {/* Call to action: Proceed to Guided Drill */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Step 1 of 3 complete • Finger assignments reviewed
              </span>
              <button
                onClick={() => {
                  setLockedNotice(null);
                  setActiveTab('guided');
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                <span>Proceed to Step 2: Guided Drill</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABS 2, 3, 4: INTERACTIVE TYPING ARENA */}
      {activeTab !== 'learn' && (
        <div className="space-y-6">
          {/* Active Guidance Prompt for Guided Mode */}
          {activeTab === 'guided' && currentFingerGuide && (
            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center font-mono font-black text-2xl border"
                  style={{
                    backgroundColor: `${FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b'}20`,
                    borderColor: `${FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b'}50`,
                    color: FINGER_PALETTE[currentFingerGuide.finger]?.color || '#f59e0b',
                  }}
                >
                  {currentTargetChar === ' ' ? '␣' : currentTargetChar.toUpperCase()}
                </div>
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                    Next Stroke
                  </span>
                  <span className="text-sm font-bold text-slate-100">
                    Use your{' '}
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

          {/* Assessment Mode Banner */}
          {activeTab === 'assessment' && (
            <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Trophy className="w-5 h-5 text-amber-400" />
                <div>
                  <span className="text-xs font-bold text-amber-300 block">
                    Mastery Benchmark Assessment
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Type the passage accurately. Maintain {lesson.minAccuracy}% accuracy & {lesson.minWpm} WPM to master this lesson.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Flow Typing Box */}
          <div
            onClick={() => inputRef.current?.focus()}
            className="relative bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-3xl p-6 sm:p-8 cursor-text select-none shadow-2xl min-h-[200px] flex flex-col justify-center transition-all"
          >
            {/* Hidden native input */}
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={handleInputChange}
              autoFocus
              className="absolute inset-0 opacity-0 cursor-default"
              aria-label="Typing lesson input"
            />

            {/* Character-by-Character Visualizer */}
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

          {/* Controls below typing box */}
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

      {/* RESULTS MODAL (Triggered on completion of any drill/assessment) */}
      {showResultsModal && lastAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 text-center animate-in zoom-in duration-300">
            {/* Header Icon */}
            <div
              className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center border shadow-xl ${
                isNewlyMastered || isMastered
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-amber-500/20'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-cyan-500/20'
              }`}
            >
              {isNewlyMastered || isMastered ? (
                <Trophy className="w-10 h-10" />
              ) : (
                <CheckCircle2 className="w-10 h-10" />
              )}
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                {activeTab === 'assessment'
                  ? 'Step 3: Assessment Results'
                  : activeTab === 'guided'
                  ? 'Step 2: Guided Drill Complete'
                  : 'Free Practice Complete'}
              </span>
              <h2 className="text-2xl font-black text-slate-100">
                {activeTab === 'guided'
                  ? 'Guided Drill Completed!'
                  : isNewlyMastered
                  ? 'Lesson Mastered!'
                  : isMastered
                  ? 'Great Repetition!'
                  : activeTab === 'assessment'
                  ? 'Attempt Recorded'
                  : 'Practice Complete'}
              </h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                {activeTab === 'guided'
                  ? 'Excellent execution! Step 3: Mini Assessment is now officially unlocked for this lesson.'
                  : isNewlyMastered
                  ? 'You satisfied the speed & accuracy benchmarks. The next lesson is now unlocked!'
                  : activeTab === 'assessment'
                  ? `Requirements: ${lesson.minAccuracy}% Accuracy & ${lesson.minWpm} WPM. Keep practicing!`
                  : 'Every repetition builds stronger neural muscle memory.'}
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
                    lastAttempt.accuracy >= lesson.minAccuracy
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

            {/* Weak Keys Detected (if any) */}
            {lastAttempt.weakKeysDetected.length > 0 && (
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-left space-y-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                  Weak Keys Identified in this Attempt
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {lastAttempt.weakKeysDetected.map(k => (
                    <span
                      key={k}
                      className="px-2 py-0.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-mono text-xs font-bold"
                    >
                      Key '{k === ' ' ? 'Space' : k.toUpperCase()}'
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
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
                <span>Practice Again</span>
              </button>

              {activeTab === 'guided' ? (
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    setLockedNotice(null);
                    setActiveTab('assessment');
                  }}
                  className="w-full sm:w-1/2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>Step 3: Begin Mini Assessment</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : isNewlyMastered && nextLessonInfo && onNextLesson ? (
                <button
                  onClick={() => {
                    setShowResultsModal(false);
                    onNextLesson(nextLessonInfo.lesson.id);
                  }}
                  className="w-full sm:w-1/2 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-4 h-4" />
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
