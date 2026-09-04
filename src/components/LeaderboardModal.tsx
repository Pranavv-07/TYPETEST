import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TypingTest } from '../types';
import {
  X,
  Share2,
  Trophy,
  Check,
  Calendar,
  Clock,
  Target,
  ArrowUpDown,
  ExternalLink,
  Award
} from 'lucide-react';

interface LeaderboardModalProps {
  test: TypingTest;
  isOpen: boolean;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ test, isOpen, onClose }) => {
  const { submissions, students, currentUser } = useApp();
  const [copied, setCopied] = useState(false);
  const [sortBy, setSortBy] = useState<'rank' | 'rollNo' | 'name' | 'wpm'>('rank');
  const [sortAsc, setSortAsc] = useState(false);

  if (!isOpen) return null;

  // Filter submissions for this test
  const testSubmissions = submissions.filter(s => s.testId === test.id);

  // Compile leaderboard list
  const rankedData = testSubmissions
    .map(sub => ({
      id: sub.id,
      studentId: sub.studentId,
      rollNo: sub.rollNo,
      name: sub.studentName,
      wpm: sub.netWpm,
      rawWpm: sub.rawWpm,
      accuracy: sub.accuracy,
      timeTaken: sub.timeTaken,
      timestamp: sub.timestamp,
      passed: sub.passed
    }))
    .sort((a, b) => b.wpm - a.wpm || b.accuracy - a.accuracy)
    .map((item, index) => ({
      ...item,
      rank: index + 1
    }));

  // Sort according to active selection
  const sortedData = [...rankedData].sort((a, b) => {
    if (sortBy === 'rank') {
      return sortAsc ? a.rank - b.rank : b.rank - a.rank;
    }
    if (sortBy === 'wpm') {
      return sortAsc ? a.wpm - b.wpm : b.wpm - a.wpm;
    }
    if (sortBy === 'rollNo') {
      return sortAsc
        ? a.rollNo.localeCompare(b.rollNo)
        : b.rollNo.localeCompare(a.rollNo);
    }
    if (sortBy === 'name') {
      return sortAsc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    return 0;
  });

  const handleCopyLink = () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?leaderboard=${test.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSortToggle = (col: 'rank' | 'rollNo' | 'name' | 'wpm') => {
    if (sortBy === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(col);
      setSortAsc(col === 'rollNo' || col === 'name');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Strip */}
        <div className="p-6 border-b border-slate-800 bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                Official Assessment Leaderboard
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {rankedData.length} Candidates Submitted
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-100 mt-1 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span>{test.title}</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copied ? 'Link Copied!' : 'Share Leaderboard'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Top Points / Benchmark Badges (Matches Reference Image top strip) */}
        <div className="px-6 py-3 bg-slate-950/40 border-b border-slate-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-indigo-400">
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Duration:</span>
            <span className="text-slate-300">{test.timeLimit}s limit</span>
          </div>

          <div className="text-slate-700">•</div>

          <div className="flex items-center gap-1.5 text-cyan-400">
            <Target className="w-4 h-4" />
            <span className="font-semibold">Target Accuracy:</span>
            <span className="text-slate-300">Min {test.minAccuracy}%</span>
          </div>

          <div className="text-slate-700">•</div>

          <div className="flex items-center gap-1.5 text-amber-400">
            <Award className="w-4 h-4" />
            <span className="font-semibold">Top Speed:</span>
            <span className="text-slate-100 font-bold">
              {rankedData.length > 0 ? `${rankedData[0].wpm} WPM` : 'No attempts yet'}
            </span>
          </div>
        </div>

        {/* Table Area - Styled accurately to reference image */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {rankedData.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Trophy className="w-12 h-12 mx-auto text-slate-700 stroke-[1.5]" />
              <p className="text-base font-semibold text-slate-400">No submissions recorded yet</p>
              <p className="text-xs text-slate-600">
                Assigned candidates who complete this assessment will appear on this live leaderboard.
              </p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 bg-slate-900/80">
                    <th
                      onClick={() => handleSortToggle('rank')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-cyan-400 select-none w-16"
                    >
                      <div className="flex items-center gap-1">
                        <span>#</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('rollNo')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-cyan-400 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>ROLL NO</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('name')}
                      className="py-3.5 px-4 font-semibold cursor-pointer hover:text-cyan-400 select-none"
                    >
                      <div className="flex items-center gap-1">
                        <span>NAME</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSortToggle('wpm')}
                      className="py-3.5 px-4 font-semibold text-right cursor-pointer hover:text-cyan-400 select-none"
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                        <span>NET WPM</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-600" />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-sm">
                  {sortedData.map(row => {
                    const isCurrentUser =
                      currentUser?.role === 'student' &&
                      (currentUser.id === row.studentId || currentUser.rollNo === row.rollNo);

                    // Badge color based on exact reference image:
                    // Rank 1: Orange #1
                    // Rank 2: Blue #2
                    // Rank 3: Green #3
                    // Rank 4+: Slate circle
                    let rankBadgeClass =
                      'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-slate-800 text-slate-400';
                    if (row.rank === 1) {
                      rankBadgeClass =
                        'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20';
                    } else if (row.rank === 2) {
                      rankBadgeClass =
                        'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-blue-600 text-white shadow-md shadow-blue-600/20';
                    } else if (row.rank === 3) {
                      rankBadgeClass =
                        'w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs bg-emerald-600 text-white shadow-md shadow-emerald-600/20';
                    }

                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors ${
                          isCurrentUser
                            ? 'bg-amber-500/10 border-l-4 border-amber-500'
                            : 'hover:bg-slate-900/50'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className={rankBadgeClass}>{row.rank}</div>
                        </td>

                        <td className="py-3 px-4 font-mono font-medium text-cyan-400">
                          {row.rollNo}
                        </td>

                        <td className="py-3 px-4 font-bold uppercase text-slate-100">
                          <div className="flex items-center gap-2">
                            <span>{row.name}</span>
                            {isCurrentUser && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-amber-500 text-slate-950 uppercase">
                                YOU
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="font-mono font-black text-base text-slate-100">
                            {row.wpm.toFixed(2)}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500">
                            {row.accuracy}% acc • {row.rawWpm} raw
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 text-center text-xs text-slate-500 font-mono">
          <span>Official Institutional Examination Leaderboard • Dept. of CSE</span>
        </div>
      </div>
    </div>
  );
};
