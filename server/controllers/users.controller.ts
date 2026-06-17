import { AuditService, AuditAction } from '../services/audit.service.ts';
import { Request, Response, NextFunction } from "express";
import { UsersService } from "../services/users.service.ts";
import { UserTransformer } from "../bff/user.transformer.ts";
import { db, admin } from "../config/firebase.ts";
import { eventBus, DomainEvents } from "../events/event-bus.ts";
import { CacheService } from "../services/cache.service.ts";
import { logger } from "../utils/logger.ts";

export const forceSync = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const uid = req.user.uid;

  try {
    const result = await UsersService.forceSync(uid);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

import { userProfileSchema, migrateProfileSchema } from "@svet-gradjevine/shared";
export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const { uid, isAdmin } = req.user;

  try {
    const validated = userProfileSchema.parse(req.body);
    const result = await UsersService.updateProfile(
      uid,
      validated,
      isAdmin || false,
    );
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const migrateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const uid = req.user.uid;

  try {
    const validated = migrateProfileSchema.parse(req.body);
    const result = await UsersService.migrateProfile(uid, validated.name, validated.photoURL);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const switchRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
  const { uid } = req.user;

  try {
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const data = userSnap.data();
    
    // Dozvoli postavljanje specifične uloge (npr. tokom registracije/onboarding-a)
    let newRole = req.body.role;
    const allowedRoles = ['standard', 'majstor', 'poslodavac', 'smestaj', 'ketering', 'placevi', 'masine', 'partner'];
    
    if (newRole && !allowedRoles.includes(newRole)) {
      return res.status(400).json({ error: 'Neispravna uloga.' });
    }

    if (!newRole) {
      newRole = data?.role === 'poslodavac' ? 'majstor' : 'poslodavac';
    }

    await db.collection('users').doc(uid).update({ role: newRole });
    
    // Enterprise Auth Sync: Update claims
    const currentRecord = await admin.auth().getUser(uid);
    const currentClaims = currentRecord.customClaims || {};
    await admin.auth().setCustomUserClaims(uid, { ...currentClaims, role: newRole });

    await CacheService.delete(`auth:claims:${uid}`);
    await CacheService.delete(`user_me_${uid}:pub`);
    await CacheService.delete(`user_me_${uid}:priv`);
    await CacheService.delete(`auth_session:${uid}`).catch((e: any) => logger.warn("[UsersController] Cache delete auth session:", e));
    await CacheService.delete(`public_profile_${uid}`);

    // We should sync stats as role changed
    eventBus.emit(DomainEvents.USER_UPDATED, { userId: uid });

    await AuditService.log({
      action: 'SWITCH_ROLE',
      userId: uid,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      details: { oldRole: data?.role, newRole }
    });
    res.json({ success: true, newRole });
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const l2ShieldKey = `user_pub_profile:${id}`;

    // 1. Redis L2 Shield (30 minutes)
    const cachedProfile = await CacheService.get<any>(l2ShieldKey);
    if (cachedProfile) {
      return res.json(cachedProfile);
    }

    const result = await UsersService.getPublicProfile(id);
    if (!result) return res.status(404).json({ error: "User not found" });

    const platform = req.headers["x-client-platform"];
    const cacheKey = `publicProfileAds_${id}`;
    
    interface AdDocument extends Record<string, unknown> {
      id: string;
      type?: string;
    }

    interface CachedAds {
      machines: AdDocument[];
      accommodations: AdDocument[];
      caterings: AdDocument[];
      plots: AdDocument[];
    }

    // Import CacheService locally or at top
    const cachedAds = await CacheService.get<CachedAds>(cacheKey);

    let machines: AdDocument[] = [];
    let accommodations: AdDocument[] = [];
    let caterings: AdDocument[] = [];
    let plots: AdDocument[] = [];

    if (cachedAds) {
      machines = cachedAds.machines;
      accommodations = cachedAds.accommodations;
      caterings = cachedAds.caterings;
      plots = cachedAds.plots;
    } else {
      try {
        // Fetch user's active ads
        const snap = await db.collection("listings")
          .where("authorId", "==", id)
          .where("status", "==", "active")
          .orderBy("createdAt", "desc")
          .limit(100)
          .get();
          
        const { ImageTransformer } = await import("../utils/image.transformer.ts");

        snap.docs.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
          const rawData = doc.data();
          const data = ImageTransformer.transformDocumentImages({ id: doc.id, ...rawData }) as AdDocument;
          if (data.type === 'machine') machines.push(data);
          else if (data.type === 'accommodation') accommodations.push(data);
          else if (data.type === 'catering') caterings.push(data);
          else if (data.type === 'plot') plots.push(data);
        });

        const adsToCache: CachedAds = { machines, accommodations, caterings, plots };
        await CacheService.set(cacheKey, adsToCache, 5 * 60 * 1000); // cache for 5 min
      } catch (quotaError) {
        console.error("[USERS] Ads fetch quota error:", quotaError);
      }
    }

    const response = {
      ...result,
      _aggregatedAds: {
        machines,
        accommodations,
        caterings,
        plots
      }
    };

    // Cache the fully assembled public profile including ads
    await CacheService.set(l2ShieldKey, response, 1800000); // 30 min L2 Shield

    if (platform === "mobile" && result) {
      return res.json(UserTransformer.toMobile(result));
    }

    res.json(response);
  } catch (err) {
    next(err);
  }
};

export const registerFcmToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  const uid = req.user.uid;
  const { token } = req.body;

  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "Missing or invalid token." });
  }

  try {
    const tokenExistsKey = `fcm_token_exist:${uid}:${token}`;

    // 1. Check L1 / L2 Cache first. If it exists, return success immediately
    const cachedExist = await CacheService.get<boolean>(tokenExistsKey);
    if (cachedExist) {
      return res.json({ success: true, message: "Token already registered (cached)." });
    }

    // 2. Fetch or load from DB user profile to inspect tokens array
    const userDoc = await db.collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found." });
    }

    const userData = userDoc.data();
    const existingTokens: string[] = Array.isArray(userData?.fcmTokens) ? userData.fcmTokens : [];

    // 3. If token is already present in DB array
    if (existingTokens.includes(token)) {
      // Warm up cache so next time it is instant
      await CacheService.set(tokenExistsKey, true, 24 * 60 * 60 * 1000); // 24 hours
      return res.json({ success: true, message: "Token already present in array." });
    }

    // 4. Otherwise, perform a write with arrayUnion
    await db.collection("users").doc(uid).update({
      fcmTokens: admin.firestore.FieldValue.arrayUnion(token),
    });

    // Invalidate FCM cache lists and mark presence
    await CacheService.delete(`fcm_tokens:${uid}`);
    await CacheService.set(tokenExistsKey, true, 24 * 60 * 60 * 1000);

    res.json({ success: true, message: "FCM token registered successfully." });
  } catch (error) {
    next(error);
  }
};
