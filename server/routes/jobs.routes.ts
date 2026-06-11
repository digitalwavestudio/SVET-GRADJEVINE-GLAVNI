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
import { authMiddleware, requireAuth } from "../middleware/auth.middleware.ts";
import { validateApplicationOwnership } from "../middleware/ownership.middleware.ts";
import {
  jobSearchSchema,
  applicationSchema,
  jobSchema,
  applicationActionSchema,
} from "@svet-gradjevine/shared";
import { z } from "zod";
import { cacheMiddleware } from "../middleware/cache.middleware.ts";

const createJobSchema = jobSchema;

export const jobsRouter = express.Router();

jobsRouter.get("/", cacheMiddleware(30000, "jobs_public"), getPublicJobs);
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
jobsRouter.patch("/:id", authMiddleware, validateRequest(jobSchema), updateJob);
jobsRouter.delete("/:id", authMiddleware, deleteJob);
