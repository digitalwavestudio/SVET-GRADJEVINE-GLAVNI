// 🛡️ [SECURITY-ENT-GUARD] Provereno i zasticeno od regresije
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { firebaseConfig } from "../config/firebase.ts";
import { Logger } from "../utils/logger.ts";

const logger = new Logger({ module: "JwksService" });

// Initialize JWKS client with robust in-memory caching to avoid CPU & I/O latency spikes
const client = jwksClient({
  jwksUri: "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com",
  cache: true,
  rateLimit: true,
  jwksRequestsPerMinute: 20,
  cacheMaxEntries: 100,
  cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours caching of Google public keys in RAM
});

/**
 * Promise-based helper to retrieve the Google/Firebase public key for a given kid from cache/JWKS.
 */
function getSigningKey(kid: string): Promise<string> {
  const fetchPromise = new Promise<string>((resolve, reject) => {
    client.getSigningKey(kid, (err, key) => {
      if (err) {
        logger.error(`[JWKS Cached Fetch] Failed to resolve signing key for kid: ${kid}`, err);
        reject(err);
      } else {
        const publicKey = key?.getPublicKey();
        if (publicKey) {
          resolve(publicKey);
        } else {
          reject(new Error(`Public key not found in JWKS for kid: ${kid}`));
        }
      }
    });
  });

  let timeoutId: NodeJS.Timeout | null = null;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(`JWKS request timeout (3000ms limit achieved) for kid: ${kid}`)), 3000);
  });

  return Promise.race([fetchPromise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  });
}

export class JwksService {
  /**
   * Verifies Firebase ID Token locally via memory-resident public certs.
   * Completely eliminates network latency spikes and Firebase API outbound limits.
   */
  public static async verifyIdTokenLocal(idToken: string): Promise<any> {
    const projectId = firebaseConfig.projectId;
    if (!projectId) {
      throw new Error("[JWKS] Firebase Project ID is not defined in current configuration.");
    }

    // 1. Decode token header to acquire the key identifier (kid)
    const decodedTokenHeader = jwt.decode(idToken, { complete: true }) as {
      header: { kid?: string; alg?: string };
      payload: any;
    } | null;

    if (!decodedTokenHeader || !decodedTokenHeader.header?.kid) {
      throw new Error("[JWKS] Invalid Token structure. Missing Key ID (kid).");
    }

    const { kid, alg } = decodedTokenHeader.header;
    if (alg !== "RS256") {
      throw new Error(`[JWKS] Unsupported algorithm: ${alg}. Only RS256 is verified.`);
    }

    // 2. Fetch public key from local JSON Web Key Set in-memory cache
    const publicKey = await getSigningKey(kid);

    // 3. Verify signature, expiration, issuer and audience locally
    const verifiedPayload = jwt.verify(idToken, publicKey, {
      algorithms: ["RS256"],
      audience: projectId,
      issuer: `https://securetoken.google.com/${projectId}`,
    });

    return verifiedPayload;
  }
}
