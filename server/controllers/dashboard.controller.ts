import { Request, Response, NextFunction } from "express";
import { DashboardService } from "../services/dashboard/dashboard.service.ts";

export const getStats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const isAdmin =
      req.user.role === "admin" ||
      req.user.isAdmin;

    if (isAdmin) {
      const stats = await DashboardService.getAdminStats();
      const chartData = await DashboardService.getChartData();
      return res.json({ ...stats, chartData });
    }

    if (req.user.role === "poslodavac" || req.user.role === "COMPANY") {
      const stats = await DashboardService.getEmployerStats(req.user.uid);
      return res.json(stats);
    }

    if (req.user.role === "majstor" || req.user.role === "MASTER") {
      const stats = await DashboardService.getSmartMatches(req.user);
      return res.json({ smartMatches: stats });
    }

    res.json({ message: "Default stats", role: req.user.role });
  } catch (err) {
    next(err);
  }
};
