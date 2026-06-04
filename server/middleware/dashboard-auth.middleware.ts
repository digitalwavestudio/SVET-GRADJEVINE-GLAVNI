import { Request, Response, NextFunction } from "express";

/**
 * Gatekeeper Middleware for dashboard resource protection.
 * Ensures the requesting user can only read/write their own data unless they are an admin.
 */
export function dashboardAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!req.user) {
    return res
      .status(401)
      .json({ error: "Zabranjen pristup - Korisnik nije prijavljen." });
  }

  // Admin bypass
  if (req.user.role === "admin" || req.user.isAdmin === true) {
    return next();
  }

  const currentUid = req.user.uid;

  // Gather values from query, params, and body
  const queryUid = req.query?.userId || req.query?.uid || req.query?.authorId;
  const paramsUid =
    req.params?.userId || req.params?.uid || req.params?.authorId;
  const bodyUid = req.body?.userId || req.body?.uid || req.body?.authorId;

  // If any ownership indicator exists, it must strictly match the logged-in user
  if (queryUid && queryUid !== currentUid) {
    return res.status(403).json({
      error:
        "Zabranjen pristup - Nemate dozvolu za pristup resursima drugog korisnika.",
    });
  }
  if (paramsUid && paramsUid !== currentUid) {
    return res.status(403).json({
      error:
        "Zabranjen pristup - Nemate dozvolu za pristup resursima drugog korisnika.",
    });
  }
  if (bodyUid && bodyUid !== currentUid) {
    return res.status(403).json({
      error:
        "Zabranjen pristup - Nemate dozvolu za pristup resursima drugog korisnika.",
    });
  }

  next();
}
