const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

// Remove import
content = content.replace(/import \{ DatabaseDiagnosticModal \} from '\.\/DatabaseDiagnosticModal';\n/, '');

// Remove state
content = content.replace(/  const \[showDbDiagModal, setShowDbDiagModal\] = useState\(false\);\n/, '');

// Remove instances of buttons triggering it. It's used in 4 places according to grep.
// Let's just blindly remove them or use regex.
// Actually, it's safer to just replace onClick={() => setShowDbDiagModal(true)} with nothing or remove the button.

content = content.replace(/<button\s+onClick=\{\(\) => setShowDbDiagModal\(true\)\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/<button\s+onClick=\{\(\) => \{\s*setShowDbDiagModal\(true\);\s*\}\}[^>]*>[\s\S]*?<\/button>/g, '');
content = content.replace(/\{?\/\* DATABASE DIAGNOSTIC MODAL \*\/\}?\s*<DatabaseDiagnosticModal[\s\S]*?\/>/, '');

fs.writeFileSync('src/components/AdminPortal.tsx', content);
