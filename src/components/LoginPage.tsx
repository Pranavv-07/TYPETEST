import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Keyboard, LogIn, Lock, User, AlertCircle, ArrowRight, ShieldCheck, Database, HelpCircle } from 'lucide-react';
import { DatabaseDiagnosticModal } from './DatabaseDiagnosticModal';
import { isSupabaseConfigured } from '../lib/supabase';

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
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);

  const hasDbConfigured = isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await login(identifier, password);
      if (res && res.success) {
        // Find role from session
        const raw = localStorage.getItem('testtype_user_v2');
        if (raw) {
          const user = JSON.parse(raw);
          onSuccess(user.role);
        } else {
          onSuccess('student');
        }
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

  const handleFillCredentials = (user: string, pass: string) => {
    setIdentifier(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-1 shadow-lg shadow-cyan-500/10">
            <Keyboard className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Sign in to Test<span className="text-cyan-400">Type</span>
          </h1>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Institutional Typing Speed Assessment & Examination Engine
          </p>
        </div>

        {/* Database Status Notice */}
        <div
          onClick={() => setIsDiagnosticOpen(true)}
          className={`px-3.5 py-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
            hasDbConfigured
              ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30'
              : 'bg-amber-950/30 border-amber-500/40 text-amber-300 hover:bg-amber-950/40'
          }`}
        >
          <div className="flex items-center gap-2 text-xs">
            <Database className="w-3.5 h-3.5 shrink-0" />
            <span className="font-semibold">
              {hasDbConfigured ? 'Supabase Database Connected' : 'Notice: Running in Local Fallback Mode'}
            </span>
          </div>
          <span className="text-[10px] font-bold underline flex items-center gap-1 opacity-90">
            <span>Diagnostics</span>
            <HelpCircle className="w-3 h-3" />
          </span>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 relative overflow-hidden">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Institutional Sign In</span>
            </div>
            <button
              type="button"
              onClick={() => setIsDiagnosticOpen(true)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors font-mono"
            >
              Test Accounts
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span>{errorMsg}</span>
                  {!hasDbConfigured && (
                    <p className="text-[11px] text-rose-400/90 underline cursor-pointer" onClick={() => setIsDiagnosticOpen(true)}>
                      Click here to check Vercel & Supabase database configuration.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Roll Number or Username</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">e.g. Roll No or admin</span>
              </label>
              <input
                type="text"
                required
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                placeholder="Enter Roll No, Username, or Email"
                autoComplete="username"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-100 font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500/60 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Password</span>
                </span>
                <span className="text-[10px] text-slate-500 font-mono">Students: Roll No or 1234</span>
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
              <span>{isLoading ? 'Verifying Credentials...' : 'Sign In'}</span>
            </button>
          </form>

          {onContinueAsGuest && (
            <div className="pt-3 border-t border-slate-800/80 text-center">
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

        <div className="text-center text-[11px] font-mono text-slate-500 space-y-1">
          <p>Candidates, Examiners, and Administrators are routed automatically.</p>
          <button
            type="button"
            onClick={() => setIsDiagnosticOpen(true)}
            className="text-cyan-500 hover:underline inline-flex items-center gap-1"
          >
            <Database className="w-3 h-3" />
            <span>Database Setup Guide & Connection Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Diagnostics & Setup Modal */}
      <DatabaseDiagnosticModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        onFillSampleCredentials={handleFillCredentials}
      />
    </div>
  );
};
