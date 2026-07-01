import { admin as firebaseAdmin, db } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";
import { AppError, BadRequestError } from "../utils/appError.ts";
import { AdminStatsService } from "./admin/admin-stats.service.ts";
import { ProductAnalyticsService } from "./product-analytics.service.ts";
import { Listing } from "../types/ads.ts";

export class UnifiedFavoritesService {
  private static logger = new Logger({ service: "UnifiedFavoritesService" });

  /**
   * Toggles favorite status for an ad.
   * Path: favorites/{userId_adId}
   */
  static async toggleFavorite(userId: string, adId: string, adType: string) {
    const favoriteId = `${userId}_${adId}`;
    const favoriteRef = db.collection("favorites").doc(favoriteId);
    const adRef = db.collection("listings").doc(adId);

    const isSaved = await db.runTransaction(async (transaction) => {
      const favSnap = await transaction.get(favoriteRef);
      const adSnap = await transaction.get(adRef);

      if (!adSnap.exists) {
        throw new BadRequestError("Oglas ne postoji više.");
      }

      const isRemoving = favSnap.exists;

      if (isRemoving) {
        transaction.delete(favoriteRef);
      } else {
        transaction.set(favoriteRef, {
          userId,
          adId,
          adType,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
      }

      return !isRemoving;
    });

    // Delegate aggregation to MetricsService (Redis Throttle & Delay)
    // Fire and forget to avoid slowing down request
    ProductAnalyticsService.recordFavoriteToggle(adId, userId, isSaved ? 1 : -1).catch(
      (err) => {
        UnifiedFavoritesService.logger.error(
          "Failed to record favorite metric",
          err,
        );
      },
    );

    return { isSaved };
  }

  /**
   * Gets list of favorites for a user with pagination
   */
  static async getUserFavorites(
    userId: string,
    limit: number = 20,
    lastId?: string,
  ): Promise<Listing[]> {
    let query = db
      .collection("favorites")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit);

    if (lastId) {
      const lastDoc = await db.collection("favorites").doc(lastId).get();
      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snap = await query.get();
    const favoriteEntries = snap.docs.map((doc) => doc.data() as { adId: string });
    const adIds = favoriteEntries.map((f) => f.adId);

    if (adIds.length === 0) return [];

    // Use listingsLoader to leverage tiered caching and eliminate N+1
    const { listingsLoader } = await import("../utils/dataloader.ts");
    const results = await listingsLoader.loadMany(adIds);

    return results
      .filter((res): res is import("../utils/dataloader.ts").ListingDTO => 
        res !== null && !(res instanceof Error)
      ) as unknown as Listing[];
  }

  /**
   * Check if specific ad is favorited by user
   */
  static async isFavorited(userId: string, adId: string) {
    const favoriteId = `${userId}_${adId}`;
    const snap = await db.collection("favorites").doc(favoriteId).get();
    return snap.exists;
  }
}
