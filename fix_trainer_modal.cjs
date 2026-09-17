const fs = require('fs');
let content = fs.readFileSync('src/components/TrainerDashboard.tsx', 'utf8');

if (!content.includes('import { CertificateGeneratorModal }')) {
  content = content.replace(
    "import { ReportModal } from './ReportModal';",
    "import { ReportModal } from './ReportModal';\nimport { CertificateGeneratorModal } from './CertificateGeneratorModal';"
  );
}

if (!content.includes('const [isCertModalOpen, setIsCertModalOpen] = useState(false);')) {
  content = content.replace(
    "const [activeTab, setActiveTab] = useState<'monitoring' | 'tests' | 'reports' | 'classes' | 'certificates'>('monitoring');",
    "const [activeTab, setActiveTab] = useState<'monitoring' | 'tests' | 'reports' | 'classes' | 'certificates'>('monitoring');\n  const [isCertModalOpen, setIsCertModalOpen] = useState(false);"
  );
}

// Add Generate button in Certificates tab
content = content.replace(
  "        <div className=\"space-y-6\">\n          <div className=\"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4\">",
  "        <div className=\"space-y-6\">\n          <div className=\"flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4\">\n            <button onClick={() => setIsCertModalOpen(true)} className=\"px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-2 transition-colors shrink-0\">\n              <Plus size={18} /> Custom Certificate\n            </button>"
);

// Add modal render
content = content.replace(
  "    </div>\n  );\n};",
  `      {isCertModalOpen && (
        <CertificateGeneratorModal 
          onClose={() => setIsCertModalOpen(false)} 
          students={students} 
          onGenerate={(cert) => {
            // Ideally we'd have an addCertificate in AppContext, but we can just mutate state for the prototype or push it
            console.log("Generated cert:", cert);
          }} 
        />
      )}
    </div>
  );
};`
);

fs.writeFileSync('src/components/TrainerDashboard.tsx', content);
