import { Request, Response, NextFunction } from "express";

interface CoalescedResponse {
  statusCode: number;
  body: unknown;
  headers: Record<string, string | string[] | undefined>;
}

// In-flight active request map keyed by request key (method + url)
const inFlightRequests = new Map<string, Promise<CoalescedResponse>>();

/**
 * Express middleware for request coalescing (query deduplication)
 * Merges concurrent identical GET requests into a single database read
 */
export const requestCoalescingMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Coalesce only GET requests which are idempotent and have no side-effects
    if (req.method !== "GET") {
      return next();
    }

    // Generate unique key based on method and exact request URL
    const key = `${req.method}:${req.originalUrl}`;

    if (inFlightRequests.has(key)) {
      console.log(`⚡ [Coalescing] Query deduplicated! Joining in-flight execution for: ${key}`);
      try {
        const result = await inFlightRequests.get(key)!;
        
        // Pass down headers if any
        if (result.headers) {
          Object.entries(result.headers).forEach(([k, v]) => {
            if (v !== undefined) {
              res.setHeader(k, v);
            }
          });
        }
        
        res.setHeader("X-Coalesced", "HIT");
        return res.status(result.statusCode).json(result.body);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`❌ [Coalescing] In-flight execution failed for ${key}, falling back to original handler:`, errorMsg);
        // On error, proceed with the normal route execution flow as fallback
        return next();
      }
    }

    // It's the first request of this kind. Create a resolver promise
    let resolvePromise!: (val: CoalescedResponse) => void;
    let rejectPromise!: (err: unknown) => void;

    const inFlightPromise = new Promise<CoalescedResponse>((resolve, reject) => {
      resolvePromise = resolve;
      rejectPromise = reject;
    });

    inFlightRequests.set(key, inFlightPromise);

    // Patch res.json to capture response payload
    const originalJson = res.json.bind(res);
    res.json = (body: unknown) => {
      res.json = originalJson; // Restore
      
      // Complete response details
      const responseData: CoalescedResponse = {
        statusCode: res.statusCode,
        body,
        headers: {
          "content-type": res.getHeader("content-type") as string | undefined,
        },
      };

      resolvePromise(responseData);
      inFlightRequests.delete(key);
      return originalJson(body);
    };

    // Patch res.send just in case
    const originalSend = res.send.bind(res);
    res.send = (body: unknown) => {
      res.send = originalSend; // Restore
      
      let parsedBody = body;
      try {
        if (typeof body === "string") {
          parsedBody = JSON.parse(body);
        }
      } catch (e) {
        // Keeps plain text if not JSON
      }

      const responseData: CoalescedResponse = {
        statusCode: res.statusCode,
        body: parsedBody,
        headers: {
          "content-type": res.getHeader("content-type") as string | undefined,
        },
      };

      resolvePromise(responseData);
      inFlightRequests.delete(key);
      return originalSend(body);
    };

    // Stream finish/close listener context to prevent memory leaks if response ends abruptly
    const cleanup = () => {
      if (inFlightRequests.has(key)) {
        inFlightRequests.delete(key);
      }
    };
    res.on("finish", cleanup);
    res.on("close", cleanup);

    try {
      next();
    } catch (err) {
      rejectPromise(err);
      inFlightRequests.delete(key);
      next(err);
    }
  };
};
