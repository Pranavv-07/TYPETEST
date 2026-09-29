import React from 'react';
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
  Swords,
} from 'lucide-react';

interface NavbarProps {
  currentView: 'arena' | 'trainer' | 'student' | 'admin' | 'login' | 'multiplayer' | 'academy';
  setCurrentView: (view: 'arena' | 'trainer' | 'student' | 'admin' | 'login' | 'multiplayer' | 'academy') => void;
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
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur border-b border-slate-800/90 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo & Brand - Clean, No Proctor label */}
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
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/60 transition-all shadow-sm shadow-emerald-500/10">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-100">
                  Test<span className="text-emerald-400">Type</span>
                </span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-wider">
                  DOTT Aditya
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans hidden sm:block">
                Department of Technical Training
              </p>
            </div>
          </div>

          {/* Navigation links based on role */}
          <nav className="hidden md:flex items-center gap-1.5">
            {currentUser?.role === 'trainer' && (
              <button
                onClick={() => setCurrentView('trainer')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentView === 'trainer'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
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
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
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
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin Console</span>
              </button>
            )}

            {/* Practice Arena */}
            <button
              onClick={() => setCurrentView('arena')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'arena'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5" />
              <span>Typing Arena</span>
            </button>

            {/* Typing Academy */}
            <button
              onClick={() => setCurrentView('academy')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'academy'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-amber-400/90 hover:text-amber-300 hover:bg-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-400" />
              <span>Typing Academy</span>
            </button>

            {/* Multiplayer Arena */}
            <button
              onClick={() => setCurrentView('multiplayer')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentView === 'multiplayer'
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-emerald-400/80 hover:text-emerald-300 hover:bg-slate-900'
              }`}
            >
              <Swords className="w-3.5 h-3.5 text-emerald-400" />
              <span>Multiplayer</span>
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
                ? 'bg-slate-900 text-emerald-400 border-slate-800 hover:bg-slate-800'
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
                  <Shield className="w-3.5 h-3.5 text-emerald-400" />
                ) : currentUser.role === 'trainer' ? (
                  <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                )}
                <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-slate-200 truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">
                    {currentUser.rollNo || currentUser.role}
                  </div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 border border-slate-800 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                if (onOpenLoginModal) onOpenLoginModal();
                else setCurrentView('login');
              }}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
