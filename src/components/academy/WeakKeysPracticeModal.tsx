import React, { useState, useEffect, useRef } from 'react';
import { StudentAcademyProfile } from '../../types';
import {
  getTopWeakKeys,
  generateWeakKeysDrill,
  recordStudentLessonAttempt
} from '../../services/academyService';
import { soundController } from '../../utils/audio';
import {
  Crosshair,
  X,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Zap,
  Target
} from 'lucide-react';

interface WeakKeysPracticeModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onProfileUpdated: (updated: StudentAcademyProfile) => void;
}

export const WeakKeysPracticeModal: React.FC<WeakKeysPracticeModalProps> = ({
  studentId,
  isOpen,
  onClose,
  onProfileUpdated,
}) => {
  const [weakKeysList, setWeakKeysList] = useState<{ key: string; count: number }[]>([]);
  const [drill, setDrill] = useState<{ title: string; practiceText: string }>({
    title: '',
    practiceText: '',
  });

  const [inputText, setInputText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState<{ wpm: number; accuracy: number } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const topKeys = getTopWeakKeys(studentId, 5);
      setWeakKeysList(topKeys);
      const generated = generateWeakKeysDrill(topKeys.map(k => k.key));
      setDrill(generated);

      setInputText('');
      setStartTime(null);
      setErrorsList([]);
      setIsCompleted(false);
      setStats(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, studentId]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const target = drill.practiceText;

    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    if (val.length > inputText.length) {
      const idx = val.length - 1;
      const expected = target[idx];
      const typed = val[idx];
      if (expected !== typed) {
        soundController.playErrorSound();
        if (expected) {
          setErrorsList(prev => [...prev, expected]);
        }
      } else {
        soundController.playKeySound(typed);
      }
    }

    setInputText(val);

    if (val.length >= target.length) {
      finishDrill(val);
    }
  };

  const finishDrill = (typedVal: string) => {
    const finishTimestamp = Date.now();
    const elapsedMinutes = startTime
      ? Math.max(0.08, (finishTimestamp - startTime) / 60000)
      : 0.2;

    let correct = 0;
    for (let i = 0; i < typedVal.length; i++) {
      if (typedVal[i] === drill.practiceText[i]) correct++;
    }

    const netWpm = Math.max(0, Math.round((correct / 5) / elapsedMinutes));
    const accuracy = typedVal.length > 0
      ? Math.max(0, Math.round((correct / typedVal.length) * 100))
      : 100;

    setStats({ wpm: netWpm, accuracy });
    setIsCompleted(true);
  };

  const handleReset = () => {
    setInputText('');
    setStartTime(null);
    setErrorsList([]);
    setIsCompleted(false);
    setStats(null);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative animate-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Crosshair className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-500/15 text-rose-300 border border-rose-500/30">
                Precision Calibration
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              Weak Keys Targeted Practice
            </h2>
          </div>
        </div>

        {/* Weak Keys Identified Pill Badges */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
            Your Most Frequently Missed Keys
          </span>
          <div className="flex flex-wrap gap-2">
            {weakKeysList.length > 0 ? (
              weakKeysList.map(item => (
                <div
                  key={item.key}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 font-mono text-xs flex items-center gap-2"
                >
                  <strong className="text-sm font-black text-rose-200">
                    '{item.key.toUpperCase()}'
                  </strong>
                  <span className="text-[10px] text-rose-400/80">({item.count} errors)</span>
                </div>
              ))
            ) : (
              <span className="text-xs text-slate-500 italic">
                No persistent weak keys detected yet! Great precision.
              </span>
            )}
          </div>
        </div>

        {/* Typing Box */}
        {!isCompleted ? (
          <div className="space-y-4">
            <div
              onClick={() => inputRef.current?.focus()}
              className="relative bg-slate-950 border border-slate-800 rounded-2xl p-6 cursor-text min-h-[160px] flex flex-col justify-center"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={handleInputChange}
                autoFocus
                className="absolute inset-0 opacity-0 cursor-default"
                aria-label="Weak keys practice input"
              />

              <div
                className="font-mono text-base sm:text-lg leading-relaxed tracking-wide text-left"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                {drill.practiceText.split('').map((char, idx) => {
                  const isTyped = idx < inputText.length;
                  const isCurrent = idx === inputText.length;
                  const isCorrect = isTyped && inputText[idx] === char;
                  const isWrong = isTyped && inputText[idx] !== char;

                  return (
                    <span
                      key={idx}
                      className={
                        isCorrect
                          ? 'text-slate-100'
                          : isWrong
                          ? 'text-rose-400 bg-rose-500/20 rounded px-0.5 underline'
                          : isCurrent
                          ? 'text-amber-400 font-bold bg-amber-500/10 rounded px-0.5'
                          : 'text-slate-600'
                      }
                    >
                      {char}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between font-mono text-xs text-slate-400">
              <span>Progress: {Math.round((inputText.length / drill.practiceText.length) * 100)}%</span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        ) : (
          /* Completion Stats */
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-100">
                Precision Drill Completed!
              </h3>
              <p className="text-xs text-slate-400">
                Targeted repetition strengthens neural motor memory on your weak keys.
              </p>
            </div>

            {stats && (
              <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto font-mono">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Speed</span>
                  <span className="text-2xl font-bold text-cyan-400">{stats.wpm} WPM</span>
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl">
                  <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
                  <span className="text-2xl font-bold text-emerald-400">{stats.accuracy}%</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Practice Another Drill</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                Return to Curriculum
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
