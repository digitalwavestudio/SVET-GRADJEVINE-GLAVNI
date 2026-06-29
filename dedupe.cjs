const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Fix the default: syntax
code = code.replace(/import\s+\{\s*default\s*:\s*([^}]+)\s*\}\s*from\s+([^;]+);/g, 'import $1 from $2;');

// Deduplicate imports
const lines = code.split('\n');
const seen = new Set();
const newLines = [];
for (const line of lines) {
  if (line.startsWith('import {') || line.startsWith('import ')) {
    if (seen.has(line)) continue;
    seen.add(line);
  }
  newLines.push(line);
}
fs.writeFileSync('server.ts', newLines.join('\n'));
