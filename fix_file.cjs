const fs = require('fs');
let code = fs.readFileSync('src/components/CertificateGeneratorModal.tsx', 'utf8');
code = code.replace(/\\\`/g, '`').replace(/\\\$/g, '$').replace(/\\\\s/g, '\\s');
fs.writeFileSync('src/components/CertificateGeneratorModal.tsx', code);
