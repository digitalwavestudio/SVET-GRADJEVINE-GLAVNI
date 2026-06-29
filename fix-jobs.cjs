const fs = require('fs');
let c = fs.readFileSync('server/routes/jobs.routes.ts', 'utf8');

c = c.replace('import { env }', 'console.log("jobs: env");\nimport { env }');
c = c.replace('import express', 'console.log("jobs: express");\nimport express');
c = c.replace('import { adCreationLimiter }', 'console.log("jobs: rate-limit");\nimport { adCreationLimiter }');
c = c.replace('import {\n  getPublicJobs,', 'console.log("jobs: controller");\nimport {\n  getPublicJobs,');
c = c.replace('import { validateRequest }', 'console.log("jobs: validate");\nimport { validateRequest }');
c = c.replace('import { authMiddleware }', 'console.log("jobs: auth");\nimport { authMiddleware }');
c = c.replace('import { validateAdOwnership', 'console.log("jobs: ownership");\nimport { validateAdOwnership');
c = c.replace('import {\n  jobSearchSchema,', 'console.log("jobs: shared");\nimport {\n  jobSearchSchema,');

fs.writeFileSync('server/routes/jobs.routes.ts', c);
console.log("Injected logs into jobs.routes.ts");