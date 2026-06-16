import { Request, Response, NextFunction } from "express";
import { CacheService } from "../services/cache.service.ts";
import { Logger } from "../utils/logger.ts";

const logger = new Logger({ middleware: "Cache" });

/**
 * Express middleware za automatsko keširanje GET zahteva.
 * @param ttlMs Vreme trajanja keša u milisekundama (default: 60 sekundi)
 * @param prefix Prefiks za ključ, korisno za segmentaciju ili invalidaciju (default: 'req')
 */
export const cacheMiddleware = (
  ttlMs: number = 60000,
  prefix: string = "req",
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Keširamo isključivo GET metode, koje nemaju side-effekte i nisu specifkacija na usera
    if (req.method !== "GET") {
      return next();
    }

    // Isključujemo authenticated rute od keširanja kako jedan user ne bi video scope drugog
    if (req.headers.authorization) {
      return next();
    }

    // Generišemo jedinstveni ključ na osnovu URL-a
    // Ignorišemo random querije ako su samo cache-busting (v=) ali za sad kompletno hashiramo url
    const key = `${prefix}:${req.originalUrl}`;

    try {
      const cachedResponse = await CacheService.get<unknown>(key);
      if (cachedResponse) {
        // Vraćamo keširan odgovor
        const responseData =
          typeof cachedResponse === "string"
            ? JSON.parse(cachedResponse)
            : cachedResponse;

        const seconds = Math.floor(ttlMs / 1000);
        // Postavljamo HTTP cache hedera za browser i CND
        res.setHeader(
          "Cache-Control",
          `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
        );
        res.setHeader("X-Cache", "HIT");

        return res.json(responseData);
      }
    } catch (error) {
      logger.error("Error fetching from cache:", error);
      // Fallback na normalnu egzekuciju
    }

    // Overajdujemo res.json da hvatamo rezultat i keširamo ga
    const originalJson = res.json.bind(res);

    res.json = (body: unknown) => {
      // Ignorišemo keširanje error responsa
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const seconds = Math.floor(ttlMs / 1000);
        res.setHeader(
          "Cache-Control",
          `public, max-age=${seconds}, s-maxage=${seconds}, stale-while-revalidate=${seconds * 2}`,
        );
        res.setHeader("X-Cache", "MISS");

        try {
          CacheService.set(key, body, ttlMs).catch((err) => {
            logger.error("Error setting cache:", err);
          });
        } catch (error) {
          // ignore
        }
      }
      return originalJson(body);
    };

    next();
  };
};
