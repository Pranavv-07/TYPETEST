const fs = require('fs');
let content = fs.readFileSync('src/components/StudentDashboard.tsx', 'utf8');

// Add Flame icon
content = content.replace(
  "import { Trophy, Clock, Target, Zap, Activity, Calendar } from 'lucide-react';",
  "import { Trophy, Clock, Target, Zap, Activity, Calendar, Flame } from 'lucide-react';"
);

// Calculate streak
const streakCalc = `
    let currentStreak = 0;
    if (mySubmissions.length > 0) {
      // Sort submissions by date descending
      const sortedDates = [...mySubmissions]
        .map(s => new Date(s.timestamp || new Date()).setHours(0, 0, 0, 0))
        .sort((a, b) => b - a);
      
      const uniqueDates = [...new Set(sortedDates)];
      const today = new Date().setHours(0, 0, 0, 0);
      const yesterday = today - 86400000;
      
      if (uniqueDates.length > 0 && (uniqueDates[0] === today || uniqueDates[0] === yesterday)) {
        currentStreak = 1;
        let expectedDate = uniqueDates[0] - 86400000;
        for (let i = 1; i < uniqueDates.length; i++) {
          if (uniqueDates[i] === expectedDate) {
            currentStreak++;
            expectedDate -= 86400000;
          } else {
            break;
          }
        }
      }
    }
`;

content = content.replace(
  "const totalScore = Math.round((avgWpm * avgAccuracy) / 100 * testsCompleted);",
  `const totalScore = Math.round((avgWpm * avgAccuracy) / 100 * testsCompleted);\n${streakCalc}`
);

content = content.replace(
  "return { bestWpm, avgWpm, avgAccuracy, testsCompleted, totalTime, totalScore };",
  "return { bestWpm, avgWpm, avgAccuracy, testsCompleted, totalTime, totalScore, currentStreak };"
);

// Add Streak UI block
const uiBlock = `
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-4 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-3 mb-2 sm:mb-4">
            <div className="p-2 sm:p-3 bg-orange-500/20 text-orange-600 rounded-xl">
              <Flame size={20} className="sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-sm font-semibold text-orange-800">Current Streak</h3>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-slate-800">{stats.currentStreak}</span>
            <span className="text-sm font-medium text-slate-500">days</span>
          </div>
        </div>
`;

content = content.replace(
  "      <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">",
  `      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">\n${uiBlock}`
);

// Change grid-cols to 5 maybe, or adjust the layout
content = content.replace(
  "grid-cols-2 md:grid-cols-4",
  "grid-cols-2 md:grid-cols-5"
);

fs.writeFileSync('src/components/StudentDashboard.tsx', content);
