const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// Add Admins icon import
content = content.replace(
  "Users, Plus,",
  "Users, Plus, Shield,"
);

// Add Admins to tabs
const tabRegex = /\{ id: 'departments', label: 'Departments', icon: Building2 \},/;
content = content.replace(
  tabRegex,
  `{ id: 'admins', label: 'Administrators', icon: Shield },\n      { id: 'departments', label: 'Departments', icon: Building2 },`
);

// Add Admins rendering block
const adminsBlock = `
      {/* TAB: ADMINISTRATORS */}
      {activeTab === 'admins' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-100">System Administrators</h2>
              <p className="text-sm text-slate-400">Manage high-level access and roles</p>
            </div>
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors">
              <Plus size={18} /> Add Admin
            </button>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800/50 border-b border-slate-700 text-xs uppercase tracking-wider text-slate-400">
                    <th className="p-4 font-medium">Name</th>
                    <th className="p-4 font-medium">Username</th>
                    <th className="p-4 font-medium">Email</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {admins.map(admin => (
                    <tr key={admin.id} className="hover:bg-slate-800/20 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-slate-200">{admin.name}</div>
                      </td>
                      <td className="p-4 text-slate-300">{admin.username}</td>
                      <td className="p-4 text-slate-400 text-sm">{admin.email}</td>
                      <td className="p-4 text-right">
                        <button className="p-2 text-slate-400 hover:text-rose-400 transition-colors" title="Revoke Access">
                          <Shield size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {admins.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-500">
                        No administrators found
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
  "{/* TAB 2: DEPARTMENTS */}",
  adminsBlock + "\n      {/* TAB 2: DEPARTMENTS */}"
);

fs.writeFileSync('src/components/AdminPortal.tsx', content);
