import { Request, Response, NextFunction } from "express";
import { DashboardAdminService } from "../services/dashboard/dashboard-admin.service.ts";
import { DashboardEmployerService } from "../services/dashboard/employer-dashboard.service.ts";
import { DashboardSmartMatchService } from "../services/dashboard/dashboard-matches.service.ts";

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
      const stats = await DashboardAdminService.getAdminStats();
      const chartData = await DashboardAdminService.getChartData();
      return res.json({ ...stats, chartData });
    }

    if (req.user.role === "poslodavac" || req.user.role === "COMPANY") {
      const stats = await DashboardEmployerService.getEmployerStats(req.user.uid);
      return res.json(stats);
    }

    if (req.user.role === "majstor" || req.user.role === "MASTER") {
      const stats = await DashboardSmartMatchService.getSmartMatches(req.user);
      return res.json({ smartMatches: stats });
    }

    res.json({ message: "Default stats", role: req.user.role });
  } catch (err) {
    next(err);
  }
};
