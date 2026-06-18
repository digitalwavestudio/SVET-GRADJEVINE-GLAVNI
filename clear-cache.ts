import { DatabaseManager } from "./server/utils/db-manager.ts";
import { logger } from "./server/utils/logger.ts";

async function run() {
  const client = DatabaseManager.getRegionalRedisConnection();
  if (client) {
    console.log("Redis connected. Evicting search and public jobs cache keys...");
    const keys = await client.keys("*");
    const searchKeys = keys.filter(k => 
      k.includes("search") || 
      k.includes("jobs") || 
      k.includes("listings") || 
      k.includes("public_jobs")
    );
    if (searchKeys.length > 0) {
      console.log(`Deleting ${searchKeys.length} keys...`);
      await client.del(...searchKeys);
      console.log("Keys deleted successfully.");
    } else {
      console.log("No relevant cache keys found to evict.");
    }
  } else {
    console.log("No active Redis connection found.");
  }
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
