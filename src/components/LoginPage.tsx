import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Keyboard, LogIn, Lock, User, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (role: 'trainer' | 'student' | 'admin') => void;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onContinueAsGuest }) => {
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = login(identifier, password);
      if (res.success) {
        // Find role from session
        const raw = localStorage.getItem('testtype_user_v2');
        if (raw) {
          const user = JSON.parse(raw);
          onSuccess(user.role);
        } else {
          onSuccess('student');
        }
      } else {
        setErrorMsg(res.message || 'Invalid credentials. Please verify your username, roll number, and password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-2 shadow-lg shadow-cyan-500/10">
            <Keyboard className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Sign in to Test<span className="text-cyan-400">Type</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Institutional Typing Speed Assessment & Examination Engine
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Unified Institutional Authentication</span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>Username, Email, or Roll Number</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter your institutional identifier"
                autoComplete="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Password</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 mt-2"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Identity...' : 'Sign In'}</span>
            </button>
          </form>

          {onContinueAsGuest && (
            <div className="pt-4 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Practice in Typing Arena as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] font-mono text-slate-500">
          Role is authenticated automatically based on institutional directory permissions.
        </div>
      </div>
    </div>
  );
};
