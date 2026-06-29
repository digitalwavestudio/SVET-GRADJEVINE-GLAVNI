const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

const importRegex = /(?:const|let)\s+\{?([^}=]+)\}?\s*=\s*await\s+import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;/g;
const imports = [];
let match;
while ((match = importRegex.exec(code)) !== null) {
    let vars = match[1].trim();
    const modulePath = match[2];
    
    // Handle specific cases like "default: feedRouter"
    if (vars.includes('default:')) {
        let v = vars.replace(/default:\s*/g, '').trim();
        imports.push(`import ${v} from "${modulePath}";`);
    } else if (vars === 'firebaseModule') {
        imports.push(`import * as firebaseModule from "${modulePath}";`);
    } else {
        // Assume named import if it was a destructuring, else we'll just try named import
        if (match[0].includes('{')) {
            imports.push(`import { ${vars} } from "${modulePath}";`);
        } else {
            imports.push(`import ${vars} from "${modulePath}";`);
        }
    }
}

code = code.replace(importRegex, '');

const dedupedImports = [...new Set(imports)];
const finalCode = dedupedImports.join('\n') + '\n' + code;

// Clean up any remaining await imports like `await import("@svet-gradjevine/shared")` without assignment
code = finalCode.replace(/await\s+import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*;/g, '');

fs.writeFileSync('server.ts', code);
