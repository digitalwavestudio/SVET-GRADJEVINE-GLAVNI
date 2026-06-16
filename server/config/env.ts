import { z } from "zod";
import fs from "fs";
import path from "path";

// Load .env file programmatically if it exists
try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    if (typeof process.loadEnvFile === "function") {
      process.loadEnvFile(envPath);
    }
  }
} catch (e) {
  console.warn("Failed to load .env file using process.loadEnvFile", e);
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("3000"),
  VITE_API_URL: z.string().optional(),
  FIREBASE_PROJECT_ID: z.string().optional(),
  ADMIN_EMAILS: z.string().optional().default('[]'),
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_API_KEY: z.string().optional(),
  ALGOLIA_INDEX_NAME: z.string().optional().default("listings"),
  FIREBASE_SERVICE_ACCOUNT_KEY: z.string().optional(),
  GOOGLE_CLOUD_PROJECT: z.string().optional(),
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().optional(),
  REDIS_PORT: z.string().optional(),
  REDIS_PASSWORD: z.string().optional(),
  DB_READ_REPLICAS: z.string().optional(), // Zarezom odvojeni ID-evi projekata ili baze
  APP_REGION: z.string().optional().default("europe-west3"), // Default Frankfurt
  REDIS_REGION_URLS: z.string().optional(), // Format: region1:url1,region2:url2
  APP_MODE: z.enum(["api", "worker", "full"]).default("full"),
  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  LOG_FORMAT: z.enum(["json", "pretty"]).default("pretty"),
  SLACK_WEBHOOK_URL: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().optional(),
  DISABLE_FIRESTORE_QUOTA_CHECK: z.string().optional(),
  SECURITY_IP_PEPPER: z.string().optional(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  BILLING_SERVICE_URL: z.string().optional().default("http://localhost:4001"),
  GEMINI_API_KEY: z.string().optional(),
  BIGQUERY_PROJECT_ID: z.string().optional(),
  BIGQUERY_DATASET_ID: z.string().optional().default("telemetry_analytics"),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("❌ Invalid environment variables:", _env.error.format());
  throw new Error("Invalid environment variables");
}

export const env = _env.data;

// Parse the ADMIN_EMAILS safely
let parsedAdminEmails: string[] = [];
try {
  if (env.ADMIN_EMAILS) {
    parsedAdminEmails = JSON.parse(env.ADMIN_EMAILS);
  }
} catch (e) {
  console.warn(
    "Failed to parse ADMIN_EMAILS env string. Using default admin email.",
  );
}

export const ADMIN_EMAILS = parsedAdminEmails;
