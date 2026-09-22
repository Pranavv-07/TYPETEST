import React, { useState, useRef, useEffect } from 'react';
import { AcademyDiagnosticResult, StudentAcademyProfile } from '../../types';
import {
  evaluateDiagnosticAssessment,
  applyDiagnosticPlacement
} from '../../services/academyService';
import { soundController } from '../../utils/audio';
import {
  Sparkles,
  X,
  Gauge,
  Target,
  Trophy,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

interface DiagnosticModalProps {
  studentId: string;
  isOpen: boolean;
  onClose: () => void;
  onPlacementApplied: (updatedProfile: StudentAcademyProfile) => void;
}

const DIAGNOSTIC_PASSAGE =
  'Touch typing enables your fingers to translate ideas directly into digital expression without conscious effort. By establishing strong keyboard anchors on the home row, you unlock remarkable speed, razor-sharp accuracy, and uninterrupted mental flow.';

export const DiagnosticModal: React.FC<DiagnosticModalProps> = ({
  studentId,
  isOpen,
  onClose,
  onPlacementApplied,
}) => {
  const [inputText, setInputText] = useState('');
  const [startTime, setStartTime] = useState<number | null>(null);
  const [errorsList, setErrorsList] = useState<string[]>([]);
  const [result, setResult] = useState<AcademyDiagnosticResult | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setInputText('');
      setStartTime(null);
      setErrorsList([]);
      setResult(null);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!startTime && val.length > 0) {
      setStartTime(Date.now());
    }

    if (val.length > inputText.length) {
      const idx = val.length - 1;
      const expected = DIAGNOSTIC_PASSAGE[idx];
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

    if (val.length >= DIAGNOSTIC_PASSAGE.length) {
      finishDiagnostic(val);
    }
  };

  const finishDiagnostic = (typedVal: string) => {
    const finishTimestamp = Date.now();
    const elapsedMinutes = startTime
      ? Math.max(0.1, (finishTimestamp - startTime) / 60000)
      : 0.5;

    let correctChars = 0;
    let incorrectChars = 0;
    const errorKeys: string[] = [];

    for (let i = 0; i < typedVal.length; i++) {
      if (typedVal[i] === DIAGNOSTIC_PASSAGE[i]) {
        correctChars++;
      } else {
        incorrectChars++;
        if (DIAGNOSTIC_PASSAGE[i]) {
          errorKeys.push(DIAGNOSTIC_PASSAGE[i]);
        }
      }
    }

    const netWpm = Math.max(0, Math.round((correctChars / 5) / elapsedMinutes));
    const accuracy = typedVal.length > 0
      ? Math.max(0, Math.round((correctChars / typedVal.length) * 100))
      : 100;
    const consistency = Math.min(100, Math.max(60, 100 - incorrectChars * 3));

    const evalResult = evaluateDiagnosticAssessment(
      netWpm,
      accuracy,
      incorrectChars,
      consistency,
      [...new Set(errorKeys)]
    );

    setResult(evalResult);
  };

  const handleApplyPlacement = (skipToRecommended: boolean) => {
    if (!result) return;
    const updated = applyDiagnosticPlacement(studentId, result, skipToRecommended);
    onPlacementApplied(updated);
    onClose();
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

        {/* Modal Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              Diagnostic Typing Assessment
            </h2>
            <p className="text-xs text-slate-400">
              Evaluate your current baseline speed and accuracy to find your ideal curriculum starting point.
            </p>
          </div>
        </div>

        {!result ? (
          /* Active Test Screen */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                Diagnostic Passage
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Type the passage below naturally at your usual pace. Do not rush; natural accuracy is the primary placement metric.
              </p>
            </div>

            {/* Interactive typing area */}
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
                aria-label="Diagnostic test input"
              />

              <div
                className="font-mono text-base sm:text-lg leading-relaxed tracking-wide text-left"
                style={{ fontFamily: "'Fira Code', monospace" }}
              >
                {DIAGNOSTIC_PASSAGE.split('').map((char, idx) => {
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
              <span>Progress: {Math.round((inputText.length / DIAGNOSTIC_PASSAGE.length) * 100)}%</span>
              <span>Errors: <strong className="text-rose-400">{errorsList.length}</strong></span>
            </div>
          </div>
        ) : (
          /* Results & Placement Recommendation Screen */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Speed</span>
                <span className="text-2xl font-bold text-cyan-400">{result.wpm} <span className="text-xs text-slate-500">WPM</span></span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Accuracy</span>
                <span className="text-2xl font-bold text-emerald-400">{result.accuracy}%</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Consistency</span>
                <span className="text-2xl font-bold text-amber-400">{result.consistency}%</span>
              </div>
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                <span className="text-[10px] text-slate-500 uppercase block">Mistakes</span>
                <span className="text-2xl font-bold text-rose-400">{result.errors}</span>
              </div>
            </div>

            {/* Placement Recommendation Box */}
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
                  Curriculum Placement Recommendation
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-100">
                {result.recommendedLevelTitle}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {result.placementMessage}
              </p>
            </div>

            {/* Choice Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              {result.recommendedLevelId > 1 && (
                <button
                  onClick={() => handleApplyPlacement(true)}
                  className="w-full sm:w-1/2 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                >
                  <span>Start at Level {result.recommendedLevelId} (Unlock Preceding)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleApplyPlacement(false)}
                className={`w-full ${
                  result.recommendedLevelId > 1 ? 'sm:w-1/2' : 'w-full'
                } py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2`}
              >
                <span>Start from Level 1 (Fundamentals)</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
