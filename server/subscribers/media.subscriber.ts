import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { db, admin } from "../config/firebase.ts";
import { logger } from "../utils/logger.ts";

export function setupMediaSubscriber() {
  eventBus.on(DomainEvents.AD_DELETED, async (eventPayload) => {
    // Note: Outbox sends the whole msg.payload to eventBus.emit(msg.type, msg.payload)
    // where msg.payload = { category, id, uid }
    const { id } = eventPayload;
    if (!id) return;

    try {
      console.info(`[MediaSubscriber] AD_DELETED caught for ${id}. Checking for orphan media...`);
      // 1. Fetch soft-deleted document
      const adSnap = await db.collection("listings").doc(id).get();
      if (!adSnap.exists) return;
      
      const data = adSnap.data();
      const images: string[] = data?.images || [];
      
      if (images.length === 0) return;

      // 2. Delete media from GC Storage
      const bucket = admin.storage().bucket();
      const deletePromises = images.map(async (url) => {
        try {
          if(url.includes("firebasestorage.googleapis.com")) {
            const pathRegex = /\/o\/(.*?)\?/; 
            const match = url.match(pathRegex);
            if (match?.[1]) {
              const filePath = decodeURIComponent(match[1]);
              await bucket.file(filePath).delete();
              console.info(`[MediaSubscriber] Deleted orphan media: ${filePath}`);
            }
          }
        } catch(err) {
          const error = err as { code?: number; message?: string };
          if(error.code !== 404) {
             logger.warn(`[MediaSubscriber] Failed to delete image ${url}:`, error.message);
          }
        }
      });

      await Promise.allSettled(deletePromises);
      
    } catch (err) {
      console.error(`[MediaSubscriber] Media cleanup failed for AD_DELETED ${id}:`, err);
    }
  });
}
