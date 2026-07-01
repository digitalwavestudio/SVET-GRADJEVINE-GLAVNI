import { Request, Response, NextFunction } from "express";
import { AdminUsersService } from "../services/admin/admin-users.service.ts";
import { AdminCleanupService } from "../services/admin/admin-cleanup.service.ts";
import { AuditService } from "../services/audit.service.ts";
import { verifyUserSchema, updateUserSchema, idParamSchema, updateUserWalletSchema, suspendUserSchema, basePaginationQuerySchema } from "../dto/admin.dto.ts";

export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { targetUserId, isVerified } = verifyUserSchema.parse(req.body);
    const result = await AdminUsersService.verifyUser(targetUserId, isVerified, req.user.uid);
    AuditService.logDestructive(req, targetUserId, "USER_VERIFICATION", { isVerified });
    res.json(result);
  } catch (err) { next(err); }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const { updates } = updateUserSchema.parse(req.body);
    const result = await AdminUsersService.updateUser(id, updates, req.user.uid);
    AuditService.logDestructive(req, id, "ADMIN_UPDATE_USER", { updates });
    res.json(result);
  } catch (err) { next(err); }
};

export const syncClaims = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const result = await AdminUsersService.syncClaims(req.user.uid, req.user.email);
    res.json(result);
  } catch (err) { next(err); }
};

export const getUsers = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId, searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminUsersService.getUsers(limit || 15, lastDocId, searchQ);
    res.json(result);
  } catch (err) { next(err); }
};

export const suspendUser = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const { status, reason } = suspendUserSchema.parse(req.body);
    const result = await AdminUsersService.suspendUser(id, status, req.user.uid, reason);
    AuditService.logDestructive(req, id, status === "suspended" ? "ADMIN_USER_SUSPEND" : "ADMIN_USER_UNSUSPEND", { reason, status });
    res.json(result);
  } catch (err) { next(err); }
};

export const shutdownUserAccount = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const result = await AdminCleanupService.shutdownUserAccount(id, req.user.uid);
    AuditService.logDestructive(req, id, "ADMIN_USER_CASCADING_SHUTDOWN", { success: true });
    res.json(result);
  } catch (err) { next(err); }
};
