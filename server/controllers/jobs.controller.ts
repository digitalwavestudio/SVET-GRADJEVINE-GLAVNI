import { Request, Response, NextFunction } from "express";
import { JobsService } from "../services/jobs.service.ts";
import { UnifiedAdsService } from "../services/unified-ads.service.ts";
import { env } from "../config/env.ts";
import { JobTransformer, RawJobInput } from "../bff/job.transformer.ts";
import { logDestructiveAction } from "../utils/destructive-audit.ts";
import { CacheService } from "../services/cache.service.ts";

export const getPublicJobs = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pageSize = Math.min(Math.max(Number(req.query.pageSize) || 10, 1), 50);
    const limit = pageSize + 1;
    const platform = req.headers["x-client-platform"];
    const cursor = (req.query.cursor as string) || undefined;

    console.info("[JOBS_CTRL] getPublicJobs called, calling JobsService.getPublicJobs...");
    const result = await JobsService.getPublicJobs(limit, cursor);

    let finalResult: {
      docs: any[];
      lastVisible: string | null;
      hasMore: boolean;
      warning?: string;
      isOptimized?: boolean;
    } = { ...result, hasMore: result.docs.length > pageSize };

    if (finalResult.hasMore) {
      finalResult.docs = result.docs.slice(0, pageSize);
      // Koristi cursorDocId koji je servis izračunao PRE sortiranja
      finalResult.lastVisible = (result as any)._cursorDocId || null;
    }

    if (platform === "mobile" && result && result.docs) {
      finalResult = {
        ...result,
        docs: result.docs.map((job) => JobTransformer.toMobile(job as unknown as RawJobInput)),
        isOptimized: true,
      };
    }

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

    const pageSize = Math.min(Math.max(Number(validated?.pageSize) || 24, 1), 50);

    // CACHING LOGIC FOR HOMEPAGE PREVIEWS (Plan 2 Optimization)
    const isPremiumHomepage =
      validated?.filters?.isPremium === true &&
      validated?.filters?.status === "active" &&
      pageSize === 6 &&
      !validated?.searchQuery;
    const isUrgentHomepage =
      validated?.filters?.isUrgent === true &&
      validated?.filters?.status === "active" &&
      pageSize === 6 &&
      !validated?.searchQuery;

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

    // Pass original pageSize (Firestore service internally does N+1 for hasMore detection)
    const result = await JobsService.searchJobs(
      validated,
      ipStr,
      useAlgoliaOptions,
    );

    // BFF logic: Transform based on platform + map lastVisibleId → lastVisible
    let finalResult: {
      docs: any[];
      lastVisible: string | null;
      hasMore: boolean;
      totalHits?: number;
      isOptimized?: boolean;
    } = {
      ...result,
      lastVisible: result.lastVisible || null,
      hasMore: result.hasMore || false,
    };

    if (platform === "mobile" && result && result.docs) {
      finalResult = {
        ...result,
        docs: result.docs.map((job) => JobTransformer.toMobile(job as unknown as RawJobInput)),
        isOptimized: true,
      };
    }

    if (cacheKey) {
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

    const job = await JobsService.getJobById(jobId);
    let result: unknown = job;

    if (platform === "mobile" && job) {
      result = JobTransformer.toMobile(job as unknown as RawJobInput);
    }

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
    const validatedJob = req.body;
    const uid = req.user.uid;
    const result = await UnifiedAdsService.createAd("jobs", validatedJob, uid);
    res.json({ id: result.id, jobData: (result as any).data });
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
