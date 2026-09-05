import React, { useState, useEffect } from 'react';
import {
  checkDatabaseConnection,
  DatabaseConnectionStatus
} from '../services/supabaseService';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Server,
  Key,
  X,
  BookOpen,
  Users,
  Layers,
  HelpCircle
} from 'lucide-react';

interface DatabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFillSampleCredentials?: (username: string, pass: string) => void;
}

export const DatabaseDiagnosticModal: React.FC<DatabaseDiagnosticModalProps> = ({
  isOpen,
  onClose,
  onFillSampleCredentials
}) => {
  const [status, setStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'status' | 'setup-guide' | 'sample-logins'>('status');

  const runDiagnostics = async () => {
    setIsLoading(true);
    try {
      const res = await checkDatabaseConnection();
      setStatus(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runDiagnostics();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopySql = async () => {
    try {
      // Fetch public setup.sql
      let text = '';
      try {
        const response = await fetch('/setup.sql');
        if (response.ok) {
          text = await response.text();
        }
      } catch (e) {
        console.warn(e);
      }
      if (!text) {
        try {
          const fallback = await fetch('/supabase/COMPLETE_INSTITUTIONAL_SETUP.sql');
          if (fallback.ok) text = await fallback.text();
        } catch (e) {
          console.warn(e);
        }
      }
      if (!text) {
        text = `-- Run this in Supabase SQL Editor:
-- Complete setup is in your repository at: /supabase/COMPLETE_INSTITUTIONAL_SETUP.sql
-- Contains all tables (students, admins, trainers, tests, attempts), RLS, and RPC procedures.`;
      }
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (e) {
      console.error('Failed to copy SQL:', e);
    }
  };

  const isFullyWorking =
    status?.isConfigured &&
    status?.isConnected &&
    status?.tablesFound.students &&
    status?.tablesFound.admins;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isFullyWorking
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}>
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">
                  Database & Cloud Sync Diagnostics
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isFullyWorking
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                }`}>
                  {isFullyWorking ? 'Supabase Live' : 'Action Required'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Institutional PostgreSQL connection & examinee credential verification
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Connection Status</span>
          </button>
          <button
            onClick={() => setActiveTab('setup-guide')}
            className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'setup-guide'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vercel + Supabase Setup (Fix Login)</span>
          </button>
          <button
            onClick={() => setActiveTab('sample-logins')}
            className={`pb-2.5 px-1 border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === 'sample-logins'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Test Accounts</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
          {activeTab === 'status' && (
            <div className="space-y-5">
              {/* Summary Card */}
              <div className={`p-4 rounded-2xl border ${
                isFullyWorking
                  ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-950/20 border-amber-500/30 text-amber-300'
              }`}>
                <div className="flex items-start gap-3">
                  {isFullyWorking ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
                  )}
                  <div className="space-y-1">
                    <p className="font-bold text-sm text-slate-100">
                      {isFullyWorking
                        ? 'Cloud Database is Fully Operational'
                        : 'Database Not Connected on Vercel (Why Students Cannot Log In)'}
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed text-slate-300">
                      {isFullyWorking
                        ? `Connected to Supabase PostgreSQL. Found ${status?.counts.students} students, ${status?.counts.classes} classes, and ${status?.counts.tests} exams. Candidate logins from all devices are active.`
                        : 'On Vercel, the app is currently running in temporary local fallback mode because environment variables are not yet linked. In this mode, student accounts created in your browser do not exist for students on their devices.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Environment Variables Detection */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <h3 className="font-bold text-slate-200 flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <span>Vercel Environment Variables Status</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-400">VITE_SUPABASE_URL</span>
                      {status?.isConfigured ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Configured
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Missing
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-slate-300 truncate">
                      {status?.maskedUrl || 'Not detected'}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] text-slate-400">VITE_SUPABASE_ANON_KEY</span>
                      {status?.hasAnonKey ? (
                        <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Configured
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-400 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Missing
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[11px] text-slate-300">
                      {status?.hasAnonKey ? '•••••••••••••••• (Valid)' : 'Not detected'}
                    </p>
                  </div>
                </div>
              </div>

              {/* PostgreSQL Tables Health */}
              <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <span>Supabase Schema & Tables</span>
                  </h3>
                  <button
                    onClick={runDiagnostics}
                    disabled={isLoading}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Re-test</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">students</div>
                      <div className="text-[10px] text-slate-400">{status?.counts.students || 0} records</div>
                    </div>
                    {status?.tablesFound.students ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">admins</div>
                      <div className="text-[10px] text-slate-400">{status?.counts.admins || 0} records</div>
                    </div>
                    {status?.tablesFound.admins ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">tests</div>
                      <div className="text-[10px] text-slate-400">{status?.counts.tests || 0} records</div>
                    </div>
                    {status?.tablesFound.tests ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">classes</div>
                      <div className="text-[10px] text-slate-400">{status?.counts.classes || 0} records</div>
                    </div>
                    {status?.tablesFound.classes ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">attempts</div>
                      <div className="text-[10px] text-slate-400">Atomic RPC</div>
                    </div>
                    {status?.tablesFound.attempts ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>

                  <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">departments</div>
                      <div className="text-[10px] text-slate-400">Academic units</div>
                    </div>
                    {status?.tablesFound.departments ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    )}
                  </div>
                </div>

                {(!status?.tablesFound.students || !status?.tablesFound.admins) && (
                  <div className="pt-2">
                    <button
                      onClick={() => setActiveTab('setup-guide')}
                      className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors flex items-center justify-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span>View 2-Minute Fix Guide & Copy SQL</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'setup-guide' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/30 text-cyan-300 space-y-2">
                <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Why this happens and how to fix it in 2 minutes</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  When you deploy a frontend app to Vercel, Vercel doesn't automatically know your database credentials until you paste them in Vercel's project settings. Follow these 3 simple steps below:
                </p>
              </div>

              {/* Step 1 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">1</span>
                    <span>Copy and Run the All-in-One SQL Script in Supabase</span>
                  </h4>
                  <button
                    onClick={handleCopySql}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-950" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Script'}</span>
                  </button>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  1. Open your Supabase project dashboard at{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    supabase.com/dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                  <br />
                  2. Click <strong>SQL Editor</strong> on the left sidebar, click <strong>New Query</strong>, paste the script, and click <strong>RUN</strong>.
                  <br />
                  This creates all database tables, security policies, and default accounts in 5 seconds.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">2</span>
                  <span>Get your Supabase API Keys</span>
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  In your Supabase project:
                  <br />
                  1. Click <strong>Project Settings</strong> (gear icon at bottom left) &rarr; <strong>API</strong>.
                  <br />
                  2. Copy the <strong>Project URL</strong> (e.g. <code className="font-mono text-cyan-300">https://xyzcompany.supabase.co</code>).
                  <br />
                  3. Copy the <strong>Project API anon public key</strong> (starts with <code className="font-mono text-cyan-300">eyJ...</code>).
                </p>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">3</span>
                  <span>Add Environment Variables in Vercel & Redeploy</span>
                </h4>
                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 font-mono text-[11px]">
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-cyan-400">VITE_SUPABASE_URL</span>
                    <span className="text-slate-500">Your Supabase Project URL</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-200">
                    <span className="text-cyan-400">VITE_SUPABASE_ANON_KEY</span>
                    <span className="text-slate-500">Your Supabase anon public key</span>
                  </div>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  1. Go to your project on{' '}
                  <a
                    href="https://vercel.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline inline-flex items-center gap-0.5"
                  >
                    vercel.com <ExternalLink className="w-3 h-3" />
                  </a>
                  <br />
                  2. Navigate to <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
                  <br />
                  3. Add both keys above for <strong>Production, Preview, and Development</strong>.
                  <br />
                  4. <span className="text-amber-300 font-bold">Important:</span> Go to the <strong>Deployments</strong> tab in Vercel, click the three dots on the latest deployment, and select <strong>Redeploy</strong>!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sample-logins' && (
            <div className="space-y-4">
              <p className="text-slate-400 text-xs">
                Click any of these seeded credentials to test immediately:
              </p>

              {/* Admin */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-indigo-400">Examination Admin</span>
                  {onFillSampleCredentials && (
                    <button
                      onClick={() => {
                        onFillSampleCredentials('admin', 'admin123');
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 transition-colors"
                    >
                      Fill Admin Login
                    </button>
                  )}
                </div>
                <div className="font-mono text-[11px] text-slate-300">
                  Identifier: <span className="text-slate-100 font-bold">admin</span> &bull; Password: <span className="text-slate-100 font-bold">admin123</span>
                </div>
              </div>

              {/* Trainer */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-cyan-400">Faculty Proctor / Trainer</span>
                  {onFillSampleCredentials && (
                    <button
                      onClick={() => {
                        onFillSampleCredentials('trainer', 'trainer@123');
                        onClose();
                      }}
                      className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition-colors"
                    >
                      Fill Trainer Login
                    </button>
                  )}
                </div>
                <div className="font-mono text-[11px] text-slate-300">
                  Identifier: <span className="text-slate-100 font-bold">trainer</span> &bull; Password: <span className="text-slate-100 font-bold">trainer@123</span>
                </div>
              </div>

              {/* Student Login Instructions */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-400">Student Examinees</span>
                  <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Managed by Admin
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-300">
                  Identifier: <span className="text-slate-100 font-bold">Student Roll Number</span> &bull; Password: <span className="text-slate-100 font-bold">Roll Number</span> or <span className="text-slate-100 font-bold">1234</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p className="font-bold text-slate-300">Password Rules for Students:</p>
                <p>&bull; Students can log in using their <strong>Roll Number as the password</strong> (e.g. password = roll number).</p>
                <p>&bull; Or using the default institutional password <code className="text-cyan-400">1234</code> or <code className="text-cyan-400">student123</code>.</p>
                <p>&bull; Or any custom password set by the admin when adding or importing the student.</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={() => setActiveTab('setup-guide')}
            className="text-xs font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Need Help Configuring?</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
