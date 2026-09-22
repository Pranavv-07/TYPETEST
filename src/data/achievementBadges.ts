export interface KeyboardBadge {
  levelId: string;
  levelNumber: number;
  id: string;
  name: string;
  keyboardType: string;
  tagline: string;
  description: string;
  icon: string;
  color: string;
  accentBorder: string;
  bgGlow: string;
  switchType: string;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Epic' | 'Legendary' | 'Mythic' | 'God Tier';
}

export const KEYBOARD_BADGES: KeyboardBadge[] = [
  {
    levelId: 'level-1',
    levelNumber: 1,
    id: 'badge-level-1',
    name: 'Chiclet Membrane Initiate',
    keyboardType: 'Basic Membrane Rubber Dome',
    tagline: 'The Journey Begins',
    description: 'Mastered home-row foundation on standard baseline chiclet keys. Clean muscle memory unlocked.',
    icon: '⌨️',
    color: '#94a3b8',
    accentBorder: 'border-slate-500/40',
    bgGlow: 'bg-slate-800/40 shadow-slate-500/10',
    switchType: 'Rubber Dome 60g',
    rarity: 'Common'
  },
  {
    levelId: 'level-2',
    levelNumber: 2,
    id: 'badge-level-2',
    name: 'Ergonomic Split Pioneer',
    keyboardType: 'Ergonomic Split Scissor-Switch',
    tagline: 'Balanced Symmetry',
    description: 'Conquered top-row reaches and split hand balance with refined ergonomic posture.',
    icon: '💻',
    color: '#38bdf8',
    accentBorder: 'border-sky-500/50',
    bgGlow: 'bg-sky-950/40 shadow-sky-500/20',
    switchType: 'Scissor Tactile 50g',
    rarity: 'Uncommon'
  },
  {
    levelId: 'level-3',
    levelNumber: 3,
    id: 'badge-level-3',
    name: 'Tactile Tenkeyless Knight',
    keyboardType: 'Tenkeyless Mechanical (TKL)',
    tagline: 'Crisp Tactile Actuation',
    description: 'Controlled bottom row coordinates with satisfying tactile mechanical actuation points.',
    icon: '⚡',
    color: '#a855f7',
    accentBorder: 'border-purple-500/50',
    bgGlow: 'bg-purple-950/40 shadow-purple-500/20',
    switchType: 'Cherry MX Brown 55g',
    rarity: 'Rare'
  },
  {
    levelId: 'level-4',
    levelNumber: 4,
    id: 'badge-level-4',
    name: 'Custom 65% Hot-Swap Artisan',
    keyboardType: 'Custom 65% Lubed Linear Board',
    tagline: 'Buttery Smooth Precision',
    description: 'Flawless punctuation, capitals, and shift discipline executed with buttery smooth strokes.',
    icon: '🎨',
    color: '#f59e0b',
    accentBorder: 'border-amber-500/50',
    bgGlow: 'bg-amber-950/40 shadow-amber-500/20',
    switchType: 'Gateron Yellow Lubed 50g',
    rarity: 'Epic'
  },
  {
    levelId: 'level-5',
    levelNumber: 5,
    id: 'badge-level-5',
    name: 'Topre Electrostatic Master',
    keyboardType: 'Topre 45g Japanese Capacitive',
    tagline: 'Silky Electrostatic Harmony',
    description: 'Mastery of rapid alphanumeric coordination and numbers row with whisper-quiet Topre raindrop tactility.',
    icon: '🔮',
    color: '#ec4899',
    accentBorder: 'border-pink-500/50',
    bgGlow: 'bg-pink-950/40 shadow-pink-500/20',
    switchType: 'Topre Electrostatic 45g',
    rarity: 'Legendary'
  },
  {
    levelId: 'level-6',
    levelNumber: 6,
    id: 'badge-level-6',
    name: 'Holy Panda Anodized Titan',
    keyboardType: 'Brass-Plate Custom Audiophile Thock',
    tagline: 'Unshakable Acoustic Power',
    description: 'Conquered programming syntax, complex symbols, and brackets with deafening mechanical thock precision.',
    icon: '👑',
    color: '#10b981',
    accentBorder: 'border-emerald-500/50',
    bgGlow: 'bg-emerald-950/40 shadow-emerald-500/25',
    switchType: 'Holy Panda U4T 62g',
    rarity: 'Mythic'
  },
  {
    levelId: 'level-7',
    levelNumber: 7,
    id: 'badge-level-7',
    name: 'Godspeed Cyber-Beast Killer',
    keyboardType: 'Titanium Hall Effect Rapid-Trigger Apex',
    tagline: 'The Ultimate Typing Apex',
    description: 'Surpassed 70+ WPM with >98% accuracy across advanced engineering literature and dense algorithmic code.',
    icon: '🔥',
    color: '#ef4444',
    accentBorder: 'border-red-500/60 ring-2 ring-red-500/40',
    bgGlow: 'bg-red-950/50 shadow-red-500/30',
    switchType: 'Magnetic Hall Effect 0.1mm Rapid Trigger',
    rarity: 'God Tier'
  }
];

export function getBadgeForLevel(levelIdOrNumber: string | number): KeyboardBadge | undefined {
  if (typeof levelIdOrNumber === 'number') {
    return KEYBOARD_BADGES.find(b => b.levelNumber === levelIdOrNumber);
  }
  return KEYBOARD_BADGES.find(b => b.levelId === levelIdOrNumber);
}
