const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const regex = /(const|let)\s+(\{[^}]+\})\s*=\s*await\s+import\((['"].\/server\/[^'"]+['"])\);/g;
let imports = [];
code = code.replace(regex, (match, keyword, bindings, path) => {
  imports.push('import ' + bindings.replace(/\s+/g, ' ') + ' from ' + path + ';');
  return '';
});

const defaultRegex = /(const|let)\s+\{\s*default\s*:\s*([^}]+)\s*\}\s*=\s*await\s+import\((['"].\/server\/[^'"]+['"])\);/g;
code = code.replace(defaultRegex, (match, keyword, name, path) => {
  imports.push('import ' + name + ' from ' + path + ';');
  return '';
});

const fsRegex = /(const|let)\s+fs\s*=\s*await\s+import\((['"]fs['"])\);/g;
code = code.replace(fsRegex, (match, keyword, name, path) => {
  return '';
});

const finalCode = imports.join('\n') + '\n\n' + code;
fs.writeFileSync('server.ts', finalCode);
console.log('Rewrote server.ts with static imports');
