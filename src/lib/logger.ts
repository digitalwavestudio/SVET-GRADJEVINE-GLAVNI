
export enum LogLevel {
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error'
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: unknown;
  uid?: string;
  url?: string;
}

class Logger {
  private static instance: Logger;
  
  private constructor() {}

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  public log(entry: LogEntry) {
    const enrichedEntry = {
      ...entry,
      uid: entry.uid || 'anonymous',
      url: typeof window !== 'undefined' ? window.location.href : 'server',
    };

    // Always log to console
    console[entry.level === LogLevel.ERROR ? 'error' : entry.level === LogLevel.WARN ? 'warn' : 'log'](
      `[${entry.level.toUpperCase()}] ${entry.message}`, 
      entry.context
    );

    // Persist to Backend if it's a critical error (non-blocking)
    if (entry.level === LogLevel.ERROR) {
      fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedEntry)
      }).catch(() => {
        // Silent fail for logging persistence
      });
    }
  }

  public info(message: string, context?: unknown) {
    this.log({ level: LogLevel.INFO, message, context });
  }

  public warn(message: string, context?: unknown) {
    this.log({ level: LogLevel.WARN, message, context });
  }

  public error(message: string, context?: unknown) {
    this.log({ level: LogLevel.ERROR, message, context });
  }
}

export const logger = Logger.getInstance();
