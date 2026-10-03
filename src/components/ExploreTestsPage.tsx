import React, { useState, useMemo } from 'react';
import { TypingTest, TypingMode } from '../types';
import { useApp } from '../context/AppContext';
import {
  Search,
  Code2,
  BookOpen,
  Clock,
  Type,
  Zap,
  Target,
  Filter,
  Sparkles,
  ArrowRight,
  Trophy,
  CheckCircle2,
  SlidersHorizontal,
  Flame,
  Star
} from 'lucide-react';

interface ExploreTestsPageProps {
  onLaunchTest: (test: TypingTest) => void;
}

export const ExploreTestsPage: React.FC<ExploreTestsPageProps> = ({ onLaunchTest }) => {
  const { tests, submissions, currentUser } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');

  // Filter out custom single-attempt tests created for institutional assignments
  // from the public test explore directory
  const publicTests = useMemo(() => {
    return tests.filter(t => !t.isCustomAssignment);
  }, [tests]);

  // Compute personal bests map for current user
  const personalBests = useMemo(() => {
    const map: Record<string, { wpm: number; accuracy: number }> = {};
    const mySubmissions = submissions.filter(s =>
      s.studentId === currentUser?.id ||
      (currentUser?.rollNo && s.rollNo === currentUser.rollNo) ||
      (currentUser?.name && s.studentName === currentUser.name)
    );

    mySubmissions.forEach(sub => {
      const existing = map[sub.testId];
      if (!existing || sub.netWpm > existing.wpm) {
        map[sub.testId] = { wpm: sub.netWpm, accuracy: sub.accuracy };
      }
    });

    return map;
  }, [submissions, currentUser]);

  // Filtered and searched tests
  const filteredTests = useMemo(() => {
    return publicTests.filter(t => {
      // Category / Mode match
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'code' && t.category !== 'code') return false;
        if (selectedCategory === 'story' && t.category !== 'story') return false;
        if (selectedCategory === 'standard' && t.category !== 'standard') return false;
        if (selectedCategory === 'speed' && (t.timeLimit > 60 || t.category === 'code')) return false;
        if (selectedCategory === 'accuracy' && t.minAccuracy < 95) return false;
      }

      // Difficulty match
      if (selectedDifficulty !== 'all' && t.difficulty !== selectedDifficulty) {
        return false;
      }

      // Programming Language match
      if (selectedLanguage !== 'all' && t.language !== selectedLanguage) {
        return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const matchesLang = (t.language || '').toLowerCase().includes(query);
        const matchesContent = t.content.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesLang || matchesContent;
      }

      return true;
    });
  }, [publicTests, selectedCategory, selectedDifficulty, selectedLanguage, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="space-y-2 z-10 max-w-2xl">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Public Test Library
            </span>
            <span className="text-xs font-mono text-slate-400">
              {publicTests.length} Curated Modules
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight">
            Explore Typing Tests & Challenges
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Choose from code algorithms in Python, JavaScript, Java and C++, evocative prose stories, speed bursts, and technical precision benchmarks.
          </p>
        </div>

        {/* Search Bar in Header */}
        <div className="w-full md:w-80 z-10">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search tests, languages, topics..."
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-3 text-xs text-slate-100 font-sans placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 shadow-inner"
            />
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Filter and Category Ribbon */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
          {/* Main Category Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Tests', icon: Sparkles },
              { id: 'code', label: 'Code & Dev', icon: Code2 },
              { id: 'story', label: 'Prose & Stories', icon: BookOpen },
              { id: 'standard', label: 'Classic Drills', icon: Type },
              { id: 'speed', label: 'Speed Sprints (≤60s)', icon: Zap },
              { id: 'accuracy', label: 'High Accuracy (≥95%)', icon: Target }
            ].map(cat => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-400'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Filters: Difficulty & Language */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <select
              value={selectedDifficulty}
              onChange={e => setSelectedDifficulty(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-emerald-500/60"
            >
              <option value="all">Difficulty: Any</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {selectedCategory === 'code' && (
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-300 text-xs focus:outline-none focus:border-emerald-500/60"
              >
                <option value="all">Language: All</option>
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
                <option value="sql">SQL</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Test Cards Grid */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTests.map(test => {
            const pb = personalBests[test.id];
            const wordCount = (test.content.match(/\s*\S+/g) || []).length;

            return (
              <div
                key={test.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all hover:shadow-xl shadow-slate-950/20 group relative overflow-hidden"
              >
                <div className="space-y-3">
                  {/* Category, Difficulty & Language Tags */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold tracking-wider bg-slate-950 text-slate-300 border border-slate-800">
                        {test.category}
                      </span>
                      {test.language && test.language !== 'none' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {test.language}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize ${
                        test.difficulty === 'easy'
                          ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                          : test.difficulty === 'hard'
                          ? 'text-rose-400 bg-rose-500/10 border border-rose-500/20'
                          : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                      }`}>
                        {test.difficulty || 'medium'}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{test.timeLimit}s</span>
                      <span className="text-slate-600">•</span>
                      <span>{wordCount}w</span>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-base font-bold text-slate-100 group-hover:text-emerald-300 transition-colors">
                      {test.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {test.description || 'Standard technical keyboard assessment module.'}
                    </p>
                  </div>

                  {/* Preview Snippet */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-400 line-clamp-2 select-none">
                    {test.content}
                  </div>
                </div>

                {/* Footer Strip & Launch Button */}
                <div className="pt-4 mt-4 border-t border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-500">Target Accuracy:</span>
                    <span className="font-bold text-emerald-400">{test.minAccuracy}%</span>
                  </div>

                  {pb && (
                    <div className="p-2 rounded-xl bg-slate-950 border border-emerald-500/20 flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Best:</span>
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {pb.wpm} WPM ({pb.accuracy}%)
                      </span>
                    </div>
                  )}

                  <button
                    onClick={() => onLaunchTest(test)}
                    className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all flex items-center justify-center gap-2 shadow-md shadow-emerald-500/10 cursor-pointer"
                  >
                    <span>Start Test</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-12 text-center space-y-3 max-w-lg mx-auto">
          <Search className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-200">No matching tests found</h3>
          <p className="text-xs text-slate-400">
            Try adjusting your search keywords or switching category filters.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedDifficulty('all');
              setSelectedLanguage('all');
            }}
            className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs font-bold transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};
