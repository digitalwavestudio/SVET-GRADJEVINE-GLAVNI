import { db } from "../config/firebase.ts";
import { 
  constructionSiteSchema, 
  constructionWorkerSchema, 
  constructionResourceSchema, 
  constructionMetricSchema 
} from "@svet-gradjevine/shared";
import { z } from "zod";

export type ConstructionSite = z.infer<typeof constructionSiteSchema> & { id: string; authorId: string; createdAt: string; updatedAt?: string; status?: string };
export type ConstructionWorker = z.infer<typeof constructionWorkerSchema> & { id: string };
export type ConstructionResource = z.infer<typeof constructionResourceSchema> & { id: string };
const constructionSitePartialSchema = constructionSiteSchema.partial();

export class ConstructionService {
  static async createSite(uid: string, data: z.infer<typeof constructionSiteSchema>) {
    const validated = constructionSiteSchema.parse(data);
    const siteRef = db.collection("sites").doc();
    const siteData = {
      ...validated,
      authorId: uid,
      createdAt: new Date().toISOString(),
      status: "active"
    };
    await siteRef.set(siteData);
    return { id: siteRef.id, ...siteData };
  }

  static async getSites(uid: string, limitCount: number = 50) {
    const sitesSnap = await db
      .collection("sites")
      .where("authorId", "==", uid)
      .where("status", "!=", "deleted")
      .limit(limitCount)
      .get();

    return sitesSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as ConstructionSite[];
  }

  static async updateSite(uid: string, siteId: string, data: z.infer<typeof constructionSitePartialSchema>) {
    const validated = constructionSitePartialSchema.parse(data);
    const docRef = db.collection("sites").doc(siteId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists || docSnap.data()?.authorId !== uid) {
      throw new Error("Unauthorized or site not found");
    }

    const updateData = {
      ...validated,
      updatedAt: new Date().toISOString(),
    };
    await docRef.update(updateData);
    return { id: siteId, ...updateData };
  }

  static async deleteSite(uid: string, siteId: string) {
    const docRef = db.collection("sites").doc(siteId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists || docSnap.data()?.authorId !== uid) {
      throw new Error("Unauthorized or site not found");
    }

    await docRef.update({
      status: "deleted",
      updatedAt: new Date().toISOString(),
    });
    return { id: siteId, success: true };
  }

  static async addWorker(uid: string, siteId: string, data: z.infer<typeof constructionWorkerSchema>) {
    await this.verifySiteOwnership(uid, siteId);
    const validated = constructionWorkerSchema.parse(data);
    const workerRef = db.collection("sites").doc(siteId).collection("workers").doc();
    await workerRef.set(validated);
    return { id: workerRef.id, ...validated };
  }

  static async updateWorker(uid: string, siteId: string, workerId: string, data: z.infer<typeof constructionWorkerSchema>) {
    await this.verifySiteOwnership(uid, siteId);
    const validated = constructionWorkerSchema.parse(data);
    await db.collection("sites").doc(siteId).collection("workers").doc(workerId).update(validated);
    return { id: workerId, success: true };
  }

  static async deleteWorker(uid: string, siteId: string, workerId: string) {
    await this.verifySiteOwnership(uid, siteId);
    await db.collection("sites").doc(siteId).collection("workers").doc(workerId).delete();
    return { success: true };
  }

  static async addResource(uid: string, siteId: string, data: z.infer<typeof constructionResourceSchema>) {
    await this.verifySiteOwnership(uid, siteId);
    const validated = constructionResourceSchema.parse(data);
    const resRef = db.collection("sites").doc(siteId).collection("resources").doc();
    await resRef.set(validated);
    return { id: resRef.id, ...validated };
  }

  static async updateResource(uid: string, siteId: string, resourceId: string, data: z.infer<typeof constructionResourceSchema>) {
    await this.verifySiteOwnership(uid, siteId);
    const validated = constructionResourceSchema.parse(data);
    await db.collection("sites").doc(siteId).collection("resources").doc(resourceId).update(validated);
    return { id: resourceId, success: true };
  }

  static async deleteResource(uid: string, siteId: string, resourceId: string) {
    await this.verifySiteOwnership(uid, siteId);
    await db.collection("sites").doc(siteId).collection("resources").doc(resourceId).update({ status: "deleted" });
    return { success: true };
  }

  static async updateMetrics(uid: string, data: z.infer<typeof constructionMetricSchema>) {
    const validated = constructionMetricSchema.parse(data);
    const metricsId = `today-${uid}`;
    const metricsData = {
      ...validated,
      authorId: uid,
      lastUpdate: new Date().toISOString(),
    };
    await db.collection("metrics").doc(metricsId).set(metricsData, { merge: true });
    return { success: true };
  }

  private static async verifySiteOwnership(uid: string, siteId: string) {
    const docSnap = await db.collection("sites").doc(siteId).get();
    if (!docSnap.exists || docSnap.data()?.authorId !== uid) {
      throw new Error("Unauthorized or site not found");
    }
  }
}
