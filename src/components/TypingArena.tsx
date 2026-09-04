import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest, TypingMode, SubmissionHistoryPoint } from '../types';
import { MONKEYTYPE_WORDS } from '../data/initialData';
import { soundController } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Clock,
  Type,
  Code2,
  BookOpen,
  AlertTriangle,
  Trophy,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Award,
  Hash,
  Delete
} from 'lucide-react';

interface TypingArenaProps {
  initialTest?: TypingTest | null;
  onExitProctored?: () => void;
}

export const TypingArena: React.FC<TypingArenaProps> = ({ initialTest, onExitProctored }) => {
  const {
    currentUser,
    classes,
    recordSubmission,
    soundEnabled,
    startAttempt,
    checkpoint,
    logViolation,
    submitAttempt
  } = useApp();

  // Mode selection (if not an active proctored assessment)
  const isAssessment = Boolean(initialTest);
  const [activeMode, setActiveMode] = useState<TypingMode>(
    initialTest?.category === 'code' ? 'code' : initialTest?.category === 'story' ? 'story' : 'time'
  );
  const [timeOption, setTimeOption] = useState<number>(initialTest?.timeLimit || 30);
  const [wordOption, setWordOption] = useState<number>(25);

  // Attempt authorization & status
  const [attemptBlockedError, setAttemptBlockedError] = useState<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);

  // Target text generation
  const [targetText, setTargetText] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);

  // User input states
  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');

  // Engine timing and stats
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(timeOption);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Initialize atomic attempt in Supabase if proctored assessment
  useEffect(() => {
    if (initialTest && currentUser) {
      startAttempt(initialTest.id, currentUser.id).then(res => {
        if (!res.success) {
          setAttemptBlockedError(res.message || 'Unable to start examination attempt.');
        } else if (res.attempt) {
          attemptIdRef.current = res.attempt.id;
        }
      });
    }
  }, [initialTest, currentUser, startAttempt]);

  // Keystrokes Tracking (Typing.com / Monkeytype accuracy calculation)
  const totalKeystrokesRef = useRef<number>(0);
  const correctKeystrokesRef = useRef<number>(0);
  const incorrectKeystrokesRef = useRef<number>(0);
  const backspacesRef = useRef<number>(0);
  const [keystrokes, setKeystrokes] = useState({
    total: 0,
    correct: 0,
    incorrect: 0,
    backspaces: 0
  });

  // Anti-cheat proctoring
  const [proctorBlurFlags, setProctorBlurFlags] = useState<number>(0);
  const [showBlurWarning, setShowBlurWarning] = useState<boolean>(false);

  // History tracking for WPM chart
  const [speedHistory, setSpeedHistory] = useState<SubmissionHistoryPoint[]>([]);

  // DOM & Timing references
  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastRecordedSecondRef = useRef<number>(0);
  const statsRef = useRef<{
    correctChars: number;
    incorrectChars: number;
    extraChars: number;
    totalTypedChars: number;
    rawWpm: number;
    netWpm: number;
    accuracy: number;
    errors: number;
  }>({
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    totalTypedChars: 0,
    rawWpm: 0,
    netWpm: 0,
    accuracy: 100,
    errors: 0
  });

  // Initialize or Reset the test text
  const generateNewTestText = useCallback(() => {
    if (initialTest) {
      setTargetText(initialTest.content.trim());
      setWords(initialTest.content.trim().split(/\s+/));
      setTimeLeft(initialTest.timeLimit);
      return;
    }

    if (activeMode === 'time') {
      const shuffled = [...MONKEYTYPE_WORDS].sort(() => 0.5 - Math.random());
      const selected = Array.from({ length: 140 }, (_, i) => shuffled[i % shuffled.length]);
      const text = selected.join(' ');
      setTargetText(text);
      setWords(selected);
      setTimeLeft(timeOption);
    } else if (activeMode === 'words') {
      const shuffled = [...MONKEYTYPE_WORDS].sort(() => 0.5 - Math.random());
      const selected = shuffled.slice(0, wordOption);
      const text = selected.join(' ');
      setTargetText(text);
      setWords(selected);
      setTimeLeft(999);
    } else if (activeMode === 'story') {
      const storyText =
        'The morning sun pierced the dense silver mist, illuminating the moss-covered granite pathway leading toward the high observatory. Every step echoed against the quiet mountain gorge, accompanied only by the distant whispers of alpine pines bending before the cool northern wind.';
      setTargetText(storyText);
      setWords(storyText.split(/\s+/));
      setTimeLeft(60);
    } else if (activeMode === 'code') {
      const codeText = `function calculateMetrics(records) {\n  return records.reduce((acc, curr) => {\n    acc.totalScore += curr.score;\n    acc.count += 1;\n    return acc;\n  }, { totalScore: 0, count: 0 });\n}`;
      setTargetText(codeText);
      setWords(codeText.split(/\s+/));
      setTimeLeft(90);
    }
  }, [activeMode, initialTest, timeOption, wordOption]);

  const resetTest = useCallback(() => {
    startTimeRef.current = null;
    lastRecordedSecondRef.current = 0;
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    incorrectKeystrokesRef.current = 0;
    backspacesRef.current = 0;
    setKeystrokes({ total: 0, correct: 0, incorrect: 0, backspaces: 0 });

    setTestStarted(false);
    setTestFinished(false);
    setTypedWords(['']);
    setCurrentWordIndex(0);
    setInputVal('');
    setElapsedSeconds(0);
    setSpeedHistory([]);
    setProctorBlurFlags(0);
    setShowBlurWarning(false);
    generateNewTestText();

    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  }, [generateNewTestText]);

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  // Anti-Cheat Window Blur Tracker & Visibility Change
  useEffect(() => {
    const handleBlur = () => {
      if (testStarted && !testFinished) {
        setProctorBlurFlags(prev => prev + 1);
        setShowBlurWarning(true);
        setTimeout(() => setShowBlurWarning(false), 4000);
        if (attemptIdRef.current && currentUser) {
          logViolation(attemptIdRef.current, currentUser.id, 'window_blur', { elapsedSeconds });
        }
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden' && testStarted && !testFinished) {
        setProctorBlurFlags(prev => prev + 1);
        setShowBlurWarning(true);
        setTimeout(() => setShowBlurWarning(false), 4000);
        if (attemptIdRef.current && currentUser) {
          logViolation(attemptIdRef.current, currentUser.id, 'visibility_change', { elapsedSeconds });
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [testStarted, testFinished, logViolation, currentUser, elapsedSeconds]);

  // Periodic Checkpoint: saves progress every 15 seconds to PostgreSQL without blocking typing flow
  useEffect(() => {
    if (!testStarted || testFinished || !attemptIdRef.current) return;
    const checkpointTimer = setInterval(() => {
      const curr = statsRef.current;
      checkpoint(attemptIdRef.current!, {
        netWpm: curr.netWpm,
        rawWpm: curr.rawWpm,
        accuracy: curr.accuracy,
        correctChars: curr.correctChars,
        totalChars: curr.totalTypedChars,
        errors: curr.errors,
        violationCount: proctorBlurFlags
      });
    }, 15000);
    return () => clearInterval(checkpointTimer);
  }, [testStarted, testFinished, checkpoint, proctorBlurFlags]);

  // Auto-scroll the word container to keep active word visible
  useEffect(() => {
    if (activeWordRef.current && textContainerRef.current) {
      const container = textContainerRef.current;
      const word = activeWordRef.current;
      const wordTop = word.offsetTop;
      const containerHeight = container.clientHeight;

      if (wordTop > containerHeight / 2) {
        container.scrollTop = wordTop - containerHeight / 3;
      }
    }
  }, [currentWordIndex]);

  // Real-time statistics calculation based on standard Typing.com & Monkeytype formulas:
  // WPM = (correct characters ÷ 5) ÷ elapsed minutes
  // Accuracy = correct keystrokes ÷ total keystrokes × 100
  const stats = useMemo(() => {
    let correctChars = 0;
    let incorrectChars = 0;
    let extraChars = 0;

    words.forEach((targetWord, idx) => {
      const typed = idx === currentWordIndex ? inputVal : typedWords[idx] || '';
      if (!typed && idx > currentWordIndex) return;

      const minLen = Math.min(targetWord.length, typed.length);
      for (let i = 0; i < minLen; i++) {
        if (typed[i] === targetWord[i]) {
          correctChars++;
        } else {
          incorrectChars++;
        }
      }

      if (typed.length > targetWord.length) {
        extraChars += typed.length - targetWord.length;
      } else if (idx < currentWordIndex && typed.length < targetWord.length) {
        incorrectChars += targetWord.length - typed.length;
      }

      // Space character added for finished words
      if (idx < currentWordIndex) {
        correctChars++; // space key counts as 1 correct character
      }
    });

    const totalTypedChars = correctChars + incorrectChars + extraChars;
    // Elapsed time in minutes (minimum floor of 0.5s to avoid division by zero on start)
    const timeInMinutes = Math.max(elapsedSeconds, 0.5) / 60;

    // Gross raw WPM: (total characters / 5) / elapsed minutes
    const rawWpm = Math.max(0, Math.round(totalTypedChars / 5 / timeInMinutes));
    // Official Net WPM: (correct characters / 5) / elapsed minutes
    const netWpm = Math.max(0, Math.round(correctChars / 5 / timeInMinutes));

    // Accuracy: (correct keystrokes ÷ total keystrokes) * 100
    const accuracy =
      keystrokes.total > 0
        ? Math.round((keystrokes.correct / keystrokes.total) * 1000) / 10
        : 100;

    const calculated = {
      correctChars,
      incorrectChars,
      extraChars,
      totalTypedChars,
      rawWpm,
      netWpm,
      accuracy,
      errors: incorrectChars + extraChars
    };

    statsRef.current = calculated;
    return calculated;
  }, [words, typedWords, currentWordIndex, inputVal, elapsedSeconds, keystrokes]);

  // Finish test handler
  const finishTest = useCallback(() => {
    setTestFinished(true);

    const currentStats = statsRef.current;
    const isPassing = isAssessment
      ? currentStats.accuracy >= (initialTest?.minAccuracy || 90) && currentStats.netWpm >= 20
      : currentStats.accuracy >= 90;

    if (isPassing) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    // If logged in as student or in assessment mode, record submission in persistent state
    if (currentUser) {
      const studentClass = classes.find(c => c.id === currentUser.classId) || classes[0];
      submitAttempt(attemptIdRef.current || '', {
        testId: initialTest?.id || `practice-${activeMode}`,
        testTitle: initialTest?.title || `Practice Test (${activeMode.toUpperCase()})`,
        testCategory: initialTest?.category || (activeMode === 'code' ? 'code' : activeMode === 'story' ? 'story' : 'standard'),
        language: initialTest?.language || 'none',
        studentId: currentUser.id,
        studentName: currentUser.name,
        rollNo: currentUser.rollNo || currentUser.username,
        classId: studentClass?.id || 'class-1',
        className: studentClass?.name || 'CSE Alpha (2024-28)',
        wpm: currentStats.netWpm,
        rawWpm: currentStats.rawWpm,
        netWpm: currentStats.netWpm,
        accuracy: currentStats.accuracy,
        errors: currentStats.errors,
        totalChars: currentStats.totalTypedChars,
        correctChars: currentStats.correctChars,
        timeTaken: Math.max(1, Math.round(elapsedSeconds)),
        backspaces: backspacesRef.current,
        totalKeystrokes: totalKeystrokesRef.current,
        proctorBlurFlags,
        passed: isPassing,
        history: speedHistory
      });
    }
  }, [activeMode, classes, currentUser, elapsedSeconds, initialTest, isAssessment, proctorBlurFlags, submitAttempt, speedHistory]);

  // Real-time High Frequency Clock:
  // Measures real elapsed time via performance.now().
  // Once the first character is typed, the timer continues running even when the user stops typing.
  // Never pauses/freezes simply because there is no keypress.
  // Pausing while typing naturally reduces WPM because elapsed time continues.
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const interval = setInterval(() => {
      if (!startTimeRef.current) return;
      const now = performance.now();
      const realElapsedSec = (now - startTimeRef.current) / 1000;
      setElapsedSeconds(realElapsedSec);

      // Handle timed test mode & assessment countdown
      if (activeMode === 'time' || isAssessment) {
        const timeLimit = initialTest?.timeLimit || timeOption;
        const remaining = Math.max(0, Math.ceil(timeLimit - realElapsedSec));
        setTimeLeft(remaining);

        if (realElapsedSec >= timeLimit) {
          clearInterval(interval);
          finishTest();
          return;
        }
      }

      // Record progression point once every second for the velocity graph
      const currentSecInt = Math.floor(realElapsedSec);
      if (currentSecInt > lastRecordedSecondRef.current) {
        lastRecordedSecondRef.current = currentSecInt;
        const currentStats = statsRef.current;
        setSpeedHistory(hist => [
          ...hist,
          {
            second: currentSecInt,
            wpm: currentStats.netWpm,
            rawWpm: currentStats.rawWpm,
            errors: currentStats.errors,
            accuracy: currentStats.accuracy
          }
        ]);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [testStarted, testFinished, activeMode, isAssessment, initialTest, timeOption, finishTest]);

  // Keyboard Handlers - Tracks exact keystrokes, correct/incorrect, backspaces
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (testFinished) return;

    // Start timer on first keystroke using high-precision performance timestamp
    if (!testStarted) {
      startTimeRef.current = performance.now();
      setTestStarted(true);
    }

    // Audio click feedback
    if (soundEnabled) {
      if (e.key === 'Backspace' || e.key.length === 1) {
        soundController.playKeyClick();
      }
    }

    // Ignore modifier keys alone
    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const currentTargetWord = words[currentWordIndex] || '';

    // Handle Backspace
    if (e.key === 'Backspace') {
      totalKeystrokesRef.current += 1;
      backspacesRef.current += 1;
      setKeystrokes({
        total: totalKeystrokesRef.current,
        correct: correctKeystrokesRef.current,
        incorrect: incorrectKeystrokesRef.current,
        backspaces: backspacesRef.current
      });

      if (inputVal === '' && currentWordIndex > 0) {
        e.preventDefault();
        const prevIndex = currentWordIndex - 1;
        const prevWord = typedWords[prevIndex] || '';
        setCurrentWordIndex(prevIndex);
        setInputVal(prevWord);
        setTypedWords(prev => prev.slice(0, -1));
      }
      return;
    }

    // Handle Space bar or Enter (advance to next word)
    if (e.key === ' ' || (activeMode === 'code' && e.key === 'Enter')) {
      e.preventDefault();
      if (!inputVal.trim() && inputVal !== '') {
        return;
      }

      totalKeystrokesRef.current += 1;
      // If the word was completed correctly, space was a correct keystroke; otherwise incorrect
      if (inputVal === currentTargetWord) {
        correctKeystrokesRef.current += 1;
      } else {
        incorrectKeystrokesRef.current += 1;
      }

      setKeystrokes({
        total: totalKeystrokesRef.current,
        correct: correctKeystrokesRef.current,
        incorrect: incorrectKeystrokesRef.current,
        backspaces: backspacesRef.current
      });

      const updatedWords = [...typedWords];
      updatedWords[currentWordIndex] = inputVal;

      // Completed all words in test (e.g. in word count mode or end of text)
      if (currentWordIndex + 1 >= words.length) {
        setTypedWords(updatedWords);
        finishTest();
        return;
      }

      updatedWords.push('');
      setTypedWords(updatedWords);
      setCurrentWordIndex(prev => prev + 1);
      setInputVal('');
      return;
    }

    // Handle printable single characters
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      totalKeystrokesRef.current += 1;
      const charIndex = inputVal.length;
      if (charIndex < currentTargetWord.length && e.key === currentTargetWord[charIndex]) {
        correctKeystrokesRef.current += 1;
      } else {
        incorrectKeystrokesRef.current += 1;
      }

      setKeystrokes({
        total: totalKeystrokesRef.current,
        correct: correctKeystrokesRef.current,
        incorrect: incorrectKeystrokesRef.current,
        backspaces: backspacesRef.current
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (testFinished) return;
    const val = e.target.value;
    setInputVal(val);

    const currentTarget = words[currentWordIndex] || '';
    if (val.length > 0 && soundEnabled) {
      const lastCharIndex = val.length - 1;
      if (lastCharIndex < currentTarget.length && val[lastCharIndex] !== currentTarget[lastCharIndex]) {
        soundController.playErrorSound();
      }
    }
  };

  // Anti-cheat clipboard block
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    setProctorBlurFlags(f => f + 1);
    setShowBlurWarning(true);
    setTimeout(() => setShowBlurWarning(false), 4000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Blocked Examination Attempt Banner / Screen */}
      {attemptBlockedError && (
        <div className="bg-rose-950/80 border-2 border-rose-500 rounded-2xl p-6 text-center space-y-4 shadow-2xl shadow-rose-950/50">
          <div className="w-14 h-14 mx-auto rounded-full bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-rose-200">Examination Access Restricted</h2>
            <p className="text-sm text-rose-300/80 mt-1 max-w-lg mx-auto font-mono">
              {attemptBlockedError}
            </p>
          </div>
          {onExitProctored && (
            <button
              onClick={onExitProctored}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700"
            >
              Return to Student Dashboard
            </button>
          )}
        </div>
      )}

      {/* Anti-cheat tab switch warning banner */}
      {showBlurWarning && (
        <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 p-3 rounded-xl flex items-center justify-between animate-bounce text-xs font-semibold">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>
              Proctor Warning: Pasting or unfocusing the window is forbidden during testing!
            </span>
          </div>
          <span className="font-mono bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/30">
            Flags: {proctorBlurFlags}
          </span>
        </div>
      )}

      {/* Assessment Header if Proctored */}
      {isAssessment && initialTest ? (
        <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-cyan-500/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-cyan-500/30">
                PROCTORED ASSESSMENT
              </span>
              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono capitalize">
                {initialTest.category} module
              </span>
              {initialTest.language && initialTest.language !== 'none' && (
                <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                  {initialTest.language}
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-100">{initialTest.title}</h2>
            <p className="text-xs text-slate-400 max-w-xl">{initialTest.description}</p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-mono">TARGET CRITERIA</div>
              <div className="font-bold text-cyan-400">Min {initialTest.minAccuracy}% Accuracy</div>
            </div>
            {onExitProctored && (
              <button
                onClick={onExitProctored}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Exit Assessment
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Mode Switch Bar (Monkeytype Style) */
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 p-2.5 rounded-2xl">
          {/* Modes */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => {
                setActiveMode('time');
                resetTest();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeMode === 'time'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>time</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('words');
                resetTest();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeMode === 'words'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>words</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('story');
                resetTest();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeMode === 'story'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>story</span>
            </button>

            <button
              onClick={() => {
                setActiveMode('code');
                resetTest();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeMode === 'code'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>code</span>
            </button>
          </div>

          {/* Sub-options based on active mode */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {activeMode === 'time' && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[15, 30, 60, 120].map(sec => (
                  <button
                    key={sec}
                    onClick={() => {
                      setTimeOption(sec);
                      resetTest();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      timeOption === sec
                        ? 'text-cyan-400 bg-cyan-500/15'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sec}
                  </button>
                ))}
              </div>
            )}

            {activeMode === 'words' && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[10, 25, 50, 100].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => {
                      setWordOption(cnt);
                      resetTest();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                      wordOption === cnt
                        ? 'text-cyan-400 bg-cyan-500/15'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Real-time HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Net Speed
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400">{stats.netWpm}</div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 text-right">
            raw <span className="text-slate-300 font-bold">{stats.rawWpm}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Accuracy
            </div>
            <div className="text-2xl font-black font-mono text-slate-100">{stats.accuracy}%</div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 text-right">
            err <span className="text-rose-400 font-bold">{stats.errors}</span>
            <div className="text-[10px] text-slate-600">{keystrokes.backspaces} bksp</div>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {activeMode === 'time' || isAssessment ? 'Timer Left' : 'Elapsed'}
            </div>
            <div className="text-2xl font-black font-mono text-cyan-400">
              {activeMode === 'time' || isAssessment
                ? `${timeLeft}s`
                : `${Math.floor(elapsedSeconds)}s`}
            </div>
          </div>
          <Clock className="w-5 h-5 text-slate-700" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Proctor Flags
            </div>
            <div
              className={`text-2xl font-black font-mono ${
                proctorBlurFlags > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
              }`}
            >
              {proctorBlurFlags}
            </div>
          </div>
          <ShieldAlert
            className={`w-5 h-5 ${proctorBlurFlags > 0 ? 'text-rose-500' : 'text-slate-700'}`}
          />
        </div>
      </div>

      {/* Main Interactive Typing Container */}
      {!testFinished ? (
        <div
          onClick={() => inputRef.current?.focus()}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className="relative bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 cursor-text select-none shadow-xl min-h-[260px] flex flex-col justify-center"
        >
          {/* Hidden text input for handling keyboard events smoothly */}
          <input
            ref={inputRef}
            type="text"
            value={inputVal}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            autoFocus
            className="absolute inset-0 opacity-0 cursor-default"
            aria-label="Typing input area"
          />

          {/* Words Container */}
          <div
            ref={textContainerRef}
            className="max-h-60 overflow-y-auto font-mono text-lg sm:text-2xl leading-relaxed tracking-wide space-x-2 text-left relative transition-all"
            style={{ fontFamily: "'Fira Code', monospace" }}
          >
            {words.map((word, wIdx) => {
              const isActive = wIdx === currentWordIndex;
              const currentInput = isActive ? inputVal : typedWords[wIdx] || '';

              return (
                <span
                  key={wIdx}
                  ref={isActive ? activeWordRef : null}
                  className={`inline-block py-1 rounded transition-colors ${
                    isActive ? 'bg-slate-800/40 px-1' : ''
                  }`}
                >
                  {word.split('').map((char, cIdx) => {
                    let charColor = 'text-slate-600'; // untyped
                    let bg = '';

                    if (cIdx < currentInput.length) {
                      if (currentInput[cIdx] === char) {
                        charColor = 'text-slate-100 font-medium'; // correct
                      } else {
                        charColor = 'text-rose-400';
                        bg = 'bg-rose-500/20'; // incorrect
                      }
                    }

                    const isCaretHere = isActive && cIdx === currentInput.length;

                    return (
                      <span key={cIdx} className={`relative ${charColor} ${bg} rounded-sm px-[1px]`}>
                        {isCaretHere && (
                          <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-cyan-400 animate-pulse" />
                        )}
                        {char}
                      </span>
                    );
                  })}

                  {/* Extra letters typed beyond target word */}
                  {currentInput.length > word.length &&
                    currentInput
                      .slice(word.length)
                      .split('')
                      .map((extraChar, eIdx) => (
                        <span
                          key={`extra-${eIdx}`}
                          className="text-rose-400 line-through bg-rose-950/40 px-[1px]"
                        >
                          {extraChar}
                        </span>
                      ))}

                  {/* Caret at the end of word */}
                  {isActive && currentInput.length >= word.length && (
                    <span className="relative">
                      <span className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-cyan-400 animate-pulse" />
                    </span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Quick bottom hint */}
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-slate-800/80">
            <div>
              {!testStarted ? (
                <span className="text-cyan-400/90 font-semibold animate-pulse">
                  Start typing to begin assessment timer...
                </span>
              ) : (
                <span>Space to advance word • Backspace to correct</span>
              )}
            </div>
            {!initialTest?.isCustomAssignment && (
              <button
                onClick={resetTest}
                className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>restart test</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Results Scorecard (Typing.com & Monkeytype style) */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                  Assessment Completed
                </span>
                {initialTest?.isCustomAssignment && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Single Attempt Recorded
                  </span>
                )}
                {proctorBlurFlags > 0 ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Flagged ({proctorBlurFlags} Tab Switches)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Proctor Clean
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-100 mt-2">
                {initialTest ? initialTest.title : 'Typing Speed Evaluation'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {!initialTest?.isCustomAssignment && (
                <button
                  onClick={resetTest}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Test</span>
                </button>
              )}

              {onExitProctored && (
                <button
                  onClick={onExitProctored}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm shadow-cyan-500/20"
                >
                  <span>View Dashboard & Leaderboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Core Big Metric Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400">NET WPM</div>
              <div className="text-4xl font-black font-mono text-cyan-400 mt-1">{stats.netWpm}</div>
              <div className="text-[11px] text-slate-500 mt-1">Official Benchmark</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400">ACCURACY</div>
              <div className="text-4xl font-black font-mono text-slate-100 mt-1">{stats.accuracy}%</div>
              <div className="text-[11px] text-slate-500 mt-1">{stats.errors} errors made</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400">RAW GROSS WPM</div>
              <div className="text-4xl font-black font-mono text-slate-100 mt-1">{stats.rawWpm}</div>
              <div className="text-[11px] text-slate-500 mt-1">Total keystrokes: {keystrokes.total}</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400">TIME TAKEN</div>
              <div className="text-4xl font-black font-mono text-indigo-300 mt-1">
                {Math.max(1, Math.round(elapsedSeconds))}s
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.accuracy >= (initialTest?.minAccuracy || 90) ? (
                  <span className="text-emerald-400 font-bold">PASSED CRITERIA</span>
                ) : (
                  <span className="text-rose-400 font-bold">BELOW TARGET</span>
                )}
              </div>
            </div>
          </div>

          {/* Granular Character & Keystroke Breakdown Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 text-xs font-mono">
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">CORRECT CHARS</span>
              <span className="text-emerald-400 font-bold text-base mt-0.5">{stats.correctChars}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">INCORRECT / MISSED</span>
              <span className="text-rose-400 font-bold text-base mt-0.5">{stats.errors}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">CORRECT KEYSTROKES</span>
              <span className="text-cyan-400 font-bold text-base mt-0.5">{keystrokes.correct} / {keystrokes.total}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-slate-500 text-[10px]">BACKSPACES USED</span>
              <span className="text-amber-400 font-bold text-base mt-0.5">{keystrokes.backspaces}</span>
            </div>
          </div>

          {/* SVG Progression Speed Chart */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200">WPM Velocity Curve</span>
              </div>
              <div>Seconds Progression</div>
            </div>

            <div className="h-40 w-full relative pt-4">
              {speedHistory.length > 1 ? (
                <svg className="w-full h-full overflow-visible" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {/* Grid lines */}
                  <line x1="0" y1="30" x2="500" y2="30" stroke="#334155" strokeDasharray="3,3" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="#334155" strokeDasharray="3,3" />
                  <line x1="0" y1="90" x2="500" y2="90" stroke="#334155" strokeDasharray="3,3" />

                  {/* Gradient fill */}
                  <defs>
                    <linearGradient id="wpmGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Calculate path coordinates */}
                  {(() => {
                    const maxWpm = Math.max(...speedHistory.map(h => h.wpm), 80);
                    const points = speedHistory.map((pt, i) => {
                      const x = (i / (speedHistory.length - 1)) * 500;
                      const y = 110 - (pt.wpm / maxWpm) * 95;
                      return `${x},${y}`;
                    });

                    const pathStr = `M ${points.join(' L ')}`;
                    const areaStr = `${pathStr} L 500,110 L 0,110 Z`;

                    return (
                      <>
                        <path d={areaStr} fill="url(#wpmGradient)" />
                        <path d={pathStr} fill="none" stroke="#22d3ee" strokeWidth="2.5" />
                        {points.map((ptStr, idx) => {
                          const [cx, cy] = ptStr.split(',');
                          return (
                            <circle
                              key={idx}
                              cx={cx}
                              cy={cy}
                              r="3"
                              fill="#22d3ee"
                              stroke="#0f172a"
                              strokeWidth="1.5"
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">
                  Test ended before velocity curve could be plotted.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
