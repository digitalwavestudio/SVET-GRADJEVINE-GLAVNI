import winston from "winston";
import os from "os";
import { TraceContext } from "./trace.ts";
import { env } from "../config/env.ts";

const INSTANCE_ID = os.hostname();

// Definisanje formata logova
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info as import("winston").Logform.TransformableInfo & { timestamp?: string; stack?: string };
    const traceId = TraceContext.getTraceId();
    const data: Record<string, unknown> = {
      timestamp,
      level: level.toUpperCase(),
      message,
      traceId,
      instanceId: INSTANCE_ID,
      service: meta.service || "web-api",
      ...meta,
    };

    if (stack) {
      data.stack = stack;
    }

    if (env.LOG_FORMAT === "pretty") {
      const colorizer = winston.format.colorize();
      const levelStr = colorizer.colorize(level, level.toUpperCase().padEnd(5));
      const metaStr = Object.keys(meta).length
        ? ` ${JSON.stringify(meta)}`
        : "";
      const traceStr = traceId ? ` [${traceId}]` : "";
      return `${timestamp} ${levelStr}${traceStr}: ${message}${metaStr}${stack ? `\n${stack}` : ""}`;
    }

    return JSON.stringify(data);
  }),
);

const winstonLogger = winston.createLogger({
  level: env.LOG_LEVEL || "info",
  format: customFormat,
  transports: [
    new winston.transports.Console({
      stderrLevels: ["error"],
    }),
  ],
});

export class Logger {
  private context: Record<string, unknown> = {};

  constructor(context: Record<string, unknown> = {}) {
    this.context = {
      service: "web-api",
      instanceId: INSTANCE_ID,
      env: env.NODE_ENV || "development",
      ...context,
    };
  }

  static withContext(correlationId?: string) {
    return new Logger({ correlationId });
  }

  log(level: string, message: string, data?: unknown) {
    const dataObj = (data && typeof data === "object" && !Array.isArray(data)) 
      ? (data as Record<string, unknown>) 
      : (data ? { data } : {});
      
    const meta = { ...this.context, ...dataObj };
    winstonLogger.log(level.toLowerCase(), message, meta);
  }

  info(message: string, data?: unknown) {
    this.log("info", message, data);
  }
  warn(message: string, data?: unknown) {
    this.log("warn", message, data);
  }
  error(message: string, data?: unknown) {
    this.log("error", message, data);
  }
  debug(message: string, data?: unknown) {
    this.log("debug", message, data);
  }
}

export const logger = new Logger();
