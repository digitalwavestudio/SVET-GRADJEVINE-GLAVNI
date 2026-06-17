import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { env } from "../config/env.ts";
import { AppError } from "../utils/appError.ts";
import { MonitoringService } from "../services/monitoring.service.ts";
import { LoggerService } from "../services/logger.service.ts";

export const globalErrorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const errMsg = err instanceof Error ? err.message : String(err);
  if (errMsg === "QUOTA_EXHAUSTED_NO_STALE_CACHE") {
    err = new AppError("System is temporarily operating under degraded mode (No stale cache available).", 429);
  }

  const isOperational = err instanceof AppError && err.statusCode < 500;
  const isValidation = err instanceof ZodError;
  const requestId = req.requestId;

  if (!isOperational && !isValidation) {
    // Sentry + Logger for critical unhandled errors
    MonitoringService.recordError(
      `${req.method} ${req.originalUrl} - ${errMsg || "Internal Server Error"}`,
      err instanceof Error ? err : new Error(errMsg),
    );
    LoggerService.error(`[Unhandled Error] ${errMsg}`, {
      error: err,
      requestId,
      url: req.originalUrl,
    });
    
    // Provera da li je Firestore Quota Limit (RESOURCE_EXHAUSTED)
    const errObj = err as Record<string, unknown> | null | undefined;
    const errCode = errObj?.code;
    const errMessage = errObj?.message;
    if (errObj && (errCode === 8 || errCode === 'RESOURCE_EXHAUSTED' || (typeof errMessage === 'string' && errMessage.includes('Quota exceeded')))) {
      import('../services/critical-alert.service.ts').then(({ CriticalAlertService }) => {
        CriticalAlertService.notifyQuotaExceeded({
          message: String(errMessage || ""),
          code: String(errCode || ""),
          url: req.originalUrl,
          method: req.method,
        }).catch(e => LoggerService.warn("[CriticalAlert] Failed to notify quota exceeded:", e));
      }).catch(e => console.error("[CRITICAL-ALERT] Failed to load service during error", e));
    }
  } else if (err instanceof AppError && err.statusCode !== 429 && !isValidation) {
    // Only log operational errors that are not Rate Limits
    LoggerService.warn(`[Operational Error] ${err.message}`, {
      statusCode: err.statusCode,
      requestId,
      url: req.originalUrl,
    });
  } else if (err instanceof ZodError) {
    LoggerService.warn(
      `[Validation Error] on ${req.method} ${req.originalUrl}`,
      { issues: err.issues, requestId },
    );
  }

  if (res.headersSent) {
    return next(err);
  }

  // Handle generic AppErrors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      status: "fail",
      message: "Invalid input data (Validation Error)",
      details: err.issues,
      stack: env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }

  // Handle default internal server errors
  const errObj = err as Record<string, unknown> | null | undefined;
  const status = (typeof errObj?.status === "number" ? errObj.status : undefined) || (typeof errObj?.statusCode === "number" ? errObj.statusCode : undefined) || 500;
  const message = err instanceof Error ? err.message : (typeof errObj?.message === "string" ? errObj.message : "Internal Server Error");

  res.status(status).json({
    status: status === 500 ? "error" : "fail",
    message,
    code: errObj?.code || null,
    stack: env.NODE_ENV === "development" && err instanceof Error ? err.stack : undefined,
  });
};
