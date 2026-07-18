import { admin as firebaseAdmin, db } from "../../config/firebase.ts";
import { CacheInvalidationService } from "../cache-invalidation.service.ts";
import { AdminStatsService } from "../admin/admin-stats.service.ts";
import { AuditService, AuditAction } from "../audit.service.ts";
import { Logger } from "../../utils/logger.ts";
import { AppError, BadRequestError } from "../../utils/appError.ts";
import { eventBus, DomainEvents } from "../../events/event-bus.ts";
import { Listing, AdStatus } from "../../types/ads.ts";

export class BaseAdStrategy {
  protected logger = new Logger({ service: "BaseAdStrategy" });

  constructor(
    public readonly category: string,
    public readonly entityType: string,
  ) {}

  protected resolvePackagePrice(pkgId: string): number {
    if (!pkgId || pkgId === "free") return 0;
    if (pkgId === "urgent") return 4000;
    if (pkgId === "standard") return 1000;
    if (pkgId === "premium") return 2000;
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

      const sysConfigRef = db.collection("system").doc("config");
      const sysConfigDoc = await transaction.get(sysConfigRef);
      const sysConfig = sysConfigDoc.exists ? sysConfigDoc.data() : null;

      let packagePrice = this.resolvePackagePrice(rawData.paket);
      const catKey = this.category === 'job' ? 'jobs' : this.category;
      if (sysConfig?.pricing?.[catKey]?.[rawData.paket]) {
        packagePrice = sysConfig.pricing[catKey][rawData.paket];
      }

      if (sysConfig?.holidayModeActive && packagePrice > 0) {
        const applicable = sysConfig.applicablePackages || [];
        if (applicable.includes("all") || applicable.includes(rawData.paket)) {
            const discountPercentage = sysConfig.discountPercentage || 0;
            const discountAmount = Math.floor(packagePrice * (discountPercentage / 100));
            packagePrice = Math.max(0, packagePrice - discountAmount);
        }
      }

      const currentWalletBalance = userData.walletBalance ?? userData.partnerBalance ?? 0;
      
      if (isPaidPackage && packagePrice <= 0 && rawData.paket !== "free") {
        throw new BadRequestError(`Nepoznat paket: "${rawData.paket}". Dozvoljeni paketi su: standard, premium, urgent.`);
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

      const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ") || "";
      const authorSnapshot = {
        displayName: fullName || userData.displayName || userData.name || "",
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
          if (packagePrice >= 3000) expiry.setMonth(expiry.getMonth() + 3);
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
          fullName ||
          userData.displayName ||
          "Kompanija",
        logo: userData.businessProfile?.logo || userData.photoURL || "",
        isCompanyVerified: (userData as { isVerified?: boolean })?.isVerified || false,
        status: "active" as AdStatus,
        moderationStatus: "approved",
        isPremium: rawData.paket === "premium",
        isUrgent: rawData.paket === "urgent",
        ...(premiumUntil ? { premiumUntil } : {}),
        ...(urgentUntil ? { urgentUntil } : {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        viewsCount: 0,
        searchKeywords: searchKeywords.slice(0, 50),
        _geoloc: (rawData as { location?: { coordinates?: { lat: number, lng: number } } })?.location?.coordinates
          ? {
              lat: (rawData as { location: { coordinates: { lat: number } } }).location.coordinates.lat,
              lng: (rawData as { location: { coordinates: { lng: number } } }).location.coordinates.lng,
            }
          : (rawData as { _geoloc?: unknown })?._geoloc || null,
        imageStatus: hasRawImages ? "processing" : "ready",
        adTitle: rawData.adTitle || rawData.title,
      };

      transaction.set(adRef, adData, { merge: true });

      if (isPaidPackage) {
        const transRef = db.collection("transactions").doc();
        const adTitle = rawData.title || rawData.adTitle || rawData.name || "";
        transaction.set(transRef, {
          userId: uid,
          adId: adId,
          type: "ad_payment_wallet",
          packageId: rawData.paket,
          amount: -packagePrice,
          currency: "RSD",
          status: "completed",
          description: `Plaćen oglas${adTitle ? ` - ${adTitle}` : ''} (${rawData.paket})`,
          referenceNumber: `SG-${adId.slice(0, 8).toUpperCase()}`,
          createdAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
        });
        
        transaction.update(userRef, {
          walletBalance: firebaseAdmin.firestore.FieldValue.increment(-packagePrice),
          totalAds: firebaseAdmin.firestore.FieldValue.increment(1),
        });
      } else {
        transaction.update(userRef, {
          totalAds: firebaseAdmin.firestore.FieldValue.increment(1),
        });
      }

      const outboxRef = db.collection("outbox").doc();
      const outboxPayloadObj = {
        type: DomainEvents.AD_CREATED,
        payload: { category: this.category, id: adId, uid, title: rawData.title || rawData.adTitle || rawData.name || "" },
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
        this.category as "jobs" | "companies" | "realEstate",
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
        userEmail: userData.email || "",
        package: rawData.paket || null,
        packagePrice,
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

    CacheInvalidationService.onAdChange(this.category, uid);

    AuditService.log({
      action: AuditAction.AD_CREATED,
      userId: uid,
      targetType: this.entityType,
      targetId: result.id,
      details: {
        category: this.category,
        title: result.data?.title || result.data?.name || "",
        package: result.package,
        price: result.packagePrice,
        status: result.data?.status,
        isPremium: !!result.data?.isPremium,
      },
    });

    if (result.userEmail) {
      const { emailService } = await import("../emailService.ts");
      const title = result.data?.title || result.data?.name || "";
      const now = new Date().toISOString().split("T")[0];
      emailService.sendEmail({
        to: result.userEmail,
        subject: `Oglasna deklaracija: ${title}`,
        html: `
          <h2>Oglasna deklaracija</h2>
          <p><strong>Datum:</strong> ${now}</p>
          <p><strong>Oglas:</strong> ${title}</p>
          <p><strong>Kategorija:</strong> ${this.category}</p>
          <p><strong>Status:</strong> ${result.data?.status || "aktivan"}</p>
          <p><strong>Paket:</strong> ${result.package || "besplatan"}</p>
          <p><strong>Cena:</strong> ${result.packagePrice || 0} RSD</p>
          <p><strong>ID oglasa:</strong> ${result.id}</p>
          <hr>
          <p style="color:#666;font-size:12px;">Oglasnu deklaraciju čuvajte najmanje 2 godine (Član 19 Zakona o oglašavanju).</p>
        `,
      }).catch((err: Error) => console.error("[OGLASNA DEKLARACIJA] Email failed:", err.message));
    }

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
        const fullName = [userData.firstName, userData.lastName].filter(Boolean).join(" ") || "";
        updateData.authorSnapshot = {
          displayName: fullName || userData.displayName || userData.name || "",
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
          fullName ||
          userData.displayName ||
          "Kompanija";
        updateData.logo = userData.businessProfile?.logo || userData.photoURL || "";
        updateData.isCompanyVerified = (userData as { isVerified?: boolean })?.isVerified || false;
      }

      await this.beforeAdUpdated(transaction, adRef, rawData, data, updateData);

      transaction.update(adRef, updateData);

      if (oldStatus !== newStatus) {
        await AdminStatsService.updateGlobalStats(
          this.category as "jobs" | "companies" | "realEstate",
          -1,
          data.isPremium || false,
          oldStatus,
          transaction,
        );
        await AdminStatsService.updateGlobalStats(
          this.category as "jobs" | "companies" | "realEstate",
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

    CacheInvalidationService.onAdChange(this.category, uid);

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
        this.category as "jobs" | "companies" | "realEstate",
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

    CacheInvalidationService.onAdChange(this.category, uid);

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

        
      } else {
        updateData.status = "rejected";
        updateData.rejectedAt = firebaseAdmin.firestore.FieldValue.serverTimestamp();
        updateData.moderationComment = reason || "";
      }

      transaction.update(adRef, updateData);

      await AdminStatsService.updateGlobalStats(this.category as "jobs" | "companies" | "realEstate", -1, data.isPremium || false, data.status, transaction);

      if (action === "approve") {
        await AdminStatsService.updateGlobalStats(this.category as "jobs" | "companies" | "realEstate", 1, data.isPremium || false, "active", transaction);
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
      CacheInvalidationService.onAdChange(this.category, result.outboxPayload.payload.uid);
    }

    return { success: true };
  }
}
