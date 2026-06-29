const fs = require('fs');
let c = fs.readFileSync('server.ts', 'utf8');
c = c.replace(
  '    // Background Init (Non-blocking)\r\n    (async () => {\r\n      try {',
  '    // Background Init (Non-blocking)\r\n    const runBackgroundInit = async () => {\r\n      try {'
);
c = c.replace(
  '    // Background Init (Non-blocking)\n    (async () => {\n      try {',
  '    // Background Init (Non-blocking)\n    const runBackgroundInit = async () => {\n      try {'
);

c = c.replace(
  '      } catch (e) {\r\n        logger.error("Delayed background init failed", e);\r\n      }\r\n    })();\r\n\r\n    // 2. Middleware & Routing foundation',
  '      } catch (e) {\r\n        logger.error("Delayed background init failed", e);\r\n      }\r\n    };\r\n\r\n    // 2. Middleware & Routing foundation'
);
c = c.replace(
  '      } catch (e) {\n        logger.error("Delayed background init failed", e);\n      }\n    })();\n\n    // 2. Middleware & Routing foundation',
  '      } catch (e) {\n        logger.error("Delayed background init failed", e);\n      }\n    };\n\n    // 2. Middleware & Routing foundation'
);

c = c.replace(
  '    isReady = true;\r\n    if (env.NODE_ENV !== "production") console.log(`[Server] Phase 4: Application fully initialized and traffic unlocked.`);\r\n\r\n    // Shutdown Handler',
  '    isReady = true;\r\n    if (env.NODE_ENV !== "production") console.log(`[Server] Phase 4: Application fully initialized and traffic unlocked.`);\r\n    runBackgroundInit();\r\n\r\n    // Shutdown Handler'
);
c = c.replace(
  '    isReady = true;\n    if (env.NODE_ENV !== "production") console.log(`[Server] Phase 4: Application fully initialized and traffic unlocked.`);\n\n    // Shutdown Handler',
  '    isReady = true;\n    if (env.NODE_ENV !== "production") console.log(`[Server] Phase 4: Application fully initialized and traffic unlocked.`);\n    runBackgroundInit();\n\n    // Shutdown Handler'
);

fs.writeFileSync('server.ts', c);
console.log("Replaced successfully!");