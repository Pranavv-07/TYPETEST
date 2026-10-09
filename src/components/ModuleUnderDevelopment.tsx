import React from 'react';
import { Hammer, ArrowLeft, ShieldAlert, Sparkles, Home, CheckCircle2, Lock } from 'lucide-react';

interface ModuleUnderDevelopmentProps {
  moduleName: string;
  customMessage?: string;
  onBackToArena: () => void;
  onGoToDashboard?: () => void;
  isAdmin?: boolean;
  onAdminEnable?: () => void;
}

export const ModuleUnderDevelopment: React.FC<ModuleUnderDevelopmentProps> = ({
  moduleName,
  customMessage,
  onBackToArena,
  onGoToDashboard,
  isAdmin,
  onAdminEnable
}) => {
  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-300">
      <div className="max-w-xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-10 text-center relative overflow-hidden shadow-2xl">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -left-24 w-60 h-60 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold uppercase tracking-wider mb-6">
          <Hammer className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Module Under Development</span>
        </div>

        {/* Central Icon Illustration */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 rounded-3xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 shadow-xl relative group">
          <div className="absolute inset-0 rounded-3xl bg-amber-500/5 group-hover:bg-amber-500/10 transition-colors" />
          <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400" />
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight mb-3">
          {moduleName} <span className="text-amber-400">is Paused</span>
        </h2>

        {/* Message */}
        <p className="text-sm text-slate-300 leading-relaxed mb-6 font-sans max-w-md mx-auto">
          {customMessage ||
            `This module is currently stopped or undergoing maintenance by the institutional administration. Please proceed with your scheduled typing practice and examination assessments.`}
        </p>

        {/* System Assurance Pill */}
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 mb-8 text-left space-y-2">
          <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Active Modules Status</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Typing Practice Arena: <strong>Active</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Institutional Tests: <strong>Active</strong></span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={onBackToArena}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Practice Arena</span>
          </button>

          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Student Dashboard</span>
            </button>
          )}

          {isAdmin && onAdminEnable && (
            <button
              onClick={onAdminEnable}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-semibold text-xs flex items-center justify-center gap-2 border border-amber-500/40 transition-colors cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Admin: Re-enable Module</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
