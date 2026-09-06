import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Keyboard,
  Volume2,
  VolumeX,
  LogOut,
  LogIn,
  UserCheck,
  Shield,
  GraduationCap,
  Sparkles,
  LayoutDashboard,
  PlaySquare,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'arena' | 'trainer' | 'student' | 'admin' | 'login';
  setCurrentView: (view: 'arena' | 'trainer' | 'student' | 'admin' | 'login') => void;
  onOpenLoginModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenLoginModal
}) => {
  const { currentUser, soundEnabled, setSoundEnabled, logout } = useApp();

  const handleLogout = () => {
    logout();
    setCurrentView('login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand - Geometric Balance */}
        <div className="flex items-center gap-6">
          <div
            onClick={() => {
              if (currentUser?.role === 'trainer') setCurrentView('trainer');
              else if (currentUser?.role === 'student') setCurrentView('student');
              else if (currentUser?.role === 'admin') setCurrentView('admin');
              else setCurrentView('arena');
            }}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 group-hover:border-cyan-500/60 transition-all shadow-sm shadow-cyan-500/10">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-100">
                  Test<span className="text-cyan-400">Type</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 uppercase tracking-wider">
                  Proctor
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
                Institutional Speed Assessment Engine
              </p>
            </div>
          </div>

          {/* Navigation links based on role */}
          <nav className="hidden md:flex items-center gap-1.5">
            {/* View Switcher Tabs - Geometric Balance */}
            {currentUser?.role === 'trainer' && (
              <button
                onClick={() => setCurrentView('trainer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'trainer'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Trainer Dashboard</span>
              </button>
            )}

            {currentUser?.role === 'student' && (
              <button
                onClick={() => setCurrentView('student')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'student'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>My Assessments & History</span>
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'admin'
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin Console</span>
              </button>
            )}

            {/* Practice Arena always easily accessible */}
            <button
              onClick={() => setCurrentView('arena')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'arena'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>Typing Arena</span>
            </button>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-2.5">
          {/* Audio toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Mechanical Click Sound Active' : 'Click Sound Muted'}
            className={`p-2 rounded-lg text-xs transition-colors border ${
              soundEnabled
                ? 'bg-slate-900 text-cyan-400 border-slate-800 hover:bg-slate-800'
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:bg-slate-900'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Active User Badge or Login */}
          {currentUser ? (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                {currentUser.role === 'admin' ? (
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                ) : currentUser.role === 'trainer' ? (
                  <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-[11px] font-bold text-slate-200 truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
                    {currentUser.role === 'student' ? currentUser.rollNo : currentUser.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Log Out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenLoginModal) onOpenLoginModal();
                setCurrentView('login');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-all shadow-sm shadow-cyan-500/20 font-bold"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
