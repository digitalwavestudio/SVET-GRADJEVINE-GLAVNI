// run_scavenge2.ts
import { OutboxWorker } from "./server/services/outbox.worker.ts";

(async () => {
  try {
    await OutboxWorker.scavengePending();
    console.log("✅ Scavenge complete");
  } catch (err) {
    console.error("❌ Scavenge error", err);
  }
})();
