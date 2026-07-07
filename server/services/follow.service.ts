import { db, admin } from "../config/firebase.ts";
import { logger } from "../utils/logger.ts";

export class FollowService {
  static async follow(followerId: string, targetId: string) {
    if (followerId === targetId) {
      throw new Error("Ne možete zapratiti sami sebe");
    }

    const batch = db.batch();

    const followerRef = db.collection("users").doc(followerId).collection("following").doc(targetId);
    const targetRef = db.collection("users").doc(targetId).collection("followers").doc(followerId);

    batch.set(followerRef, {
      targetId,
      followedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    batch.set(targetRef, {
      followerId,
      followedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    logger.info(`[Follow] ${followerId} -> ${targetId}`);
    return { success: true };
  }

  static async unfollow(followerId: string, targetId: string) {
    const batch = db.batch();

    const followerRef = db.collection("users").doc(followerId).collection("following").doc(targetId);
    const targetRef = db.collection("users").doc(targetId).collection("followers").doc(followerId);

    batch.delete(followerRef);
    batch.delete(targetRef);

    await batch.commit();

    logger.info(`[Follow] ${followerId} -X ${targetId}`);
    return { success: true };
  }

  static async isFollowing(followerId: string, targetId: string) {
    const doc = await db.collection("users").doc(followerId).collection("following").doc(targetId).get();
    return doc.exists;
  }

  static async getFollowers(targetId: string, limit = 50) {
    const snap = await db.collection("users").doc(targetId).collection("followers").orderBy("followedAt", "desc").limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async getFollowing(userId: string, limit = 50) {
    const snap = await db.collection("users").doc(userId).collection("following").orderBy("followedAt", "desc").limit(limit).get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }

  static async getFollowerCount(targetId: string) {
    const snap = await db.collection("users").doc(targetId).collection("followers").count().get();
    return snap.data().count;
  }

  static async getFollowingIds(userId: string): Promise<string[]> {
    const snap = await db.collection("users").doc(userId).collection("following").select("targetId").get();
    return snap.docs.map(d => d.data().targetId);
  }
}
