import { Request, Response, NextFunction } from "express";
import { JobsService } from "../services/jobs.service.ts";
import { env } from "../config/env.ts";
import { JobTransformer, RawJobInput } from "../bff/job.transformer.ts";
import { logDestructiveAction } from "../utils/destructive-audit.ts";

export const getPublicJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const limit = 100;
    const platform = req.headers["x-client-platform"];
    const cursor = (req.query.cursor as string) || undefined;

    // Server-side cache check
    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = cursor ? `public_jobs_${platform || "web"}_${cursor}` : `public_jobs_${platform || "web"}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const result = await JobsService.getPublicJobs(limit, cursor);

    let finalResult: {
      docs: any[];
      lastVisible: string | null;
      hasMore: boolean;
      warning?: string;
      isOptimized?: boolean;
    } = result;

    if (platform === "mobile" && result && result.docs) {
      finalResult = {
        ...result,
        docs: result.docs.map((job) => JobTransformer.toMobile(job as unknown as RawJobInput)),
        isOptimized: true,
      };
    }

    // Cache for 15 minutes
    await CacheService.set(cacheKey, finalResult, 900000);
    res.json(finalResult);
  } catch (error) {
    next(error);
  }
};

export const searchJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const validated = req.body;
    const ip =
      req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
    const ipStr = Array.isArray(ip) ? ip[0] : ip;
    const platform = req.headers["x-client-platform"];

    // CACHING LOGIC FOR HOMEPAGE PREVIEWS (Plan 2 Optimization)
    const isPremiumHomepage =
      validated?.filters?.isPremium === true &&
      validated?.filters?.status === "approved" &&
      validated?.pageSize === 6 &&
      !validated?.searchQuery;
    const isUrgentHomepage =
      validated?.filters?.isUrgent === true &&
      validated?.filters?.status === "approved" &&
      validated?.pageSize === 6 &&
      !validated?.searchQuery;

    const { CacheService } = await import("../services/cache.service.ts");
    let cacheKey = null;

    if (isPremiumHomepage)
      cacheKey = `homepage_premium_jobs_${platform || "web"}`;
    if (isUrgentHomepage)
      cacheKey = `homepage_urgent_jobs_${platform || "web"}`;

    if (cacheKey) {
      const cached = await CacheService.get(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    }

    const useAlgoliaOptions = {
      appId: env.ALGOLIA_APP_ID,
      apiKey: env.ALGOLIA_API_KEY,
    };

    const result = await JobsService.searchJobs(
      validated,
      ipStr,
      useAlgoliaOptions,
    );

    // BFF logic: Transform based on platform
    let finalResult: {
      docs: any[];
      lastVisible: string | null;
      hasMore: boolean;
      totalHits?: number;
      isOptimized?: boolean;
    } = result;

    if (platform === "mobile" && result && result.docs) {
      finalResult = {
        ...result,
        docs: result.docs.map((job) => JobTransformer.toMobile(job as unknown as RawJobInput)),
        isOptimized: true,
      };
    }

    if (cacheKey) {
      // Cache for 15 minutes to save Firestore Reads
      await CacheService.set(cacheKey, finalResult, 15 * 60 * 1000);
    }

    res.json(finalResult);
  } catch (error) {
    next(error);
  }
};

export const getJobById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const jobId = req.params.id;
    const platform = req.headers["x-client-platform"];

    // Server-side cache check
    const { CacheService } = await import("../services/cache.service.ts");
    const cacheKey = `job_${jobId}_${platform || "web"}`;
    const cached = await CacheService.get(cacheKey);
    if (cached) return res.json(cached);

    const job = await JobsService.getJobById(jobId);
    let result: unknown = job;

    if (platform === "mobile" && job) {
      result = JobTransformer.toMobile(job as unknown as RawJobInput);
    }

    // Cache for 15 minutes
    await CacheService.set(cacheKey, result, 900000);
    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const createJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { job: validatedJob } = req.body;
    const uid = req.user.uid;
    const result = await JobsService.createJob(validatedJob, uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const applyJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const validated = req.body;
    const userParams = {
      uid: req.user.uid,
      email: req.user.email || "",
      name: req.user.name || "",
    };

    const result = await JobsService.applyForJob(validated, userParams);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { id } = req.params;
    const updates = req.body;
    const uid = req.user.uid;

    const result = await JobsService.updateJob(id, updates, uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const deleteJob = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { id } = req.params;
    const uid = req.user.uid;

    const result = await JobsService.deleteJob(id, uid);

    // Internally log destructive job deletion asynchronously
    logDestructiveAction(req, id, "JOB_DELETION", { type: "job" });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const result = await JobsService.getApplications(
      req.params.jobId,
      req.user.uid,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const getUserApplications = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { role } = req.params;
    const limit = parseInt(req.query.limit as string) || 15;
    const cursor = req.query.cursor as string | undefined;
    const result = await JobsService.getUserApplications(req.user.uid, role, limit, cursor);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const updateApplicationStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { appId } = req.params;
    const { status } = req.body;
    const result = await JobsService.updateApplicationStatus(
      appId,
      status,
      req.user.uid,
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

export const checkApplied = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!req.user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const { jobId } = req.params;
    const result = await JobsService.checkIfAlreadyApplied(jobId, req.user.uid);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
