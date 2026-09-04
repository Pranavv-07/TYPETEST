import React from 'react';
import { TestReport } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  Download,
  Printer,
  FileText,
  Trophy,
  CheckCircle2,
  Clock,
  Target,
  AlertCircle
} from 'lucide-react';

interface ReportModalProps {
  report: TestReport | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({ report, isOpen, onClose }) => {
  const { downloadReportCSV } = useApp();

  if (!isOpen || !report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Official Assessment Report
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Generated {report.generatedAt}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <FileText className="w-6 h-6 text-cyan-400" />
              <span>{report.testTitle}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => downloadReportCSV(report)}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Summary Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-6 bg-slate-950/40 border-b border-slate-800">
          <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Total Candidates</div>
            <div className="text-2xl font-black font-mono text-slate-100 mt-1">
              {report.totalCompleted} / {report.totalAssigned}
            </div>
            <div className="text-[11px] text-cyan-400 font-medium mt-0.5">
              {Math.round((report.totalCompleted / Math.max(report.totalAssigned, 1)) * 100)}% Participation
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Average Velocity</div>
            <div className="text-2xl font-black font-mono text-cyan-400 mt-1">
              {report.averageWpm} <span className="text-xs text-slate-400">WPM</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Assigned Class Mean</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Average Accuracy</div>
            <div className="text-2xl font-black font-mono text-emerald-400 mt-1">
              {report.averageAccuracy}%
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Typing Precision</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 p-3.5 rounded-2xl">
            <div className="text-[10px] font-mono text-slate-400 uppercase">Top Speed Peak</div>
            <div className="text-2xl font-black font-mono text-amber-400 mt-1">
              {report.highestWpm} <span className="text-xs text-slate-400">WPM</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Rank 1 Highest Score</div>
          </div>
        </div>

        {/* Detailed Results Table */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-900/90">
                  <th className="py-3 px-4 w-12">#</th>
                  <th className="py-3 px-4">ROLL NO</th>
                  <th className="py-3 px-4">STUDENT NAME</th>
                  <th className="py-3 px-4">STATUS</th>
                  <th className="py-3 px-4 text-right">NET WPM</th>
                  <th className="py-3 px-4 text-right">ACCURACY</th>
                  <th className="py-3 px-4 text-right">TIME TAKEN</th>
                  <th className="py-3 px-4 text-right">COMPLETED AT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {report.studentResults.map((res, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-500">
                      {res.rank ? (
                        <span className="w-6 h-6 rounded-full inline-flex items-center justify-center bg-slate-800 text-slate-300">
                          {res.rank}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-cyan-400">{res.rollNo}</td>
                    <td className="py-3 px-4 font-sans font-bold text-slate-200 uppercase">
                      {res.studentName}
                    </td>
                    <td className="py-3 px-4">
                      {res.status === 'completed' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Not Attempted</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-100 text-sm">
                      {res.wpm !== undefined ? res.wpm : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-300">
                      {res.accuracy !== undefined ? `${res.accuracy}%` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-400">
                      {res.timeTaken !== undefined ? `${res.timeTaken}s` : '-'}
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 text-[11px]">
                      {res.timestamp || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
          <span>Dept. of CSE • Institutional Examination & Assessment Record</span>
        </div>
      </div>
    </div>
  );
};
