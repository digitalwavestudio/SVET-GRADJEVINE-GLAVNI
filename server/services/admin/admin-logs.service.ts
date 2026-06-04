import { db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";

export class AdminLogsService {
  static async getAuditLogs(limitCount = 15, lastDocId?: string) {
    const limitNum = 15; // fiksno 15 stavki po stranici
    let q: FirebaseFirestore.Query = db
      .collection("audit_logs")
      .orderBy("timestamp", "desc")
      .limit(limitNum);
    if (lastDocId) {
      const lastSn = await db.collection("audit_logs").doc(lastDocId).get();
      if (lastSn.exists) q = q.startAfter(lastSn);
    }
    const snap = await q.get();
    const result = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate(),
    }));

    const lastVisibleId = result.length === limitNum ? result[result.length - 1].id : null;
    return {
      items: result,
      lastVisibleId,
      hasMore: result.length === limitNum
    };
  }

  static async getSupportTickets(searchQ?: string) {
    const cacheKey = `admin_support_tickets_${searchQ || "none"}`;
    const cached = await CacheService.get<Record<string, unknown>[]>(cacheKey);
    if (cached) return cached;

    let q: FirebaseFirestore.Query = db.collection("supportTickets");

    const limitNum = 15; // fiksno 15 stavki po stranici
    if (searchQ) {
      const qStr = searchQ.trim().toLowerCase();
      q = q.where("email", "==", qStr).limit(limitNum);
    } else {
      q = q.orderBy("createdAt", "desc").limit(limitNum);
    }

    const snap = await q.get();
    const result = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    await CacheService.set(cacheKey, result, 5 * 60000); // 5 min cache
    return result;
  }

  static async getTicketStats() {
    return CacheService.getOrSet<Record<string, number>>(
      "admin:ticket_stats",
      async () => {
        const snap = await db.collection("supportTickets").select("status").get();
        let total = 0;
        let open = 0;
        let closed = 0;
        snap.forEach((doc) => {
          total++;
          const status = doc.data().status;
          if (status === "closed") {
            closed++;
          } else {
            open++;
          }
        });
        return { total, open, closed };
      },
      5 * 60 * 1000 // 5 minuta TTL
    );
  }

  static async getAbuseReports(limitCount = 20, lastDocId?: string) {
    const cacheKey = `admin_abuse_reports_${limitCount}_${lastDocId || "initial"}`;
    const cached = await CacheService.get<{ items: Record<string, unknown>[]; lastVisibleId: string | null; hasMore: boolean }>(cacheKey);
    if (cached) return cached;

    let q: FirebaseFirestore.Query = db
      .collection("reports")
      .orderBy("createdAt", "desc")
      .limit(limitCount);
    if (lastDocId) {
      const lastSn = await db.collection("reports").doc(lastDocId).get();
      if (lastSn.exists) q = q.startAfter(lastSn);
    }
    const snap = await q.get();
    const result = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const lastVisibleId = result.length === limitCount ? result[result.length - 1].id : null;
    const payload = {
      items: result,
      lastVisibleId,
      hasMore: result.length === limitCount
    };

    await CacheService.set(cacheKey, payload, 10 * 60000); // 10 min cache
    return payload;
  }
}
