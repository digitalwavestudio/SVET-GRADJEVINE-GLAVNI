import express from "express";
import compression from "compression";
import { getStats } from "../controllers/dashboard.controller.ts";


import { requireAuth } from "../middleware/auth.middleware.ts";
import { dashboardAuthMiddleware } from "../middleware/dashboard-auth.middleware.ts";

const dashboardRouter = express.Router();




dashboardRouter.get("/stats", compression({ threshold: 512 }), requireAuth, dashboardAuthMiddleware, getStats);

export default dashboardRouter;
