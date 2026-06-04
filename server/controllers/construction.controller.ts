import { Request, Response, NextFunction } from "express";
import { ConstructionService } from "../services/construction.service.ts";
import type { AuthenticatedRequest } from "../types/auth.ts";

export const createSite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const result = await ConstructionService.createSite(uid, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getSites = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const limit = Number(req.query.limit) || 50;
    const result = await ConstructionService.getSites(uid, limit);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const updateSite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    const result = await ConstructionService.updateSite(uid, id, req.body);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const deleteSite = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const { id } = req.params;
    const result = await ConstructionService.deleteSite(uid, id);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const modifyWorker = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const { id, workerId } = req.params;

    if (req.method === "POST") {
      const result = await ConstructionService.addWorker(uid, id, req.body);
      return res.json(result);
    } else if (req.method === "PUT") {
      const result = await ConstructionService.updateWorker(uid, id, workerId, req.body);
      return res.json(result);
    } else if (req.method === "DELETE") {
      const result = await ConstructionService.deleteWorker(uid, id, workerId);
      return res.json(result);
    }
  } catch (e) {
    next(e);
  }
};

export const modifyResource = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const { id, resourceId } = req.params;

    if (req.method === "POST") {
      const result = await ConstructionService.addResource(uid, id, req.body);
      return res.json(result);
    } else if (req.method === "PUT") {
      const result = await ConstructionService.updateResource(uid, id, resourceId, req.body);
      return res.json(result);
    } else if (req.method === "DELETE") {
      const result = await ConstructionService.deleteResource(uid, id, resourceId);
      return res.json(result);
    }
  } catch (e) {
    next(e);
  }
};

export const updateMetrics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const uid = req.user.uid;
    const result = await ConstructionService.updateMetrics(uid, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
};
