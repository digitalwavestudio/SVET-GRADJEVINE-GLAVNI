import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { db } from "../config/firebase.ts";
import { emailService } from "../services/emailService.ts";

function formatRegionId(regionId: string): string {
  const mapping: Record<string, string> = {
    "beograd": "Beograd",
    "novi-sad": "Novi Sad",
    "nis": "Niš",
    "kragujevac": "Kragujevac",
    "subotica": "Subotica",
    "pancevo": "Pančevo",
    "cacak": "Čačak",
    "kraljevo": "Kraljevo",
    "novi-pazar": "Novi Pazar",
    "leskovac": "Leskovac",
    "krusevac": "Kruševac",
    "smederevo": "Smederevo",
    "vranje": "Vranje",
    "valjevo": "Valjevo",
    "sabac": "Šabac"
  };
  return mapping[regionId] || regionId.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export function setupRfqSubscriber() {
  eventBus.on(
    DomainEvents.RFQ_CREATED,
    async (payload) => {
      try {
        console.info(`[RfqSubscriber] RFQ_CREATED caught for ${payload.rfqId}`);

        const regionName = formatRegionId(payload.regionId);

        // 1. Pretraga svih aktivnih oglasa u marketplace kategoriji na datoj lokaciji
        // U bazi su skladišteni u 'listings' kolekciji
        const listingsSnap = await db.collection("listings")
          .where("type", "==", "marketplace")
          .where("locationSlug", "==", payload.regionId)
          .where("status", "==", "active")
          .limit(200)
          .get();

        if (listingsSnap.empty) {
          console.info(`[RfqSubscriber] No active marketplace sellers found for region ${payload.regionId}`);
          return;
        }

        // 2. Izdvajanje jedinstvenih authorId-eva dobavljača
        const authorIds = Array.from(
          new Set(
            listingsSnap.docs
              .map(doc => doc.data().authorId)
              .filter(Boolean)
          )
        );

        console.info(`[RfqSubscriber] Found ${authorIds.length} unique suppliers for RFQ ${payload.rfqId} in region ${payload.regionId}`);

        // 3. Slanje email notifikacija dobavljačima (N+1 DataLoader optimizacija)
        const CHUNK_SIZE = 100;
        const suppliersData: any[] = [];
        
        for (let i = 0; i < authorIds.length; i += CHUNK_SIZE) {
          const chunkIds = authorIds.slice(i, i + CHUNK_SIZE);
          const refs = chunkIds.map(id => db.collection("users").doc(id));
          
          try {
            const snapshots = await db.getAll(...refs);
            for (const snap of snapshots) {
              if (snap.exists) {
                suppliersData.push({ id: snap.id, ...snap.data() });
              }
            }
          } catch (err) {
            console.error(`[RfqSubscriber] Fetch chunk failed:`, err);
          }
        }

        for (const userData of suppliersData) {
          try {
            if (userData && userData.email) {
              console.info(`[RfqSubscriber] Sending RFQ email to ${userData.email} (supplier)`);
              await emailService.sendRfqNotification({
                to: userData.email,
                category: payload.category,
                region: regionName,
                phone: payload.phone,
                specification: payload.specification
              });
            }
          } catch (err: unknown) {
            const error = err as Error;
            console.error(`[RfqSubscriber] Failed to send email to supplier ${userData.id}:`, error.message);
          }
        }
      } catch (error: unknown) {
        const err = error as Error;
        console.error(`[RfqSubscriber] Critical failure in RFQ processing:`, err.message);
      }
    }
  );

  console.info("[Events] RFQ Subscriber registered.");
}
