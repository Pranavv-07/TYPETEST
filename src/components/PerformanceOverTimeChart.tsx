import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TestSubmission } from '../types';
import { TrendingUp, Target, Activity, Award, Filter, Calendar } from 'lucide-react';

interface PerformanceOverTimeChartProps {
  submissions: TestSubmission[];
  className?: string;
}

export const PerformanceOverTimeChart: React.FC<PerformanceOverTimeChartProps> = ({
  submissions,
  className = ''
}) => {
  const [filterRange, setFilterRange] = useState<'all' | '10' | '5'>('all');

  // Sort chronologically (oldest to newest) for a proper time-series curve
  const chartData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    const sorted = [...submissions].sort((a, b) => {
      const timeA = new Date(a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp || 0).getTime();
      return timeA - timeB;
    });

    const sliced =
      filterRange === '5'
        ? sorted.slice(-5)
        : filterRange === '10'
        ? sorted.slice(-10)
        : sorted;

    return sliced.map((sub, index) => {
      const d = sub.timestamp ? new Date(sub.timestamp) : new Date();
      const formattedDate = d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      const formattedTime = d.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });

      return {
        id: sub.id || `sub-${index}`,
        attemptIndex: index + 1,
        dateLabel: `${formattedDate} ${formattedTime}`,
        shortLabel: `#${index + 1} (${formattedDate})`,
        netWpm: Number(sub.netWpm) || 0,
        rawWpm: Number(sub.rawWpm) || Number(sub.netWpm) || 0,
        accuracy: Number(sub.accuracy) || 100,
        errors: sub.errors || 0,
        testTitle: sub.testTitle || 'Typing Assessment',
        isPractice: sub.isPractice || false,
        timeTaken: sub.timeTaken || 60
      };
    });
  }, [submissions, filterRange]);

  // Derived metrics
  const stats = useMemo(() => {
    if (chartData.length === 0) {
      return { peakWpm: 0, avgWpm: 0, avgAccuracy: 0, progressDiff: 0 };
    }
    const wpms = chartData.map(d => d.netWpm);
    const accs = chartData.map(d => d.accuracy);
    const peakWpm = Math.max(...wpms);
    const avgWpm = Math.round(wpms.reduce((a, b) => a + b, 0) / wpms.length);
    const avgAccuracy = Math.round(accs.reduce((a, b) => a + b, 0) / accs.length);

    const firstWpm = chartData[0]?.netWpm || 0;
    const latestWpm = chartData[chartData.length - 1]?.netWpm || 0;
    const progressDiff = latestWpm - firstWpm;

    return { peakWpm, avgWpm, avgAccuracy, progressDiff };
  }, [chartData]);

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-950/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur font-mono text-xs space-y-2 z-50">
          <div className="border-b border-slate-800 pb-1.5 flex items-center justify-between gap-3">
            <span className="font-bold text-slate-200">{data.testTitle}</span>
            <span className="text-[10px] text-slate-400">{data.dateLabel}</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span>Net Speed:</span>
              <strong className="text-cyan-300 font-bold">{data.netWpm} WPM</strong>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Accuracy:</span>
              <strong className="text-emerald-300 font-bold">{data.accuracy}%</strong>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>Raw: {data.rawWpm} WPM</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
              <span>Errors: {data.errors}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 ${className}`}>
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-slate-100">Performance Over Time</h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Recharts Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Historical progression of Net WPM speed velocity and accuracy metrics
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setFilterRange('all')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
              filterRange === 'all'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setFilterRange('10')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
              filterRange === '10'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 10
          </button>
          <button
            onClick={() => setFilterRange('5')}
            className={`px-3 py-1 text-xs font-mono rounded-lg transition-all ${
              filterRange === '5'
                ? 'bg-slate-800 text-cyan-300 font-bold border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Last 5
          </button>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase">Peak Verified</span>
          <span className="text-xl font-bold text-cyan-400">{stats.peakWpm} <span className="text-xs font-normal text-slate-500">WPM</span></span>
        </div>
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase">Average Speed</span>
          <span className="text-xl font-bold text-slate-200">{stats.avgWpm} <span className="text-xs font-normal text-slate-500">WPM</span></span>
        </div>
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase">Avg Accuracy</span>
          <span className="text-xl font-bold text-emerald-400">{stats.avgAccuracy}%</span>
        </div>
        <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
          <span className="text-[10px] text-slate-500 block uppercase">Speed Progress</span>
          <span className={`text-xl font-bold ${stats.progressDiff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {stats.progressDiff >= 0 ? `+${stats.progressDiff}` : stats.progressDiff} <span className="text-xs font-normal text-slate-500">WPM</span>
          </span>
        </div>
      </div>

      {/* Recharts Line Chart Container */}
      <div className="h-64 sm:h-72 w-full pt-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
              <defs>
                <linearGradient id="wpmColor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis
                dataKey="shortLabel"
                stroke="#64748b"
                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
              />
              {/* Left Y Axis: WPM */}
              <YAxis
                yAxisId="left"
                stroke="#06b6d4"
                tick={{ fill: '#38bdf8', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.max(80, Math.ceil(dataMax * 1.15))]}
              />
              {/* Right Y Axis: Accuracy (%) */}
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                tick={{ fill: '#34d399', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={false}
                axisLine={false}
                domain={[60, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                wrapperStyle={{ paddingBottom: '10px', fontSize: '11px', fontFamily: 'monospace' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="netWpm"
                name="Net Speed (WPM)"
                stroke="#22d3ee"
                strokeWidth={3}
                dot={{ r: 4, fill: '#06b6d4', stroke: '#0f172a', strokeWidth: 2 }}
                activeDot={{ r: 6, fill: '#67e8f9', stroke: '#0f172a', strokeWidth: 2 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="accuracy"
                name="Accuracy (%)"
                stroke="#34d399"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3, fill: '#10b981', stroke: '#0f172a', strokeWidth: 1.5 }}
                activeDot={{ r: 5, fill: '#6ee7b7' }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <Activity className="w-8 h-8 text-slate-600 mb-2 animate-pulse" />
            <h4 className="text-sm font-semibold text-slate-300">No Assessment Runs Recorded Yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Complete practice arena tests or trainer assessments to plot your WPM and accuracy progression over time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
