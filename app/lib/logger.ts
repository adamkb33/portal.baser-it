// ~/lib/logger.ts

import { ENV } from '~/api/config/env';

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = ENV.NODE_ENV === 'development';

  private serializeError(error: unknown): string {
    if (error instanceof Response) {
      return `Response(status=${error.status}, statusText=${error.statusText})`;
    }
    if (error instanceof Error) {
      return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`;
    }
    if (typeof error === 'object' && error !== null) {
      try {
        return JSON.stringify(error, null, 2);
      } catch {
        return String(error);
      }
    }
    return String(error);
  }

  error(message: string, context?: LogContext): void {
    const serialized = context ? this.serializeContext(context) : '';
    console.error(`[ERROR] ${message}`, serialized);
  }

  warn(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const serialized = context ? this.serializeContext(context) : '';
      console.warn(`[WARN] ${message}`, serialized);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const serialized = context ? this.serializeContext(context) : '';
      console.info(`[INFO] ${message}`, serialized);
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      const serialized = context ? this.serializeContext(context) : '';
      console.debug(`[DEBUG] ${message}`, serialized);
    }
  }

  private serializeContext(context: LogContext): string {
    const serialized: Record<string, string> = {};

    for (const [key, value] of Object.entries(context)) {
      if (value instanceof Response) {
        serialized[key] = `Response(status=${value.status}, statusText=${value.statusText})`;
      } else if (value instanceof Error) {
        serialized[key] = `${value.name}: ${value.message}`;
      } else {
        serialized[key] = typeof value === 'object' ? JSON.stringify(value) : String(value);
      }
    }

    return JSON.stringify(serialized, null, 2);
  }
}

export const logger = new Logger();
