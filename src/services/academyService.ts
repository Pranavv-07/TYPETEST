import {
  AcademyCurriculum,
  AcademyLevel,
  AcademyLesson,
  StudentAcademyProfile,
  StudentLessonAttempt,
  StudentLessonProgress,
  AcademyDiagnosticResult,
  AcademyAssignment,
  StudentCertificate
} from '../types';
import { DEFAULT_CURRICULUM } from '../data/academyCurriculum';
import { isWithinISTWindow, formatISTDateTime } from '../utils/dateUtils';

const PROFILE_KEY_PREFIX = 'typetest_academy_profile_';
const ATTEMPTS_KEY_PREFIX = 'typetest_academy_attempts_';
const ASSIGNMENTS_KEY = 'typetest_academy_assignments_v3';
const GLOBAL_ACADEMY_OPEN_KEY = 'typetest_academy_global_open';
const CURRICULUM_OVERRIDE_KEY = 'typetest_academy_curriculum_overrides';

// Check if Academy is globally unlocked by Trainer/Admin
export function isAcademyGloballyOpen(): boolean {
  try {
    const raw = localStorage.getItem(GLOBAL_ACADEMY_OPEN_KEY);
    return raw ? JSON.parse(raw) : false; // Closed by default
  } catch {
    return false;
  }
}

export function setAcademyGloballyOpen(isOpen: boolean): void {
  try {
    localStorage.setItem(GLOBAL_ACADEMY_OPEN_KEY, JSON.stringify(isOpen));
  } catch (e) {
    console.error(e);
  }
}

// Load stored curriculum overrides (for trainer customizations)
export function getActiveCurriculum(): AcademyCurriculum {
  try {
    const stored = localStorage.getItem(CURRICULUM_OVERRIDE_KEY);
    if (stored) {
      const overrides: Record<string, Partial<AcademyLesson>> = JSON.parse(stored);
      const cloned = JSON.parse(JSON.stringify(DEFAULT_CURRICULUM)) as AcademyCurriculum;
      cloned.levels.forEach(lvl => {
        lvl.lessons.forEach(lsn => {
          if (overrides[lsn.id]) {
            Object.assign(lsn, overrides[lsn.id]);
          }
        });
      });
      return cloned;
    }
  } catch (e) {
    console.error('Failed to load curriculum overrides:', e);
  }
  return DEFAULT_CURRICULUM;
}

// Save trainer customization for a lesson
export function saveLessonOverride(lessonId: string, updates: Partial<AcademyLesson>): void {
  try {
    const raw = localStorage.getItem(CURRICULUM_OVERRIDE_KEY);
    const overrides: Record<string, Partial<AcademyLesson>> = raw ? JSON.parse(raw) : {};
    overrides[lessonId] = { ...(overrides[lessonId] || {}), ...updates };
    localStorage.setItem(CURRICULUM_OVERRIDE_KEY, JSON.stringify(overrides));
  } catch (e) {
    console.error('Failed to save lesson override:', e);
  }
}

// Generate fully completed profile for Pranav Vedula (24B11CS355)
function createFullyCompletedProfile(studentId: string): StudentAcademyProfile {
  const curriculum = DEFAULT_CURRICULUM;
  const lessonProgress: Record<string, StudentLessonProgress> = {};
  const sampleWpms = [55, 62, 68, 74, 82, 88, 94];
  const sampleAccs = [98, 99, 97, 99, 98, 99, 100];

  curriculum.levels.forEach((lvl, lvlIdx) => {
    lvl.lessons.forEach(lsn => {
      lessonProgress[lsn.id] = {
        lessonId: lsn.id,
        studentId,
        status: 'mastered',
        attemptsCount: 3,
        bestWpm: sampleWpms[lvlIdx] || 75,
        bestAccuracy: sampleAccs[lvlIdx] || 98,
        masteredAt: '2026-09-20T10:00:00.000Z',
        guidedCompleted: true,
        conceptRead: true,
        completedDrillNumbers: [1, 2, 3]
      };
    });
  });

  const now = new Date();
  const pastDates: string[] = [];
  for (let i = 0; i < 15; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    pastDates.push(d.toISOString());
  }

  const profile: StudentAcademyProfile = {
    studentId,
    curriculumId: curriculum.id,
    currentLevelId: 7,
    currentLessonId: curriculum.levels[6].lessons[curriculum.levels[6].lessons.length - 1].id,
    diagnosticCompleted: true,
    diagnosticWpm: 88,
    diagnosticAccuracy: 99,
    diagnosticRecommendedLevel: 7,
    lessonProgress,
    weakKeysCounter: {},
    totalPracticeSeconds: 14200,
    streakDays: 15,
    longestStreakDays: 15,
    practicedToday: true,
    activityDates: pastDates.map(d => d.substring(0, 10)),
    certificateEarned: true,
    certificateId: 'cert-pranav-24b11cs355-apex',
    trainerOverrideUnlockAll: true
  };

  return profile;
}

// Check if an ID belongs to Pranav Vedula 24B11CS355
function isPranavVedulaAccount(id: string): boolean {
  if (!id) return false;
  const clean = id.toLowerCase().replace(/[^a-z0-9]/g, '');
  return (
    clean === '24b11cs355' ||
    clean.includes('24b11cs355') ||
    clean === 'pranav' ||
    clean === 'pranavvedula'
  );
}

// Get or create Student Academy Profile
export function getStudentAcademyProfile(studentId: string): StudentAcademyProfile {
  const isPranav = isPranavVedulaAccount(studentId);
  const key = `${PROFILE_KEY_PREFIX}${studentId}`;

  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const profile: StudentAcademyProfile = JSON.parse(stored);
      if (isPranav && profile.currentLevelId < 7) {
        const full = createFullyCompletedProfile(studentId);
        saveStudentAcademyProfile(full);
        return full;
      }
      return refreshProfileLockStatus(profile);
    }
  } catch (e) {
    console.error('Failed to load student profile:', e);
  }

  // Pre-seed 24b11cs355 with 100% completion & all badges
  if (isPranav) {
    const full = createFullyCompletedProfile(studentId);
    saveStudentAcademyProfile(full);
    return full;
  }

  // Initialize new profile
  const initialProfile: StudentAcademyProfile = {
    studentId,
    curriculumId: DEFAULT_CURRICULUM.id,
    currentLevelId: 1,
    currentLessonId: DEFAULT_CURRICULUM.levels[0].lessons[0].id,
    diagnosticCompleted: false,
    lessonProgress: {},
    weakKeysCounter: {},
    totalPracticeSeconds: 0,
    streakDays: 1,
    trainerOverrideUnlockAll: false,
  };

  return refreshProfileLockStatus(initialProfile);
}

// Save Student Academy Profile
export function saveStudentAcademyProfile(profile: StudentAcademyProfile): void {
  const key = `${PROFILE_KEY_PREFIX}${profile.studentId}`;
  try {
    localStorage.setItem(key, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save student profile:', e);
  }
}

// Calculate streak from date strings
export function calculateStreakFromDates(dateStrings: string[]): {
  currentStreak: number;
  longestStreak: number;
  practicedToday: boolean;
  activityDates: string[];
} {
  if (!dateStrings || dateStrings.length === 0) {
    return { currentStreak: 0, longestStreak: 0, practicedToday: false, activityDates: [] };
  }

  const uniqueDays = Array.from(
    new Set(
      dateStrings.map(d => {
        try {
          const dateObj = new Date(d);
          if (isNaN(dateObj.getTime())) return '';
          const year = dateObj.getFullYear();
          const month = String(dateObj.getMonth() + 1).padStart(2, '0');
          const day = String(dateObj.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
        } catch {
          return '';
        }
      }).filter(Boolean)
    )
  ).sort().reverse();

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0, practicedToday: false, activityDates: [] };
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  const yesterdayObj = new Date(now);
  yesterdayObj.setDate(yesterdayObj.getDate() - 1);
  const yesterdayStr = `${yesterdayObj.getFullYear()}-${String(yesterdayObj.getMonth() + 1).padStart(2, '0')}-${String(yesterdayObj.getDate()).padStart(2, '0')}`;

  const practicedToday = uniqueDays.includes(todayStr);

  let currentStreak = 0;
  if (uniqueDays[0] === todayStr || uniqueDays[0] === yesterdayStr) {
    let checkDate = new Date(uniqueDays[0] === todayStr ? now : yesterdayObj);
    for (const day of uniqueDays) {
      const year = checkDate.getFullYear();
      const month = String(checkDate.getMonth() + 1).padStart(2, '0');
      const d = String(checkDate.getDate()).padStart(2, '0');
      const expectedDayStr = `${year}-${month}-${d}`;
      if (day === expectedDayStr) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
  }

  let longestStreak = currentStreak;
  const ascDays = [...uniqueDays].reverse();
  let tempStreak = 0;
  let prevDate: Date | null = null;
  for (const day of ascDays) {
    const curDate = new Date(`${day}T00:00:00`);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = curDate.getTime() - prevDate.getTime();
      const diffDays = Math.round(diffTime / (1000 * 3600 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = curDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return {
    currentStreak: Math.max(0, currentStreak),
    longestStreak: Math.max(currentStreak, longestStreak),
    practicedToday,
    activityDates: uniqueDays,
  };
}

// Record that a student reviewed the concept for a lesson
export function recordConceptRead(studentId: string, lessonId: string): StudentAcademyProfile {
  const profile = getStudentAcademyProfile(studentId);
  const current = profile.lessonProgress[lessonId] || {
    lessonId,
    studentId,
    status: 'unlocked',
    attemptsCount: 0,
    bestWpm: 0,
    bestAccuracy: 0,
  };
  current.conceptRead = true;
  profile.lessonProgress[lessonId] = current;
  saveStudentAcademyProfile(profile);
  return profile;
}

// Record completion of a specific drill number (1, 2, or 3)
export function recordStudentDrillCompletion(
  studentId: string,
  lessonId: string,
  drillNumber: number
): { profile: StudentAcademyProfile; allDrillsCompleted: boolean } {
  const profile = getStudentAcademyProfile(studentId);
  const current = profile.lessonProgress[lessonId] || {
    lessonId,
    studentId,
    status: 'unlocked',
    attemptsCount: 0,
    bestWpm: 0,
    bestAccuracy: 0,
  };

  const existingDrills = new Set(current.completedDrillNumbers || []);
  existingDrills.add(drillNumber);
  current.completedDrillNumbers = Array.from(existingDrills).sort((a, b) => a - b);

  const allCompleted = [1, 2, 3].every(n => existingDrills.has(n));
  if (allCompleted) {
    current.guidedCompleted = true;
  }

  profile.lessonProgress[lessonId] = current;
  saveStudentAcademyProfile(profile);
  return { profile, allDrillsCompleted: allCompleted };
}

// Recalculate locks for all lessons based on prerequisites & assignments
export function refreshProfileLockStatus(profile: StudentAcademyProfile): StudentAcademyProfile {
  const curriculum = getActiveCurriculum();
  const updatedProgress: Record<string, StudentLessonProgress> = { ...profile.lessonProgress };

  let firstPendingFound = false;
  let highestLevel = 1;
  let activeLessonId = curriculum.levels[0].lessons[0].id;

  for (let lIdx = 0; lIdx < curriculum.levels.length; lIdx++) {
    const level = curriculum.levels[lIdx];
    const prevLevel = lIdx > 0 ? curriculum.levels[lIdx - 1] : null;

    const prevLevelMastered = prevLevel
      ? prevLevel.lessons.every(
          l => (profile.lessonProgress[l.id]?.status === 'mastered') || profile.trainerOverrideUnlockAll
        )
      : true;

    for (let sIdx = 0; sIdx < level.lessons.length; sIdx++) {
      const lesson = level.lessons[sIdx];
      const existing = updatedProgress[lesson.id];

      if (profile.trainerOverrideUnlockAll) {
        if (!existing || existing.status === 'locked') {
          updatedProgress[lesson.id] = {
            lessonId: lesson.id,
            studentId: profile.studentId,
            status: 'unlocked',
            attemptsCount: existing?.attemptsCount || 0,
            bestWpm: existing?.bestWpm || 0,
            bestAccuracy: existing?.bestAccuracy || 0,
            completedDrillNumbers: existing?.completedDrillNumbers || [],
            guidedCompleted: existing?.guidedCompleted || false,
            conceptRead: existing?.conceptRead || false,
          };
        }
        continue;
      }

      if (lIdx === 0 && sIdx === 0) {
        if (!existing || existing.status === 'locked') {
          updatedProgress[lesson.id] = {
            lessonId: lesson.id,
            studentId: profile.studentId,
            status: 'unlocked',
            attemptsCount: existing?.attemptsCount || 0,
            bestWpm: existing?.bestWpm || 0,
            bestAccuracy: existing?.bestAccuracy || 0,
            completedDrillNumbers: existing?.completedDrillNumbers || [],
            guidedCompleted: existing?.guidedCompleted || false,
            conceptRead: existing?.conceptRead || false,
          };
        }
        if (existing?.status !== 'mastered' && !firstPendingFound) {
          firstPendingFound = true;
          activeLessonId = lesson.id;
          highestLevel = level.id;
        }
        continue;
      }

      if (level.prerequisiteLevelId && !prevLevelMastered) {
        updatedProgress[lesson.id] = {
          lessonId: lesson.id,
          studentId: profile.studentId,
          status: 'locked',
          attemptsCount: existing?.attemptsCount || 0,
          bestWpm: existing?.bestWpm || 0,
          bestAccuracy: existing?.bestAccuracy || 0,
          completedDrillNumbers: existing?.completedDrillNumbers || [],
          guidedCompleted: existing?.guidedCompleted || false,
          conceptRead: existing?.conceptRead || false,
          lockReason: `Complete all lessons and assessment of Level ${level.prerequisiteLevelId} to unlock this level.`,
        };
        continue;
      }

      if (lesson.prerequisiteLessonId) {
        const prereqProgress = updatedProgress[lesson.prerequisiteLessonId];
        const isPrereqMastered = prereqProgress && prereqProgress.status === 'mastered';

        if (!isPrereqMastered) {
          updatedProgress[lesson.id] = {
            lessonId: lesson.id,
            studentId: profile.studentId,
            status: 'locked',
            attemptsCount: existing?.attemptsCount || 0,
            bestWpm: existing?.bestWpm || 0,
            bestAccuracy: existing?.bestAccuracy || 0,
            completedDrillNumbers: existing?.completedDrillNumbers || [],
            guidedCompleted: existing?.guidedCompleted || false,
            conceptRead: existing?.conceptRead || false,
            lockReason:
              lesson.prerequisiteReason ||
              `Complete the previous lesson with at least ${lesson.minAccuracy}% accuracy to unlock.`,
          };
          continue;
        }
      }

      if (!existing || existing.status === 'locked') {
        updatedProgress[lesson.id] = {
          lessonId: lesson.id,
          studentId: profile.studentId,
          status: 'unlocked',
          attemptsCount: existing?.attemptsCount || 0,
          bestWpm: existing?.bestWpm || 0,
          bestAccuracy: existing?.bestAccuracy || 0,
          completedDrillNumbers: existing?.completedDrillNumbers || [],
          guidedCompleted: existing?.guidedCompleted || false,
          conceptRead: existing?.conceptRead || false,
        };
      }

      if (updatedProgress[lesson.id].status !== 'mastered' && !firstPendingFound) {
        firstPendingFound = true;
        activeLessonId = lesson.id;
        highestLevel = level.id;
      }
    }
  }

  const attempts = getStudentAttemptHistory(profile.studentId);
  const attemptDates = attempts.map(a => a.timestamp);
  if (profile.lastActiveDate) {
    attemptDates.push(profile.lastActiveDate);
  }
  const streakStats = calculateStreakFromDates(attemptDates);

  const updatedProfile: StudentAcademyProfile = {
    ...profile,
    lessonProgress: updatedProgress,
    currentLevelId: highestLevel,
    currentLessonId: activeLessonId,
    streakDays: streakStats.currentStreak,
    longestStreakDays: streakStats.longestStreak,
    practicedToday: streakStats.practicedToday,
    activityDates: streakStats.activityDates,
  };

  saveStudentAcademyProfile(updatedProfile);
  return updatedProfile;
}

// Record a student's attempt at a lesson (Guided, Practice, or Assessment)
export function recordStudentLessonAttempt(
  studentId: string,
  attempt: Omit<StudentLessonAttempt, 'id' | 'timestamp'>
): { attempt: StudentLessonAttempt; profile: StudentAcademyProfile; newlyMastered: boolean } {
  const profile = getStudentAcademyProfile(studentId);
  const curriculum = getActiveCurriculum();

  let targetLesson: AcademyLesson | undefined;
  for (const lvl of curriculum.levels) {
    const found = lvl.lessons.find(l => l.id === attempt.lessonId);
    if (found) {
      targetLesson = found;
      break;
    }
  }

  const fullAttempt: StudentLessonAttempt = {
    ...attempt,
    id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  saveAttemptToHistory(studentId, fullAttempt);

  const isAssessment = attempt.phase === 'assessment';
  const minAcc = Math.max(95, targetLesson?.minAccuracy || 95);
  const minWpm = targetLesson?.minWpm || 15;
  const meetsCriteria = attempt.accuracy >= minAcc && attempt.wpm >= minWpm;
  const newlyMastered = isAssessment && meetsCriteria;

  const currentProgress = profile.lessonProgress[attempt.lessonId] || {
    lessonId: attempt.lessonId,
    studentId,
    status: 'unlocked',
    attemptsCount: 0,
    bestWpm: 0,
    bestAccuracy: 0,
  };

  currentProgress.attemptsCount += 1;
  currentProgress.bestWpm = Math.max(currentProgress.bestWpm, attempt.wpm);
  currentProgress.bestAccuracy = Math.max(currentProgress.bestAccuracy, attempt.accuracy);
  currentProgress.lastAttemptDate = fullAttempt.timestamp;

  if (attempt.phase === 'guided') {
    currentProgress.guidedCompleted = true;
  }

  if (newlyMastered || currentProgress.status === 'mastered') {
    currentProgress.status = 'mastered';
    currentProgress.masteredAt = currentProgress.masteredAt || fullAttempt.timestamp;
    currentProgress.guidedCompleted = true;
  } else {
    currentProgress.status = 'in_progress';
  }

  profile.lessonProgress[attempt.lessonId] = currentProgress;
  profile.totalPracticeSeconds += attempt.timeTakenSeconds;

  attempt.weakKeysDetected.forEach(char => {
    const lower = char.toLowerCase();
    profile.weakKeysCounter[lower] = (profile.weakKeysCounter[lower] || 0) + 1;
  });

  const refreshedProfile = refreshProfileLockStatus(profile);
  return { attempt: fullAttempt, profile: refreshedProfile, newlyMastered };
}

function saveAttemptToHistory(studentId: string, attempt: StudentLessonAttempt): void {
  const key = `${ATTEMPTS_KEY_PREFIX}${studentId}`;
  try {
    const raw = localStorage.getItem(key);
    const list: StudentLessonAttempt[] = raw ? JSON.parse(raw) : [];
    list.unshift(attempt);
    localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save attempt history:', e);
  }
}

export function getStudentAttemptHistory(studentId: string): StudentLessonAttempt[] {
  const key = `${ATTEMPTS_KEY_PREFIX}${studentId}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function getTopWeakKeys(studentId: string, limit = 6): { key: string; count: number }[] {
  const profile = getStudentAcademyProfile(studentId);
  const entries = Object.entries(profile.weakKeysCounter || {});
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit).map(([key, count]) => ({ key, count }));
}

export function generateWeakKeysDrill(weakKeys: string[]): { title: string; practiceText: string } {
  if (!weakKeys.length) {
    return {
      title: 'General Fundamentals Drill',
      practiceText:
        'The quick brown fox jumps over the lazy dog. Swift actions create lasting confidence and steady accuracy.',
    };
  }

  const WORD_BANK: Record<string, string[]> = {
    p: ['practice', 'pace', 'project', 'pass', 'point', 'speed', 'plastic', 'capture', 'rapid', 'expert'],
    t: ['trust', 'testing', 'target', 'tactics', 'intent', 'letter', 'attitude', 'pattern', 'vital', 'action'],
    c: ['focus', 'capture', 'circle', 'scale', 'impact', 'concept', 'crucial', 'circuit', 'exact', 'metric'],
    r: ['rhythm', 'regular', 'rapid', 'reason', 'react', 'correct', 'direct', 'strive', 'barrier', 'error'],
    e: ['effort', 'speed', 'level', 'every', 'excel', 'sense', 'deliver', 'serene', 'meter', 'perfect'],
    b: ['balance', 'habit', 'number', 'stable', 'vibrate', 'build', 'broad', 'begin', 'amber', 'symbol'],
    v: ['vital', 'vivid', 'active', 'travel', 'value', 'solve', 'curve', 'brave', 'silver', 'voice'],
    m: ['master', 'moment', 'motion', 'rhythm', 'modern', 'sample', 'memory', 'mental', 'metronome', 'impact'],
    n: ['steady', 'fluent', 'action', 'nation', 'tension', 'intent', 'online', 'screen', 'engine', 'mind'],
    q: ['quick', 'quiet', 'quiz', 'quench', 'quaint', 'quota', 'equal', 'quality', 'unique', 'liquid'],
    z: ['zero', 'zone', 'zigzag', 'freeze', 'breeze', 'gaze', 'haze', 'blaze', 'maze', 'prize'],
    x: ['exact', 'extra', 'exercise', 'apex', 'axis', 'text', 'next', 'fixed', 'complex', 'maximum'],
  };

  const selectedWords: string[] = [];
  weakKeys.forEach(k => {
    const bank = WORD_BANK[k.toLowerCase()];
    if (bank) {
      selectedWords.push(...bank.slice(0, 4));
    }
  });

  if (selectedWords.length < 8) {
    selectedWords.push('precision', 'discipline', 'confidence', 'steady', 'focus', 'metronome');
  }

  const shuffled = selectedWords.sort(() => 0.5 - Math.random());
  const sentence = shuffled.join(' ') + '.';

  return {
    title: `Targeted Drill: Keys [${weakKeys.map(k => k.toUpperCase()).join(', ')}]`,
    practiceText: `${sentence} Repeat each stroke calmly and anchor your fingers directly to the home row after every touch.`,
  };
}

export function evaluateDiagnosticAssessment(
  wpm: number,
  accuracy: number,
  errors: number,
  consistency: number,
  weakKeys: string[]
): AcademyDiagnosticResult {
  let recommendedLevelId = 1;
  let placementMessage = '';

  if (wpm < 15 || accuracy < 85) {
    recommendedLevelId = 1;
    placementMessage =
      'Recommended: Level 1 (Keyboard Fundamentals). Building strong home-row muscle memory on F and J anchors will establish a rock-solid foundation.';
  } else if (wpm < 25 || accuracy < 90) {
    recommendedLevelId = 2;
    placementMessage =
      'Recommended: Level 2 (Key Mastery). You know basic keys; let\'s master diagonal top and bottom row reaches.';
  } else if (wpm < 35 && accuracy >= 92) {
    recommendedLevelId = 3;
    placementMessage =
      'Recommended: Level 3 (Word Formation). Your key reaches are solid; let\'s accelerate whole-word chunking and cadence.';
  } else if (accuracy < 94) {
    recommendedLevelId = 4;
    placementMessage =
      'Recommended: Level 4 (Accuracy & Error Correction). You have solid speed; precision calibration will unlock professional speed.';
  } else if (wpm < 45) {
    recommendedLevelId = 5;
    placementMessage =
      'Recommended: Level 5 (Speed & Endurance). You are an experienced typist ready for timed stamina sprints.';
  } else {
    recommendedLevelId = 6;
    placementMessage =
      'Recommended: Level 6 (Advanced Typing). Excellent baseline! Master numbers, symbols, and code syntax.';
  }

  const curriculum = getActiveCurriculum();
  const targetLevel = curriculum.levels.find(l => l.id === recommendedLevelId) || curriculum.levels[0];

  return {
    wpm,
    accuracy,
    errors,
    consistency,
    recommendedLevelId,
    recommendedLevelTitle: targetLevel.title,
    placementMessage,
    weakKeys,
    timestamp: new Date().toISOString(),
  };
}

export function applyDiagnosticPlacement(
  studentId: string,
  result: AcademyDiagnosticResult,
  skipToRecommended = true
): StudentAcademyProfile {
  const profile = getStudentAcademyProfile(studentId);
  profile.diagnosticCompleted = true;
  profile.diagnosticWpm = result.wpm;
  profile.diagnosticAccuracy = result.accuracy;
  profile.diagnosticRecommendedLevel = result.recommendedLevelId;

  if (skipToRecommended && result.recommendedLevelId > 1) {
    const curriculum = getActiveCurriculum();
    curriculum.levels.forEach(lvl => {
      if (lvl.id < result.recommendedLevelId) {
        lvl.lessons.forEach(lsn => {
          profile.lessonProgress[lsn.id] = {
            lessonId: lsn.id,
            studentId,
            status: 'mastered',
            attemptsCount: 1,
            bestWpm: result.wpm,
            bestAccuracy: result.accuracy,
            masteredAt: new Date().toISOString(),
          };
        });
      }
    });
  }

  return refreshProfileLockStatus(profile);
}

export function setTrainerOverrideUnlockAll(studentId: string, unlockAll: boolean): StudentAcademyProfile {
  const profile = getStudentAcademyProfile(studentId);
  profile.trainerOverrideUnlockAll = unlockAll;
  return refreshProfileLockStatus(profile);
}

export function issueAcademyCertificate(
  student: { id: string; name: string; rollNo?: string },
  institutionName: string,
  finalWpm: number,
  finalAccuracy: number
): StudentCertificate {
  const code = `DOTT-ADITYA-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const cert: StudentCertificate = {
    id: `cert_academy_${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    rollNo: student.rollNo || '24B11CS355',
    achievementTitle: 'Typing Academy Touch-Typing Certified Graduate',
    wpm: finalWpm,
    accuracy: finalAccuracy,
    testTitle: 'Level 7 Professional Touch Typing Institutional Certification',
    issuedAt: new Date().toISOString(),
    issuingAuthority: 'Department of Technical Training (DOTT), Aditya University',
    verificationCode: code,
    certificateNumber: `DOTT-TTC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'valid',
  };

  const profile = getStudentAcademyProfile(student.id);
  profile.certificateEarned = true;
  profile.certificateId = cert.id;
  saveStudentAcademyProfile(profile);

  return cert;
}

// ============================================================================
// ACADEMY ASSIGNMENTS (Trainer / Faculty Schedule Management)
// ============================================================================

export function getAcademyAssignments(): AcademyAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to get academy assignments:', e);
  }

  // Pre-seed an active assignment so students have clear assigned curriculum
  const defaultAssignment: AcademyAssignment = {
    id: 'assign_week1_fundamentals',
    title: 'Week 1: Keyboard Fundamentals & Touch Foundations',
    classId: 'all',
    className: 'All CSE & AI Batches (2024-28)',
    trainerId: 'trn-1',
    curriculumId: DEFAULT_CURRICULUM.id,
    levelIds: [1, 2],
    lessonIds: ['l1-lesson-1', 'l1-lesson-2', 'l1-lesson-3', 'l1-lesson-4', 'l2-lesson-1', 'l2-lesson-2'],
    minWpm: 15,
    minAccuracy: 95,
    startDate: new Date(Date.now() - 86400000 * 2).toISOString(),
    dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  };

  return [defaultAssignment];
}

export function saveAcademyAssignment(assignment: Omit<AcademyAssignment, 'id' | 'createdAt'>): AcademyAssignment {
  const full: AcademyAssignment = {
    ...assignment,
    id: `assign_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
  };
  const list = getAcademyAssignments();
  list.unshift(full);
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
  return full;
}

export function updateAcademyAssignment(id: string, updates: Partial<AcademyAssignment>): void {
  const list = getAcademyAssignments();
  const idx = list.findIndex(a => a.id === id);
  if (idx !== -1) {
    list[idx] = { ...list[idx], ...updates };
    try {
      localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list));
    } catch (e) {
      console.error(e);
    }
  }
}

export function deleteAcademyAssignment(id: string): void {
  const list = getAcademyAssignments().filter(a => a.id !== id);
  try {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list));
  } catch (e) {
    console.error(e);
  }
}

/**
 * Checks if a specific lesson or level is currently accessible to a student based on:
 * 1. Global open toggle by trainer/admin
 * 2. Active Academy Assignment covering this level/lesson and student's class/batch
 * 3. Whether the student has already completed/mastered it (past completions are always accessible)
 */
export function checkLessonAccess(
  levelId: number,
  lessonId: string,
  student?: { id: string; classId?: string; role?: string; rollNo?: string } | null
): {
  isAccessible: boolean;
  assignment?: AcademyAssignment;
  isCompleted: boolean;
  reason?: string;
} {
  // Trainers and Admins always have full access
  if (student?.role === 'trainer' || student?.role === 'admin') {
    return { isAccessible: true, isCompleted: false };
  }

  const studentId = student?.id || 'std-24b11cs355';
  const profile = getStudentAcademyProfile(studentId);
  const isCompleted = Boolean(profile?.lessonProgress[lessonId]?.status === 'mastered');

  // If already completed or user has override unlock
  if (isCompleted || profile?.trainerOverrideUnlockAll) {
    return { isAccessible: true, isCompleted };
  }

  // If Academy is globally opened by trainer
  if (isAcademyGloballyOpen()) {
    return { isAccessible: true, isCompleted };
  }

  // Check active assignments
  const assignments = getAcademyAssignments().filter(a => a.status === 'active');
  const now = Date.now();

  const studentClassId = student?.classId || 'cls-cse-a';

  for (const assign of assignments) {
    // Robust date window checking (full day support with 24h timezone grace window)
    if (assign.startDate) {
      const startStr = assign.startDate.includes('T') ? assign.startDate : `${assign.startDate}T00:00:00`;
      const start = new Date(startStr).getTime();
      if (!isNaN(start) && now < start - 86400000) {
        continue;
      }
    }

    if (assign.dueDate) {
      const dueStr = assign.dueDate.includes('T') ? assign.dueDate : `${assign.dueDate}T23:59:59`;
      const end = new Date(dueStr).getTime();
      if (!isNaN(end) && now > end + 86400000) {
        continue;
      }
    }

    // Check class targeting (support 'all', specific classId, className wildcard, or individual studentId)
    const matchesClass =
      assign.classId === 'all' ||
      !assign.classId ||
      assign.classId === studentClassId ||
      (student?.id && assign.classId === student.id) ||
      (assign.className && assign.className.toLowerCase().includes('all')) ||
      (student?.classId && assign.classId === student.classId);

    if (!matchesClass) {
      continue;
    }

    // Check level & lesson inclusion
    const includesLevel =
      !assign.levelIds ||
      assign.levelIds.length === 0 ||
      assign.levelIds.includes(levelId) ||
      assign.levelIds.includes(Number(levelId));

    const includesLesson =
      !assign.lessonIds ||
      assign.lessonIds.length === 0 ||
      assign.lessonIds.includes(lessonId);

    if (includesLevel && includesLesson) {
      return { isAccessible: true, assignment: assign, isCompleted };
    }
  }

  return {
    isAccessible: false,
    isCompleted,
    reason: 'Assigned by Trainer Only. Your faculty will assign this module for your scheduled practice window.'
  };
}
