const fs = require('fs');
let content = fs.readFileSync('src/components/TrainerDashboard.tsx', 'utf8');

// Add certificates to useApp
if (!content.includes('certificates,')) {
  content = content.replace(
    "    reports,",
    "    reports,\n    certificates,"
  );
}

// Replace the empty array in the map with actual certificates
content = content.replace(
  "{[] /* Should be certificates list if we exported it, but we can just show empty state for now or filter submissions */.length === 0",
  "{certificates.length === 0"
);

const certRow = `
                  {certificates.map(cert => (
                    <tr key={cert.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{cert.studentName}</div>
                        <div className="text-xs text-slate-500">{cert.rollNo}</div>
                      </td>
                      <td className="p-4 text-indigo-400 font-medium text-sm">
                        {cert.achievementTitle}
                      </td>
                      <td className="p-4 text-slate-300 text-sm">
                        {cert.testTitle}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 text-xs">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded border border-emerald-500/20">{cert.wpm} WPM</span>
                          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">{cert.accuracy}% Acc</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-400">
                        {cert.verificationCode}
                      </td>
                    </tr>
                  ))}
`;

content = content.replace(
  "                <tbody className=\"divide-y divide-slate-800\">",
  "                <tbody className=\"divide-y divide-slate-800\">\n" + certRow
);

fs.writeFileSync('src/components/TrainerDashboard.tsx', content);
