const fs = require('fs');
let c = fs.readFileSync('server/routes/api.routes.ts', 'utf8');

const routers = [
  "admin.routes.ts",
  "auth.routes.ts",
  "users.routes.ts",
  "jobs.routes.ts",
  "metrics.routes.ts",
  "masters.routes.ts",
  "dashboard.routes.ts",
  "bff.routes.ts",
  "ads.routes.ts",
  "messages.routes.ts",
  "calendar.routes.ts",
  "construction.routes.ts",
  "partners.routes.ts",
  "checkout.routes.ts",
  "wallet.routes.ts",
  "support.routes.ts",
  "notifications.routes.ts",
  "applications.routes.ts",
  "reports.routes.ts",
  "verification.routes.ts",
  "favorites.routes.ts",
  "analytics.routes.ts",
  "system.routes.ts",
  "media.routes.ts"
];

for (const router of routers) {
  const routerNameMatch = c.match(new RegExp(`import\\s+(?:\\{\\s*(\\w+)\\s*\\}|(\\w+))\\s+from\\s+['"]./${router}['"]`));
  if (routerNameMatch) {
    c = c.replace(routerNameMatch[0], `console.log("loading ${router}");\n${routerNameMatch[0]}\nconsole.log("loaded ${router}");`);
  }
}

fs.writeFileSync('server/routes/api.routes.ts', c);
console.log("Injected logs into api.routes.ts");