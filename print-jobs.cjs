const fs = require('fs');
let c = fs.readFileSync('server/routes/jobs.routes.ts', 'utf8');
const lines = c.split('\n');
console.log("jobs.routes.ts imports:");
for (const line of lines) {
  if (line.trim().startsWith('import')) {
     console.log(line);
  }
}