import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Keyboard,
  Volume2,
  VolumeX,
  LogOut,
  LogIn,
  User,
  Shield,
  GraduationCap,
  Sparkles,
  LayoutDashboard,
  PlaySquare,
  Swords,
  Trophy,
  History,
  Award,
  BarChart2,
  ChevronDown,
  Building2,
  CheckCircle2,
  FileCheck
} from 'lucide-react';

export type AppView = 'arena' | 'tests' | 'trainer' | 'student' | 'admin' | 'login' | 'multiplayer' | 'academy' | 'leaderboard' | 'verify';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onOpenLoginModal?: () => void;
  onOpenVerificationModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenLoginModal,
  onOpenVerificationModal
}) => {
  const { currentUser, soundEnabled, setSoundEnabled, logout } = useApp();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    setCurrentView('arena');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/90 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand: TYPETEST */}
        <div className="flex items-center gap-8">
          <div
            onClick={() => setCurrentView('arena')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/50 transition-all shadow-sm shadow-emerald-500/10">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-xl tracking-tight text-slate-100">
                  TYPE<span className="text-emerald-400">TEST</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest hidden sm:inline">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans hidden md:block">
                Type faster. Type better.
              </p>
            </div>
          </div>

          {/* Clean Public Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            {/* 1. Practice Arena */}
            <button
              onClick={() => setCurrentView('arena')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'arena'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>Practice</span>
            </button>

            {/* 2. Explore Tests */}
            <button
              onClick={() => setCurrentView('tests')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'tests'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tests</span>
            </button>

            {/* 3. Multiplayer Arena */}
            <button
              onClick={() => setCurrentView('multiplayer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'multiplayer'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multiplayer</span>
            </button>

            {/* 4. Public Leaderboard */}
            <button
              onClick={() => setCurrentView('leaderboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'leaderboard'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Leaderboard</span>
            </button>

            {/* 5. Typing Academy */}
            <button
              onClick={() => setCurrentView('academy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'academy'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Academy</span>
            </button>

            {/* 6. Verify Certificate */}
            <button
              onClick={() => setCurrentView('verify')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                currentView === 'verify'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-cyan-300 hover:bg-slate-900'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Verify</span>
            </button>
          </nav>
        </div>

        {/* Right Section: Sound Toggle & Auth / Profile */}
        <div className="flex items-center gap-3">
          {/* Sound Synthesizer Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 transition-colors cursor-pointer"
            title={soundEnabled ? 'Mute Mechanical Switch Audio' : 'Enable Mechanical Switch Audio'}
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* If Guest User: Simple "Sign In" Button */}
          {!currentUser ? (
            <button
              onClick={() => {
                if (onOpenLoginModal) onOpenLoginModal();
                else setCurrentView('login');
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          ) : (
            /* If Authenticated: Profile Dropdown Menu */
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-[11px]">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-200 max-w-[120px] truncate">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 font-mono capitalize">
                    {currentUser.role}
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Menu Dropdown */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 py-2 border-b border-slate-800/80">
                    <p className="text-xs font-bold text-slate-100 truncate">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{currentUser.email || currentUser.username}</p>
                  </div>

                  <div className="py-1">
                    {/* Student/Learner Portal */}
                    <button
                      onClick={() => {
                        setCurrentView('student');
                        setProfileDropdownOpen(false);
                      }}
                      className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>My Tests & History</span>
                    </button>

                    {/* Trainer Dashboard (if role matches) */}
                    {currentUser.role === 'trainer' && (
                      <button
                        onClick={() => {
                          setCurrentView('trainer');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 flex items-center gap-2"
                      >
                        <Building2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Trainer Organization</span>
                      </button>
                    )}

                    {/* Admin Console (if role matches) */}
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          setCurrentView('admin');
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 flex items-center gap-2"
                      >
                        <Shield className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Admin Console</span>
                      </button>
                    )}

                    {/* Verify Certificate Tool */}
                    {onOpenVerificationModal && (
                      <button
                        onClick={() => {
                          onOpenVerificationModal();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-300 hover:text-emerald-300 hover:bg-slate-800/60 flex items-center gap-2"
                      >
                        <FileCheck className="w-3.5 h-3.5 text-teal-400" />
                        <span>Verify Certificate</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-800/80 pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
