import { env } from "./server/config/env.ts";
import { ensureInitialized, db } from "./server/config/firebase.ts";
import { bffService } from "./server/services/bff.service.ts";

async function test() {
  ensureInitialized();
  try {
    const data = await bffService.getHomepageData("web");
    console.log("Returned latestJobs count:", data.latestJobs?.length);
  } catch (e) {
    console.error("Error in bffService:", e);
  }
  process.exit(0);
}

test();
