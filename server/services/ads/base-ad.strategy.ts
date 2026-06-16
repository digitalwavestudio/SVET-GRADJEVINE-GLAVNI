import { admin as firebaseAdmin, db } from "../../config/firebase.ts";
import { CacheService } from "../cache.service.ts";
import { AdminStatsService } from "../admin-stats.service.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { Logger } from "../../utils/logger.ts";
import { AppError, BadRequestError } from "../../utils/appError.ts";
import { eventBus, DomainEvents } from "../../events/event-bus.ts";
import { Listing, AdStatus } from "../../types/ads.ts";

export abstract class BaseAdStrategy {
  protected logger = new Logger({ service: this.constructor.name });

  abstract get category(): string;
  abstract get entityType(): string;

  protected resolvePackagePrice(pkgId: string): number {
    if (!pkgId || pkgId === "free") return 0;
    if (pkgId === "premium_partner") return 6000;
    if (pkgId === "urgent") return 1500;
    if (pkgId === "standard") return 500;
    if (pkgId === "premium") return 1000;
    return 0;
  }

  protected async afterAdCreated(transaction: FirebaseFirestore.Transaction, adId: string, rawData: any, userData: any, adData: any): Promise<void> {
    // Hook for subclasses
  }

  protected async beforeAdUpdated(transaction: FirebaseFirestore.Transaction, adRef: FirebaseFirestore.DocumentReference, rawData: any, data: any, updateData: any): Promise<void> {
    // Hook for subclasses
  }

  public async createAd(rawData: any, uid: string) {
    const result = await db.runTransaction(async (transaction) => {
      const userRef = db.collection("users").doc(uid);
      const userSnap = await transaction.get(userRef);
      if (!userSnap.exists) throw new BadRequestError("Korisnik nije pronađen");
      const userData = userSnap.data() as any;

      const isPaidPackage = !!rawData.paket;
      let packagePrice = this.resolvePackagePrice(rawData.paket);

      const sysConfigRef = db.collection("system").doc("config");
      const sysConfigDoc = await transaction.get(sysConfigRef);
      const sysConfig = sysConfigDoc.exists ? sysConfigDoc.data() : null;

      if (sysConfig?.holidayModeActive && packagePrice > 0) {
        const applicable = sysConfig.applicablePackages || [];
        if (applicable.includes("all") || applicable.includes(rawData.paket)) {
            const discountPercentage = sysConfig.discountPercentage || 0;
            const discountAmount = Math.floor(packagePrice * (discountPercentage / 100));
            packagePrice = Math.max(0, packagePrice - discountAmount);
        }
      }

      const currentWalletBalance = userData.walletBalance || userData.partnerBalance || 0;
      
      if (isPaidPackage && packagePrice <= 0 && rawData.paket !== "free") {
        throw new BadRequestError(`Nepoznat paket: "${rawData.paket}". Dozvoljeni paketi su: standard, premium, urgent, premium_partner.`);
      }
      if (currentWalletBalance < packagePrice) {
        throw new BadRequestError(`Nemate dovoljno sredstava u Wallet-u za izabrani paket. Cena je ${packagePrice} SG Kredita, a vaš balans iznosi ${currentWalletBalance} SG Kredita. Molimo dopunite wallet.`);
      }

      if (Array.isArray(rawData.images)) {
        rawData.images = rawData.images.filter((url: string) => !url.startsWith("blob:") && !url.startsWith("data:"));
      }
      if (Array.isArray(rawData.companyPortfolioImages)) {
        rawData.companyPortfolioImages = rawData.companyPortfolioImages.filter((url: string) => !url.startsWith("blob:") && !url.startsWith("data:"));
      }

      const adId = rawData.id || db.collection("listings").doc().id;
      const adRef = db.collection("listings").doc(adId);

      const hasRawImages =
        (rawData.images || []).some((url: string) => url.includes("/raw/")) ||
        (rawData.portfolioImages || []).some((url: string) => url.includes("/raw/"));

      const textToIndex = `${rawData.title || ""} ${rawData.name || ""} ${rawData.description || ""} ${rawData.manufacturer || ""} ${rawData.model || ""}`.toLowerCase();
      const searchKeywords = Array.from(
        new Set(textToIndex.split(/[\s,._-]+/).filter((w) => w.length > 2)),
      );

      const authorSnapshot = {
        displayName: userData.displayName || "",
        photoURL: userData.photoURL || "",
        isVerified: (userData as { isVerified?: boolean })?.isVerified || false,
        role: userData.role || "standard",
        companyName:
          (userData as { businessProfile?: { companyName?: string } })?.businessProfile?.companyName ||
          userData.businessProfile?.name ||
          (userData as { company?: string })?.company ||
          "",
      };

      let premiumUntil = null;
      let urgentUntil = null;
      if (isPaidPackage) {
        if (rawData.paket === "urgent") {
          const expiry = new Date();
          expiry.setDate(expiry.getDate() + 7);
          urgentUntil = firebaseAdmin.firestore.Timestamp.fromDate(expiry);
        } else {
          const expiry = new Date();
          if (rawData.paket === "premium_partner") expiry.setFullYear(expiry.getFullYear() + 10);
          else if (packagePrice >= 3000) expiry.setMonth(expiry.getMonth() + 3);
          else expiry.setDate(expiry.getDate() + 30);
          premiumUntil = firebaseAdmin.firestore.Timestamp.fromDate(expiry);
        }
      }

      const adData: any = {
        ...rawData,
        id: adId,
        authorId: uid,
        authorSnapshot,
        type: this.entityType,
        comp:
          (userData as { businessProfile?: { companyName?: string } })?.businessProfile?.companyName ||
          userData.businessProfile?.name ||
          (userData as { company?: string })?.company ||
          userData.displayName ||
          "Kompanija",
        logo: userData.businessProfile?.logo || userData.photoURL || "",
        isCompanyVerified: (userData as { isVerified?: boolean })?.isVerified || false,
        status: "active" as AdStatus,
        moderationStatus: "approved",
        isPremium: rawData.paket === "premium" || rawData.paket === "premium_partner",
        isUrgent: rawData.paket === "urgent",
        ...(premiumUntil ? { premiumUntil } : {}),
        ...(urgentUntil ? { urgentUntil } : {}),
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        viewsCount: 0,
        searchKeywords: searchKeywords.slice(0, 50),
        _geoloc: (rawData as { location?: { coordinates?: { lat: number, lng: number } } })?.location?.coordinates
          ? {
              lat: (rawData as { location: { coordinates: { lat: number } } }).location.coordinates.lat,
              lng: (rawData as { location: { coordinates: { lng: number } } }).location.coordinates.lng,
            }
          : (rawData as { _geoloc?: unknown })?._geoloc || null,
        imageStatus: hasRawImages ? "processing" : "ready",
      };

      transaction.set(adRef, adData, { merge: true });

      if (isPaidPackage) {
        const transRef = db.collection("transactions").doc();
        transaction.set(transRef, {
          userId: uid,
          adId: adId,
          type: "ad_payment_wallet",
          packageId: rawData.paket,
          amount: packagePrice,
          currency: "RSD",
          status: "completed",
          referenceNumber: `SG-${adId.slice(0, 8).toUpperCase()}`,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
        
        transaction.update(userRef, {
          walletBalance: firebaseAdmin.firestore.FieldValue.increment(-packagePrice),
          totalAds: firebaseAdmin.firestore.FieldValue.increment(1),
          ...(rawData.paket === "premium_partner" ? { isPremiumPartner: true, "businessProfile.premiumPartner": true } : {})
        });
      } else {
        transaction.update(userRef, {
          totalAds: firebaseAdmin.firestore.FieldValue.increment(1),
        });
      }

      const outboxRef = db.collection("outbox").doc();
      const outboxPayloadObj = {
        type: DomainEvents.AD_CREATED,
        payload: { category: this.category, id: adId, uid },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: uid,
        version: 1,
        shardNum: Math.floor(Math.random() * 10),
      };
      transaction.set(outboxRef, outboxPayloadObj);

      await this.afterAdCreated(transaction, adId, rawData, userData, adData);

      await AdminStatsService.updateGlobalStats(
        this.category as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate",
        1,
        adData.isPremium || false,
        adData.status,
        transaction,
      );

      if (adData.status === "active") {
        await AdminStatsService.updateUserStats(
          uid,
          { activeAds: 1 },
          transaction,
        );
      }

      return {
        id: adId,
        data: adData,
        outboxDocId: outboxRef.id,
        outboxPayload: outboxPayloadObj,
      };
    });

    if (result.outboxDocId && result.outboxPayload) {
      const QueueService = (await import("../queue.service.ts")).QueueService;
      const { JobType, JobPriority } = await import("../queue.service.ts");

      QueueService.addJob(
        JobType.OUTBOX_PROCESS,
        { id: result.outboxDocId, ...result.outboxPayload },
        {
          jobId: `outbox-${result.outboxDocId}`,
          priority: JobPriority.HIGH,
        },
      ).catch((err) => {
        console.error("Queue immediate push failed, fallback to scavenger", err.message);
      });
    }

    CacheService.invalidateByPrefix(`myAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix(`publicProfileAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix("promoted_").catch(() => {});
    CacheService.invalidateByPrefix("public_ads_").catch(() => {});
    CacheService.invalidateByPrefix("search_ads_").catch(() => {});
    CacheService.invalidateByPrefix("admin_moderation_queue_").catch(() => {});

    import("../dashboard.service.ts").then(({ DashboardService }) => {
      DashboardService.clearEmployerStatsCache(uid).catch(() => {});
    }).catch(() => {});

    return { id: result.id };
  }

  public async updateAd(id: string, rawData: any, uid: string) {
    if (Array.isArray(rawData.images)) {
      rawData.images = rawData.images.filter((url: string) => !url.startsWith("blob:") && !url.startsWith("data:"));
    }
    if (Array.isArray(rawData.companyPortfolioImages)) {
      rawData.companyPortfolioImages = rawData.companyPortfolioImages.filter((url: string) => !url.startsWith("blob:") && !url.startsWith("data:"));
    }

    const result = await db.runTransaction(async (transaction) => {
      const adRef = db.collection("listings").doc(id);
      const snap = await transaction.get(adRef);
      if (!snap.exists) throw new BadRequestError("Oglas nije pronađen");

      const data = snap.data() as any;
      const oldStatus = data.status;
      const newStatus = rawData.status || oldStatus;

      if (data.authorId !== uid) {
        throw new BadRequestError("Niste vlasnik oglasa");
      }

      const hasRawImages =
        (rawData.images || []).some((url: string) => url.includes("/raw/")) ||
        (rawData.portfolioImages || []).some((url: string) => url.includes("/raw/"));

      const updateData: any = {
        ...rawData,
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        imageStatus: hasRawImages ? "processing" : "ready",
        ...((rawData as { location?: { coordinates?: { lat: number, lng: number } } })?.location?.coordinates
          ? {
              _geoloc: {
                lat: (rawData as { location: { coordinates: { lat: number } } }).location.coordinates.lat,
                lng: (rawData as { location: { coordinates: { lng: number } } }).location.coordinates.lng,
              },
            }
          : {}),
      };

      delete updateData.id;
      delete updateData.authorId;
      delete updateData.createdAt;

      const userRef = db.collection("users").doc(data.authorId);
      const userSnap = await transaction.get(userRef);
      if (userSnap.exists) {
        const userData = userSnap.data()!;
        updateData.authorSnapshot = {
          displayName: userData.displayName || "",
          photoURL: userData.photoURL || "",
          isVerified: (userData as { isVerified?: boolean })?.isVerified || false,
          role: userData.role || "standard",
          companyName:
            (userData as { businessProfile?: { companyName?: string } })?.businessProfile?.companyName ||
            userData.businessProfile?.name ||
            (userData as { company?: string })?.company ||
            "",
        };
        updateData.comp =
          (userData as { businessProfile?: { companyName?: string } })?.businessProfile?.companyName ||
          userData.businessProfile?.name ||
          (userData as { company?: string })?.company ||
          userData.displayName ||
          "Kompanija";
        updateData.logo = userData.businessProfile?.logo || userData.photoURL || "";
        updateData.isCompanyVerified = (userData as { isVerified?: boolean })?.isVerified || false;
      }

      await this.beforeAdUpdated(transaction, adRef, rawData, data, updateData);

      transaction.update(adRef, updateData);

      if (oldStatus !== newStatus) {
        await AdminStatsService.updateGlobalStats(
          this.category as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate",
          -1,
          data.isPremium || false,
          oldStatus,
          transaction,
        );
        await AdminStatsService.updateGlobalStats(
          this.category as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate",
          1,
          data.isPremium || false,
          newStatus,
          transaction,
        );

        if (oldStatus === "active" && newStatus !== "active") {
          await AdminStatsService.updateUserStats(data.authorId, { activeAds: -1 }, transaction);
        } else if (oldStatus !== "active" && newStatus === "active") {
          await AdminStatsService.updateUserStats(data.authorId, { activeAds: 1 }, transaction);
        }
      }

      const outboxRef = db.collection("outbox").doc();
      const outboxPayloadObj = {
        type: DomainEvents.AD_UPDATED,
        payload: {
          category: this.category,
          id,
          uid: data.authorId,
          oldData: data,
          newData: { ...data, ...updateData },
        },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: uid,
        version: 1,
        shardNum: Math.floor(Math.random() * 10),
      };
      transaction.set(outboxRef, outboxPayloadObj);

      return { outboxDocId: outboxRef.id, outboxPayload: outboxPayloadObj };
    });

    if (result.outboxDocId && result.outboxPayload) {
      const QueueService = (await import("../queue.service.ts")).QueueService;
      const { JobType, JobPriority } = await import("../queue.service.ts");

      QueueService.addJob(
        JobType.OUTBOX_PROCESS,
        { id: result.outboxDocId, ...result.outboxPayload },
        {
          jobId: `outbox-${result.outboxDocId}`,
          priority: JobPriority.HIGH,
        },
      ).catch((err) => console.error("Queue immediate push failed for updateAd", err.message));
    }

    CacheService.invalidateByPrefix(`myAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix(`publicProfileAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix("promoted_").catch(() => {});
    CacheService.invalidateByPrefix("public_ads_").catch(() => {});
    CacheService.invalidateByPrefix("search_ads_").catch(() => {});
    CacheService.invalidateByPrefix("admin_moderation_queue_").catch(() => {});

    if (this.category === "jobs") {
      CacheService.invalidateByPrefix("public_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:public_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("jobs_public").catch(() => {});
      CacheService.invalidateByPrefix("swr:jobs_public").catch(() => {});
      CacheService.invalidateByPrefix("homepage_premium_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:homepage_premium_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("homepage_urgent_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:homepage_urgent_jobs_").catch(() => {});
    }

    import("../dashboard.service.ts").then(({ DashboardService }) => {
      DashboardService.clearEmployerStatsCache(uid).catch(() => {});
    }).catch(() => {});

    return { success: true };
  }

  public async deleteAd(id: string, uid: string) {
    const result = await db.runTransaction(async (transaction) => {
      const adRef = db.collection("listings").doc(id);
      const snap = await transaction.get(adRef);

      if (!snap.exists) throw new BadRequestError("Oglas nije pronađen");
      const data = snap.data()!;

      if (data.authorId !== uid) {
        throw new BadRequestError("Niste vlasnik oglasa");
      }

      transaction.update(adRef, {
        status: "deleted",
        deletedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      const outboxRef = db.collection("outbox").doc();
      const outboxPayloadObj = {
        type: DomainEvents.AD_DELETED,
        payload: { category: this.category, id, uid },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: uid,
        version: 1,
        shardNum: Math.floor(Math.random() * 10),
      };
      transaction.set(outboxRef, outboxPayloadObj);

      await AdminStatsService.updateGlobalStats(
        this.category as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate",
        -1,
        data.isPremium || false,
        data.status,
        transaction,
      );

      if (data.status === "active") {
        await AdminStatsService.updateUserStats(uid, { activeAds: -1 }, transaction);
      }

      return { outboxDocId: outboxRef.id, outboxPayload: outboxPayloadObj };
    });

    if (result.outboxDocId && result.outboxPayload) {
      const QueueService = (await import("../queue.service.ts")).QueueService;
      const { JobType, JobPriority } = await import("../queue.service.ts");

      QueueService.addJob(
        JobType.OUTBOX_PROCESS,
        { id: result.outboxDocId, ...result.outboxPayload },
        {
          jobId: `outbox-${result.outboxDocId}`,
          priority: JobPriority.HIGH,
        },
      ).catch((err) => console.error("Queue immediate push failed for deleteAd", err.message));
    }

    CacheService.invalidateByPrefix(`myAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix(`publicProfileAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix("promoted_").catch(() => {});
    CacheService.invalidateByPrefix("public_ads_").catch(() => {});
    CacheService.invalidateByPrefix("search_ads_").catch(() => {});
    CacheService.invalidateByPrefix("admin_moderation_queue_").catch(() => {});

    if (this.category === "jobs") {
      CacheService.invalidateByPrefix("public_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:public_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("jobs_public").catch(() => {});
      CacheService.invalidateByPrefix("swr:jobs_public").catch(() => {});
      CacheService.invalidateByPrefix("homepage_premium_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:homepage_premium_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("homepage_urgent_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:homepage_urgent_jobs_").catch(() => {});
    }

    import("../dashboard.service.ts").then(({ DashboardService }) => {
      DashboardService.clearEmployerStatsCache(uid).catch(() => {});
    }).catch(() => {});

    return { success: true };
  }

  public async moderateAd(id: string, action: "approve" | "reject", adminId: string, reason?: string) {
    const result = await db.runTransaction(async (transaction) => {
      const adRef = db.collection("listings").doc(id);
      const snap = await transaction.get(adRef);
      if (!snap.exists) throw new BadRequestError("Oglas nije pronađen");
      const data = snap.data() as any;

      const updateData: any = {
        updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      };

      if (action === "approve") {
        updateData.status = "active";
        updateData.approvedAt = firebaseAdmin.firestore.FieldValue.serverTimestamp();

        if (
          data.paket === "premium" ||
          data.paket === "premium_partner" ||
          data.paket === "pro" ||
          data.paket === "enterprise"
        ) {
          updateData.isPremium = true;
          if (!data.premiumUntil) {
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            updateData.premiumUntil = firebaseAdmin.firestore.Timestamp.fromDate(expiry);
          }
        }

        if (data.paket === "premium_partner") {
          transaction.update(db.collection("users").doc(data.authorId), {
            isPremiumPartner: true,
            "businessProfile.premiumPartner": true,
          });

          await AdminStatsService.updateGlobalStats("premiumPartners" as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate", 1, false, "active", transaction);
        }
      } else {
        updateData.status = "rejected";
        updateData.rejectedAt = firebaseAdmin.firestore.FieldValue.serverTimestamp();
        updateData.moderationComment = reason || "";
      }

      transaction.update(adRef, updateData);

      await AdminStatsService.updateGlobalStats(this.category as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate", -1, data.isPremium || false, data.status, transaction);

      if (action === "approve") {
        await AdminStatsService.updateGlobalStats(this.category as "jobs" | "accommodations" | "machines" | "caterings" | "plots" | "companies" | "realEstate", 1, data.isPremium || false, "active", transaction);
      }

      const activityId = db.collection("activities").doc().id;
      transaction.set(db.collection("activities").doc(activityId), {
        type: action === "approve" ? "ad_approved" : "ad_rejected",
        userId: data.authorId,
        moderatorId: adminId,
        targetId: id,
        targetType: this.category,
        title: data.title || data.name || "Oglas moderisan",
        reason: reason || "",
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
      });

      if (action === "approve" && data.status !== "active") {
        await AdminStatsService.updateUserStats(data.authorId, { activeAds: 1 }, transaction);
      } else if (action === "reject" && data.status === "active") {
        await AdminStatsService.updateUserStats(data.authorId, { activeAds: -1 }, transaction);
      }

      await AuditService.logAction(
        adminId,
        action === "approve" ? AuditAction.AD_APPROVED : AuditAction.AD_REJECTED,
        this.category,
        id,
        { reason },
      );

      const outboxRef = db.collection("outbox").doc();
      const outboxPayloadObj = {
        type: DomainEvents.AD_UPDATED,
        payload: {
          category: this.category,
          id,
          uid: data.authorId,
          title: data.title,
          status: action === "approve" ? "active" : "rejected",
          reason,
        },
        status: "pending",
        attempts: 0,
        createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        correlationId: adminId,
        version: 1,
        shardNum: Math.floor(Math.random() * 10),
      };
      transaction.set(outboxRef, outboxPayloadObj);

      return { outboxDocId: outboxRef.id, outboxPayload: outboxPayloadObj };
    });

    if (result.outboxDocId && result.outboxPayload) {
      const QueueService = (await import("../queue.service.ts")).QueueService;
      const { JobType, JobPriority } = await import("../queue.service.ts");

      QueueService.addJob(
        JobType.OUTBOX_PROCESS,
        { id: result.outboxDocId, ...result.outboxPayload },
        {
          jobId: `outbox-${result.outboxDocId}`,
          priority: JobPriority.HIGH,
        },
      ).catch((err) => console.error("Queue immediate push failed for moderateAd", err.message));
    }
    
    if (result.outboxPayload?.payload?.uid) {
       const uid = result.outboxPayload.payload.uid;
    CacheService.invalidateByPrefix(`myAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix(`publicProfileAds_${uid}`).catch(() => {});
    CacheService.invalidateByPrefix("promoted_").catch(() => {});
    CacheService.invalidateByPrefix("public_ads_").catch(() => {});
    CacheService.invalidateByPrefix("search_ads_").catch(() => {});
    CacheService.invalidateByPrefix("admin_moderation_queue_").catch(() => {});

    if (this.category === "jobs") {
      CacheService.invalidateByPrefix("public_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:public_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("jobs_public").catch(() => {});
      CacheService.invalidateByPrefix("swr:jobs_public").catch(() => {});
      CacheService.invalidateByPrefix("homepage_premium_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:homepage_premium_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("homepage_urgent_jobs_").catch(() => {});
      CacheService.invalidateByPrefix("swr:homepage_urgent_jobs_").catch(() => {});
    }

    import("../dashboard.service.ts").then(({ DashboardService }) => {
         DashboardService.clearEmployerStatsCache(uid).catch(() => {});
       }).catch(() => {});
    }

    return { success: true };
  }
}
