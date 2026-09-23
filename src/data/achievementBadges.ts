export interface CertificationBadge {
  id: string;
  levelId: string;
  levelNumber: number;
  name: string;
  certificationTitle: string;
  credentialSubtext: string;
  keyboardType: string;
  tagline: string;
  description: string;
  icon: string;
  tier: 'Foundations' | 'Associate' | 'Specialist' | 'Professional' | 'Senior Specialist' | 'Master Architect' | 'Grandmaster Apex';
  rarity: 'Foundations Tier' | 'Associate Tier' | 'Specialist Tier' | 'Professional Tier' | 'Senior Master' | 'Elite Master' | 'Grand Imperial Apex';
  color: string;
  bezelClass: string;
  innerPlateClass: string;
  bannerColor: string;
  pedestalType: 'aluminum' | 'bronze' | 'silver' | 'gold' | 'ruby' | 'emerald' | 'grand-gold-ribbon';
  switchType: string;
  isGrand?: boolean;
}

export const KEYBOARD_BADGES: CertificationBadge[] = [
  {
    id: 'badge-level-1',
    levelId: 'level-1',
    levelNumber: 1,
    name: 'Home Row Foundations Associate',
    certificationTitle: 'Foundations',
    credentialSubtext: 'Touch Typing Foundations Associate',
    keyboardType: 'Chiclet Membrane Initiate',
    tagline: 'Level 1 Baseline Certification',
    description: 'Mastered home-row foundation, upright posture, and index tactile nubs on standard baseline keys.',
    icon: '⌨️',
    tier: 'Foundations',
    rarity: 'Foundations Tier',
    color: '#94a3b8',
    bezelClass: 'from-slate-300 via-slate-100 to-slate-400 border-slate-400',
    innerPlateClass: 'bg-gradient-to-b from-slate-50 to-slate-100 text-slate-900',
    bannerColor: '#475569',
    pedestalType: 'aluminum',
    switchType: 'Baseline Membrane 60g',
    isGrand: false
  },
  {
    id: 'badge-level-2',
    levelId: 'level-2',
    levelNumber: 2,
    name: 'Key Mastery Specialist',
    certificationTitle: 'Specialist',
    credentialSubtext: 'Top & Bottom Reach Specialist',
    keyboardType: 'Ergonomic Split Scissor-Switch',
    tagline: 'Level 2 Vertical Reach Credential',
    description: 'Mastered vertical reaches to QWERTY upper and ZXCV lower rows with snappy return anchors.',
    icon: '💻',
    tier: 'Specialist',
    rarity: 'Specialist Tier',
    color: '#38bdf8',
    bezelClass: 'from-sky-300 via-sky-100 to-sky-500 border-sky-400',
    innerPlateClass: 'bg-gradient-to-b from-sky-50 to-slate-100 text-slate-900',
    bannerColor: '#0284c7',
    pedestalType: 'bronze',
    switchType: 'Scissor Tactile 50g',
    isGrand: false
  },
  {
    id: 'badge-level-3',
    levelId: 'level-3',
    levelNumber: 3,
    name: 'Shift & Punctuation Associate',
    certificationTitle: 'Associate',
    credentialSubtext: 'Punctuation & Shift Certified Associate',
    keyboardType: 'Tenkeyless Mechanical (TKL)',
    tagline: 'Level 3 Bilateral Shift Credential',
    description: 'Mastered capitalizations, opposing-hand Shift discipline, commas, periods, and quotation punctuation.',
    icon: '⚡',
    tier: 'Associate',
    rarity: 'Associate Tier',
    color: '#a855f7',
    bezelClass: 'from-purple-300 via-purple-100 to-purple-500 border-purple-400',
    innerPlateClass: 'bg-gradient-to-b from-purple-50 to-slate-100 text-slate-900',
    bannerColor: '#7e22ce',
    pedestalType: 'silver',
    switchType: 'Cherry MX Brown 55g',
    isGrand: false
  },
  {
    id: 'badge-level-4',
    levelId: 'level-4',
    levelNumber: 4,
    name: 'Number & Symbol Professional',
    certificationTitle: 'Professional',
    credentialSubtext: 'Alphanumeric Professional Certified',
    keyboardType: 'Custom 65% Hot-Swap Artisan',
    tagline: 'Level 4 Numbers & Symbols Credential',
    description: 'Flawless execution of numerical top-row data entry, currency signs, and common technical characters.',
    icon: '🎨',
    tier: 'Professional',
    rarity: 'Professional Tier',
    color: '#f59e0b',
    bezelClass: 'from-amber-300 via-amber-100 to-amber-500 border-amber-400',
    innerPlateClass: 'bg-gradient-to-b from-amber-50 to-slate-100 text-slate-900',
    bannerColor: '#d97706',
    pedestalType: 'gold',
    switchType: 'Gateron Yellow Lubed 50g',
    isGrand: false
  },
  {
    id: 'badge-level-5',
    levelId: 'level-5',
    levelNumber: 5,
    name: 'Speed & Rhythm Senior Specialist',
    certificationTitle: 'Senior Specialist',
    credentialSubtext: 'High-Cadence Rhythm Senior Specialist',
    keyboardType: 'Topre 45g Japanese Capacitive',
    tagline: 'Level 5 High-Velocity Credential',
    description: 'Sustained >45+ WPM with >96% accuracy across uninterrupted paragraphs with melodic rhythm.',
    icon: '🔮',
    tier: 'Senior Specialist',
    rarity: 'Senior Master',
    color: '#ec4899',
    bezelClass: 'from-rose-300 via-rose-100 to-rose-500 border-rose-400',
    innerPlateClass: 'bg-gradient-to-b from-rose-50 to-slate-100 text-slate-900',
    bannerColor: '#e11d48',
    pedestalType: 'ruby',
    switchType: 'Topre Electrostatic 45g',
    isGrand: false
  },
  {
    id: 'badge-level-6',
    levelId: 'level-6',
    levelNumber: 6,
    name: 'Code & Technical Master Architect',
    certificationTitle: 'Master Architect',
    credentialSubtext: 'Programming & Syntax Master Architect',
    keyboardType: 'Brass-Plate Custom Audiophile Thock',
    tagline: 'Level 6 Developer Syntax Master',
    description: 'Complex programming syntax, camelCase/snake_case variables, regex symbols, and braces at 60+ WPM.',
    icon: '👑',
    tier: 'Master Architect',
    rarity: 'Elite Master',
    color: '#10b981',
    bezelClass: 'from-emerald-300 via-emerald-100 to-emerald-500 border-emerald-400',
    innerPlateClass: 'bg-gradient-to-b from-emerald-50 to-slate-100 text-slate-900',
    bannerColor: '#059669',
    pedestalType: 'emerald',
    switchType: 'Holy Panda U4T 62g',
    isGrand: false
  },
  {
    id: 'badge-level-7',
    levelId: 'level-7',
    levelNumber: 7,
    name: 'Grandmaster Apex Titan',
    certificationTitle: 'Grandmaster Apex',
    credentialSubtext: 'Supreme Imperial Touch Typing Apex',
    keyboardType: 'Titanium Hall Effect Rapid-Trigger Apex',
    tagline: 'Level 7 The Ultimate Grand Credential',
    description: 'Surpassed 70+ WPM with >98% accuracy across advanced engineering literature and dense algorithmic code.',
    icon: '🔥',
    tier: 'Grandmaster Apex',
    rarity: 'Grand Imperial Apex',
    color: '#ef4444',
    bezelClass: 'from-amber-200 via-yellow-100 to-amber-600 border-yellow-300 shadow-yellow-500/50',
    innerPlateClass: 'bg-gradient-to-b from-amber-50 via-white to-amber-100 text-slate-900',
    bannerColor: '#b91c1c',
    pedestalType: 'grand-gold-ribbon',
    switchType: 'Magnetic Hall Effect 0.1mm Rapid Trigger',
    isGrand: true
  }
];

export type KeyboardBadge = CertificationBadge;

export function getBadgeForLevel(levelIdOrNumber: string | number): CertificationBadge | undefined {
  if (typeof levelIdOrNumber === 'number') {
    return KEYBOARD_BADGES.find(b => b.levelNumber === levelIdOrNumber);
  }
  return KEYBOARD_BADGES.find(b => b.levelId === levelIdOrNumber);
}
