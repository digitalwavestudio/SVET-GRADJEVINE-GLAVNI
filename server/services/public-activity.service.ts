import { db, admin } from "../config/firebase.ts";
import { logger } from "../utils/logger.ts";

type ActivityType = "new_ad" | "premium_upgrade" | "company_verified" | "logo_changed" | "cover_changed";

interface PublicActivity {
  actorId: string;
  actorName: string;
  actorLogo: string | null;
  type: ActivityType;
  targetId: string;
  targetType: string;
  title: string;
  createdAt: FirebaseFirestore.FieldValue;
}

export class PublicActivityService {
  static async write(activity: PublicActivity) {
    const docRef = db.collection("public_activities").doc();
    await docRef.set(activity);
    logger.info(`[PublicActivity] ${activity.type}: ${activity.actorName} -> ${activity.title}`);
    return docRef.id;
  }

  static async getGlobal(limit = 20) {
    const snap = await db.collection("public_activities")
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async getPersonalized(actorIds: string[], limit = 20) {
    if (!actorIds.length) return [];
    const snap = await db.collection("public_activities")
      .where("actorId", "in", actorIds)
      .orderBy("createdAt", "desc")
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async writeForAdCreated(payload: { id: string; category: string; uid?: string; userId?: string; title?: string }) {
    const actorId = payload.uid || payload.userId;
    if (!actorId) return;
    const userDoc = await db.collection("users").doc(actorId).get();
    const userData = userDoc.data();
    const actorName = userData?.businessProfile?.companyName || userData?.displayName || "Nepoznato";
    const actorLogo = userData?.businessProfile?.logo || null;

    await PublicActivityService.write({
      actorId,
      actorName,
      actorLogo,
      type: "new_ad",
      targetId: payload.id,
      targetType: payload.category,
      title: payload.title || "Novi oglas",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }

  static async writeForAdUpgraded(payload: { id: string; category: string; uid?: string; title?: string }) {
    const actorId = payload.uid;
    if (!actorId) return;
    const userDoc = await db.collection("users").doc(actorId).get();
    const userData = userDoc.data();
    const actorName = userData?.businessProfile?.companyName || userData?.displayName || "Nepoznato";
    const actorLogo = userData?.businessProfile?.logo || null;

    await PublicActivityService.write({
      actorId,
      actorName,
      actorLogo,
      type: "premium_upgrade",
      targetId: payload.id,
      targetType: payload.category,
      title: payload.title || "Oglas unapređen",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}
