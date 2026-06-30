import { env } from "./env.ts";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { logger } from "../utils/logger.ts";

let currentDirname = "";
try {
  if (typeof __dirname !== "undefined") {
    currentDirname = __dirname;
  } else if (typeof import.meta !== "undefined" && import.meta.url) {
    currentDirname = path.dirname(fileURLToPath(import.meta.url));
  } else {
    currentDirname = process.cwd();
  }
} catch (e) {
  currentDirname = process.cwd();
}

const rootDir = path.resolve(currentDirname, "../../");

interface FirebaseAppletConfig {
  projectId: string;
  storageBucket: string;
  firestoreDatabaseId?: string;
}

let firebaseConfig: FirebaseAppletConfig = {
  projectId: "placeholder",
  storageBucket: "placeholder"
};

try {
  let configPath = path.join(process.cwd(), "firebase-applet-config.json");
  if (!fs.existsSync(configPath)) {
    configPath = path.join(rootDir, "firebase-applet-config.json");
  }

  if (fs.existsSync(configPath)) {
    console.info(`[FIREBASE] Loading configuration from: ${configPath}`);
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } else {
    logger.warn(
      "[FIREBASE] firebase-applet-config.json missing. Using defaults.",
    );
  }
} catch (e) {
  console.error(
    "[FIREBASE] Failed to read or parse firebase-applet-config.json",
    e,
  );
}

let _initialized = false;

export function ensureInitialized() {
  if (_initialized) return;

  try {
    if (admin.apps.length === 0) {
      console.info(
        "[FIREBASE] Initializing Admin SDK for project: " +
          firebaseConfig.projectId,
      );
      let credential;
      let serviceAccountKey: any = null;

      const localKeyPath = path.resolve(process.cwd(), "firebase-service-account.json");
      if (fs.existsSync(localKeyPath)) {
        try {
          console.info("[FIREBASE] Using service account key from local file: firebase-service-account.json");
          serviceAccountKey = JSON.parse(fs.readFileSync(localKeyPath, "utf-8"));
        } catch (fileErr) {
          console.error("[FIREBASE] Failed to read/parse local firebase-service-account.json:", fileErr);
        }
      }

      if (!serviceAccountKey && env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        try {
          console.info("[FIREBASE] Using service account key from environment.");
          let keyString = env.FIREBASE_SERVICE_ACCOUNT_KEY;
          const trimmed = keyString.trim();
          if (fs.existsSync(trimmed)) {
            serviceAccountKey = JSON.parse(fs.readFileSync(trimmed, "utf-8"));
          } else {
            if (!trimmed.startsWith("{")) keyString = "{" + trimmed;
            if (!keyString.trim().endsWith("}")) keyString = keyString + "}";
            serviceAccountKey = JSON.parse(keyString);
          }
        } catch (e: unknown) {
          console.error(
            "[FIREBASE] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY from env",
            e instanceof Error ? e.message : String(e),
          );
        }
      }

      if (serviceAccountKey) {
        credential = admin.credential.cert(serviceAccountKey);
      } else {
        console.info("[FIREBASE] Using applicationDefault credentials.");
        try {
          credential = admin.credential.applicationDefault();
        } catch (appDefaultErr) {
          logger.warn("[FIREBASE] applicationDefault credentials failed. Using dummy fallback cert to ensure container liveness.");
          credential = admin.credential.cert({
            projectId: firebaseConfig.projectId || "svet-gradjevine-mock",
            privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADA\n-----END PRIVATE KEY-----",
            clientEmail: "mock@svet-gradjevine-mock.iam.gserviceaccount.com"
          });
        }
      }

      admin.initializeApp({
        credential,
        projectId: firebaseConfig.projectId,
        storageBucket: firebaseConfig.storageBucket,
      });
      console.info("[FIREBASE] Admin SDK initialized.");
    }
    _initialized = true;
  } catch (err) {
    console.error("[FIREBASE] Critical initialization error:", err);
    throw err;
  }
}

let _db: admin.firestore.Firestore | null = null;
export function getDb() {
  ensureInitialized();
  if (!_db) {
    try {
      console.info(
        "[FIREBASE] Getting Firestore instance for database: " +
          (firebaseConfig.firestoreDatabaseId || "(default)"),
      );
      _db = getFirestore(admin.app(), firebaseConfig.firestoreDatabaseId as string);
      _db.settings({ ignoreUndefinedProperties: true });
    } catch (err) {
      console.error("[FIREBASE] Failed to get Firestore instance:", err);
      throw err;
    }
  }
  return _db;
}

let _bucket: ReturnType<typeof admin.storage.prototype.bucket> | null = null;
export function getBucket() {
  ensureInitialized();
  if (!_bucket) {
    _bucket = admin.storage().bucket();
  }
  return _bucket;
}

export { admin, firebaseConfig };
