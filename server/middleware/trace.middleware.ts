import { Request, Response, NextFunction } from "express";
import { TraceContext } from "../utils/trace.ts";
import { MonitoringService } from "../services/monitoring.service.ts";

function resolveRegionFromHeaders(headers: Record<string, string | string[] | undefined>): string {
  const city = (
    headers["x-appengine-city"] ||
    headers["x-client-city"] ||
    headers["x-geo-city"] ||
    ""
  ).toString().toLowerCase().trim();

  const regHeader = (
    headers["x-appengine-region"] ||
    headers["x-client-region"] ||
    headers["x-geo-region"] ||
    headers["x-cloud-run-region"] ||
    ""
  ).toString().toLowerCase().trim();

  // Mapping cities or region headers to specific zones
  if (
    city.includes("novi sad") ||
    city.includes("subotica") ||
    city.includes("zrenjanin") ||
    city.includes("sombor") ||
    city.includes("pancevo") ||
    city.includes("sremska mitrovica") ||
    city.includes("kikinda") ||
    city.includes("vrsac") ||
    city.includes("vršac") ||
    regHeader.includes("vojvodina") ||
    regHeader.includes("north-serbia") ||
    regHeader.includes("north_serbia")
  ) {
    return "vojvodina";
  }

  if (
    city.includes("nis") ||
    city.includes("niš") ||
    city.includes("leskovac") ||
    city.includes("vranje") ||
    city.includes("pirot") ||
    city.includes("prokuplje") ||
    regHeader.includes("juzna") ||
    regHeader.includes("južna") ||
    regHeader.includes("south-serbia") ||
    regHeader.includes("south_serbia")
  ) {
    return "juzna-srbija";
  }

  if (
    city.includes("kragujevac") ||
    city.includes("cacak") ||
    city.includes("čačak") ||
    city.includes("kraljevo") ||
    city.includes("krusevac") ||
    city.includes("kruševac") ||
    city.includes("novi pazar") ||
    city.includes("valjevo") ||
    city.includes("sabac") ||
    city.includes("šabac") ||
    city.includes("uzice") ||
    city.includes("užice") ||
    regHeader.includes("sumadija") ||
    regHeader.includes("šumadija") ||
    regHeader.includes("centralna") ||
    regHeader.includes("central-serbia") ||
    regHeader.includes("central_serbia")
  ) {
    return "centralna-srbija";
  }

  if (
    city.includes("beograd") ||
    city.includes("belgrade") ||
    regHeader.includes("beograd") ||
    regHeader.includes("belgrade")
  ) {
    return "beograd";
  }

  return "beograd"; // Default fallback
}

export function traceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const incomingTraceId = req.header("X-Trace-ID") || req.header("x-trace-id");

  TraceContext.run(incomingTraceId, () => {
    // Postavljamo TraceID u odgovor radi lakšeg debugginga sa klijentske strane
    res.setHeader("X-Trace-ID", TraceContext.getTraceId());

    // Resolve geographic region from Cloud Run headers and cache in context
    const resolvedRegion = resolveRegionFromHeaders(req.headers);
    TraceContext.set("resolvedRegion", resolvedRegion);

    // Detect bots and store in global trace context for deep pagination blocks and security layers
    const userAgent = req.get("User-Agent") || "";
    const isBot = /googlebot|bingbot|yandex|baidu|slurp|duckduckbot|sogou|spider|crawl|bot|gptbot|claudebot/i.test(userAgent);
    TraceContext.set("userAgent", userAgent);
    TraceContext.set("isBot", isBot ? "true" : "false");

    // Intercept finish to track bot status codes
    res.on("finish", () => {
      const userAgent = req.get("User-Agent") || "";
      let botType = "";
      if (userAgent.includes("Googlebot")) botType = "Googlebot";
      else if (userAgent.includes("GPTBot")) botType = "GPTBot";
      else if (userAgent.includes("ClaudeBot")) botType = "ClaudeBot";

      if (botType) {
        MonitoringService.recordBotHit(botType, req.path, res.statusCode);
      }
    });

    next();
  });
}
