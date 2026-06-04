import { eventBus } from "../events/event-bus.ts";
import { DomainEvents } from "../events/event-bus.ts";
import { db } from "../config/firebase.ts";
import {
  JobType,
  JobPriority,
  QueueService,
} from "../services/queue.service.ts";
import { Logger } from "../utils/logger.ts";

/**
 * Image Subscriber listens to unified Ad events and handles scheduling of image optimization.
 */
export function initializeImageSubscribers() {
  const handleOptimization = async ({
    category,
    id,
  }: {
    category: string;
    id: string;
  }) => {
    try {
      const docRef = db.collection(category).doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) return;

      const data = docSnap.data();
      if (!data?.images || data.images.length === 0) return;

      // Only optimize if they are not already optimized
      if (data.imagesOptimized) return;

      Logger.withContext().info(
        `[ImageSubscriber] Scheduling optimization for ${category}/${id}`,
      );

      await QueueService.addJob(
        JobType.IMAGE_OPTIMIZE,
        {
          collection: category,
          docId: id,
          images: data.images,
        },
        {
          priority: JobPriority.MEDIUM,
          jobId: `image_optimize_${category}_${id}`,
        },
      );
    } catch (err) {
      const error = err as Error;
      Logger.withContext().error(
        `[ImageSubscriber] Error checking images for ${category}/${id}`,
        { error: error.message },
      );
    }
  };

  eventBus.on(DomainEvents.AD_CREATED, handleOptimization);
  eventBus.on(DomainEvents.AD_UPDATED, handleOptimization);
}
