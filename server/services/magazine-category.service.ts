import { db, admin } from "../config/firebase.ts";
import { CacheService } from "./cache.service.ts";
import { MagazineCategory } from "../../src/types/magazine.ts";

export class MagazineCategoryService {
  private static readonly COLLECTION = "magazine_categories";

  static async getCategories(): Promise<MagazineCategory[]> {
    const cacheKey = "magazine_categories_all";

    return await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        let snapshot = await db
          .collection(this.COLLECTION)
          .where("isActive", "==", true)
          .orderBy("order", "asc")
          .get();

        if (snapshot.empty) {
          const checkAll = await db.collection(this.COLLECTION).limit(1).get();
          if (checkAll.empty) {
            await this.seedDefaultCategories();
            snapshot = await db
              .collection(this.COLLECTION)
              .where("isActive", "==", true)
              .orderBy("order", "asc")
              .get();
          }
        }

        return snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as MagazineCategory,
        );
      },
      24 * 60 * 60 * 1000, // Very long TTL (24h)
      [], // Fallback value
    );
  }

  private static async seedDefaultCategories() {
    const categories = [
      { name: "Vesti", slug: "vesti", order: 1, isActive: true },
      { name: "Arhitektura", slug: "arhitektura", order: 2, isActive: true },
      { name: "Građevina", slug: "gradjevina", order: 3, isActive: true },
      { name: "Cenovnici", slug: "cenovnici", order: 4, isActive: true },
      { name: "Saveti", slug: "saveti", order: 5, isActive: true },
    ];

    const batch = db.batch();
    for (const cat of categories) {
      const id = db.collection(this.COLLECTION).doc().id;
      const ref = db.collection(this.COLLECTION).doc(id);
      batch.set(ref, {
        id,
        ...cat,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
    await batch.commit();
    console.log("[MagazineCategoryService] Seeded default categories.");
  }

  static async getAllCategoriesAdmin(): Promise<MagazineCategory[]> {
    const snapshot = await db
      .collection(this.COLLECTION)
      .orderBy("order", "asc")
      .get();

    return snapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() }) as MagazineCategory,
    );
  }

  static async getCategoryBySlug(
    slug: string,
  ): Promise<MagazineCategory | null> {
    const categories = await this.getCategories();
    return categories.find((c) => c.slug === slug) || null;
  }

  static async upsertCategory(id: string, data: Partial<MagazineCategory>) {
    await db
      .collection(this.COLLECTION)
      .doc(id)
      .set(
        {
          ...data,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );

    await CacheService.delete("magazine_categories_all");
  }

  static async deleteCategory(id: string) {
    await db.collection(this.COLLECTION).doc(id).delete();
    await CacheService.delete("magazine_categories_all");
  }
}
