const fs = require('fs');
let content = fs.readFileSync('src/components/TypingArena.tsx', 'utf8');

// Fix generateNewTestText
content = content.replace(
  "      if (initialTest.category === 'code') {\n        setWords(initialTest.content.match(/\\s*\\S+/g) || []);\n      } else {\n        setWords(initialTest.content.trim().split(/\\s+/));\n      }",
  "      setWords(initialTest.content.match(/\\s*\\S+/g) || []);"
);

// Fix Space/Enter logic
content = content.replace(
  "    if (e.key === ' ' || (activeMode === 'code' && e.key === 'Enter')) {",
  "    if (e.key === ' ' || e.key === 'Enter') {"
);

fs.writeFileSync('src/components/TypingArena.tsx', content);
