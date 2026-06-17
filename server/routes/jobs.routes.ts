import { env } from "../config/env.ts";
import express from "express";
import { adCreationLimiter } from "../middleware/rate-limit.middleware.ts";
import {
  getPublicJobs,
  searchJobs,
  createJob,
  applyJob,
  getJobById,
  updateJob,
  deleteJob,
  getApplications,
  getUserApplications,
  updateApplicationStatus,
  checkApplied,
} from "../controllers/jobs.controller.ts";
import { validateRequest } from "../middleware/validate.ts";
import { authMiddleware } from "../middleware/auth.middleware.ts";
import { validateAdOwnership, validateApplicationOwnership } from "../middleware/ownership.middleware.ts";
import {
  jobSearchSchema,
  applicationSchema,
  jobSchema,
  applicationActionSchema,
} from "@svet-gradjevine/shared";

const createJobSchema = jobSchema;
const updateJobSchema = jobSchema.partial();

export const jobsRouter = express.Router();

jobsRouter.get("/", (req, res, next) => {
  if (env.NODE_ENV !== "production") { console.info("[JOBS_ROUTE] GET /api/jobs called, originalUrl:", req.originalUrl); }
  next();
}, getPublicJobs);
jobsRouter.get("/applications/user/:role", authMiddleware, getUserApplications);
jobsRouter.get("/applications/:jobId", authMiddleware, getApplications);
jobsRouter.patch(
  "/applications/:appId",
  authMiddleware,
  validateApplicationOwnership,
  validateRequest(applicationActionSchema),
  updateApplicationStatus,
);
jobsRouter.get("/applied/:jobId", authMiddleware, checkApplied);

jobsRouter.get("/:id", getJobById);
jobsRouter.post("/search", validateRequest(jobSearchSchema), searchJobs);
jobsRouter.post("/create", authMiddleware, adCreationLimiter, validateRequest(createJobSchema), createJob);
jobsRouter.post("/apply", authMiddleware, validateRequest(applicationSchema), applyJob);
jobsRouter.patch("/:id", authMiddleware, validateAdOwnership, validateRequest(updateJobSchema), updateJob);
jobsRouter.delete("/:id", authMiddleware, validateAdOwnership, deleteJob);
