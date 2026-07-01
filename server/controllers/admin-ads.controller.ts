import { Request, Response, NextFunction } from "express";
import { AdminAdsService } from "../services/admin/admin-ads.service.ts";
import { AdminModerationService } from "../services/admin/admin-moderation.service.ts";
import { AuditService } from "../services/audit.service.ts";
import { idParamSchema, basePaginationQuerySchema, resolveReportSchema } from "../dto/admin.dto.ts";

export const getModerationQueue = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, cursor, searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminAdsService.getModerationQueue(limit || 25, cursor, searchQ);
    res.json(result);
  } catch (err) { next(err); }
};

export const editListing = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { collection, id } = req.params;
    const { updates } = req.body;
    if (!collection || !id || !updates) return res.status(400).json({ error: "Missing required fields" });
    const result = await AdminAdsService.editListing(collection, id, updates, req.user.uid);
    AuditService.logDestructive(req, id, "ADMIN_EDIT_LISTING", { collection, updates });
    res.json(result);
  } catch (err) { next(err); }
};

export const moderateListing = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { collection, id } = req.params;
    const { status, feedback } = req.body;
    if (!collection || !id || !status) return res.status(400).json({ error: "Missing required fields" });
    const result = await AdminAdsService.moderateListing(collection, id, status, req.user.uid, feedback);
    AuditService.logDestructive(req, id, "ADMIN_MODERATE_LISTING", { collection, status, feedback });
    res.json(result);
  } catch (err) { next(err); }
};

export const getReportTranscript = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = req.params;
    const result = await AdminModerationService.getReportTranscript(id);
    res.json(result);
  } catch (err) {
    if ((err as Error).message === "Report not found") return res.status(404).json({ error: "Report not found" });
    if ((err as Error).message.includes("only available for chat reports")) return res.status(400).json({ error: (err as Error).message });
    next(err);
  }
};

export const resolveReport = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, note } = resolveReportSchema.parse(req.body);
    const result = await AdminModerationService.resolveReport(id, status, note, req.user.uid);
    AuditService.logDestructive(req, id, "ADMIN_RESOLVE_REPORT", { status, note });
    res.json(result);
  } catch (err) { next(err); }
};
