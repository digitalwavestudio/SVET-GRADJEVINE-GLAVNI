import winston from "winston";
import { env } from "../config/env.ts";

const { combine, timestamp, json, errors, label, printf } = winston.format;

// Custom format for local development (if not in production)
const consoleFormat = printf(
  ({ level, message, label, timestamp, stack, ...metadata }) => {
    let msg = `${timestamp} [${level.toUpperCase()}] ${label ? `[${label}] ` : ""}${message}`;
    if (stack) {
      msg += `\n${stack}`;
    }
    if (Object.keys(metadata).length > 0 && metadata.constructor === Object) {
      msg += `\n${JSON.stringify(metadata, null, 2)}`;
    }
    return msg;
  },
);

// Configure the Winston Logger
export const Logger = winston.createLogger({
  level: env.LOG_LEVEL || "info", // 'debug', 'info', 'warn', 'error'
  exitOnError: false,
  format: combine(
    errors({ stack: true }), // Automatically log error stacks
    timestamp(),
    json(), // Default to JSON for production / observability tools structure
  ),
  defaultMeta: { service: "svet-gradjevine-backend" },
  transports: [
    // Write all logs with importance level of `error` or higher to `error.log`
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // Write all logs with importance level of `info` or higher to `combined.log`
    // new winston.transports.File({ filename: 'combined.log' }),
  ],
  exceptionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  ],
});

// If we're not in production then log to the `console` with a simpler format,
// but in Cloud Run (production), JSON logs to standard output are preferred for Cloud Logging / Google Cloud
if (process.env.NODE_ENV !== "production") {
  Logger.add(
    new winston.transports.Console({
      format: combine(winston.format.colorize(), consoleFormat),
    }),
  );
} else {
  // In production (Cloud Run), we log JSON to stdout for GCP Cloud Logging
  Logger.add(
    new winston.transports.Console({
      format: combine(timestamp(), json()),
    }),
  );
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  meta: unknown;
}

export class LoggerService {
  private static logsBuffer: LogEntry[] = [];
  private static readonly MAX_BUFFER_SIZE = 50;

  private static appendToBuffer(level: string, message: string, meta?: unknown) {
    const entry = { timestamp: new Date().toISOString(), level, message, meta };
    this.logsBuffer.push(entry);
    if (this.logsBuffer.length > this.MAX_BUFFER_SIZE) {
      this.logsBuffer.shift(); // Keep only the last 50
    }
  }

  static getRecentLogs() {
    return this.logsBuffer;
  }

  static info(message: string, meta?: unknown) {
    Logger.info(message, meta);
  }

  static warn(message: string, meta?: unknown) {
    this.appendToBuffer('warn', message, meta);
    Logger.warn(message, meta);
  }

  static error(message: string, meta?: unknown) {
    if (meta instanceof Error) {
      const errorMeta = { error: meta.message, stack: meta.stack };
      this.appendToBuffer('error', message, errorMeta);
      Logger.error(message, errorMeta);
    } else {
      this.appendToBuffer('error', message, meta);
      Logger.error(message, meta);
    }
  }

  static debug(message: string, meta?: unknown) {
    Logger.debug(message, meta);
  }
}
