const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf8');
c = c.replace(
  "console.log('loading helmet'); const helmet = (await import('helmet')).default; console.log('loaded helmet');",
  "console.log('loading helmet'); const helmet = require('helmet'); console.log('loaded helmet');"
);
c = c.replace(
  "console.log('loading compression'); const compression = (await import('compression')).default; console.log('loaded compression');",
  "console.log('loading compression'); const compression = require('compression'); console.log('loaded compression');"
);
c = c.replace(
  "const cors = (await import('cors')).default;",
  "const cors = require('cors');"
);
fs.writeFileSync('server.ts', c);
console.log("Replaced dynamic imports with require for CJS modules.");