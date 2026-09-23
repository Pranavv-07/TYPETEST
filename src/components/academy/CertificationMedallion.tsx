import React from 'react';
import { CertificationBadge } from '../../data/achievementBadges';
import { Lock, Sparkles, Trophy, Award, CheckCircle2 } from 'lucide-react';

interface CertificationMedallionProps {
  badge: CertificationBadge;
  isUnlocked: boolean;
  lessonsCompleted?: number;
  totalLessons?: number;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

export const CertificationMedallion: React.FC<CertificationMedallionProps> = ({
  badge,
  isUnlocked,
  lessonsCompleted = 0,
  totalLessons = 5,
  onClick,
  size = 'md'
}) => {
  const isGrand = badge.isGrand;

  return (
    <div
      onClick={onClick}
      className={`group relative flex flex-col items-center select-none transition-all duration-300 ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Container with shadow & hover glow */}
      <div className="relative flex flex-col items-center">
        
        {/* GRAND TIER AURA & HALO (For Level 7) */}
        {isGrand && isUnlocked && (
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-red-500/30 rounded-full blur-xl animate-pulse pointer-events-none" />
        )}

        {/* GRAND TIER TOP CROWN LAUREL (For Level 7) */}
        {isGrand && (
          <div className="absolute -top-3 z-20 flex items-center gap-1">
            <span className="text-amber-300 text-xs filter drop-shadow">✨</span>
            <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 text-slate-950 font-black text-[9px] uppercase tracking-wider shadow-lg border border-yellow-200">
              👑 GRAND APEX
            </div>
            <span className="text-amber-300 text-xs filter drop-shadow">✨</span>
          </div>
        )}

        {/* CIRCULAR METALLIC MEDALLION BEZEL */}
        <div
          className={`relative rounded-full transition-transform duration-300 group-hover:scale-105 flex items-center justify-center ${
            size === 'sm' ? 'w-24 h-24' : size === 'lg' ? 'w-44 h-44' : 'w-32 h-32'
          } ${
            isUnlocked
              ? isGrand
                ? 'p-2 bg-gradient-to-br from-amber-200 via-yellow-400 via-amber-500 to-yellow-600 shadow-2xl shadow-amber-500/40 ring-2 ring-yellow-300/80'
                : badge.levelNumber === 6
                ? 'p-1.5 bg-gradient-to-br from-emerald-200 via-emerald-400 to-teal-700 shadow-xl shadow-emerald-500/30 ring-1 ring-emerald-300'
                : badge.levelNumber === 5
                ? 'p-1.5 bg-gradient-to-br from-rose-200 via-rose-400 to-pink-700 shadow-xl shadow-rose-500/30 ring-1 ring-rose-300'
                : badge.levelNumber === 4
                ? 'p-1.5 bg-gradient-to-br from-amber-200 via-amber-400 to-yellow-600 shadow-xl shadow-amber-500/30 ring-1 ring-amber-300'
                : badge.levelNumber === 3
                ? 'p-1.5 bg-gradient-to-br from-slate-200 via-purple-300 to-purple-600 shadow-xl shadow-purple-500/20 ring-1 ring-purple-300'
                : badge.levelNumber === 2
                ? 'p-1.5 bg-gradient-to-br from-sky-200 via-sky-400 to-blue-600 shadow-xl shadow-sky-500/20 ring-1 ring-sky-300'
                : 'p-1.5 bg-gradient-to-br from-slate-200 via-slate-300 to-slate-500 shadow-lg ring-1 ring-slate-300'
              : 'p-1.5 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 opacity-60 grayscale ring-1 ring-slate-800'
          }`}
          style={{
            boxShadow: isUnlocked
              ? isGrand
                ? '0 12px 30px -4px rgba(234, 179, 8, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.8), inset 0 -3px 6px rgba(0, 0, 0, 0.3)'
                : '0 8px 24px -4px rgba(0,0,0,0.4), inset 0 2px 4px rgba(255, 255, 255, 0.6), inset 0 -2px 4px rgba(0, 0, 0, 0.2)'
              : 'none'
          }}
        >
          {/* Inner Metallic Bevel Ring */}
          <div className="w-full h-full rounded-full p-1 bg-gradient-to-tr from-slate-400 via-slate-100 to-slate-400 flex items-center justify-center shadow-inner">
            
            {/* Medallion Face / Plate */}
            <div
              className={`w-full h-full rounded-full flex flex-col items-center justify-between p-2 sm:p-2.5 text-center relative overflow-hidden ${
                isUnlocked
                  ? 'bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 shadow-inner'
                  : 'bg-gradient-to-b from-slate-900 to-slate-950 text-slate-400'
              }`}
            >
              {/* Outer Circular Thin Accent Border */}
              <div
                className="absolute inset-1 rounded-full border pointer-events-none"
                style={{
                  borderColor: isUnlocked
                    ? isGrand
                      ? '#d97706'
                      : badge.color
                    : '#334155'
                }}
              />

              {/* TOP HEADER: Brand / Certified Arc */}
              <div className="pt-0.5 flex flex-col items-center z-10">
                <span
                  className="font-black tracking-widest text-[7px] sm:text-[8px] uppercase font-sans leading-none"
                  style={{
                    color: isUnlocked ? (isGrand ? '#b91c1c' : badge.bannerColor) : '#64748b'
                  }}
                >
                  TYPETEST
                </span>
                <span className="text-[6px] font-mono text-slate-500 uppercase tracking-tighter leading-none mt-0.5">
                  Certified
                </span>
              </div>

              {/* CENTER: Main Certification Tier Title (Oracle style) */}
              <div className="my-auto flex flex-col items-center justify-center z-10">
                <span
                  className={`font-black tracking-tight leading-none ${
                    size === 'lg' ? 'text-base' : size === 'sm' ? 'text-[10px]' : 'text-xs'
                  } font-sans uppercase`}
                  style={{
                    color: isUnlocked ? '#0f172a' : '#94a3b8',
                    textShadow: isUnlocked ? '0 1px 1px rgba(0,0,0,0.1)' : 'none'
                  }}
                >
                  {badge.certificationTitle}
                </span>

                {/* Sub-label or Icon */}
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs filter drop-shadow-sm">{badge.icon}</span>
                  {isUnlocked && (
                    <span
                      className="text-[7px] font-mono font-bold px-1 rounded uppercase tracking-wider"
                      style={{
                        backgroundColor: `${badge.color}20`,
                        color: badge.color
                      }}
                    >
                      L{badge.levelNumber}
                    </span>
                  )}
                </div>
              </div>

              {/* BOTTOM INNER BADGE ARC / TIER TAG */}
              <div className="pb-0.5 z-10">
                <span
                  className="px-1.5 py-0.2 rounded text-[6.5px] font-mono font-bold uppercase tracking-wider block truncate max-w-[85px]"
                  style={{
                    backgroundColor: isUnlocked
                      ? isGrand
                        ? '#fef3c7'
                        : '#f1f5f9'
                      : '#1e293b',
                    color: isUnlocked
                      ? isGrand
                        ? '#92400e'
                        : '#334155'
                      : '#64748b',
                    border: `1px solid ${isUnlocked ? (isGrand ? '#fcd34d' : '#cbd5e1') : '#334155'}`
                  }}
                >
                  {isGrand ? 'Grandmaster' : badge.tier}
                </span>
              </div>

              {/* LOCKED OVERLAY (Padlock) */}
              {!isUnlocked && (
                <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[1px] flex flex-col items-center justify-center p-2 z-20">
                  <Lock className="w-5 h-5 text-slate-400 mb-1" />
                  <span className="text-[8px] font-mono font-bold text-slate-300">
                    Level {badge.levelNumber}
                  </span>
                  <span className="text-[7px] font-mono text-slate-500">
                    {lessonsCompleted}/{totalLessons} Done
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MEDALLION STAND PEDESTAL / HERALDIC RIBBON BASE (Direct match to reference image) */}
        {isGrand ? (
          /* LEVEL 7: GRAND FLOWING SILK GOLDEN RIBBON TAILS */
          <div className="relative -mt-2 z-10 flex flex-col items-center">
            {/* Center Gold Medallion Pin */}
            <div className="w-5 h-5 rounded-full bg-gradient-to-b from-yellow-200 via-amber-400 to-amber-600 border border-yellow-100 flex items-center justify-center shadow-md">
              <span className="text-[9px]">👑</span>
            </div>
            {/* Dual Flowing Ribbon Tails */}
            <div className="flex gap-2 -mt-1.5">
              <div className="w-3.5 h-6 bg-gradient-to-b from-amber-600 to-yellow-500 shadow-md transform -rotate-12 rounded-b-sm border-t border-amber-400" />
              <div className="w-3.5 h-6 bg-gradient-to-b from-amber-600 to-yellow-500 shadow-md transform rotate-12 rounded-b-sm border-t border-amber-400" />
            </div>
          </div>
        ) : (
          /* STANDARD CERTIFICATION STAND (Wooden/Metallic dual-support legs as in reference) */
          <div className="relative -mt-1.5 z-0 flex items-center justify-center gap-3">
            <div
              className={`w-2.5 h-4 rounded-b-sm shadow-md ${
                isUnlocked
                  ? badge.pedestalType === 'gold'
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800'
                    : badge.pedestalType === 'silver'
                    ? 'bg-gradient-to-b from-slate-400 to-slate-700'
                    : badge.pedestalType === 'bronze'
                    ? 'bg-gradient-to-b from-amber-800 to-yellow-950'
                    : badge.pedestalType === 'ruby'
                    ? 'bg-gradient-to-b from-rose-700 to-rose-950'
                    : badge.pedestalType === 'emerald'
                    ? 'bg-gradient-to-b from-emerald-700 to-emerald-950'
                    : 'bg-gradient-to-b from-slate-500 to-slate-800'
                  : 'bg-slate-800'
              }`}
            />
            <div
              className={`w-2.5 h-4 rounded-b-sm shadow-md ${
                isUnlocked
                  ? badge.pedestalType === 'gold'
                    ? 'bg-gradient-to-b from-amber-600 to-amber-800'
                    : badge.pedestalType === 'silver'
                    ? 'bg-gradient-to-b from-slate-400 to-slate-700'
                    : badge.pedestalType === 'bronze'
                    ? 'bg-gradient-to-b from-amber-800 to-yellow-950'
                    : badge.pedestalType === 'ruby'
                    ? 'bg-gradient-to-b from-rose-700 to-rose-950'
                    : badge.pedestalType === 'emerald'
                    ? 'bg-gradient-to-b from-emerald-700 to-emerald-950'
                    : 'bg-gradient-to-b from-slate-500 to-slate-800'
                  : 'bg-slate-800'
              }`}
            />
          </div>
        )}
      </div>

      {/* CREDENTIAL LABEL TEXT (Direct match to reference image beneath each badge) */}
      <div className="mt-2 text-center max-w-[150px]">
        <h4
          className={`font-bold text-xs line-clamp-1 ${
            isUnlocked
              ? isGrand
                ? 'text-amber-300 font-black'
                : 'text-slate-200'
              : 'text-slate-500'
          }`}
        >
          {badge.name}
        </h4>
        <p className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
          {badge.credentialSubtext}
        </p>
        <span
          className={`inline-block text-[9px] font-mono mt-1 font-bold ${
            isUnlocked
              ? isGrand
                ? 'text-yellow-400'
                : 'text-emerald-400'
              : 'text-slate-600'
          }`}
        >
          {isUnlocked ? '✓ Certified' : `Locked • Level ${badge.levelNumber}`}
        </span>
      </div>
    </div>
  );
};
