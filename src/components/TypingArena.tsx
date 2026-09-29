import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest, TypingMode, SubmissionHistoryPoint } from '../types';
import { MONKEYTYPE_WORDS } from '../data/initialData';
import { soundController } from '../utils/audio';
import confetti from 'canvas-confetti';
import { D3SessionChart } from './D3SessionChart';
import { MechanicalKeyboard } from './MechanicalKeyboard';
import { formatISTDateTime } from '../utils/dateUtils';
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

const WordRenderer = React.memo(({ rawWord, wIdx, isActive, currentInput, activeWordRef }: any) => {
  const word = rawWord.trim();
  const prefix = rawWord.substring(0, rawWord.length - word.length);
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
        className={`inline-block py-1 rounded transition-colors ${
          isActive ? 'bg-slate-800/60 px-1 ring-1 ring-emerald-400/30' : ''
        }`}
      >
        {word.split('').map((char: string, cIdx: number) => {
          let charColor = 'text-slate-600';
          let bg = '';

          if (cIdx < currentInput.length) {
            if (currentInput[cIdx] === char) {
              charColor = 'text-emerald-400 font-medium';
            } else {
              charColor = 'text-rose-400';
              bg = 'bg-rose-500/20';
            }
          }

          const isCaretHere = isActive && cIdx === currentInput.length;

          return (
            <span key={cIdx} className="relative inline-block">
              {isCaretHere && (
                <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-emerald-400 animate-pulse rounded-full shadow-[0_0_8px_#10b981]" />
              )}
              <span className={`${charColor} ${bg} rounded-sm`}>{char}</span>
            </span>
          );
        })}
        {currentInput.length > word.length &&
          currentInput.substring(word.length).split('').map((char: string, idx: number) => (
            <span key={`extra-${idx}`} className="relative inline-block">
              {isActive && idx === currentInput.length - word.length - 1 && (
                <span className="absolute left-0 top-0.5 bottom-0.5 w-[2px] bg-emerald-400 animate-pulse rounded-full" />
              )}
              <span className="text-rose-400 bg-rose-500/20 opacity-80 rounded-sm">{char}</span>
            </span>
          ))}
        {isActive && currentInput.length >= word.length && (
          <span className="relative inline-block">
            <span className="absolute left-0 top-0.5 bottom-0.5 h-full w-[2px] bg-emerald-400 animate-pulse rounded-full" />
          </span>
        )}
      </span>
    </React.Fragment>
  );
});

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

  const isAssessment = Boolean(initialTest);
  const [activeMode, setActiveMode] = useState<TypingMode>(
    initialTest?.category === 'code' ? 'code' : initialTest?.category === 'story' ? 'story' : 'time'
  );
  const [timeOption, setTimeOption] = useState<number>(initialTest?.timeLimit || 30);
  const [wordOption, setWordOption] = useState<number>(25);

  const [attemptBlockedError, setAttemptBlockedError] = useState<string | null>(null);
  const attemptIdRef = useRef<string | null>(null);

  const [targetText, setTargetText] = useState<string>('');
  const [words, setWords] = useState<string[]>([]);

  const [typedWords, setTypedWords] = useState<string[]>(['']);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(0);
  const [inputVal, setInputVal] = useState<string>('');

  const [testStarted, setTestStarted] = useState<boolean>(false);
  const [testFinished, setTestFinished] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState<number>(timeOption);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

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

  const [proctorBlurFlags, setProctorBlurFlags] = useState<number>(0);
  const [showBlurWarning, setShowBlurWarning] = useState<boolean>(false);
  const [speedHistory, setSpeedHistory] = useState<SubmissionHistoryPoint[]>([]);

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

  const generateNewTestText = useCallback(() => {
    if (initialTest) {
      setTargetText(initialTest.content.trim());
      setWords(initialTest.content.match(/\s*\S+/g) || []);
      return;
    }

    if (activeMode === 'code') {
      const snippets = [
        `def quick_sort(arr):\n    if len(arr) <= 1:\n        return arr\n    pivot = arr[len(arr) // 2]\n    left = [x for x in arr if x < pivot]\n    middle = [x for x in arr if x == pivot]\n    right = [x for x in arr if x > pivot]\n    return quick_sort(left) + middle + quick_sort(right)`,
        `function binarySearch(arr, target) {\n  let low = 0, high = arr.length - 1;\n  while (low <= high) {\n    let mid = Math.floor((low + high) / 2);\n    if (arr[mid] === target) return mid;\n    if (arr[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}`,
        `#include <iostream>\n#include <vector>\nusing namespace std;\n\nint main() {\n    vector<int> numbers = {10, 20, 30, 40};\n    for (int n : numbers) {\n        cout << n << " ";\n    }\n    return 0;\n}`
      ];
      const selected = snippets[Math.floor(Math.random() * snippets.length)];
      setTargetText(selected);
      setWords(selected.match(/\s*\S+/g) || []);
      return;
    }

    if (activeMode === 'story') {
      const stories = [
        "In the quiet laboratory, researchers watched as crystalline neural processors calculated quantum simulations with effortless precision. Every keystroke echoed across the silent floor, tracing pathways of computational elegance that bridged theoretical mathematics with real-world architecture.",
        "The ancient lighthouse keeper ascended the spiral granite staircase at twilight. Outside, violent ocean breakers crashed against basalt reefs, but within the lantern vault, the polished brass gears turned in perfect mechanical harmony, casting golden beacons into the dark horizon."
      ];
      const selected = stories[Math.floor(Math.random() * stories.length)];
      setTargetText(selected);
      setWords(selected.match(/\s*\S+/g) || []);
      return;
    }

    const count = activeMode === 'words' ? wordOption : 100;
    const shuffled: string[] = [];
    for (let i = 0; i < count; i++) {
      shuffled.push(MONKEYTYPE_WORDS[Math.floor(Math.random() * MONKEYTYPE_WORDS.length)]);
    }
    const txt = shuffled.join(' ');
    setTargetText(txt);
    setWords(txt.match(/\s*\S+/g) || []);
  }, [initialTest, activeMode, wordOption]);

  const resetTest = useCallback(() => {
    setTestStarted(false);
    setTestFinished(false);
    setTimeLeft(timeOption);
    setElapsedSeconds(0);
    setInputVal('');
    setTypedWords(['']);
    setCurrentWordIndex(0);
    totalKeystrokesRef.current = 0;
    correctKeystrokesRef.current = 0;
    incorrectKeystrokesRef.current = 0;
    backspacesRef.current = 0;
    setKeystrokes({ total: 0, correct: 0, incorrect: 0, backspaces: 0 });
    setSpeedHistory([]);
    startTimeRef.current = null;
    lastRecordedSecondRef.current = 0;
    statsRef.current = {
      correctChars: 0,
      incorrectChars: 0,
      extraChars: 0,
      totalTypedChars: 0,
      rawWpm: 0,
      netWpm: 0,
      accuracy: 100,
      errors: 0
    };
    generateNewTestText();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [timeOption, generateNewTestText]);

  useEffect(() => {
    resetTest();
  }, [resetTest]);

  const computeCurrentStats = useCallback(() => {
    let correct = 0;
    let incorrect = 0;
    let extra = 0;
    let totalChars = 0;

    typedWords.forEach((typed, idx) => {
      const rawTarget = words[idx] || '';
      const target = rawTarget.trim();
      const current = idx === currentWordIndex ? inputVal : typed;

      for (let i = 0; i < current.length; i++) {
        totalChars++;
        if (i < target.length) {
          if (current[i] === target[i]) {
            correct++;
          } else {
            incorrect++;
          }
        } else {
          extra++;
        }
      }

      if (idx < currentWordIndex && current.length < target.length) {
        incorrect += target.length - current.length;
      }
    });

    const elapsedMin = startTimeRef.current
      ? Math.max(0.016, (Date.now() - startTimeRef.current) / 60000)
      : 0.016;

    const rawWpm = Math.round(totalChars / 5 / elapsedMin);
    const netWpm = Math.max(0, Math.round(correct / 5 / elapsedMin));
    const totalAttempted = correct + incorrect + extra;
    const accuracy = totalAttempted > 0 ? Math.round((correct / totalAttempted) * 100) : 100;

    const currentStats = {
      correctChars: correct,
      incorrectChars: incorrect,
      extraChars: extra,
      totalTypedChars: totalChars,
      rawWpm,
      netWpm,
      accuracy,
      errors: incorrect + extra
    };
    statsRef.current = currentStats;
    return currentStats;
  }, [typedWords, words, currentWordIndex, inputVal]);

  const finishTest = useCallback(async () => {
    if (testFinished) return;
    setTestFinished(true);
    const finalStats = computeCurrentStats();

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    const submissionPayload = {
      testId: initialTest ? initialTest.id : `practice-${activeMode}-${Date.now()}`,
      testTitle: initialTest ? initialTest.title : `Free Practice (${activeMode.toUpperCase()})`,
      studentId: currentUser?.id || 'guest',
      studentName: currentUser?.name || 'Guest Typist',
      rollNo: currentUser?.rollNo || 'GUEST',
      grossWpm: finalStats.rawWpm,
      netWpm: finalStats.netWpm,
      accuracy: finalStats.accuracy,
      errorCount: finalStats.errors,
      characterCount: finalStats.totalTypedChars,
      timeSpentSeconds: Math.max(1, Math.round(elapsedSeconds)),
      history: speedHistory,
      passed: finalStats.accuracy >= (initialTest?.minAccuracy || 90)
    };

    if (attemptIdRef.current) {
      await submitAttempt(attemptIdRef.current, submissionPayload);
    } else {
      await recordSubmission(submissionPayload);
    }
  }, [
    testFinished,
    computeCurrentStats,
    initialTest,
    activeMode,
    currentUser,
    elapsedSeconds,
    speedHistory,
    submitAttempt,
    recordSubmission
  ]);

  useEffect(() => {
    if (!testStarted || testFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - (startTimeRef.current || now)) / 1000;
      setElapsedSeconds(elapsed);

      if (activeMode === 'time' || isAssessment) {
        const remaining = Math.max(0, timeOption - Math.floor(elapsed));
        setTimeLeft(remaining);
        if (remaining <= 0) {
          finishTest();
          return;
        }
      }

      const currentSec = Math.floor(elapsed);
      if (currentSec > lastRecordedSecondRef.current) {
        lastRecordedSecondRef.current = currentSec;
        const currentStats = computeCurrentStats();
        setSpeedHistory(prev => [
          ...prev,
          {
            second: currentSec,
            wpm: currentStats.netWpm,
            rawWpm: currentStats.rawWpm,
            errors: currentStats.errors,
            accuracy: currentStats.accuracy
          }
        ]);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [testStarted, testFinished, activeMode, isAssessment, timeOption, finishTest, computeCurrentStats]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (testFinished) return;

    if (soundEnabled) {
      if (e.key === 'Backspace' || e.key.length === 1) {
        soundController.playKeyClick();
      }
    }

    if (!testStarted) {
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        setTestStarted(true);
        startTimeRef.current = Date.now();
      }
    }

    if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
      return;
    }

    const currentTargetWord = (words[currentWordIndex] || '').trim();

    if (e.key === 'Backspace') {
      totalKeystrokesRef.current += 1;
      backspacesRef.current += 1;
      setKeystrokes(prev => ({
        ...prev,
        total: prev.total + 1,
        backspaces: prev.backspaces + 1
      }));

      if (inputVal === '' && currentWordIndex > 0) {
        e.preventDefault();
        const prevIndex = currentWordIndex - 1;
        const prevWord = typedWords[prevIndex] || '';
        setCurrentWordIndex(prevIndex);
        setInputVal(prevWord);
        setTypedWords(prev => prev.slice(0, -1));
        return;
      }
      return;
    }

    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      if (!inputVal.trim() && inputVal !== '') return;

      totalKeystrokesRef.current += 1;
      if (inputVal === currentTargetWord) {
        correctKeystrokesRef.current += 1;
      } else {
        incorrectKeystrokesRef.current += 1;
      }

      setKeystrokes(prev => ({
        ...prev,
        total: prev.total + 1,
        correct: inputVal === currentTargetWord ? prev.correct + 1 : prev.correct,
        incorrect: inputVal !== currentTargetWord ? prev.incorrect + 1 : prev.incorrect
      }));

      const updated = [...typedWords];
      updated[currentWordIndex] = inputVal;

      if (currentWordIndex + 1 >= words.length) {
        setTypedWords(updated);
        finishTest();
        return;
      }

      updated.push('');
      setTypedWords(updated);
      setCurrentWordIndex(prev => prev + 1);
      setInputVal('');
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      totalKeystrokesRef.current += 1;
      const charIndex = inputVal.length;
      if (charIndex < currentTargetWord.length && e.key === currentTargetWord[charIndex]) {
        correctKeystrokesRef.current += 1;
      } else {
        incorrectKeystrokesRef.current += 1;
        if (soundEnabled) soundController.playErrorSound();
      }

      setKeystrokes(prev => ({
        ...prev,
        total: prev.total + 1,
        correct:
          charIndex < currentTargetWord.length && e.key === currentTargetWord[charIndex]
            ? prev.correct + 1
            : prev.correct,
        incorrect:
          charIndex >= currentTargetWord.length || e.key !== currentTargetWord[charIndex]
            ? prev.incorrect + 1
            : prev.incorrect
      }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (testFinished) return;
    setInputVal(e.target.value);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    if (attemptIdRef.current && currentUser) {
      logViolation(attemptIdRef.current, currentUser.id, 'paste_attempt', {
        time: Date.now()
      });
    }
  };

  const stats = statsRef.current;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* Mode Controls Bar */}
      {!isAssessment && (
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-3.5 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2 text-xs font-mono">
            <button
              onClick={() => {
                setActiveMode('time');
                resetTest();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeMode === 'time'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeMode === 'words'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeMode === 'story'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeMode === 'code'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>code</span>
            </button>
          </div>

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
            <div className="text-2xl font-black font-mono text-emerald-400">{stats.netWpm} WPM</div>
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
            <div className="text-2xl font-black font-mono text-amber-400">{stats.accuracy}%</div>
          </div>
          <div className="text-[11px] font-mono text-slate-500 text-right">
            err <span className="text-rose-400 font-bold">{stats.errors}</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              {activeMode === 'time' || isAssessment ? 'Timer Left' : 'Elapsed'}
            </div>
            <div className="text-2xl font-black font-mono text-slate-100">
              {activeMode === 'time' || isAssessment
                ? `${timeLeft}s`
                : `${Math.floor(elapsedSeconds)}s`}
            </div>
          </div>
          <Clock className="w-5 h-5 text-slate-600" />
        </div>

        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
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
        </div>
      </div>

      {/* Main Interactive Typing Container */}
      {!testFinished ? (
        <>
          <div
            onClick={() => inputRef.current?.focus()}
            onCopy={e => e.preventDefault()}
            onCut={e => e.preventDefault()}
            onContextMenu={e => e.preventDefault()}
            className="relative bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 cursor-text select-none shadow-xl min-h-[260px] flex flex-col justify-center"
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

            {/* Words Container */}
            <div
              ref={textContainerRef}
              className="max-h-60 overflow-y-auto font-mono text-lg sm:text-2xl leading-relaxed tracking-wide space-x-2 text-left relative transition-all"
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

            <div className="mt-6 flex items-center justify-between text-xs text-slate-500 font-mono pt-4 border-t border-slate-800/80">
              <div>
                {!testStarted ? (
                  <span className="text-emerald-400 font-semibold animate-pulse">
                    Start typing to begin examination timer...
                  </span>
                ) : (
                  <span>Space to advance word • Backspace to correct</span>
                )}
              </div>
              {!initialTest?.isCustomAssignment && (
                <button
                  onClick={resetTest}
                  className="flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>restart test</span>
                </button>
              )}
            </div>
          </div>

          <div className="w-full pt-2">
            <MechanicalKeyboard interactive={true} compact={false} />
          </div>
        </>
      ) : (
        /* Results Scorecard */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Assessment Completed
                </span>
                <span className="text-xs font-mono text-slate-400">
                  DOTT Verified Result
                </span>
              </div>
              <h3 className="text-2xl font-black text-slate-100 mt-2">
                {initialTest ? initialTest.title : 'Speed & Accuracy Benchmark'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {!initialTest?.isCustomAssignment && (
                <button
                  onClick={resetTest}
                  className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Retake Test</span>
                </button>
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

          {/* Core Metrics Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase">NET WPM</div>
              <div className="text-4xl font-black font-mono text-emerald-400 mt-1">{stats.netWpm}</div>
              <div className="text-[11px] text-slate-500 mt-1">Verified Net Speed</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase">ACCURACY</div>
              <div className="text-4xl font-black font-mono text-amber-400 mt-1">{stats.accuracy}%</div>
              <div className="text-[11px] text-slate-500 mt-1">{stats.errors} errors recorded</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase">RAW GROSS WPM</div>
              <div className="text-4xl font-black font-mono text-slate-100 mt-1">{stats.rawWpm}</div>
              <div className="text-[11px] text-slate-500 mt-1">Total keystrokes: {keystrokes.total}</div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center">
              <div className="text-xs font-mono text-slate-400 uppercase">TIME TAKEN</div>
              <div className="text-4xl font-black font-mono text-slate-100 mt-1">
                {Math.max(1, Math.round(elapsedSeconds))}s
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {stats.accuracy >= (initialTest?.minAccuracy || 90) ? (
                  <span className="text-emerald-400 font-bold">PASSED BENCHMARK</span>
                ) : (
                  <span className="text-rose-400 font-bold">NEEDS PRACTICE</span>
                )}
              </div>
            </div>
          </div>

          <D3SessionChart data={speedHistory} height={220} isLive={false} />
        </div>
      )}
    </div>
  );
};
