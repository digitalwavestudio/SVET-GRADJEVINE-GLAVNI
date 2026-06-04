// @ts-nocheck
import { eventBus } from "../events/event-bus.ts";
import { MagazineAIService } from "../services/magazine-ai.service.ts";
import { db, admin } from "../config/firebase.ts";
import { syncArticleToIndex, deleteAdFromIndex } from "../services/algolia.service.ts";

export function setupMagazineSubscriber() {
  /**
   * Automatically generate AI SEO variants and index to Algolia when an article is created
   */
  eventBus.on("ARTICLE_CREATED", async (payload: { id: string; title: string; excerpt?: string; content?: string }) => {
    try {
      console.log(`[MagazineSubscriber] Triggering AI SEO and Algolia Sync for article: ${payload.id}`);
      
      // 1. AI SEO Generation
      const variants = await MagazineAIService.generateSEOVariants(payload);
      
      if (variants && variants.length > 0) {
        await db.collection("articles").doc(payload.id).set({
          seo: {
            aiVariants: variants,
            lastGenerated: admin.firestore.FieldValue.serverTimestamp()
          }
        }, { merge: true });
        
        console.log(`[MagazineSubscriber] Successfully added ${variants.length} AI SEO variants to ${payload.id}`);
      }

      // 2. Sync to Algolia magazine_index
      const doc = await db.collection("articles").doc(payload.id).get();
      if (doc.exists) {
        await syncArticleToIndex(payload.id, doc.data());
      }
    } catch (err) {
      console.error("[MagazineSubscriber] ARTICLE_CREATED handler failed", err);
    }
  });

  /**
   * Handle ARTICLE_UPDATED sync to Algolia
   */
  eventBus.on("ARTICLE_UPDATED", async (payload: { id: string }) => {
    try {
      console.log(`[MagazineSubscriber] Syncing updated article to Algolia: ${payload.id}`);
      const doc = await db.collection("articles").doc(payload.id).get();
      if (doc.exists) {
        await syncArticleToIndex(payload.id, doc.data());
      }
    } catch (err) {
      console.error("[MagazineSubscriber] ARTICLE_UPDATED handler failed", err);
    }
  });

  /**
   * Handle ARTICLE_DELETED sync to Algolia
   */
  eventBus.on("ARTICLE_DELETED", async (payload: { id: string }) => {
    try {
      console.log(`[MagazineSubscriber] Deleting article from Algolia: ${payload.id}`);
      await deleteAdFromIndex("magazine_index", payload.id);
    } catch (err) {
      console.error("[MagazineSubscriber] ARTICLE_DELETED handler failed", err);
    }
  });
}
