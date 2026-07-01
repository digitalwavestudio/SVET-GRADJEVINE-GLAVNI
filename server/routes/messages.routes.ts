import { logger } from "../utils/logger.ts";
import { Router } from "express";
import { getReqUser } from "../utils/request.ts";
import fs from "fs";
import path from "path";
import { db, admin } from "../config/firebase.ts";
import { authMiddleware, requireAuth } from "../middleware/auth.middleware.ts";
import { chatMessagingLimiter } from "../middleware/rate-limit.middleware.ts";
import { ChatService } from "../services/chat.service.ts";
import { CacheService } from "../services/cache.service.ts";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import { userProfileLoader, userPresenceLoader } from "../utils/dataloader.ts";
import { BadRequestError } from "../utils/appError.ts";
import { validateRequest } from "../middleware/validate.ts";
import { z } from "zod";

const sendMessageSchema = z.object({
  chatId: z.string().min(1, "ID četa je obavezan"),
  content: z.string().min(1, "Sadržaj poruke je obavezan"),
  recipientId: z.string().min(1, "Primalac je obavezan"),
  type: z.enum(["text", "image", "file"]).default("text"),
});

const createConversationSchema = z.object({
  partnerId: z.string().min(1, "Partner ID je obavezan"),
  initialMessage: z.string().optional(),
  adData: z.object({
    id: z.string().min(1, "ID oglasa je obavezan"),
    title: z.string().min(1, "Naslov oglasa je obavezan"),
    category: z.string().min(1, "Kategorija oglasa je obavezna"),
    price: z.number().optional(),
    imageUrl: z.string().optional(),
  }).optional(),
});

function validateFileSignature(buffer: Buffer, mimetype: string, extension: string): boolean {
  if (!buffer || buffer.length < 4) return false;

  const hex = buffer.toString("hex", 0, 4).toUpperCase();
  const magicPng = "89504E47";
  const magicPdf = "25504446"; // %PDF
  const magicJpg = "FFD8FF";    // JPEG start

  const isWebP = buffer.toString("ascii", 0, 4) === "RIFF" && 
                 buffer.toString("ascii", 8, 12) === "WEBP";

  const ext = extension.toLowerCase();

  if (ext === "png" && mimetype === "image/png") {
    return hex === magicPng;
  }
  if ((ext === "jpg" || ext === "jpeg") && (mimetype === "image/jpeg" || mimetype === "image/jpg")) {
    return hex.startsWith(magicJpg);
  }
  if (ext === "webp" && mimetype === "image/webp") {
    return isWebP;
  }
  if (ext === "pdf" && mimetype === "application/pdf") {
    return hex === magicPdf;
  }

  return false;
}

export const messagesRouter = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req: import("express").Request, file: Express.Multer.File, cb: import("multer").FileFilterCallback) => {
    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
    const originalName = file.originalname || "";
    const ext = originalName.split(".").pop()?.toLowerCase() || "";
    const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];

    if (!allowedMimeTypes.includes(file.mimetype) || !allowedExtensions.includes(ext)) {
      return cb(new BadRequestError("Odbijen fajl: Dozvoljene su isključivo slike (jpg, jpeg, png, webp) i PDF dokumenti."));
    }
    cb(null, true);
  }
}); // 5MB

// Send message (UNIFIED)
messagesRouter.post(
  "/send",
  authMiddleware,
  requireAuth,
  chatMessagingLimiter,
  validateRequest(sendMessageSchema),
  async (req, res, next) => {
    try {
      const uid = getReqUser(req).uid;
      const { chatId, content, recipientId, type } = req.body;

      const result = await ChatService.sendMessage(
        chatId,
        uid,
        recipientId,
        content,
        type,
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  },
);

// Upload Chat Media
messagesRouter.post(
  "/upload",
  authMiddleware,
  requireAuth,
  upload.single("media"),
  async (req, res, next) => {
    try {
      const file = req.file;
      const uid = getReqUser(req).uid;
      const { chatId } = req.body;

      if (!file || !chatId)
        return res.status(400).json({ error: "Missing file or chatId" });

      const originalName = file.originalname || "";
      const ext = originalName.split(".").pop()?.toLowerCase() || "";

      // 1. Structure / Signature check of the file directly on backend
      const isSignatureValid = validateFileSignature(file.buffer, file.mimetype, ext);

      // 2. Asynchronously retrieve and test the file size limit before writing to Cloud Storage
      const maxLimit = await (async () => {
        try {
          const { AdminSettingsService } = await import("../services/admin/admin-settings.service.ts");
          const settings = await AdminSettingsService.getSettings("system") as { maxUploadSize?: number };
          return settings?.maxUploadSize || 5 * 1024 * 1024;
        } catch {
          return 5 * 1024 * 1024; // fallback to 5MB
        }
      })();

      const isSizeValid = file.size <= maxLimit;

      const allowedExtensions = ["jpg", "jpeg", "png", "webp", "pdf"];
      const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "application/pdf"];
      const isMimeAndExtAllowed = allowedExtensions.includes(ext) && allowedMimeTypes.includes(file.mimetype);

      if (!isSignatureValid || !isSizeValid || !isMimeAndExtAllowed) {
        // Log potentially suspicious upload to _logs asynchronously and block upload
        const ip = req.headers["x-forwarded-for"] || req.ip || req.socket.remoteAddress || "unknown";
        const ipStr = Array.isArray(ip) ? ip[0] : ip;

        logger.warn("Potentially suspicious upload", {
          ip: ipStr,
          uid,
          resourceId: chatId || "unknown",
          details: {
            fileName: file.originalname,
            fileSize: file.size,
            mimetype: file.mimetype,
            extension: ext,
            signatureValid: isSignatureValid,
            sizeValid: isSizeValid,
            mimeAndExtAllowed: isMimeAndExtAllowed,
            maxLimit,
          }
        });

        return res.status(400).json({ 
          error: "Fajl krši bezbednosna pravila platforme (neodgovarajući format, neispravna struktura ili prevelika veličina)." 
        });
      }

      // Ownership check (IDOR Protection)
      const chatSnap = await db.collection("conversations").doc(chatId).get();
      if (!chatSnap.exists) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      const chatData = chatSnap.data();
      if (!chatData?.participants?.includes(uid)) {
        return res.status(403).json({ error: "Access denied to upload to this chat" });
      }

      let url = "";
      const fileName = `chats/${chatId}/${Date.now()}_${file.originalname}`;

      try {
        const bucket = admin.storage().bucket();
        const [exists] = await bucket.exists();
        if (!exists) {
          throw new Error("Target Cloud Storage bucket does not exist.");
        }

        const blob = bucket.file(fileName);
        const token = uuidv4();

        await blob.save(file.buffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: { firebaseStorageDownloadTokens: token },
          },
        });

        url = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(fileName)}?alt=media&token=${token}`;
      } catch (storageError: any) {
        console.info(`[CHAT STORAGE INFO] Direct local media stream active.`);
        
        const uploadsDir = path.join(process.cwd(), "uploads", "chats", chatId);
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        
        const localFilePath = path.join(uploadsDir, path.basename(fileName));
        fs.writeFileSync(localFilePath, file.buffer);
        
        url = `/uploads/chats/${chatId}/${path.basename(fileName)}`;
      }

      res.json({ url });
    } catch (error) {
      next(error);
    }
  },
);

// Create conversation (UNIFIED)
messagesRouter.post(
  "/create",
  requireAuth,
  chatMessagingLimiter,
  validateRequest(createConversationSchema),
  async (req, res, next) => {
    try {
      const uid = getReqUser(req).uid;
      const { partnerId, initialMessage, adData } = req.body;

      const participants = [uid, partnerId].sort();
      const chatId = adData
        ? `${participants.join("_")}_${adData.id}`
        : participants.join("_");

      if (initialMessage) {
        await ChatService.sendMessage(
          chatId,
          uid,
          partnerId,
          initialMessage,
          "text",
          adData
        );
      } else {
        // Just ensure conversation metadata exists
        await db
          .collection("conversations")
          .doc(chatId)
          .set(
            {
              participants,
              adData: adData || null,
              lastMessage: "",
              lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
              unreadCount: { [partnerId]: 0, [uid]: 0 },
            },
            { merge: true },
          );
      }

      res.json({ id: chatId, success: true });
    } catch (error) {
      next(error);
    }
  },
);

// Report chat
messagesRouter.post("/report/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const uid = getReqUser(req).uid;

    const result = await ChatService.reportConversation(id, uid, reason);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get all user conversations (aggregated inbox with presence)
messagesRouter.get("/inbox", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const limitNum = Number(req.query.limit) || 20;
    const cursor = req.query.cursor as string;

    const cacheKey = `inbox_${uid}_${limitNum}_${cursor || "first"}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          let q = db
            .collection("conversations")
            .where("participants", "array-contains", uid)
            .orderBy("lastMessageAt", "desc");

          if (cursor) {
            const cursorDoc = await db.collection("conversations").doc(cursor).get();
            if (cursorDoc.exists) {
              q = q.startAfter(cursorDoc);
            }
          }

          const snap = await q.limit(limitNum).get();

          // Extract and deduplicate all partner IDs from all chats
          const rawChats = snap.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as any),
          }));
          const uniquePartnerIds = [
            ...new Set(
              rawChats
                .map((chat) => chat.participants.find((p: string) => p !== uid))
                .filter(Boolean),
            ),
          ] as string[];

          // Fetch all related profiles and presences in batch
          const [presences, profiles] = await Promise.all([
            uniquePartnerIds.length > 0
              ? userPresenceLoader.loadMany(uniquePartnerIds)
              : Promise.resolve([]),
            uniquePartnerIds.length > 0
              ? userProfileLoader.loadMany(uniquePartnerIds)
              : Promise.resolve([]),
          ]);

          // Build O(1) lookups
          const presenceMap = new Map();
          const profileMap = new Map();

          uniquePartnerIds.forEach((pid, index) => {
            presenceMap.set(
              pid,
              presences[index] instanceof Error
                ? { status: "offline" }
                : presences[index],
            );
            profileMap.set(
              pid,
              profiles[index] instanceof Error ? null : profiles[index],
            );
          });

          // Remap chats with fully resolved data
          const enrichedChats = rawChats.map((data) => {
            const partnerId = data.participants.find((p: string) => p !== uid);

            return {
              ...data,
              partner: partnerId ? profileMap.get(partnerId) : null,
              partnerPresence: partnerId
                ? presenceMap.get(partnerId)
                : { status: "offline" },
              unreadCount: data.unreadCount ? data.unreadCount[uid] || 0 : 0,
            };
          });

          return {
            items: enrichedChats,
            lastVisibleId:
              enrichedChats.length === limitNum
                ? enrichedChats[enrichedChats.length - 1].id
                : null,
            hasMore: enrichedChats.length === limitNum,
          };
        } catch (err: any) {
          if (err.message && err.message.includes("quota")) {
             logger.warn("[Quota Protect] Returning empty inbox for user:", uid);
             return { items: [], lastVisibleId: null, hasMore: false };
          }
          throw err;
        }
      },
      60000 // Cache for 1 minute
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Original legacy conversations endpoint (for backwards compatibility if needed, though we should migrate front-end to use /inbox)
messagesRouter.get("/conversations", requireAuth, async (req, res, next) => {
  try {
    const uid = getReqUser(req).uid;
    const cacheKey = `conversations_swr:${uid}`;

    const result = await CacheService.getOrSetSWR(
      cacheKey,
      async () => {
        const snap = await db
          .collection("conversations")
          .where("participants", "array-contains", uid)
          .orderBy("lastMessageAt", "desc")
          .limit(50)
          .get();

        return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      },
      30000 // 30 seconds TTL
    );

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Get chat messages
messagesRouter.get(
  "/chat/:id/messages",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = getReqUser(req);
      const uid = user.uid;

      // Ownership check (IDOR Protection)
      const chatSnap = await db.collection("conversations").doc(id).get();
      if (!chatSnap.exists) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      const chatData = chatSnap.data();
      if (!chatData?.participants?.includes(uid) && !user.isAdmin) {
        import('../services/critical-alert.service.ts').then(({ CriticalAlertService }) => {
          CriticalAlertService.triggerResourceAlert("Potential IDOR Attack Detected (Messages Fetch)", {
            uid,
            chatId: id
          });
          }).catch(err => console.error("[Messages] CriticalAlertService.triggerResourceAlert failed:", err));
        return res.status(403).json({ error: "Access denied to this chat" });
      }

      const limitVal = Number(req.query.limit) || 50;
      const cursor = req.query.cursor ? String(req.query.cursor) : null;

      let msgQuery = db
        .collection("conversations")
        .doc(id)
        .collection("messages")
        .orderBy("createdAt", "desc")
        .limit(limitVal);

      if (cursor) {
        const cursorNum = Number(cursor);
        if (!isNaN(cursorNum)) {
          msgQuery = msgQuery.startAfter(admin.firestore.Timestamp.fromMillis(cursorNum));
        } else {
          msgQuery = msgQuery.startAfter(admin.firestore.Timestamp.fromDate(new Date(cursor)));
        }
      }

      const snap = await msgQuery.get();
      const items = snap.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt ? (data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt) : null
        };
      });

      let nextCursor: number | null = null;
      if (items.length > 0) {
        const lastDoc = snap.docs[snap.docs.length - 1];
        const lastCreated = lastDoc.data()?.createdAt;
        if (lastCreated) {
          nextCursor = lastCreated.toMillis ? lastCreated.toMillis() : new Date(lastCreated).getTime();
        }
      }

      const hasMore = items.length === limitVal;

      res.json({
        items,
        nextCursor,
        hasMore
      });
    } catch (error) {
      next(error);
    }
  },
);

// Mark chat as read
messagesRouter.post(
  "/chat/:id/read",
  requireAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const uid = getReqUser(req).uid;
      await ChatService.markAsRead(id, uid);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
);

// Get Shared Media Gallery
messagesRouter.get(
  "/chat/:id/media",
  authMiddleware,
  requireAuth,
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = getReqUser(req);
      const uid = user.uid;

      // Ownership check (IDOR Protection)
      const chatSnap = await db.collection("conversations").doc(id).get();
      if (!chatSnap.exists) {
        return res.status(404).json({ error: "Chat not found" });
      }
      
      const chatData = chatSnap.data();
      if (!chatData?.participants?.includes(uid) && !user.isAdmin) {
        import('../services/critical-alert.service.ts').then(({ CriticalAlertService }) => {
          CriticalAlertService.triggerResourceAlert("Potential IDOR Attack Detected (Media Fetch)", {
            uid,
            chatId: id
          });
        }).catch(err => console.error("[Messages] CriticalAlertService.triggerResourceAlert failed:", err));
        return res.status(403).json({ error: "Access denied to this chat media" });
      }

      const snap = await db
        .collection("conversations")
        .doc(id)
        .collection("messages")
        .where("type", "==", "image")
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      res.json(
        snap.docs.map((doc) => ({
          id: doc.id,
          url: doc.data().mediaUrl,
          createdAt: doc.data().createdAt,
        })),
      );
    } catch (error) {
      next(error);
    }
  },
);
