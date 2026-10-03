/**
 * TYPETEST Authoritative Typing Engine & Calculations
 * Standardized across Live Arena, Results Page, History, Leaderboard,
 * Multiplayer, Certificates, and Institutional Reports.
 *
 * Metric Standards:
 * - Gross WPM = (Total Typed Characters / 5) / Elapsed Minutes
 * - Net WPM   = (Correct Characters / 5) / Elapsed Minutes (min 0)
 * - Accuracy  = (Correct Characters / Total Attempted Characters) * 100
 * - Consistency = 100 - (Standard Deviation of WPM Snapshots / Mean WPM) * 100 (bounded [0, 100])
 * - Elapsed Time = (Timestamp Now - Start Timestamp) / 1000
 */

export interface TypingMetrics {
  grossWpm: number;
  netWpm: number;
  accuracy: number;
  consistency: number;
  correctChars: number;
  incorrectChars: number;
  extraChars: number;
  totalTypedChars: number;
  errors: number;
  elapsedSeconds: number;
  wordsCompleted: number;
  totalWords: number;
}

export interface WpmHistoryPoint {
  second: number;
  wpm: number;
  rawWpm?: number;
  errors?: number;
  accuracy?: number;
}

/**
 * Gross Words Per Minute
 * Measures raw keying velocity regardless of errors.
 * Standard typing word length = 5 characters (including spaces & punctuation).
 */
export function calculateGrossWpm(totalTypedChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || totalTypedChars <= 0) return 0;
  const elapsedMinutes = Math.max(0.016, elapsedSeconds / 60); // minimum 1 second equivalent
  const gross = Math.round((totalTypedChars / 5) / elapsedMinutes);
  return Math.max(0, gross);
}

/**
 * Net Words Per Minute
 * The authoritative benchmark speed: accounts only for accurate characters.
 */
export function calculateNetWpm(correctChars: number, elapsedSeconds: number): number {
  if (elapsedSeconds <= 0 || correctChars <= 0) return 0;
  const elapsedMinutes = Math.max(0.016, elapsedSeconds / 60);
  const net = Math.round((correctChars / 5) / elapsedMinutes);
  return Math.max(0, net);
}

/**
 * Typing Accuracy Percentage
 * Formula: (Correct Characters / Total Attempted Characters) * 100
 * Bounded strictly between 0% and 100%. Defaults to 100% before typing begins.
 */
export function calculateAccuracy(correctChars: number, totalAttemptedChars: number): number {
  if (totalAttemptedChars <= 0) return 100;
  if (correctChars <= 0) return 0;
  const acc = Math.round((correctChars / totalAttemptedChars) * 1000) / 10; // 1 decimal place
  return Math.min(100, Math.max(0, Math.round(acc)));
}

/**
 * Typing Consistency Percentage
 * Computed from real rolling second-by-second WPM snapshots.
 * Measures rhythm stability using coefficient of variation (CV = stdDev / mean).
 * A steady, non-burst cadence yields high consistency (85-98%).
 */
export function calculateConsistency(history: WpmHistoryPoint[]): number {
  if (!history || history.length < 3) return 100;

  // Filter out the initial 1-2 seconds ramp-up
  const sample = history.slice(1).map(h => h.wpm).filter(w => w > 0);
  if (sample.length < 2) return 100;

  const mean = sample.reduce((sum, v) => sum + v, 0) / sample.length;
  if (mean <= 0) return 100;

  const variance = sample.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / sample.length;
  const stdDev = Math.sqrt(variance);

  // Coefficient of Variation
  const cv = stdDev / mean;
  // Consistency = 100 - (CV * 100), bounded between 0 and 100
  const consistencyScore = Math.round(Math.max(0, Math.min(100, 100 - (cv * 100))));
  return consistencyScore;
}

/**
 * Computes complete deterministic metrics for a typing session
 */
export function evaluateTypingSession(params: {
  typedWords: string[];
  targetWords: string[];
  currentWordIndex: number;
  currentInput: string;
  startTime: number | null;
  endTime?: number | null;
  history?: WpmHistoryPoint[];
}): TypingMetrics {
  const {
    typedWords,
    targetWords,
    currentWordIndex,
    currentInput,
    startTime,
    endTime,
    history = []
  } = params;

  let correctChars = 0;
  let incorrectChars = 0;
  let extraChars = 0;
  let totalTypedChars = 0;

  const totalWords = targetWords.length;
  const maxIdx = Math.max(typedWords.length, currentWordIndex + 1);

  for (let idx = 0; idx < maxIdx; idx++) {
    const rawTarget = targetWords[idx] || '';
    const target = rawTarget.trim();
    const typed = idx === currentWordIndex ? currentInput : (typedWords[idx] || '');

    for (let c = 0; c < typed.length; c++) {
      totalTypedChars++;
      if (c < target.length) {
        if (typed[c] === target[c]) {
          correctChars++;
        } else {
          incorrectChars++;
        }
      } else {
        extraChars++;
      }
    }

    // Account for word separator (space) if word was completed
    if (idx < currentWordIndex && idx < targetWords.length) {
      totalTypedChars++; // Space bar pressed
      if (typed === target) {
        correctChars++; // Space was accurate
      } else {
        incorrectChars++; // Word was imperfect
      }

      // Missed letters at end of word
      if (typed.length < target.length) {
        incorrectChars += target.length - typed.length;
      }
    }
  }

  const now = endTime || Date.now();
  const elapsedSeconds = startTime ? Math.max(0.1, (now - startTime) / 1000) : 0;

  const grossWpm = calculateGrossWpm(totalTypedChars, elapsedSeconds);
  const netWpm = calculateNetWpm(correctChars, elapsedSeconds);
  const totalAttempted = correctChars + incorrectChars + extraChars;
  const accuracy = calculateAccuracy(correctChars, totalAttempted);
  const consistency = calculateConsistency(history);

  return {
    grossWpm,
    netWpm,
    accuracy,
    consistency,
    correctChars,
    incorrectChars,
    extraChars,
    totalTypedChars,
    errors: incorrectChars + extraChars,
    elapsedSeconds,
    wordsCompleted: Math.min(totalWords, currentWordIndex),
    totalWords
  };
}
