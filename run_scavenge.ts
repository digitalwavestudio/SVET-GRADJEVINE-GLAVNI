// run_scavenge.ts
import { OutboxWorker } from "./server/services/outbox.worker.ts";

(async () => {
  console.log("Starting manual outbox scavenge...");
  try {
    await OutboxWorker.scavengePending();
    console.log("Scavenge completed.");
  } catch (e) {
    console.error("Scavenge error:", e);
  }
})();
