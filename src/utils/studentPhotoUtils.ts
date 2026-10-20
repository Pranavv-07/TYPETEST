/**
 * Aditya University Student Photo Utility
 * 
 * Provides direct resolution to official Aditya University student photos via:
 * https://backend.digitalservices.adityauniversity.in/api/proxy/student-photo/{ROLL_NO}
 * 
 * Includes deterministic color hashing and initials generation for seamless
 * and graceful fallback when images are loading or absent.
 */

export function cleanRollNumber(rollNo?: string | null): string {
  if (!rollNo) return '';
  return rollNo.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function getStudentPhotoUrl(rollNo?: string | null): string {
  const clean = cleanRollNumber(rollNo);
  if (!clean) return '';
  return `/api/proxy/student-photo/${clean}`;
}

export function getStudentDirectPhotoUrl(rollNo?: string | null): string {
  const clean = cleanRollNumber(rollNo);
  if (!clean) return '';
  return `https://backend.digitalservices.adityauniversity.in/api/proxy/student-photo/${clean}`;
}

export function getStudentInitials(name?: string | null, rollNo?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }
  }
  const clean = cleanRollNumber(rollNo);
  if (clean.length >= 2) {
    return clean.slice(-2);
  }
  return clean || 'ST';
}

const AVATAR_GRADIENTS = [
  'from-emerald-600 to-teal-800 text-emerald-100',
  'from-blue-600 to-indigo-800 text-blue-100',
  'from-violet-600 to-purple-800 text-violet-100',
  'from-amber-600 to-orange-800 text-amber-100',
  'from-rose-600 to-pink-800 text-rose-100',
  'from-cyan-600 to-blue-800 text-cyan-100',
  'from-fuchsia-600 to-pink-800 text-fuchsia-100',
  'from-teal-600 to-emerald-800 text-teal-100'
];

export function getAvatarGradient(identifier?: string | null): string {
  if (!identifier) return AVATAR_GRADIENTS[0];
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = (hash << 5) - hash + identifier.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % AVATAR_GRADIENTS.length;
  return AVATAR_GRADIENTS[index];
}
