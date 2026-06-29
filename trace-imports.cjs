const fs = require('fs');
const path = require('path');

// A simple recursive import tracer
const visited = new Set();
const hangingModules = new Set();

function findImports(filePath, basePath = 'server/') {
  if (visited.has(filePath)) return;
  visited.add(filePath);
  
  if (!fs.existsSync(filePath)) return;
  const content = fs.readFileSync(filePath, 'utf8');
  
  // check for top-level await (crude check: "await " not inside a block, but realistically we just look for any await not in a function)
  // Let's just find "await " and see if it looks top-level
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^(?:export\s+)?(?:const|let|var)\s+.*=\s+await\s+/) || lines[i].match(/^await\s+/)) {
      console.log(`Potential top-level await in ${filePath}: ${lines[i].trim()}`);
    }
  }

  const importRegex = /import\s+.*(?:from\s+)?['"](.*?)['"]/g;
  let match;
  while ((match = importRegex.exec(content)) !== null) {
    let dep = match[1];
    if (dep.startsWith('.')) {
      let depPath = path.resolve(path.dirname(filePath), dep);
      if (fs.existsSync(depPath) && fs.statSync(depPath).isDirectory()) {
          depPath = path.join(depPath, 'index.ts');
      } else if (!depPath.endsWith('.ts') && !depPath.endsWith('.js')) {
          if (fs.existsSync(depPath + '.ts')) depPath += '.ts';
      }
      findImports(depPath, basePath);
    }
  }
}

findImports(path.resolve('server/routes/jobs.routes.ts'));
console.log('Traced ' + visited.size + ' files in jobs.routes.ts graph.');