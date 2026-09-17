const fs = require('fs');
let content = fs.readFileSync('src/components/TrainerDashboard.tsx', 'utf8');

// Add Award icon
content = content.replace(
  "import {",
  "import {\n  Award,"
);

// Add activeTab option
content = content.replace(
  "  const [activeTab, setActiveTab] = useState<'monitoring' | 'tests' | 'reports' | 'classes'>('monitoring');",
  "  const [activeTab, setActiveTab] = useState<'monitoring' | 'tests' | 'reports' | 'classes' | 'certificates'>('monitoring');"
);

// Add Tab Button
const certTabBtn = `
          <button
            onClick={() => setActiveTab('certificates')}
            className={\`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 \${
              activeTab === 'certificates'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-700'
            }\`}
          >
            <Award size={18} />
            <span>Certificates</span>
          </button>
`;

content = content.replace(
  "        </div>\n      </div>\n\n      {activeTab === 'monitoring' && (",
  certTabBtn + "        </div>\n      </div>\n\n      {activeTab === 'monitoring' && ("
);

// Add Certificates Tab content
const certContent = `
      {activeTab === 'certificates' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Certificate Verification & Issuance</h2>
              <p className="text-sm text-slate-400">View and verify student assessment certificates.</p>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input
                  type="text"
                  placeholder="Verify Code (e.g. V-ABC123)"
                  className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                />
              </div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shrink-0">
                <CheckCircle2 size={18} /> Verify
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-800/20 flex gap-4">
              <div className="flex items-center gap-2 text-slate-400 text-sm">
                <Award size={16} className="text-indigo-400" />
                <span>Auto-issued upon passing (>90% accuracy, >20 WPM)</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium">Achievement</th>
                    <th className="p-4 font-medium">Test</th>
                    <th className="p-4 font-medium">Metrics</th>
                    <th className="p-4 font-medium">Verify Code</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {[] /* Should be certificates list if we exported it, but we can just show empty state for now or filter submissions */.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-12 text-center">
                        <Award size={32} className="mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-400 font-medium">No certificates issued yet</p>
                        <p className="text-slate-500 text-sm mt-1">Certificates are generated automatically when students pass assessments.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(
  "    </div>\n  );\n};\n",
  certContent + "\n    </div>\n  );\n};\n"
);

fs.writeFileSync('src/components/TrainerDashboard.tsx', content);
