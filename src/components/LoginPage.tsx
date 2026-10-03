import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Keyboard, LogIn, Lock, User, AlertCircle, ArrowRight, ShieldCheck, CheckSquare, Square } from 'lucide-react';

interface LoginPageProps {
  onSuccess: (role: 'trainer' | 'student' | 'admin') => void;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onSuccess, onContinueAsGuest }) => {
  const { login } = useApp();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await login(identifier, password);
      if (res && res.success) {
        // Find role from session
        const raw = sessionStorage.getItem('testtype_session_user') || localStorage.getItem('testtype_session_user');
        let role: 'trainer' | 'student' | 'admin' = 'student';
        if (raw) {
          const user = JSON.parse(raw);
          role = user.role || 'student';
        }

        // Save remember-me preference
        if (rememberMe) {
          localStorage.setItem('testtype_remember_preference', 'true');
        } else {
          localStorage.removeItem('testtype_remember_preference');
          localStorage.removeItem('testtype_session_user');
          localStorage.removeItem('testtype_user_v2');
        }

        onSuccess(role);
      } else {
        setErrorMsg(
          res?.message ||
          'Invalid credentials. Please verify your roll number, username, and password.'
        );
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please verify your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg shadow-emerald-500/10">
            <Keyboard className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Sign in to TYPE<span className="text-emerald-400">TEST</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Professional Typing & Keyboard Mastery Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Account Sign In</span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              TYPETEST SECURE
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>{errorMsg}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Roll Number / Username</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">e.g. 24B11CS355, trainer, admin</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter Roll No or Username"
                autoComplete="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Password</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Students: 1234 or Roll No</span>
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                autoComplete="current-password"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
              />
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center justify-between pt-1">
              <label
                onClick={() => setRememberMe(!rememberMe)}
                className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-200 select-none"
              >
                <button
                  type="button"
                  className={`w-4 h-4 rounded flex items-center justify-center transition-colors ${
                    rememberMe ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 border border-slate-700'
                  }`}
                >
                  {rememberMe && <CheckSquare className="w-3.5 h-3.5 stroke-[3]" />}
                </button>
                <span className="text-xs">Remember me on this device</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50 mt-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In to Portal'}</span>
            </button>
          </form>

          {onContinueAsGuest && (
            <div className="pt-3 border-t border-slate-800/80 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="text-xs font-semibold text-slate-400 hover:text-emerald-400 transition-colors inline-flex items-center gap-1.5"
              >
                <span>Practice in Typing Arena as Guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        <div className="text-center text-[11px] font-mono text-slate-500 space-y-1">
          <p>Candidates, Examiners, and Administrators are routed automatically.</p>
        </div>
      </div>
    </div>
  );
};
