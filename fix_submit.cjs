const fs = require('fs');
let content = fs.readFileSync('src/services/supabaseService.ts', 'utf8');
content = content.replace(
  "const subId = `sub-${Date.now()}`;",
  "const subId = attemptId || `sub-${Date.now()}`;"
);
fs.writeFileSync('src/services/supabaseService.ts', content);
