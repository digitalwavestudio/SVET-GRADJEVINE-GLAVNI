import { Request, Response, NextFunction } from "express";
import { RedirectService } from "../services/redirect.service.ts";

/**
 * SEO Redirection Middleware
 * Intercepts legacy WordPress URL patterns and issues 301 Permanent Redirects
 * to preserve PageRank and improve UX during migration.
 */
export const redirectMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Only process GET requests
  if (req.method !== "GET") {
    return next();
  }

  const path = req.path;
  const redirectPath = RedirectService.getRedirectPath(path);

  if (redirectPath) {
    if (process.env.NODE_ENV !== "production") console.log(`[SEO-Redirect] Redirecting legacy path ${path} to ${redirectPath} (301)`);
    
    // Preserve query strings if any
    const queryString = req.url.includes("?") ? req.url.split("?")[1] : "";
    const finalUrl = queryString ? `${redirectPath}?${queryString}` : redirectPath;

    // Use 301 for permanent SEO moves
    return res.redirect(301, finalUrl);
  }

  next();
};
