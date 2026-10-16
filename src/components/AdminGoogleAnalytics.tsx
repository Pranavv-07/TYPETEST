import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Activity,
  Globe,
  Shield,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Send,
  Smartphone,
  Monitor,
  Tablet,
  Radio,
  Trash2,
  HelpCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Sparkles
} from 'lucide-react';
import {
  getGAMeasurementId,
  setGAMeasurementId,
  isGATrackingEnabled,
  setGATrackingEnabled,
  sendTestPing,
  getRecentEvents,
  getAggregatedStats,
  clearAggregatedStats,
  subscribeToAnalytics,
  AnalyticsEventRecord,
  AggregatedTrafficStats,
  VERIFIED_HOSTED_URL
} from '../services/analyticsService';

export const AdminGoogleAnalytics: React.FC = () => {
  const [measurementId, setMeasurementIdInput] = useState(() => getGAMeasurementId());
  const [activeId, setActiveId] = useState(() => getGAMeasurementId());
  const [trackingEnabled, setTrackingEnabled] = useState(() => isGATrackingEnabled());
  const [recentEvents, setRecentEvents] = useState<AnalyticsEventRecord[]>(() => getRecentEvents());
  const [stats, setStats] = useState<AggregatedTrafficStats>(() => getAggregatedStats());
  const [copiedVar, setCopiedVar] = useState(false);
  const [pingStatus, setPingStatus] = useState<string | null>(null);
  const [isPinging, setIsPinging] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(!getGAMeasurementId());
  const [selectedEvent, setSelectedEvent] = useState<AnalyticsEventRecord | null>(null);

  useEffect(() => {
    const update = () => {
      setActiveId(getGAMeasurementId());
      setTrackingEnabled(isGATrackingEnabled());
      setRecentEvents(getRecentEvents());
      setStats(getAggregatedStats());
    };

    const unsubscribe = subscribeToAnalytics(update);
    return () => unsubscribe();
  }, []);

  const handleSaveId = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);

    const trimmed = measurementId.trim().toUpperCase();
    if (trimmed && !trimmed.startsWith('G-')) {
      setSaveError('Measurement ID must begin with "G-" (for example: G-ABC123XYZ4).');
      return;
    }

    const success = setGAMeasurementId(trimmed);
    if (success) {
      setActiveId(trimmed);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setSaveError('Failed to save Measurement ID.');
    }
  };

  const handleToggleTracking = () => {
    const next = !trackingEnabled;
    setGATrackingEnabled(next);
    setTrackingEnabled(next);
  };

  const handleSendPing = () => {
    setIsPinging(true);
    setPingStatus(null);
    try {
      const ok = sendTestPing('Admin Hub Manual Diagnostic');
      if (ok) {
        setPingStatus('Live test ping dispatched to Google Analytics! Check "Realtime" in your GA console.');
      } else {
        setPingStatus('Measurement ID is not set or tracking is disabled. Please enter your G-XXXXXXXXXX ID first.');
      }
    } catch (e: any) {
      setPingStatus(`Error sending ping: ${e.message}`);
    } finally {
      setIsPinging(false);
      setTimeout(() => setPingStatus(null), 6000);
    }
  };

  const handleCopyVercelEnv = () => {
    const val = activeId || measurementId.trim() || 'G-XXXXXXXXXX';
    navigator.clipboard.writeText(`VITE_GA_MEASUREMENT_ID=${val}`);
    setCopiedVar(true);
    setTimeout(() => setCopiedVar(false), 2500);
  };

  const isConnected = Boolean(activeId && activeId.startsWith('G-') && trackingEnabled);

  // Calculate highest route count for percentage bars
  const maxRouteCount = Math.max(1, ...Object.values(stats.routeBreakdown));
  const totalDeviceCount = Math.max(1, (stats.deviceBreakdown.Desktop || 0) + (stats.deviceBreakdown.Mobile || 0) + (stats.deviceBreakdown.Tablet || 0));

  return (
    <div className="space-y-6">
      {/* Privacy Guarantee Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <span>Admin-Only Traffic Analytics & Telemetry</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                100% Free Google Analytics 4 (gtag.js)
              </span>
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Only authenticated administrators and your personal Google Analytics account can view website visits and engagement data.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span>Open Google Analytics</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Main Connection & Configuration Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-[10px] font-mono font-bold uppercase tracking-wider">
                Web Telemetry & Traffic
              </span>
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-cyan-400" />
                <span>{VERIFIED_HOSTED_URL}</span>
              </span>
            </div>
            <h3 className="text-xl font-bold text-slate-100 flex items-center gap-2.5 mt-2">
              <BarChart3 className="w-5 h-5 text-cyan-400" />
              <span>Google Analytics 4 Connection Hub</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Connect your website to Google's standard free analytics platform. Monitors visitor traffic, test participation, device types, and page views with zero recurring fees or subscriptions.
            </p>
          </div>

          {/* Connection Status Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 px-3.5 py-2 border rounded-2xl text-xs font-mono shrink-0 ${
                isConnected
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
              <span className="font-bold">
                {isConnected ? 'GA4 Connected & Active' : activeId ? 'Tracking Paused' : 'Measurement ID Required'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleToggleTracking}
              disabled={!activeId}
              className={`px-3 py-2 rounded-2xl text-xs font-mono font-bold transition-all border ${
                !activeId
                  ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                  : trackingEnabled
                  ? 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/30 text-amber-300'
                  : 'bg-emerald-500/15 hover:bg-emerald-500/25 border-emerald-500/30 text-emerald-300'
              }`}
            >
              {trackingEnabled ? 'Pause Tracking' : 'Resume Tracking'}
            </button>
          </div>
        </div>

        {/* Input Form & Action Bar */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <form onSubmit={handleSaveId} className="lg:col-span-7 space-y-4">
            <div>
              <label className="text-xs font-mono font-semibold text-slate-300 flex items-center justify-between">
                <span>Google Analytics 4 Measurement ID</span>
                <span className="text-[11px] text-cyan-400 font-normal">Format: G-XXXXXXXXXX</span>
              </label>
              <div className="flex items-center gap-2 mt-1.5">
                <input
                  type="text"
                  value={measurementId}
                  onChange={e => setMeasurementIdInput(e.target.value)}
                  placeholder="e.g. G-32YV3H5Z1E"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500 transition-colors uppercase"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold font-mono transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save & Connect</span>
                </button>
              </div>

              {saveError && (
                <p className="text-[11px] text-rose-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{saveError}</span>
                </p>
              )}
              {saveSuccess && (
                <p className="text-[11px] text-emerald-400 mt-1.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Measurement ID updated and Google Analytics initialized!</span>
                </p>
              )}
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleSendPing}
                disabled={isPinging || !isConnected}
                className={`px-3.5 py-2 rounded-xl text-xs font-mono font-semibold flex items-center gap-1.5 transition-all border ${
                  !isConnected
                    ? 'bg-slate-950 border-slate-800 text-slate-600 cursor-not-allowed'
                    : 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-cyan-300'
                }`}
              >
                <Send className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                <span>Send Realtime Test Ping</span>
              </button>

              <button
                type="button"
                onClick={handleCopyVercelEnv}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 transition-all"
              >
                {copiedVar ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedVar ? 'Copied Vercel Env!' : 'Copy Vercel Env Var'}</span>
              </button>

              <button
                type="button"
                onClick={() => setShowGuide(prev => !prev)}
                className="px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-all ml-auto"
              >
                <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                <span>{showGuide ? 'Hide Free Setup Guide' : 'How to get Free GA4 ID'}</span>
                {showGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {pingStatus && (
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/40 rounded-xl text-xs text-cyan-300 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400 shrink-0 animate-pulse" />
                <span>{pingStatus}</span>
              </div>
            )}
          </form>

          {/* Quick Info Summary */}
          <div className="lg:col-span-5 bg-slate-950 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Free Google Analytics Setup Summary</span>
            </h4>
            <div className="text-xs space-y-2 text-slate-400">
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Subscription Cost:</span>
                <span className="font-mono font-bold text-emerald-400">100% Free (Google GA4)</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Hosted Domain:</span>
                <span className="font-mono text-cyan-400 text-[11px] truncate max-w-[180px]">
                  {VERIFIED_HOSTED_URL.replace('https://', '')}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Active Measurement ID:</span>
                <span className="font-mono font-bold text-slate-200">
                  {activeId || <span className="text-amber-400">None</span>}
                </span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-400">Realtime Reporting:</span>
                <span className="font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live (Under 10s)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Step-by-Step Guide for Free GA4 */}
        {showGuide && (
          <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                  3-Minute Quickstart: Setup Free Google Analytics 4
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Zero Payment Required</span>
            </div>

            <ol className="space-y-3 text-xs text-slate-300">
              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <strong className="text-slate-100">Open Google Analytics:</strong> Navigate to{' '}
                  <a
                    href="https://analytics.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 underline font-mono hover:text-cyan-300"
                  >
                    analytics.google.com
                  </a>{' '}
                  and sign in with your regular Google Account.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <strong className="text-slate-100">Create a Free Property:</strong> Click <strong>Admin</strong> (gear icon bottom left) &rarr; <strong>+ Create Property</strong>. Enter property name <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">TypeTest</code> and select your time zone and currency.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <div>
                  <strong className="text-slate-100">Add Web Stream:</strong> Select <strong>Web</strong> as your platform. Set Website URL to{' '}
                  <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">https://typetest-gules.vercel.app</code> and Stream Name to <code className="text-cyan-300 bg-slate-900 px-1 py-0.5 rounded font-mono">TypeTest Web</code>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  4
                </span>
                <div>
                  <strong className="text-slate-100">Copy your Measurement ID:</strong> Copy the code beginning with <code className="text-emerald-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded font-mono">G-XXXXXXXXXX</code> and paste it into the field above, then click <strong>Save & Connect</strong>.
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  5
                </span>
                <div>
                  <strong className="text-slate-100">Confirm in Realtime:</strong> Click the <strong>Send Realtime Test Ping</strong> button above, then in Google Analytics click <strong>Reports &rarr; Realtime</strong>. You will immediately see your active user and event count!
                </div>
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Traffic & Visits Intelligence Dashboard (In-App Preview) */}
      <div className="space-y-6">
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Total Page Views</div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {stats.totalPageViews}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Dispatched to Google gtag</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Tracked Visits</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {stats.totalVisits}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Unique browsing sessions</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Tests Completed</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {stats.testsCompleted}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">{stats.testsStarted} initiated</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="text-[11px] font-mono text-slate-400 uppercase">Certs Verified</div>
            <div className="text-2xl font-black font-mono text-purple-400 mt-1">
              {stats.certificatesVerified}
            </div>
            <div className="text-[10px] text-slate-500 mt-1">Public token audits</div>
          </div>
        </div>

        {/* Detailed Breakdown: Routes & Devices */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Views & Routes Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                <span>Page Views by Section / Route</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Live Counter</span>
            </div>

            <div className="space-y-3 pt-1">
              {Object.entries(stats.routeBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([route, count]) => {
                  const pct = Math.round((count / maxRouteCount) * 100);
                  const routeLabels: Record<string, string> = {
                    '/arena': 'Practice Arena (/arena)',
                    '/academy': 'Touch Typing Academy (/academy)',
                    '/tests': 'Test Catalog Directory (/tests)',
                    '/leaderboard': 'Public Leaderboard (/leaderboard)',
                    '/multiplayer': 'Multiplayer Races (/multiplayer)',
                    '/verify': 'Certificate Verification (/verify)',
                    '/student': 'Student Portal & Tests (/student)',
                    '/trainer': 'Trainer Dashboard (/trainer)',
                    '/admin': 'Institutional Admin Portal (/admin)'
                  };

                  return (
                    <div key={route} className="space-y-1">
                      <div className="flex justify-between text-xs font-mono">
                        <span className="text-slate-300">{routeLabels[route] || route}</span>
                        <span className="text-cyan-400 font-bold">{count} views</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(count > 0 ? 5 : 0, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Device & Client Breakdown */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Monitor className="w-4 h-4 text-cyan-400" />
                <span>Audience Hardware & Browsers</span>
              </h4>
              <span className="text-[10px] font-mono text-slate-400">Client Telemetry</span>
            </div>

            {/* Devices Row */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { name: 'Desktop', icon: Monitor, count: stats.deviceBreakdown.Desktop || 0 },
                { name: 'Mobile', icon: Smartphone, count: stats.deviceBreakdown.Mobile || 0 },
                { name: 'Tablet', icon: Tablet, count: stats.deviceBreakdown.Tablet || 0 }
              ].map(dev => {
                const Icon = dev.icon;
                const pct = Math.round((dev.count / totalDeviceCount) * 100);
                return (
                  <div key={dev.name} className="bg-slate-950 border border-slate-800/80 p-3 rounded-2xl text-center space-y-1">
                    <Icon className="w-4 h-4 mx-auto text-cyan-400" />
                    <div className="text-[11px] font-mono text-slate-300 font-bold">{dev.name}</div>
                    <div className="text-lg font-black font-mono text-slate-100">{dev.count}</div>
                    <div className="text-[10px] text-slate-500">{pct}%</div>
                  </div>
                );
              })}
            </div>

            {/* Browser breakdown list */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2">
              <div className="text-xs font-mono text-slate-400 font-semibold mb-1">Detected Browsers:</div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {Object.entries(stats.browserBreakdown).map(([bro, count]) => (
                  <div key={bro} className="flex justify-between items-center bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/60">
                    <span className="text-slate-300">{bro}</span>
                    <span className="text-cyan-400 font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Real-time Event Stream Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span>Live Google Analytics Event Stream</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  {recentEvents.length} Recent Events
                </span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Displays real-time events sent to your Google tag manager endpoint.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecentEvents(getRecentEvents())}
                className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs transition-all"
                title="Refresh log"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={clearAggregatedStats}
                className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-rose-950/40 border border-slate-800 hover:border-rose-500/30 text-slate-400 hover:text-rose-300 text-xs font-mono transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Local Stats</span>
              </button>
            </div>
          </div>

          {recentEvents.length === 0 ? (
            <div className="text-center py-8 text-slate-500 font-mono text-xs">
              No recent events logged yet. Navigate around or click "Send Realtime Test Ping" above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Event Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Payload Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {recentEvents.map(evt => (
                    <tr
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{evt.timestamp}</td>
                      <td className="py-2.5 px-3 text-cyan-300 font-bold whitespace-nowrap">{evt.eventName}</td>
                      <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">{evt.category || 'general'}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            evt.status === 'sent'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}
                        >
                          {evt.status === 'sent' ? 'Dispatched' : 'Buffered'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate">
                        {JSON.stringify(evt.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Event Inspector: {selectedEvent.eventName}</span>
              </h4>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono"
              >
                Close ✕
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Event ID:</span>
                <span className="text-slate-200">{selectedEvent.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-200">{selectedEvent.timestamp}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Category:</span>
                <span className="text-cyan-400">{selectedEvent.category}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span className="text-slate-500">Delivery Status:</span>
                <span className={selectedEvent.status === 'sent' ? 'text-emerald-400' : 'text-amber-400'}>
                  {selectedEvent.status === 'sent' ? 'Dispatched to Google Analytics' : 'Buffered (No ID or Disabled)'}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[11px] font-mono text-slate-400">Parameter Payload:</span>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48">
                {JSON.stringify(selectedEvent.details, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
