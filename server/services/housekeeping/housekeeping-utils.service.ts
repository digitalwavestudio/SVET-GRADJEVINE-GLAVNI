import { db, admin } from "../../config/firebase.ts";
import { Logger } from "../../utils/logger.ts";

export class HousekeepingUtils {
  private static logger = new Logger({ service: "HousekeepingUtils" });
  private static METADATA_DOC = "metadata/housekeeping_status";
  static COLD_STORAGE = "cold_storage";
  static ARCHIVE_AFTER_MONTHS = 6;

  private static accumulatedStatuses: Record<string, any> = {};
  private static isAccumulating = false;

  static startAccumulating() {
    this.accumulatedStatuses = {};
    this.isAccumulating = true;
    this.logger.info("Started accumulating housekeeping statuses in-memory.");
  }

  static stopAccumulating() {
    this.isAccumulating = false;
    const temp = { ...this.accumulatedStatuses };
    this.accumulatedStatuses = {};
    this.logger.info("Stopped status accumulation.");
    return temp;
  }

  static async flushAccumulated(fullCycleResult: any, isError: boolean = false) {
    const accumulated = this.stopAccumulating();
    try {
      const payload: Record<string, any> = {
        full_cycle: {
          lastRun: admin.firestore.FieldValue.serverTimestamp(),
          status: isError ? "error" : "success",
          result: {
            ...fullCycleResult,
            tasks: accumulated
          }
        }
      };
      await db.doc(this.METADATA_DOC).set(payload, { merge: true });
      this.logger.info("Successfully flushed consolidated housekeeping statuses to Firestore in a single write.");
    } catch (e) {
      this.logger.error("Failed to flush consolidated housekeeping statuses to Firestore", e);
    }
  }

  static async updateStatus(
    taskName: string,
    result: any,
    isError: boolean = false,
  ) {
    this.accumulatedStatuses[taskName] = {
      lastRun: new Date().toISOString(),
      status: isError ? "error" : "success",
      result: result,
    };
    this.logger.info(`Accumulated task status in-memory: ${taskName}`);
  }
}
