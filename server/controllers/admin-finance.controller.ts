import { Request, Response, NextFunction } from "express";
import { AdminFinanceService } from "../services/admin/admin-finance.service.ts";
import { AuditService } from "../services/audit.service.ts";
import { idParamSchema, basePaginationQuerySchema, updateUserWalletSchema } from "../dto/admin.dto.ts";

export const getCheckouts = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { limit, lastDocId, searchQ } = basePaginationQuerySchema.parse(req.query);
    const result = await AdminFinanceService.getCheckouts(limit || 20, lastDocId, searchQ);
    res.json(result);
  } catch (err) { next(err); }
};

export const updateUserWallet = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const { amount, type, reason } = updateUserWalletSchema.parse(req.body);
    const result = await AdminFinanceService.updateUserWallet(id, amount, type, req.user.uid, reason);
    AuditService.logDestructive(req, id, "ADMIN_WALLET_ADJUST", { amount, type, reason });
    res.json(result);
  } catch (err) { next(err); }
};

export const confirmCheckoutPayment = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
  try {
    const { id } = idParamSchema.parse(req.params);
    const result = await AdminFinanceService.confirmInvoicePayment(id, req.user.uid);
    AuditService.logDestructive(req, id, "ADMIN_CONFIRM_PAYMENT", { success: true });
    res.json(result);
  } catch (err) { next(err); }
};
