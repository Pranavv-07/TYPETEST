/**
 * Keystroke & Finger Position Analytics Service
 * Tracks individual key precision, reaction times, error substitutions,
 * and maps all keystrokes to anatomical fingers for D3.js heatmap visualizations.
 */

export type FingerId =
  | 'left-pinky'
  | 'left-ring'
  | 'left-middle'
  | 'left-index'
  | 'left-thumb'
  | 'right-thumb'
  | 'right-index'
  | 'right-middle'
  | 'right-ring'
  | 'right-pinky';

export interface FingerInfo {
  id: FingerId;
  name: string;
  hand: 'left' | 'right';
  homeKey: string;
  assignedKeys: string[];
}

export const FINGER_DEFINITIONS: Record<FingerId, FingerInfo> = {
  'left-pinky': {
    id: 'left-pinky',
    name: 'Left Pinky',
    hand: 'left',
    homeKey: 'A',
    assignedKeys: ['1', 'Q', 'A', 'Z', 'TAB', 'CAPS', 'SHIFT', 'CTRL', '`', '~', '!']
  },
  'left-ring': {
    id: 'left-ring',
    name: 'Left Ring',
    hand: 'left',
    homeKey: 'S',
    assignedKeys: ['2', 'W', 'S', 'X', '@']
  },
  'left-middle': {
    id: 'left-middle',
    name: 'Left Middle',
    hand: 'left',
    homeKey: 'D',
    assignedKeys: ['3', 'E', 'D', 'C', '#']
  },
  'left-index': {
    id: 'left-index',
    name: 'Left Index',
    hand: 'left',
    homeKey: 'F',
    assignedKeys: ['4', '5', 'R', 'T', 'F', 'G', 'V', 'B', '$', '%']
  },
  'left-thumb': {
    id: 'left-thumb',
    name: 'Left Thumb',
    hand: 'left',
    homeKey: 'SPACE',
    assignedKeys: ['SPACE', 'ALT']
  },
  'right-thumb': {
    id: 'right-thumb',
    name: 'Right Thumb',
    hand: 'right',
    homeKey: 'SPACE',
    assignedKeys: ['SPACE', 'ALT']
  },
  'right-index': {
    id: 'right-index',
    name: 'Right Index',
    hand: 'right',
    homeKey: 'J',
    assignedKeys: ['6', '7', 'Y', 'U', 'H', 'J', 'N', 'M', '^', '&']
  },
  'right-middle': {
    id: 'right-middle',
    name: 'Right Middle',
    hand: 'right',
    homeKey: 'K',
    assignedKeys: ['8', 'I', 'K', ',', '<', '*']
  },
  'right-ring': {
    id: 'right-ring',
    name: 'Right Ring',
    hand: 'right',
    homeKey: 'L',
    assignedKeys: ['9', 'O', 'L', '.', '>', '(']
  },
  'right-pinky': {
    id: 'right-pinky',
    name: 'Right Pinky',
    hand: 'right',
    homeKey: ';',
    assignedKeys: [
      '0', '-', '=', 'P', '[', ']', ';', "'", '/', '\\',
      ')', '_', '+', '{', '}', ':', '"', '?', 'ENTER', 'BACKSPACE', 'SHIFT'
    ]
  }
};

export interface KeyStats {
  key: string;
  char: string;
  finger: FingerId;
  hand: 'left' | 'right';
  totalHits: number;
  correctHits: number;
  errorCount: number;
  accuracy: number; // 0-100%
  errorRate: number; // 0-100%
  avgLatencyMs: number; // reaction/hesitation time
  substitutions: Record<string, number>; // common typo keys typed instead
  struggleScore: number; // composite index based on error rate + latency (0-100)
}

export interface FingerStats {
  finger: FingerId;
  name: string;
  hand: 'left' | 'right';
  totalHits: number;
  errorCount: number;
  errorRate: number; // 0-100%
  accuracy: number; // 0-100%
  avgLatencyMs: number;
  strugglingKeys: string[];
  loadSharePercent: number; // share of total keystrokes (0-100%)
}

export interface FingerHeatmapSnapshot {
  studentId: string;
  totalKeystrokes: number;
  totalErrors: number;
  overallAccuracy: number;
  leftHandLoadPercent: number;
  rightHandLoadPercent: number;
  fingerStats: Record<FingerId, FingerStats>;
  keyStats: Record<string, KeyStats>;
  topStrugglingKeys: KeyStats[];
  topStrugglingFingers: FingerStats[];
  lastUpdated: string;
}

const STORAGE_KEY_PREFIX = 'testtype_keystroke_telemetry_';

/**
 * Maps a single character or key name to its assigned FingerId
 */
export function getFingerForKey(rawKey: string): FingerId {
  const normalized = rawKey.toUpperCase();
  if (normalized === ' ' || normalized === 'SPACE') return 'right-thumb';

  for (const [fingerId, info] of Object.entries(FINGER_DEFINITIONS)) {
    if (info.assignedKeys.includes(normalized)) {
      return fingerId as FingerId;
    }
  }

  // Fallback defaults for symbols
  if (['Q', 'A', 'Z', '1'].includes(normalized)) return 'left-pinky';
  if (['W', 'S', 'X', '2'].includes(normalized)) return 'left-ring';
  if (['E', 'D', 'C', '3'].includes(normalized)) return 'left-middle';
  if (['R', 'T', 'F', 'G', 'V', 'B', '4', '5'].includes(normalized)) return 'left-index';
  if (['Y', 'U', 'H', 'J', 'N', 'M', '6', '7'].includes(normalized)) return 'right-index';
  if (['I', 'K', '8', ','].includes(normalized)) return 'right-middle';
  if (['O', 'L', '9', '.'].includes(normalized)) return 'right-ring';
  return 'right-pinky';
}

/**
 * Generate a realistic initial baseline telemetry dataset for a user
 */
function createBaselineTelemetry(studentId: string): FingerHeatmapSnapshot {
  const keyStats: Record<string, KeyStats> = {};

  // Standard alphanumeric keyboard set
  const allKeys = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    '0', '1', '2', '3', '4', '5', '6', '7', '8', '9',
    ',', '.', ';', '/', '-', '=', 'SPACE'
  ];

  // Realistic error profile: pinkies and outer keys (B, P, Q, Z, X, C, NUMBERS) have slightly higher error rates
  const baseErrorRates: Record<string, { errorRate: number; latency: number; hits: number }> = {
    'E': { errorRate: 2.1, latency: 135, hits: 240 },
    'T': { errorRate: 2.8, latency: 142, hits: 210 },
    'A': { errorRate: 3.2, latency: 150, hits: 195 },
    'O': { errorRate: 2.5, latency: 140, hits: 180 },
    'I': { errorRate: 2.9, latency: 148, hits: 175 },
    'N': { errorRate: 3.4, latency: 155, hits: 165 },
    'S': { errorRate: 4.1, latency: 162, hits: 150 },
    'H': { errorRate: 3.8, latency: 158, hits: 145 },
    'R': { errorRate: 3.1, latency: 149, hits: 140 },
    'D': { errorRate: 3.6, latency: 152, hits: 130 },
    'L': { errorRate: 4.2, latency: 160, hits: 125 },
    'C': { errorRate: 6.8, latency: 185, hits: 90 },
    'U': { errorRate: 4.5, latency: 164, hits: 88 },
    'M': { errorRate: 5.2, latency: 172, hits: 82 },
    'W': { errorRate: 6.1, latency: 180, hits: 78 },
    'F': { errorRate: 5.4, latency: 168, hits: 75 },
    'G': { errorRate: 7.2, latency: 192, hits: 70 },
    'Y': { errorRate: 8.1, latency: 205, hits: 65 },
    'P': { errorRate: 11.4, latency: 228, hits: 60 },
    'B': { errorRate: 12.8, latency: 245, hits: 55 },
    'V': { errorRate: 8.6, latency: 210, hits: 50 },
    'K': { errorRate: 6.5, latency: 178, hits: 48 },
    'J': { errorRate: 7.9, latency: 195, hits: 45 },
    'X': { errorRate: 14.2, latency: 260, hits: 35 },
    'Q': { errorRate: 16.5, latency: 285, hits: 28 },
    'Z': { errorRate: 15.8, latency: 275, hits: 25 },
    'SPACE': { errorRate: 0.9, latency: 120, hits: 450 },
    ',': { errorRate: 7.4, latency: 188, hits: 62 },
    '.': { errorRate: 6.2, latency: 182, hits: 70 },
    ';': { errorRate: 13.5, latency: 250, hits: 30 },
    '/': { errorRate: 15.0, latency: 270, hits: 20 },
    '-': { errorRate: 14.0, latency: 265, hits: 18 },
    '=': { errorRate: 16.0, latency: 280, hits: 15 },
  };

  let totalHitsAll = 0;
  let totalErrorsAll = 0;

  allKeys.forEach(k => {
    const finger = getFingerForKey(k);
    const hand = FINGER_DEFINITIONS[finger]?.hand || 'right';
    const profile = baseErrorRates[k] || { errorRate: 8.0, latency: 210, hits: 40 };

    const hits = profile.hits;
    const errors = Math.round((hits * profile.errorRate) / 100);
    const correct = hits - errors;
    const errorRate = profile.errorRate;
    const accuracy = 100 - errorRate;

    totalHitsAll += hits;
    totalErrorsAll += errors;

    keyStats[k] = {
      key: k,
      char: k,
      finger,
      hand,
      totalHits: hits,
      correctHits: correct,
      errorCount: errors,
      accuracy: +(accuracy.toFixed(1)),
      errorRate: +(errorRate.toFixed(1)),
      avgLatencyMs: profile.latency,
      substitutions: {
        [k === 'P' ? 'O' : k === 'B' ? 'V' : k === 'Q' ? 'W' : 'D']: Math.max(1, Math.round(errors * 0.6))
      },
      struggleScore: Math.min(100, Math.round(errorRate * 3.5 + (profile.latency / 10)))
    };
  });

  // Calculate finger aggregates
  const fingerStats: Record<FingerId, FingerStats> = {} as any;
  let leftHandHits = 0;
  let rightHandHits = 0;

  (Object.keys(FINGER_DEFINITIONS) as FingerId[]).forEach(fId => {
    const fInfo = FINGER_DEFINITIONS[fId];
    const fingerKeys = Object.values(keyStats).filter(ks => ks.finger === fId);

    const fHits = fingerKeys.reduce((sum, ks) => sum + ks.totalHits, 0);
    const fErrors = fingerKeys.reduce((sum, ks) => sum + ks.errorCount, 0);
    const fErrorRate = fHits > 0 ? +((fErrors / fHits) * 100).toFixed(1) : 0;
    const fAccuracy = 100 - fErrorRate;
    const fAvgLatency = fingerKeys.length > 0
      ? Math.round(fingerKeys.reduce((sum, ks) => sum + ks.avgLatencyMs, 0) / fingerKeys.length)
      : 180;

    const strugglingKeys = fingerKeys
      .filter(ks => ks.errorRate >= 6.0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .map(ks => ks.key);

    if (fInfo.hand === 'left') leftHandHits += fHits;
    else rightHandHits += fHits;

    fingerStats[fId] = {
      finger: fId,
      name: fInfo.name,
      hand: fInfo.hand,
      totalHits: fHits,
      errorCount: fErrors,
      errorRate: fErrorRate,
      accuracy: fAccuracy,
      avgLatencyMs: fAvgLatency,
      strugglingKeys,
      loadSharePercent: totalHitsAll > 0 ? +((fHits / totalHitsAll) * 100).toFixed(1) : 0
    };
  });

  const leftPercent = totalHitsAll > 0 ? Math.round((leftHandHits / totalHitsAll) * 100) : 50;
  const rightPercent = 100 - leftPercent;

  const topStrugglingKeys = Object.values(keyStats)
    .filter(ks => ks.totalHits >= 10)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 8);

  const topStrugglingFingers = Object.values(fingerStats)
    .sort((a, b) => b.errorRate - a.errorRate);

  return {
    studentId,
    totalKeystrokes: totalHitsAll,
    totalErrors: totalErrorsAll,
    overallAccuracy: +(((totalHitsAll - totalErrorsAll) / totalHitsAll) * 100).toFixed(1),
    leftHandLoadPercent: leftPercent,
    rightHandLoadPercent: rightPercent,
    fingerStats,
    keyStats,
    topStrugglingKeys,
    topStrugglingFingers,
    lastUpdated: new Date().toISOString()
  };
}

/**
 * Retrieve user finger position and keystroke telemetry snapshot
 */
export function getFingerHeatmapData(studentId = 'std-24b11cs355'): FingerHeatmapSnapshot {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${studentId}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.fingerStats && parsed.keyStats) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading keystroke telemetry:', e);
  }

  const baseline = createBaselineTelemetry(studentId);
  saveFingerHeatmapData(baseline);
  return baseline;
}

/**
 * Save user finger position and keystroke telemetry snapshot
 */
export function saveFingerHeatmapData(data: FingerHeatmapSnapshot): void {
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${data.studentId}`, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving keystroke telemetry:', e);
  }
}

/**
 * Record a live keystroke event into the user's persistent heatmap data
 */
export function recordKeystrokeEvent(
  studentId: string,
  expectedChar: string,
  typedChar: string,
  latencyMs = 150
): void {
  const current = getFingerHeatmapData(studentId);
  const key = (expectedChar === ' ' ? 'SPACE' : expectedChar.toUpperCase()) || 'SPACE';
  const typedKey = (typedChar === ' ' ? 'SPACE' : typedChar.toUpperCase()) || 'SPACE';
  const isError = key !== typedKey;

  const finger = getFingerForKey(key);
  const hand = FINGER_DEFINITIONS[finger]?.hand || 'right';

  // Update or initialize KeyStats
  let ks = current.keyStats[key];
  if (!ks) {
    ks = {
      key,
      char: key,
      finger,
      hand,
      totalHits: 0,
      correctHits: 0,
      errorCount: 0,
      accuracy: 100,
      errorRate: 0,
      avgLatencyMs: latencyMs,
      substitutions: {},
      struggleScore: 0
    };
  }

  ks.totalHits += 1;
  if (isError) {
    ks.errorCount += 1;
    ks.substitutions[typedKey] = (ks.substitutions[typedKey] || 0) + 1;
  } else {
    ks.correctHits += 1;
  }

  ks.accuracy = +(((ks.correctHits) / ks.totalHits) * 100).toFixed(1);
  ks.errorRate = +(((ks.errorCount) / ks.totalHits) * 100).toFixed(1);
  ks.avgLatencyMs = Math.round((ks.avgLatencyMs * 0.9) + (latencyMs * 0.1));
  ks.struggleScore = Math.min(100, Math.round(ks.errorRate * 3.5 + (ks.avgLatencyMs / 10)));
  current.keyStats[key] = ks;

  // Recalculate totals
  current.totalKeystrokes += 1;
  if (isError) current.totalErrors += 1;
  current.overallAccuracy = +(
    ((current.totalKeystrokes - current.totalErrors) / current.totalKeystrokes) * 100
  ).toFixed(1);

  // Recalculate finger stats
  let leftHandHits = 0;
  let rightHandHits = 0;

  (Object.keys(FINGER_DEFINITIONS) as FingerId[]).forEach(fId => {
    const fInfo = FINGER_DEFINITIONS[fId];
    const fingerKeys = Object.values(current.keyStats).filter(k => k.finger === fId);

    const fHits = fingerKeys.reduce((sum, k) => sum + k.totalHits, 0);
    const fErrors = fingerKeys.reduce((sum, k) => sum + k.errorCount, 0);
    const fErrorRate = fHits > 0 ? +((fErrors / fHits) * 100).toFixed(1) : 0;
    const fAccuracy = 100 - fErrorRate;
    const fAvgLatency = fingerKeys.length > 0
      ? Math.round(fingerKeys.reduce((sum, k) => sum + k.avgLatencyMs, 0) / fingerKeys.length)
      : 180;

    const strugglingKeys = fingerKeys
      .filter(k => k.errorRate >= 6.0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .map(k => k.key);

    if (fInfo.hand === 'left') leftHandHits += fHits;
    else rightHandHits += fHits;

    current.fingerStats[fId] = {
      finger: fId,
      name: fInfo.name,
      hand: fInfo.hand,
      totalHits: fHits,
      errorCount: fErrors,
      errorRate: fErrorRate,
      accuracy: fAccuracy,
      avgLatencyMs: fAvgLatency,
      strugglingKeys,
      loadSharePercent: current.totalKeystrokes > 0
        ? +((fHits / current.totalKeystrokes) * 100).toFixed(1)
        : 0
    };
  });

  current.leftHandLoadPercent = Math.round((leftHandHits / current.totalKeystrokes) * 100);
  current.rightHandLoadPercent = 100 - current.leftHandLoadPercent;

  current.topStrugglingKeys = Object.values(current.keyStats)
    .filter(k => k.totalHits >= 5)
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 8);

  current.topStrugglingFingers = Object.values(current.fingerStats)
    .sort((a, b) => b.errorRate - a.errorRate);

  current.lastUpdated = new Date().toISOString();
  saveFingerHeatmapData(current);
}

/**
 * Generate a targeted drill passage specifically crafted to practice struggling keys
 */
export function generateTargetedDrillForWeakKeys(studentId: string): {
  title: string;
  focusKeys: string[];
  focusFingers: string[];
  passage: string;
} {
  const data = getFingerHeatmapData(studentId);
  const weakKeys = data.topStrugglingKeys.slice(0, 4).map(k => k.key);
  const weakFingers = Array.from(new Set(data.topStrugglingKeys.slice(0, 4).map(k => k.finger)))
    .map(fId => FINGER_DEFINITIONS[fId]?.name || fId);

  const fallbackKeys = weakKeys.length > 0 ? weakKeys : ['P', 'Q', 'B', 'Z'];

  // Curated targeted drills emphasizing specific difficult bigrams & keys
  const drillSentences: Record<string, string[]> = {
    'P': [
      'precision practice prepares pro typists for professional typing speed and peak performance.',
      'rapid typing passes through proper palm posture and prompt finger positioning.'
    ],
    'B': [
      'brave builders bridge binary blocks by balancing nimble keystroke rhythms.',
      'big databases build better benchmark metrics before background jobs begin.'
    ],
    'Q': [
      'quick inquiries require quantum queries and quiet concentration under proctored constraints.',
      'frequent quotes question quick sequential requests with exquisite accuracy.'
    ],
    'Z': [
      'zealous developers organize fuzzy algorithms to maximize zero latency buffers.',
      'horizontal puzzles minimize hazard sizes with amazing kinetic zoom.'
    ],
    'X': [
      'expand exact syntax contexts to execute flexible index structures flawlessly.',
      'complex matrix structures exert exceptional tax on auxiliary execution loops.'
    ],
    'C': [
      'clean code creates concise components configured with accurate cache controls.',
      'continuous cadence connects conscious character chords across dynamic circuits.'
    ]
  };

  const selectedLines: string[] = [];
  fallbackKeys.forEach(k => {
    const list = drillSentences[k.toUpperCase()];
    if (list && list.length > 0) {
      selectedLines.push(list[Math.floor(Math.random() * list.length)]);
    }
  });

  if (selectedLines.length === 0) {
    selectedLines.push(
      'precise posture and balanced finger dexterity prevent premature fatigue while typing challenging passages.',
      'frequent practice on outer keys builds strong neural connections and muscle memory.'
    );
  }

  return {
    title: `Targeted Recovery Drill: Keys ${fallbackKeys.join(', ')}`,
    focusKeys: fallbackKeys,
    focusFingers: weakFingers,
    passage: selectedLines.join(' ')
  };
}
