import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest, TypingMode, SubmissionHistoryPoint } from '../types';
import { MONKEYTYPE_WORDS } from '../data/initialData';
import { soundController } from '../utils/audio';
import confetti from 'canvas-confetti';
import { D3SessionChart } from './D3SessionChart';
import { D3FingerHeatmap } from './D3FingerHeatmap';
import { MechanicalKeyboard } from './MechanicalKeyboard';
import { recordKeystrokeEvent } from '../services/keystrokeAnalyticsService';
import {
  evaluateTypingSession,
  calculateGrossWpm,
  calculateNetWpm,
  calculateAccuracy,
  calculateConsistency,
  TypingMetrics
} from '../utils/typingCalculations';
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
  Delete,
  Hand,
  Share2,
  Sparkles,
  Zap,
  Gauge,
  Check
} from 'lucide-react';

interface TypingArenaProps {
  initialTest?: TypingTest | null;
  onExitProctored?: () => void;
  onSelectDifferentTest?: () => void;
}

const WordRenderer = React.memo(({ rawWord, wIdx, isActive, currentInput, activeWordRef }: any) => {
  const word = rawWord.trim();
  const wordStart = rawWord.indexOf(word);
  const prefix = wordStart >= 0 ? rawWord.substring(0, wordStart) : '';
  const newlines = (prefix.match(/\n/g) || []).length;
  const indentStr = prefix.split('\n').pop() || '';
  const indentCount = indentStr.length;

  return (
    <React.Fragment key={wIdx}>
      {newlines > 0 && Array.from({ length: newlines }).map((_, i) => (
        <div key={`nl-${wIdx}-${i}`} className={`w-full ${i > 0 ? 'h-6' : 'h-0'} basis-full`}></div>
      ))}
      {newlines > 0 && indentCount > 0 && (
        <span style={{ width: `${indentCount * 1}ch` }} className="inline-block pointer-events-none select-none"></span>
      )}
      <span
        ref={isActive ? activeWordRef : null}
        className={`inline-block py-1 rounded transition-colors mr-2 ${
          isActive ? 'bg-slate-800/80 px-1.5 ring-1 ring-emerald-400/40' : ''
        }`}
      >
        {word.split('').map((char: string, cIdx: number) => {
          let charColor = 'text-slate-500';
          let bg = '';

          if (cIdx < currentInput.length) {
            if (currentInput[cIdx] === char) {
              charColor = 'text-emerald-400 font-semibold';
            } else {
              charColor = 'text-rose-400 font-semibold';
              bg = 'bg-rose-500/25';
            }
          }

          const isCaretHere = isActive && cIdx === currentInput.length;

          return (
            <span key={cIdx} className="relative inline-block">
              {isCaretHere && (
                <span className="absolute -left-[1px] top-1 bottom-1 w-[2.5px] bg-emerald-400 animate-pulse rounded-full shadow-[0_0_8px_#10b981]" />
              )}
              <span className={`${charColor} ${bg} rounded-sm px-[0.5px]`}>{char}</span>
            </span>
          );
        })}
        {currentInput.length > word.length &&
          currentInput.substring(word.length).split('').map((char: string, idx: number) => (
            <span key={`extra-${idx}`} className="relative inline-block">
              {isActive && idx === currentInput.length - word.length - 1 && (
                <span className="absolute -left-[1px] top-1 bottom-1 w-[2.5px] bg-emerald-400 animate-pulse rounded-full" />
              )}
              <span className="text-rose-400 bg-rose-500/30 rounded-sm px-[0.5px] line-through">{char}</span>
            </span>
          ))}
        {isActive && currentInput.length >= word.length && (
          <span className="relative inline-block">
            <span className="absolute -left-[1px] top-1 bottom-1 h-full w-[2.5px] bg-emerald-400 animate-pulse rounded-full shadow-[0_0_8px_#10b981]" />
          </span>
        )}
      </span>
    </React.Fragment>
  );
});

export const TypingArena: React.FC<TypingArenaProps> = ({
  initialTest,
  onExitProctored,
  onSelectDifferentTest
}) => {
  const {
    currentUser,
    recordSubmission,
    soundEnabled,
    startAttempt,
    submitAttempt,
    logViolation
  } = useApp();

  const isAssessment = Boolean(initialTest);

  // Available Modes & Configurations
  const [activeMode, setActiveMode] = useState<TypingMode>(
    initialTest?.category === 'code' ? 'code' : initialTest?.category === 'story' ? 'story' : 'time'
  );
  const [timeOption, setTimeOption] = useState<number>(initialTest?.timeLimit || 30);
  const [wordOption, setWordOption] = useState<number>(25);

  const [attemptBlockedError, setAttemptBlockedError] = useState<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);

  // Words & Progress State
  const [targetText, setTargetText] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);
  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');

  // Clock & Execution State
  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(timeOption);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // Live Metrics & Telemetry
  const startTimeRef = useRef<number | null>(null);
  const isSubmittingRef = useRef<boolean>(false);
  const lastRecordedSecondRef = useRef<number>(0);
  const lastKeyTimestampRef = useRef<number>(Date.now());
  const tabPressedTimestampRef = useRef<number>(0);

  const [proctorBlurFlags, setProctorBlurFlags] = useState<number>(0);
  const [speedHistory, setSpeedHistory] = useState<SubmissionHistoryPoint[]>([]);
  const [showBiometrics, setShowBiometrics] = useState<boolean>(false);
  const [shareCopied, setShareCopied] = useState<boolean>(false);

  // Authoritative metrics snapshot
  const [metrics, setMetrics] = useState<TypingMetrics>({
    grossWpm: 0,
    netWpm: 0,
    accuracy: 100,
    consistency: 100,
    correctChars: 0,
    incorrectChars: 0,
    extraChars: 0,
    totalTypedChars: 0,
    errors: 0,
    elapsedSeconds: 0,
    wordsCompleted: 0,
    totalWords: 0
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const activeWordRef = useRef<HTMLSpanElement>(null);

  // Initialize attempt if proctored assessment
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

  useEffect(() => {
    if (initialTest) {
      setActiveMode(
        initialTest.category === 'code' ? 'code' : initialTest.category === 'story' ? 'story' : 'time'
      );
      setTimeOption(initialTest.timeLimit || 30);
    }
  }, [initialTest]);

  // Generate test content based on selected mode
  const generateNewTestText = useCallback(() => {
    if (initialTest) {
      setTargetText(initialTest.content.trim());
      setWords(initialTest.content.match(/\s*\S+/g) || []);
      return;
    }

    if (activeMode === 'code') {
      const codeSnippets = [
        `function binarySearch(arr, target) {\n  let low = 0, high = arr.length - 1;\n  while (low <= high) {\n    let mid = Math.floor((low + high) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}`,
        `def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)`,
        `const debounce = (fn, delay = 300) => {\n  let timerId;\n  return (...args) => {\n    clearTimeout(timerId);\n    timerId = setTimeout(() => fn(...args), delay);\n  };\n};`,
        `SELECT department, COUNT(id) as total_users, AVG(wpm) as avg_speed\nFROM examinees\nWHERE active = TRUE\nGROUP BY department\nHAVING COUNT(id) >= 5\nORDER BY avg_speed DESC;`,
        `#include <iostream>\n#include <vector>\n#include <algorithm>\n\nint main() {\n    std::vector<int> nums = {4, 2, 7, 1, 9};\n    std::sort(nums.begin(), nums.end());\n    for (int n : nums) std::cout << n << " ";\n    return 0;\n}`
      ];
      const selected = codeSnippets[Math.floor(Math.random() * codeSnippets.length)];
      setTargetText(selected);
      setWords(selected.match(/\s*\S+/g) || []);
      return;
    }

    if (activeMode === 'story') {
      const stories = [
        "In the quiet laboratory, researchers watched as crystalline neural processors calculated quantum simulations with effortless precision. Every keystroke echoed across the silent floor, tracing pathways of computational elegance that bridged theoretical mathematics with real-world architecture.",
        "The ancient lighthouse keeper ascended the spiral granite staircase at twilight. Outside, violent ocean breakers crashed against basalt reefs, but within the lantern vault, the polished brass gears turned in perfect mechanical harmony, casting golden beacons into the dark horizon.",
        "A symphony of rain tapped gently against the high conservatory glass as steam rose from porcelain teacups. Across the polished mahogany desk, ink dried slowly on parchment maps detailing unchartered archipelagoes and forgotten trade routes across the southern seas."
      ];
      const selected = stories[Math.floor(Math.random() * stories.length)];
      setTargetText(selected);
      setWords(selected.match(/\s*\S+/g) || []);
      return;
    }

    // Word or Time mode
    const count = activeMode === 'words' ? wordOption : 100;
    const shuffled: string[] = [];
    for (let i = 0; i < count; i++) {
      shuffled.push(MONKEYTYPE_WORDS[Math.floor(Math.random() * MONKEYTYPE_WORDS.length)]);
    }
    const txt = shuffled.join(' ');
    setTargetText(txt);
    setWords(txt.match(/\s*\S+/g) || []);
  }, [initialTest, activeMode, wordOption]);

  // Clean reset of all test state (flawless idempotency)
  const resetTest = useCallback(() => {
    isSubmittingRef.current = false;
    setTestStarted(false);
    setTestFinished(false);
    setTimeLeft(timeOption);
    setElapsedSeconds(0);
    setInputVal('');
    setTypedWords(['']);
    setCurrentWordIndex(0);
    setSpeedHistory([]);
    setProctorBlurFlags(0);
    setShareCopied(false);
    startTimeRef.current = null;
    lastRecordedSecondRef.current = 0;
    tabPressedTimestampRef.current = 0;

    setMetrics({
      grossWpm: 0,
      netWpm: 0,
      accuracy: 100,
      consistency: 100,
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      totalTypedChars: 0,
      errors: 0,
      elapsedSeconds: 0,
      wordsCompleted: 0,
      totalWords: 0
    });

    generateNewTestText();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [timeOption, generateNewTestText]);

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  // Compute live metrics snapshot using authoritative engine
  const computeLiveMetrics = useCallback(() => {
    return evaluateTypingSession({
      typedWords,
      targetWords: words,
      currentWordIndex,
      currentInput: inputVal,
      startTime: startTimeRef.current,
      history: speedHistory
    });
  }, [typedWords, words, currentWordIndex, inputVal, speedHistory]);

  // Finish and record test attempt (idempotent, protected against race conditions)
  const finishTest = useCallback(async (
    overrideTypedWords?: string[],
    overrideInputVal?: string,
    overrideCurrentIndex?: number
  ) => {
    if (isSubmittingRef.current || testFinished) return;
    isSubmittingRef.current = true;
    setTestFinished(true);

    const finishTimestamp = Date.now();
    const finalTypedWords = overrideTypedWords ?? typedWords;
    const finalInputVal = overrideInputVal ?? inputVal;
    const finalWordIndex = overrideCurrentIndex ?? currentWordIndex;

    const finalMetrics = evaluateTypingSession({
      typedWords: finalTypedWords,
      targetWords: words,
      currentWordIndex: finalWordIndex,
      currentInput: finalInputVal,
      startTime: startTimeRef.current,
      endTime: finishTimestamp,
      history: speedHistory
    });

    setMetrics(finalMetrics);

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    const submissionPayload = {
      testId: initialTest ? initialTest.id : `practice-${activeMode}-${Date.now()}`,
      testTitle: initialTest ? initialTest.title : `TYPETEST Free Practice (${activeMode.toUpperCase()})`,
      studentId: currentUser?.id || 'guest',
      studentName: currentUser?.name || 'Guest Typist',
      rollNo: currentUser?.rollNo || 'GUEST',
      grossWpm: finalMetrics.grossWpm,
      netWpm: finalMetrics.netWpm,
      accuracy: finalMetrics.accuracy,
      errorCount: finalMetrics.errors,
      characterCount: finalMetrics.totalTypedChars,
      timeSpentSeconds: Math.max(1, Math.round(finalMetrics.elapsedSeconds)),
      history: speedHistory,
      passed: finalMetrics.accuracy >= (initialTest?.minAccuracy || 90)
    };

    if (attemptIdRef.current) {
      await submitAttempt(attemptIdRef.current, submissionPayload);
    } else {
      await recordSubmission(submissionPayload);
    }
  }, [
    testFinished,
    typedWords,
    words,
    currentWordIndex,
    inputVal,
    speedHistory,
    initialTest,
    activeMode,
    currentUser,
    submitAttempt,
    recordSubmission
  ]);

  // Timestamp-based live timer loop
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.max(0, (now - (startTimeRef.current || now)) / 1000);
      setElapsedSeconds(elapsed);

      // Time-based limit check
      if (activeMode === 'time' || isAssessment) {
        const remaining = Math.max(0, timeOption - Math.floor(elapsed));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          finishTest();
          return;
        }
      }

      // Record second-by-second performance timeline
      const currentSec = Math.floor(elapsed);
      if (currentSec > lastRecordedSecondRef.current) {
        lastRecordedSecondRef.current = currentSec;
        const live = computeLiveMetrics();
        setMetrics(live);
        setSpeedHistory(prev => [
          ...prev,
          {
            second: currentSec,
            wpm: live.netWpm,
            rawWpm: live.grossWpm,
            errors: live.errors,
            accuracy: live.accuracy
          }
        ]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [testStarted, testFinished, activeMode, isAssessment, timeOption, finishTest, computeLiveMetrics]);

  // Tab + Enter Global/Arena Keyboard Shortcut
  useEffect(() => {
    const handleGlobalShortcuts = (e: KeyboardEvent) => {
      // Don't trigger if user is actively in a form or input modal outside arena
      const activeEl = document.activeElement;
      const isInput = activeEl?.tagName === 'INPUT' || activeEl?.tagName === 'TEXTAREA' || activeEl?.tagName === 'SELECT';
      const isArenaInput = activeEl === inputRef.current;

      if (isInput && !isArenaInput) {
        return;
      }

      // TAB + ENTER restart shortcut
      if (e.key === 'Tab') {
        tabPressedTimestampRef.current = Date.now();
      }

      if (e.key === 'Enter') {
        const now = Date.now();
        // If Tab was pressed within last 600ms, or Tab is held
        if (now - tabPressedTimestampRef.current <= 600) {
          e.preventDefault();
          resetTest();
          return;
        }
      }
    };

    window.addEventListener('keydown', handleGlobalShortcuts);
    return () => window.removeEventListener('keydown', handleGlobalShortcuts);
  }, [resetTest]);

  // Keystroke Handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Tab key inside arena: prevent default focus navigation and track for Tab + Enter
    if (e.key === 'Tab') {
      e.preventDefault();
      tabPressedTimestampRef.current = Date.now();
      return;
    }

    if (e.key === 'Enter' && Date.now() - tabPressedTimestampRef.current <= 600) {
      e.preventDefault();
      resetTest();
      return;
    }

    if (testFinished) return;

    if (soundEnabled) {
      if (e.key === 'Backspace' || e.key.length === 1) {
        soundController.playKeyClick();
      }
    }

    // Start timer on first printable keypress
    if (!testStarted) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setTestStarted(true);
        startTimeRef.current = Date.now();
      }
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock'].includes(e.key)) {
      return;
    }

    const currentTargetWord = (words[currentWordIndex] || '').trim();

    // Backspace handling: allows jumping back to previous word if current word is empty
    if (e.key === 'Backspace') {
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

    const now = Date.now();
    const latency = Math.min(600, now - lastKeyTimestampRef.current);
    lastKeyTimestampRef.current = now;

    // Word submission via Space or Enter
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!inputVal.trim() && inputVal !== '') return;

      recordKeystrokeEvent(currentUser?.id || 'guest', ' ', ' ', latency);

      const updated = [...typedWords];
      updated[currentWordIndex] = inputVal;

      // Check if test reached final word
      if (currentWordIndex + 1 >= words.length) {
        setTypedWords(updated);
        finishTest(updated, inputVal, currentWordIndex);
        return;
      }

      updated.push('');
      setTypedWords(updated);
      setCurrentWordIndex(prev => prev + 1);
      setInputVal('');
      return;
    }

    // Printable single character keypress
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const charIndex = inputVal.length;
      const expectedChar = charIndex < currentTargetWord.length ? currentTargetWord[charIndex] : e.key;

      recordKeystrokeEvent(currentUser?.id || 'guest', expectedChar, e.key, latency);

      if (charIndex < currentTargetWord.length && e.key !== currentTargetWord[charIndex]) {
        if (soundEnabled) soundController.playErrorSound();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (testFinished) return;
    const val = e.target.value;
    setInputVal(val);

    // If on the final word and the user has typed the target word completely
    if (words.length > 0 && currentWordIndex === words.length - 1) {
      const currentTargetWord = (words[currentWordIndex] || '').trim();
      if (val === currentTargetWord) {
        const updated = [...typedWords];
        updated[currentWordIndex] = val;
        setTypedWords(updated);
        finishTest(updated, val, currentWordIndex);
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (attemptIdRef.current && currentUser) {
      logViolation(attemptIdRef.current, currentUser.id, 'paste_attempt', {
        time: Date.now()
      });
      setProctorBlurFlags(prev => prev + 1);
    }
  };

  // Copy shareable result to clipboard
  const handleShareResult = () => {
    const text = `⚡ TYPETEST Speed Result: ${metrics.netWpm} Net WPM | ${metrics.accuracy}% Accuracy | ${metrics.consistency}% Consistency | Mode: ${activeMode.toUpperCase()}`;
    navigator.clipboard.writeText(text);
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  // Keep caret scrolled into view
  useEffect(() => {
    if (activeWordRef.current) {
      activeWordRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      });
    }
  }, [currentWordIndex]);

  // Active anti-cheat proctoring monitor for official assessments
  useEffect(() => {
    if (!isAssessment || !testStarted || testFinished) return;

    const handleWindowBlur = () => {
      setProctorBlurFlags(prev => prev + 1);
      if (attemptIdRef.current && currentUser) {
        logViolation(attemptIdRef.current, currentUser.id, 'window_blur', {
          time: Date.now(),
          type: 'window_blur'
        });
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctorBlurFlags(prev => prev + 1);
        if (attemptIdRef.current && currentUser) {
          logViolation(attemptIdRef.current, currentUser.id, 'tab_switch', {
            time: Date.now(),
            type: 'tab_switch'
          });
        }
      }
    };

    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAssessment, testStarted, testFinished, currentUser, logViolation]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Attempt Blocked Notice */}
      {attemptBlockedError && (
        <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span className="font-semibold">{attemptBlockedError}</span>
          </div>
          {onExitProctored && (
            <button
              onClick={onExitProctored}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold transition-colors cursor-pointer shrink-0"
            >
              Return
            </button>
          )}
        </div>
      )}

      {/* Mode Controls Bar (for Public Practice) */}
      {!isAssessment && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-sm">
          {/* Typing Mode Options */}
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <button
              onClick={() => {
                setActiveMode('time');
                resetTest();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeMode === 'time'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeMode === 'words'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeMode === 'story'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                activeMode === 'code'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>code</span>
            </button>
          </div>

          {/* Time & Words Options Pills */}
          <div className="flex items-center gap-2 text-xs font-mono">
            {activeMode === 'time' && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[15, 30, 60, 120, 300].map(sec => (
                  <button
                    key={sec}
                    onClick={() => {
                      setTimeOption(sec);
                      resetTest();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      timeOption === sec
                        ? 'text-emerald-400 bg-emerald-500/15'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            )}

            {activeMode === 'words' && (
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                {[25, 50, 100, 200].map(cnt => (
                  <button
                    key={cnt}
                    onClick={() => {
                      setWordOption(cnt);
                      resetTest();
                    }}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                      wordOption === cnt
                        ? 'text-emerald-400 bg-emerald-500/15'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {cnt} words
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
            <div className="text-2xl font-black font-mono text-emerald-400">
              {metrics.netWpm} <span className="text-xs text-slate-500 font-normal">WPM</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 text-right">
            gross <span className="text-slate-300 font-bold">{metrics.grossWpm}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Accuracy
            </div>
            <div className="text-2xl font-black font-mono text-amber-400">
              {metrics.accuracy}%
            </div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 text-right">
            err <span className="text-rose-400 font-bold">{metrics.errors}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {activeMode === 'time' || isAssessment ? 'Time Left' : 'Elapsed'}
            </div>
            <div className="text-2xl font-black font-mono text-slate-100">
              {activeMode === 'time' || isAssessment
                ? `${timeLeft}s`
                : `${Math.floor(elapsedSeconds)}s`}
            </div>
          </div>
          <Clock className="w-5 h-5 text-slate-500" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          {isAssessment ? (
            <>
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Proctor Status
                </div>
                <div
                  className={`text-sm font-black font-mono mt-1 ${
                    proctorBlurFlags > 0 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
                  }`}
                >
                  {proctorBlurFlags > 0 ? `Flagged (${proctorBlurFlags})` : 'Secured'}
                </div>
              </div>
              <ShieldAlert
                className={`w-5 h-5 ${proctorBlurFlags > 0 ? 'text-rose-500' : 'text-emerald-500/40'}`}
              />
            </>
          ) : (
            <>
              <div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Consistency
                </div>
                <div className="text-2xl font-black font-mono text-teal-400">
                  {metrics.consistency}%
                </div>
              </div>
              <Gauge className="w-5 h-5 text-teal-500/50" />
            </>
          )}
        </div>
      </div>

      {/* Main Interactive Typing Area */}
      {!testFinished ? (
        <>
          <div
            onClick={() => inputRef.current?.focus()}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
            className="relative bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 cursor-text select-none shadow-xl min-h-[260px] flex flex-col justify-center"
          >
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

            {/* Target Words Container */}
            <div
              ref={textContainerRef}
              className="max-h-60 overflow-y-auto font-mono text-lg sm:text-2xl leading-relaxed tracking-wide text-left relative transition-all"
            >
              {words.map((rawWord, wIdx) => {
                const isActive = wIdx === currentWordIndex;
                const currentInput = isActive ? inputVal : typedWords[wIdx] || '';
                return (
                  <WordRenderer
                    key={wIdx}
                    rawWord={rawWord}
                    wIdx={wIdx}
                    isActive={isActive}
                    currentInput={currentInput}
                    activeWordRef={isActive ? activeWordRef : null}
                  />
                );
              })}
            </div>

            {/* Hint & Restart Helper Footer */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 font-mono pt-4 border-t border-slate-800/80">
              <div>
                {!testStarted ? (
                  <span className="text-emerald-400 font-semibold animate-pulse">
                    Start typing to begin test...
                  </span>
                ) : (
                  <span>Space to advance word • Backspace to correct</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400 text-[10px]">tab</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-400 text-[10px]">enter</kbd> to restart
                </span>
                <button
                  onClick={resetTest}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>restart test</span>
                </button>
              </div>
            </div>
          </div>

          <div className="w-full pt-2">
            <MechanicalKeyboard interactive={true} compact={false} />
          </div>
        </>
      ) : (
        /* Test Complete Results Page */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Test Complete
                </span>
                <span className="text-xs font-mono text-slate-400">
                  TYPETEST Verified Scorecard
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 mt-2">
                {initialTest ? initialTest.title : 'Speed & Accuracy Performance Summary'}
              </h2>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={resetTest}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => {
                  generateNewTestText();
                  resetTest();
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>New Test</span>
              </button>

              <button
                onClick={() => setShowBiometrics(true)}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Hand className="w-4 h-4 text-emerald-400" />
                <span>Practice Weak Keys</span>
              </button>

              <button
                onClick={handleShareResult}
                className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {shareCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
                <span>{shareCopied ? 'Copied!' : 'Share Result'}</span>
              </button>

              {!currentUser ? (
                <button
                  onClick={() => {
                    const headerSignInBtn = document.querySelector('header button');
                    (headerSignInBtn as HTMLElement)?.click();
                  }}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Sign In to Save</span>
                </button>
              ) : (
                <div className="px-3 py-2 rounded-xl text-xs font-mono font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Saved</span>
                </div>
              )}

              {onExitProctored && (
                <button
                  onClick={onExitProctored}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
                >
                  <span>Return to Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Prominent Results Hero Metrics Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">NET SPEED</div>
              <div className="text-5xl font-black font-mono text-emerald-400 mt-2">{metrics.netWpm}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Net WPM</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">ACCURACY</div>
              <div className="text-5xl font-black font-mono text-amber-400 mt-2">{metrics.accuracy}%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">{metrics.errors} errors</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">GROSS SPEED</div>
              <div className="text-5xl font-black font-mono text-slate-100 mt-2">{metrics.grossWpm}</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Raw Gross WPM</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-5 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase font-bold">CONSISTENCY</div>
              <div className="text-5xl font-black font-mono text-teal-400 mt-2">{metrics.consistency}%</div>
              <div className="text-xs text-slate-400 mt-1 font-mono">Cadence Stability</div>
            </div>
          </div>

          {/* Secondary Details Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80 text-xs font-mono text-slate-400">
            <div>
              Correct Characters: <strong className="text-emerald-400">{metrics.correctChars}</strong>
            </div>
            <div>
              Incorrect Characters: <strong className="text-rose-400">{metrics.incorrectChars}</strong>
            </div>
            <div>
              Total Typed: <strong className="text-slate-200">{metrics.totalTypedChars}</strong>
            </div>
            <div>
              Elapsed Time: <strong className="text-slate-200">{Math.max(1, Math.round(metrics.elapsedSeconds))}s</strong>
            </div>
          </div>

          {/* Performance-Based Smart Recommendations */}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold uppercase text-emerald-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Adaptive Recommendation
              </span>
              <p className="text-xs text-slate-300">
                {metrics.accuracy < 94 ? (
                  <>Your speed is solid at <strong>{metrics.netWpm} WPM</strong>, but accuracy was <strong>{metrics.accuracy}%</strong>. Focus on slow-paced accuracy drills to avoid finger misfires.</>
                ) : metrics.netWpm >= 80 ? (
                  <>Phenomenal performance! You're operating in the top tier of typists. Try challenging programming syntax modules or compete in the Multiplayer Arena.</>
                ) : (
                  <>Great rhythm and stability! To build muscle memory, practice consistent 60-second prose tests or target weak finger keys.</>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowBiometrics(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Hand className="w-3.5 h-3.5 text-emerald-400" />
                <span>Practice Weak Keys</span>
              </button>
            </div>
          </div>

          {/* Chart & Biometrics Selector */}
          <div className="flex border-b border-slate-800 gap-4 text-xs font-bold pt-2">
            <button
              onClick={() => setShowBiometrics(false)}
              className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                !showBiometrics
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Speed & Error Timeline</span>
            </button>
            <button
              onClick={() => setShowBiometrics(true)}
              className={`pb-2.5 flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                showBiometrics
                  ? 'border-emerald-400 text-emerald-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Finger-Position & Weak Key Heatmap (D3)</span>
            </button>
          </div>

          {!showBiometrics ? (
            <D3SessionChart data={speedHistory} height={220} isLive={false} />
          ) : (
            <D3FingerHeatmap
              studentId={currentUser?.id || 'guest'}
              onStartTargetedDrill={(drillText, title) => {
                setTargetText(drillText);
                setWords(drillText.match(/\s*\S+/g) || []);
                resetTest();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
};
