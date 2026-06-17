import { db, admin } from "../config/firebase.ts";
import { NotificationService, NotificationType } from "./notification.service.ts";
import { User } from "@svet-gradjevine/shared";
import { logger } from "../utils/logger.ts";

export class AdminSystemService {
  static async sendBroadcast(audience: string, title: string, body: string) {
    let userQuery: admin.firestore.Query = db.collection("users");
    
    if (audience === "verified_companies") {
      userQuery = userQuery.where("businessProfile.isVerified", "==", true);
    } else if (audience === "premium") {
      userQuery = userQuery.where("businessProfile.isPremium", "==", true);
    }

    const snap = await userQuery.limit(250).get();
    let users = snap.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => ({ id: doc.id, ...doc.data() } as User));

    if (audience === "all_active") {
      users = users.filter((u: User) => (u as { status?: string }).status !== "suspended");
    }

    const broadcastRef = db.collection("broadcasts").doc();
    const broadcastId = broadcastRef.id;

    await broadcastRef.set({
      id: broadcastId,
      title: title.trim(),
      body: body.trim(),
      audience,
      reach: users.length,
      opens: "25%",
      status: "delivered",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    const notifications = users.map((user: User) =>
      NotificationService.send({
        userId: user.id,
        type: NotificationType.SYSTEM,
        title: title.trim(),
        message: body.trim(),
        sendEmail: false,
      }).catch((err: unknown) => {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`Failed to send broadcast to user ${user.id}:`, errorMsg);
      })
    );

    await Promise.all(notifications);

    return {
      success: true,
      message: `Broadcast uspešno poslat do ${users.length} korisnika.`,
      broadcastId,
      reach: users.length,
    };
  }

  static async getBroadcasts(limitNum: number) {
    const snap = await db.collection("broadcasts").orderBy("createdAt", "desc").limit(limitNum).get();
    return snap.docs.map((doc: admin.firestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        body: data.body,
        audience: data.audience,
        reach: data.reach || 0,
        opens: data.opens || "0%",
        status: data.status || "delivered",
        date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString('sr-RS') : "Nepoznato",
      };
    });
  }

  static async clearDashboardCache(uid: string) {
    const { DashboardService } = await import("./dashboard.service.ts");
    const { CacheService } = await import("./cache.service.ts");

    await DashboardService.clearEmployerStatsCache(uid);
    await CacheService.delete(`bff_cache:${uid}`).catch((e: any) => logger.warn("[AdminSystemService] Cache delete bff cache:", e));
    await CacheService.invalidateByPrefix(`publicProfileAds_${uid}`).catch((e: any) => logger.warn("[AdminSystemService] Cache invalidate public profile ads:", e));
    await CacheService.invalidateByPrefix(`metrics:user_analytics:${uid}`).catch((e: any) => logger.warn("[AdminSystemService] Cache invalidate user analytics:", e));
    
    return { success: true };
  }
}
