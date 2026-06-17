import { CacheService } from "./cache.service.ts";
import { db, admin as firebaseAdmin } from "../config/firebase.ts";
import { FieldPath } from "firebase-admin/firestore";
import { DomainEventPublisher } from "../utils/DomainEventPublisher.ts";
import { AppError, NotFoundError, BadRequestError } from "../utils/appError.ts";
import { DomainEvents, eventBus } from "../events/event-bus.ts";
import { userProfileSchema } from "@svet-gradjevine/shared";
import { User, UserRole } from "@svet-gradjevine/shared";
import { AdminService } from "./admin.service.ts";
import type { DecodedIdToken } from "firebase-admin/auth";
import { logger } from "../utils/logger.ts";

const l1UserCache = new Map<string, { data: User; expiry: number }>();
const L1_USER_TTL = 30 * 1000; // 30s RAM cache for current user data

export class UsersService {
  static async forceSync(uid: string) {
    eventBus.emit(DomainEvents.USER_UPDATED, { userId: uid });
    return { success: true, message: "Sinhronizacija pokrenuta ručno." };
  }

  static async searchPartner(filter: { code?: string; slug?: string }) {
    let q: FirebaseFirestore.Query = db.collection("users");
    if (filter.code) {
      q = q.where("partnerCode", "==", filter.code);
    } else if (filter.slug) {
      q = q.where("partnerSlug", "==", filter.slug.toLowerCase());
    } else {
      return null;
    }
    const snapshot = await q.limit(1).get();
    if (snapshot.empty) return null;
    const docSnap = snapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  }

  static async getAvailabilityEvents(uid: string) {
    const cacheKey = `user_events_${uid}`;
    const cached = await CacheService.get<any[]>(cacheKey);
    if (cached) return cached;

    const snap = await db.collection("users").doc(uid).collection("calendar_events").limit(50).get();
    const events = snap.docs.map(doc => doc.data());
    
    await CacheService.set(cacheKey, events, 300000); /* 5 min TTL */
    return events;
  }

  static async getUserById(
    uid: string, 
    fallbackUser?: Partial<firebaseAdmin.auth.UserRecord & { role?: string; permissions?: string[]; isVerified?: boolean; picture?: string; email_verified?: boolean }>,
    includePrivate = false
  ): Promise<User | null> {
    const cacheKey = `user_me_${uid}:${includePrivate ? "priv" : "pub"}`;
    
    // 1. L1 RAM Shield (Process level)
    const now = Date.now();
    const l1CachedTarget = l1UserCache.get(cacheKey);
    if (l1CachedTarget && now < l1CachedTarget.expiry) {
      return l1CachedTarget.data;
    }

    const cached = await CacheService.get<User>(cacheKey);
    if (cached) {
      l1UserCache.set(cacheKey, { data: cached, expiry: now + L1_USER_TTL });
      return cached;
    }

    try {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error("QuickTimeout")), 8000);
      });

      let userSnap: firebaseAdmin.firestore.DocumentSnapshot;
      let privSnap: firebaseAdmin.firestore.DocumentSnapshot;

      if (includePrivate) {
        const userRef = db.collection("users").doc(uid);
        const privRef = userRef.collection("private").doc("data");
        const fetchPromise = Promise.all([
          userRef.get(),
          privRef.get()
        ]);
        const [uSnap, pSnap] = await (Promise.race([fetchPromise, timeoutPromise]) as Promise<[firebaseAdmin.firestore.DocumentSnapshot, firebaseAdmin.firestore.DocumentSnapshot]>).finally(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });
        
        userSnap = uSnap;
        privSnap = pSnap;

        // Lazy migration if still using sub-collection
        if (userSnap.exists && privSnap.exists) {
          const privData = privSnap.data();
          if (privData) {
            await userRef.set(privData, { merge: true });
            await privRef.delete();
            console.info(`[UsersService] Migrated private data for user ${uid}`);
          }
        }
      } else {
        const fetchPromise = db.collection("users").doc(uid).get();
        const uSnap = await (Promise.race([fetchPromise, timeoutPromise]) as Promise<firebaseAdmin.firestore.DocumentSnapshot>).finally(() => {
          if (timeoutId) clearTimeout(timeoutId);
        });
        userSnap = uSnap;
        privSnap = { exists: false, data: () => ({}) } as any;
      }

      if (!userSnap || !userSnap.exists) {
        if (fallbackUser) {
          const fallbackObj: User = {
            id: uid,
            email: fallbackUser.email || "",
            name: fallbackUser.displayName || "",
            firstName: "",
            lastName: "",
            role: (fallbackUser.role as UserRole) || "standard",
            isVerified: fallbackUser.emailVerified || fallbackUser.isVerified || false,
            photoURL: fallbackUser.photoURL || "",
            status: "active",
            
            isPremiumProfile: false,
            emailVerified: fallbackUser.emailVerified || false,
            freeAdsCount: 3,
          };
          // Auto-init in Firestore on first Google login/signup
          try {
            await UsersService.initUser(uid, fallbackObj, fallbackUser);
            console.info(`[UsersService] Auto-initialized Google user ${uid} in Firestore`);
          } catch (initErr) {
            console.error(`[UsersService] Failed to auto-initialize Google user ${uid}:`, initErr);
          }
          return fallbackObj;
        }
        return null;
      }

      const privData = (privSnap && privSnap.exists) ? privSnap.data() : {};

      const result = {
        id: userSnap.id,
        ...userSnap.data(),
        ...privData,
      } as User;
      
      l1UserCache.set(cacheKey, { data: result, expiry: Date.now() + L1_USER_TTL });

      // ENTERPRISE CACHE: 10 MIN TTL protects against spamming Firestore within the same session/flow
      // but prevents the stale-data issue of the 30-day cache we had before.
      await CacheService.set(cacheKey, result, 600000);

      return result;
    } catch (error: unknown) {
      const err = error as Error & { message?: string };
      if (err?.message === "QuickTimeout" || err?.message?.includes("timeout") || err?.message?.includes("Quota")) {
        logger.warn(`[USERS] User fetch timeout/quota for ${uid}, fast fallback activated.`);
      } else {
        console.error("[USERS] User fetch error:", err);
      }

      if (fallbackUser) {
        return {
          id: uid,
          email: fallbackUser.email || "",
          name: fallbackUser.displayName || "",
          firstName: "",
          lastName: "",
          role: (fallbackUser.role as UserRole) || "standard",
          isVerified: fallbackUser.emailVerified || fallbackUser.isVerified || false,
          photoURL: fallbackUser.photoURL || "",
          status: "active",
          
          isPremiumProfile: false,
          emailVerified: fallbackUser.emailVerified || false,
          freeAdsCount: 3,
        };
      }
      return null;
    }
  }

  static async initUser(
    uid: string,
    payload: Partial<User & { emailVerified?: boolean; role?: string }>,
    tokenData?: Partial<DecodedIdToken & { role?: string; permissions?: string[]; email_verified?: boolean; customClaims?: { role?: string; permissions?: string[] } }>
  ) {
    const userRef = db.collection('users').doc(uid);
    
    const result = await db.runTransaction(async (transaction) => {
      const userSnap = await transaction.get(userRef);
      
      let newRole = payload.role || 'standard';
      const isNew = !userSnap.exists;

      const baseData: Record<string, unknown> = {
         email: payload.email || tokenData?.email || '',
         firstName: payload.firstName || '',
         lastName: payload.lastName || '',
         name: payload.name || tokenData?.name || '',
         role: newRole,
         status: 'active',
         isVerified: payload.emailVerified || tokenData?.email_verified || false,
         updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
      };

      if (isNew) {
         baseData.createdAt = firebaseAdmin.firestore.FieldValue.serverTimestamp();
         baseData.viewsCount = 0;
         baseData.walletBalance = 1500; // 1500 SG Kredita gratis za prve oglase
         baseData.freeAdsCount = 3;
         baseData.isPremiumProfile = false;
         transaction.set(userRef, baseData, { merge: true });
      } else {
         const existingRole = userSnap.data()?.role;
         if (existingRole) {
            newRole = existingRole; 
            delete baseData.role; 
         }
         // Fallback if existing user somehow lacks walletBalance entirely:
         const existingData = userSnap.data();
         if (existingData && existingData.walletBalance === undefined) {
            baseData.walletBalance = 1500;
         }
         transaction.set(userRef, baseData, { merge: true });
      }

      return { isNew, newRole };
    });

    const { isNew, newRole } = result;

    const permissions = newRole === 'admin' ? ['*'] : ['read', 'write', 'ads:create'];

    // Update permissions in DB as well
    if (isNew) {
       await db.collection('users').doc(uid).update({ permissions });
    }

    // Always enforce Firebase custom claims to keep frontend fast path working
    const currentRole = (tokenData?.role as string) || (tokenData?.customClaims?.role as string);
    const currentPermissions = (tokenData?.permissions as string[]) || (tokenData?.customClaims?.permissions as string[]);

    if (currentRole !== newRole || !currentPermissions) {
        // We only set what we KNOW are custom claims: role and permissions
        await firebaseAdmin.auth().setCustomUserClaims(uid, { 
            role: newRole, 
            permissions: permissions 
        });
    }

    return { isNew, role: newRole };
  }

  static async updateProfile(uid: string, rawPayload: Record<string, unknown>, isAdmin: boolean) {
    // If admin, we use passthrough so they can update status, role, etc. 
    // If not admin, we force strip behavior.
    const schemaToUse = isAdmin ? userProfileSchema.passthrough() : userProfileSchema.strip();
    const validatedData = schemaToUse.partial().parse(rawPayload) as Record<string, unknown>;

    if (!isAdmin) {
      // Hardened explicit strip for critical monetary and access control fields
      const sensitiveFields = [
        "wallet", "cryptoWallet", "balance", "fiatBalance", 
        "role", "isVerified", "planExpiration", "status"
      ];
      for (const field of sensitiveFields) {
        delete rawPayload[field];
        delete validatedData[field];
      }
    }

    const privateFieldsList = [
      "email",
      "phoneNumber",
      "pib",
      "maticniBroj",
      "address",
      "savedJobs",
      "savedAds",
      "savedSearches",
    ];
    const publicUpdates: Record<string, unknown> = {};
    const privateUpdates: Record<string, unknown> = {};

    Object.keys(rawPayload).forEach((key) => {
      // Validate or map fields. If it's private, put it in private.
      if (privateFieldsList.includes(key)) {
        privateUpdates[key] = rawPayload[key];
      } else if (validatedData[key] !== undefined) {
        publicUpdates[key] = validatedData[key];
      }
    });

    if (
      Object.keys(publicUpdates).length === 0 &&
      Object.keys(privateUpdates).length === 0
    ) {
      throw new AppError("Nema validnih polja za ažuriranje.", 400);
    }

    const userSnap = await db.collection("users").doc(uid).get();

    const batch = db.batch();

    if (Object.keys(publicUpdates).length > 0) {
      batch.set(db.collection("users").doc(uid), publicUpdates, {
        merge: true,
      });
    }

    if (Object.keys(privateUpdates).length > 0) {
      batch.set(
        db.collection("users").doc(uid),
        privateUpdates,
        { merge: true },
      );
      batch.delete(db.collection("users").doc(uid).collection("private").doc("data"));
    }

    const relevantFields = [
      "businessProfile",
      "displayName",
      "name",
      "photoURL",
      "company",
      "isVerified",
      "firstName",
      "lastName",
    ];

    // Intercept 'events' to prevent unbounded array growth in main document
    if (rawPayload.events && Array.isArray(rawPayload.events)) {
      const events = rawPayload.events;
      const eventsCol = db.collection("users").doc(uid).collection("calendar_events");
      
      // We perform a surgical overwrite of the sub-collection
      // 1. Delete all existing (limit 500 for safety)
      const existing = await eventsCol.limit(500).get();
      existing.docs.forEach(doc => batch.delete(doc.ref));
      
      // 2. Add new events
      events.forEach((event: Record<string, unknown>) => {
        const eventId = event.date as string; // Deterministic ID per date
        batch.set(eventsCol.doc(eventId), {
            ...event,
            updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp()
        });
      });

      // 3. Outbox sync to inform search layer that availability changed
      DomainEventPublisher.publish(batch, "USER_AVAILABILITY_SYNC", { userId: uid }, uid);
      
      // Clean up the main document field if it exists (Backfill/Migration)
      batch.update(db.collection("users").doc(uid), {
        events: firebaseAdmin.firestore.FieldValue.delete()
      });

      // Force publicUpdates irrelevant to events if only events were sent
      delete publicUpdates.events;
    }

    const isProfileRelevant = Object.keys(publicUpdates).some((key) =>
      relevantFields.includes(key),
    );

    if (isProfileRelevant) {
      DomainEventPublisher.publish(batch, "FAN_OUT_PROFILE_UPDATE", { userId: uid }, uid);
    }

    await batch.commit();

    if (isProfileRelevant) {
      await CacheService.set("outbox_tasks_has_pending", true, 60 * 60 * 1000);
      eventBus.emit(DomainEvents.USER_UPDATED, { userId: uid });
    }
    await CacheService.delete(`user_me_${uid}:pub`);
    await CacheService.delete(`user_me_${uid}:priv`);
    await CacheService.delete(`auth_session:${uid}`).catch((e: any) => logger.warn("[Users] Invalidate auth_session:", e?.message));
    await CacheService.delete(`public_profile_${uid}`);
    await CacheService.delete(`user_events_${uid}`);

    // Sync Claims if role or verification changed
    if (
      publicUpdates.role ||
      publicUpdates.isVerified !== undefined ||
      publicUpdates.status
    ) {
      await AdminService.syncClaims(uid);
    }

    return {
      success: true,
      message: "Profil ažuriran.",
      syncInitiated: isProfileRelevant,
    };
  }

  static async migrateProfile(
    uid: string,
    name: string | undefined,
    photoURL: string | undefined,
  ) {
    const updateData: Record<string, string | firebaseAdmin.firestore.FieldValue | undefined> = {};
    if (name) updateData.firstName = name;
    if (photoURL) updateData.photoURL = photoURL;

    if (Object.keys(updateData).length > 0) {
      const batch = db.batch();
      batch.update(db.collection("users").doc(uid), updateData);

      DomainEventPublisher.publish(batch, "FAN_OUT_PROFILE_UPDATE", { userId: uid }, uid);

      await batch.commit();

      const { CacheService } = await import("./cache.service.ts");
      await CacheService.set("outbox_tasks_has_pending", true, 60 * 60 * 1000);
      await CacheService.delete(`user_me_${uid}:pub`);
      await CacheService.delete(`user_me_${uid}:priv`);
      await CacheService.delete(`auth_session:${uid}`).catch((e: any) => logger.warn("[Users] Invalidate auth_session on update:", e?.message));
      await CacheService.delete(`public_profile_${uid}`);
    }

    if (name || photoURL) {
      eventBus.emit(DomainEvents.USER_UPDATED, { userId: uid });
    }
    return { success: true };
  }

  static async getPublicProfile(id: string): Promise<User> {
    // Use our new DataLoader
    const { userProfileLoader } = await import("../utils/dataloader.ts");
    const user = await userProfileLoader.load(id);
    if (!user) throw new NotFoundError("Korisnik ne postoji.");

    // Fetch availability events via cached service method
    const events = await this.getAvailabilityEvents(id);
    
    // Safety cast from DTO to User
    const castedUser = user as unknown as User;

    const publicProfile: User & { events?: firebaseAdmin.firestore.DocumentData[] } = {
      ...castedUser,
      events
    };
    
    return publicProfile as User;
  }

  static async updatePresence(uid: string, status: "online" | "offline") {
    const { PresenceService } = await import("./presenceService.ts");
    return PresenceService.updatePresence(uid, status);
  }

  static async getPresence(uid: string) {
    const { userPresenceLoader } = await import("../utils/dataloader.ts");
    return userPresenceLoader.load(uid);
  }

  static async updatePackage(uid: string, packageId: string, duration: number) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);

    const role =
      packageId === "pro" || packageId === "enterprise" ? "company" : "majstor";

    const batch = db.batch();
    batch.set(
      db.collection("users").doc(uid),
      {
        currentPackage: packageId,
        packageExpiresAt: firebaseAdmin.firestore.Timestamp.fromDate(expiresAt),
        // If package is professional, set role
        role: role,
      },
      { merge: true },
    );

    DomainEventPublisher.publish(batch, "FAN_OUT_PROFILE_UPDATE", { userId: uid }, uid);

    await batch.commit();

    const { CacheService } = await import("./cache.service.ts");
    await CacheService.set("outbox_tasks_has_pending", true, 60 * 60 * 1000);

    await AdminService.syncClaims(uid);
    await CacheService.delete(`user_me_${uid}:pub`);
    await CacheService.delete(`user_me_${uid}:priv`);
    await CacheService.delete(`auth_session:${uid}`).catch((e: any) => logger.warn("[Users] Invalidate auth_session on role change:", e?.message));
    await CacheService.delete(`public_profile_${uid}`);
    return { success: true };
  }


}
