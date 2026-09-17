const fs = require('fs');
let content = fs.readFileSync('src/components/AdminPortal.tsx', 'utf8');

if (!content.includes("    admins,")) {
  content = content.replace(
    "    students,",
    "    students,\n    admins,"
  );
  fs.writeFileSync('src/components/AdminPortal.tsx', content);
}
