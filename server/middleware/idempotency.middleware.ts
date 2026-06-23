import { Request, Response, NextFunction } from "express";
import { IdempotencyService } from "../services/idempotency.service.ts";

export async function idempotencyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Primjenjujemo samo na mutacione zahteve
  if (
    req.method !== "POST" &&
    req.method !== "PUT" &&
    req.method !== "PATCH" &&
    req.method !== "DELETE"
  ) {
    return next();
  }

  // Skip idempotency for read-only search endpoints (POST)
  const skipPaths = ["/api/search/", "/api/ads/search", "/api/jobs/search", "/api/users/search"];
  if (skipPaths.some(p => req.path.startsWith(p))) {
    return next();
  }

  // Tražimo klijentski definisan ključ ili pravimo dinamički debounce ključ
  let key = req.header("Idempotency-Key") || req.header("idempotency-key");

  if (!key) {
    if (req.user && req.user.uid) {
      // Dinamički Debounce Lock sa body hash-om da razlikuje različite zahteve
      const bodyHash = req.body ? JSON.stringify(req.body).length.toString(36) : "0";
      key = `debounce:${req.user.uid}:${req.method}:${req.baseUrl}${req.path}:${bodyHash}`;
    } else {
      // Ako nema usera i nema headera - puštamo kroz system bez idempotency (nije osigurano ali je graceful)
      return next();
    }
  }

  try {
    const record = await IdempotencyService.start(key);

    if (record) {
      if (record.status === "processing") {
        return res.status(409).json({
          error: "Conflict",
          message: "Vaš zahtev je već u obradi. Molimo sačekajte.",
        });
      }

      if (record.status === "completed" && record.response) {
        return res
          .status(record.response.statusCode)
          .json(record.response.body);
      }
    }

    // Presrećemo res.json da bi snimili odgovor
    const originalJson = res.json;
    res.json = function (body: unknown) {
      // Snimamo odgovor asinhrono
      IdempotencyService.finish(key as string, res.statusCode, body).catch(
        (err: unknown) => {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error("[Idempotency] Failed to save result:", errorMsg);
        },
      );
      return originalJson.call(this, body);
    };

    next();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Idempotency] Middleware error:", errorMsg);
    next();
  }
}
