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

const PROFILE_KEY_PREFIX = 'typetest_academy_profile_';
const ATTEMPTS_KEY_PREFIX = 'typetest_academy_attempts_';
const ASSIGNMENTS_KEY = 'typetest_academy_assignments';
const CURRICULUM_OVERRIDE_KEY = 'typetest_academy_curriculum_overrides';

// Load stored curriculum overrides (for trainer customizations)
export function getActiveCurriculum(): AcademyCurriculum {
  try {
    const stored = localStorage.getItem(CURRICULUM_OVERRIDE_KEY);
    if (stored) {
      const overrides: Record<string, Partial<AcademyLesson>> = JSON.parse(stored);
      // Merge overrides onto default
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

// Get or create Student Academy Profile
export function getStudentAcademyProfile(studentId: string): StudentAcademyProfile {
  const key = `${PROFILE_KEY_PREFIX}${studentId}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const profile: StudentAcademyProfile = JSON.parse(stored);
      return refreshProfileLockStatus(profile);
    }
  } catch (e) {
    console.error('Failed to load student profile:', e);
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

// Recalculate locks for all lessons based on prerequisites
export function refreshProfileLockStatus(profile: StudentAcademyProfile): StudentAcademyProfile {
  const curriculum = getActiveCurriculum();
  const updatedProgress: Record<string, StudentLessonProgress> = { ...profile.lessonProgress };

  let firstPendingFound = false;
  let highestLevel = 1;
  let activeLessonId = curriculum.levels[0].lessons[0].id;

  for (let lIdx = 0; lIdx < curriculum.levels.length; lIdx++) {
    const level = curriculum.levels[lIdx];
    const prevLevel = lIdx > 0 ? curriculum.levels[lIdx - 1] : null;

    // Check if previous level final assessment is mastered
    const prevLevelMastered = prevLevel
      ? prevLevel.lessons.every(
          l => (profile.lessonProgress[l.id]?.status === 'mastered') || profile.trainerOverrideUnlockAll
        )
      : true;

    for (let sIdx = 0; sIdx < level.lessons.length; sIdx++) {
      const lesson = level.lessons[sIdx];
      const existing = updatedProgress[lesson.id];

      // If trainer overrode unlocks, everything is unlocked!
      if (profile.trainerOverrideUnlockAll) {
        if (!existing || existing.status === 'locked') {
          updatedProgress[lesson.id] = {
            lessonId: lesson.id,
            studentId: profile.studentId,
            status: 'unlocked',
            attemptsCount: existing?.attemptsCount || 0,
            bestWpm: existing?.bestWpm || 0,
            bestAccuracy: existing?.bestAccuracy || 0,
          };
        }
        continue;
      }

      // First lesson of Level 1 is always unlocked
      if (lIdx === 0 && sIdx === 0) {
        if (!existing || existing.status === 'locked') {
          updatedProgress[lesson.id] = {
            lessonId: lesson.id,
            studentId: profile.studentId,
            status: 'unlocked',
            attemptsCount: existing?.attemptsCount || 0,
            bestWpm: existing?.bestWpm || 0,
            bestAccuracy: existing?.bestAccuracy || 0,
          };
        }
        if (existing?.status !== 'mastered' && !firstPendingFound) {
          firstPendingFound = true;
          activeLessonId = lesson.id;
          highestLevel = level.id;
        }
        continue;
      }

      // Check level prerequisite
      if (level.prerequisiteLevelId && !prevLevelMastered) {
        updatedProgress[lesson.id] = {
          lessonId: lesson.id,
          studentId: profile.studentId,
          status: 'locked',
          attemptsCount: existing?.attemptsCount || 0,
          bestWpm: existing?.bestWpm || 0,
          bestAccuracy: existing?.bestAccuracy || 0,
          lockReason: `Complete all lessons and assessment of Level ${level.prerequisiteLevelId} to unlock this level.`,
        };
        continue;
      }

      // Check lesson prerequisite
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
            lockReason:
              lesson.prerequisiteReason ||
              `Complete the previous lesson with at least ${lesson.minAccuracy}% accuracy to unlock.`,
          };
          continue;
        }
      }

      // Prerequisite satisfied -> unlocked or keep mastered
      if (!existing || existing.status === 'locked') {
        updatedProgress[lesson.id] = {
          lessonId: lesson.id,
          studentId: profile.studentId,
          status: 'unlocked',
          attemptsCount: existing?.attemptsCount || 0,
          bestWpm: existing?.bestWpm || 0,
          bestAccuracy: existing?.bestAccuracy || 0,
        };
      }

      if (updatedProgress[lesson.id].status !== 'mastered' && !firstPendingFound) {
        firstPendingFound = true;
        activeLessonId = lesson.id;
        highestLevel = level.id;
      }
    }
  }

  const updatedProfile: StudentAcademyProfile = {
    ...profile,
    lessonProgress: updatedProgress,
    currentLevelId: highestLevel,
    currentLessonId: activeLessonId,
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

  // Find target lesson
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

  // Save attempt to history
  saveAttemptToHistory(studentId, fullAttempt);

  // Check mastery criteria
  const isAssessment = attempt.phase === 'assessment';
  const minAcc = targetLesson?.minAccuracy || 95;
  const minWpm = targetLesson?.minWpm || 15;
  const meetsCriteria = attempt.accuracy >= minAcc && attempt.wpm >= minWpm;
  const newlyMastered = isAssessment && meetsCriteria;

  // Update progress
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

  // Track completion of phases
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

  // Track weak keys
  attempt.weakKeysDetected.forEach(char => {
    const lower = char.toLowerCase();
    profile.weakKeysCounter[lower] = (profile.weakKeysCounter[lower] || 0) + 1;
  });

  const refreshedProfile = refreshProfileLockStatus(profile);
  return { attempt: fullAttempt, profile: refreshedProfile, newlyMastered };
}

// Save attempt to localStorage history
function saveAttemptToHistory(studentId: string, attempt: StudentLessonAttempt): void {
  const key = `${ATTEMPTS_KEY_PREFIX}${studentId}`;
  try {
    const raw = localStorage.getItem(key);
    const list: StudentLessonAttempt[] = raw ? JSON.parse(raw) : [];
    list.unshift(attempt);
    // Keep last 100 attempts
    localStorage.setItem(key, JSON.stringify(list.slice(0, 100)));
  } catch (e) {
    console.error('Failed to save attempt history:', e);
  }
}

// Get student's attempt history
export function getStudentAttemptHistory(studentId: string): StudentLessonAttempt[] {
  const key = `${ATTEMPTS_KEY_PREFIX}${studentId}`;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

// Top weak keys
export function getTopWeakKeys(studentId: string, limit = 6): { key: string; count: number }[] {
  const profile = getStudentAcademyProfile(studentId);
  const entries = Object.entries(profile.weakKeysCounter || {});
  entries.sort((a, b) => b[1] - a[1]);
  return entries.slice(0, limit).map(([key, count]) => ({ key, count }));
}

// Generate targeted drills for weak keys
export function generateWeakKeysDrill(weakKeys: string[]): { title: string; practiceText: string } {
  if (!weakKeys.length) {
    return {
      title: 'General Fundamentals Drill',
      practiceText:
        'The quick brown fox jumps over the lazy dog. Swift actions create lasting confidence and steady accuracy.',
    };
  }

  // Pre-built dictionary mapped by key
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

  // Shuffle
  const shuffled = selectedWords.sort(() => 0.5 - Math.random());
  const sentence = shuffled.join(' ') + '.';

  return {
    title: `Targeted Drill: Keys [${weakKeys.map(k => k.toUpperCase()).join(', ')}]`,
    practiceText: `${sentence} Repeat each stroke calmly and anchor your fingers directly to the home row after every touch.`,
  };
}

// Evaluate Diagnostic Test
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

// Apply Diagnostic Placement
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
    // Auto-master preceding levels
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

// Trainer: Override all locks for a student
export function setTrainerOverrideUnlockAll(studentId: string, unlockAll: boolean): StudentAcademyProfile {
  const profile = getStudentAcademyProfile(studentId);
  profile.trainerOverrideUnlockAll = unlockAll;
  return refreshProfileLockStatus(profile);
}

// Generate Official Typing Academy Certificate
export function issueAcademyCertificate(
  student: { id: string; name: string; rollNo?: string },
  institutionName: string,
  finalWpm: number,
  finalAccuracy: number
): StudentCertificate {
  const code = `ACAD-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const cert: StudentCertificate = {
    id: `cert_${Date.now()}`,
    studentId: student.id,
    studentName: student.name,
    rollNo: student.rollNo || 'N/A',
    achievementTitle: 'Typing Academy Certified Touch Typist',
    wpm: finalWpm,
    accuracy: finalAccuracy,
    testTitle: 'Level 7 Touch Typing Institutional Certification Exam',
    issuedAt: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    issuingAuthority: institutionName || 'Global Touch Typing Institute',
    verificationCode: code,
    certificateNumber: `TTC-2026-${Math.floor(100000 + Math.random() * 900000)}`,
    status: 'valid',
  };

  // Update profile
  const profile = getStudentAcademyProfile(student.id);
  profile.certificateEarned = true;
  profile.certificateId = cert.id;
  saveStudentAcademyProfile(profile);

  return cert;
}

// Academy Assignments Management
export function getAcademyAssignments(): AcademyAssignment[] {
  try {
    const raw = localStorage.getItem(ASSIGNMENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export function saveAcademyAssignment(assignment: Omit<AcademyAssignment, 'id' | 'createdAt'>): AcademyAssignment {
  const full: AcademyAssignment = {
    ...assignment,
    id: `assign_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  const list = getAcademyAssignments();
  list.unshift(full);
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(list));
  return full;
}
