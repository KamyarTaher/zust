/**
 * Standalone Logging Middleware - No Zustand dependency
 * Note: The new engine handles middleware differently.
 * This file primarily exports types for configuration.
 */

/**
 * Log levels for the logging middleware.
 */
export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

/**
 * Configuration options for the logging middleware.
 */
export interface LoggingOptions {
  /** The log level to use (default: INFO in development, NONE in production) */
  level?: LogLevel;
  /** Whether to log in production (default: false) */
  enableInProduction?: boolean;
  /** Custom logger function (default: console) */
  logger?: {
    log: (...args: unknown[]) => void;
    warn: (...args: unknown[]) => void;
    error: (...args: unknown[]) => void;
  };
  /** Whether to log the diff between states (default: false) */
  logDiff?: boolean;
}

/**
 * Determines if we're in production mode.
 */
const isProduction = (): boolean => {
  return typeof process !== "undefined" && process.env?.NODE_ENV === "production";
};

/**
 * Creates a simple diff between two objects (shallow comparison).
 */
function getDiff<T>(prev: T, next: T): Partial<T> {
  if (typeof prev !== "object" || typeof next !== "object" || prev === null || next === null) {
    return next as Partial<T>;
  }

  const diff: Partial<T> = {};
  const allKeys = new Set([...Object.keys(prev as object), ...Object.keys(next as object)]);

  for (const key of allKeys) {
    const prevValue = (prev as Record<string, unknown>)[key];
    const nextValue = (next as Record<string, unknown>)[key];

    if (prevValue !== nextValue) {
      (diff as Record<string, unknown>)[key] = nextValue;
    }
  }

  return diff;
}

/**
 * Create a logging middleware that can be used with the store
 *
 * @param options - Configuration options for logging
 * @returns A middleware function
 */
export function createLoggingMiddleware<T extends object>(
  options: LoggingOptions = {}
): (next: (state: T) => T) => (state: T) => T {
  const {
    level = isProduction() ? LogLevel.NONE : LogLevel.INFO,
    enableInProduction = false,
    logger = console,
    logDiff = false,
  } = options;

  // Disable logging in production unless explicitly enabled
  if (isProduction() && !enableInProduction) {
    return (next) => next;
  }

  // If log level is NONE, skip middleware
  if (level === LogLevel.NONE) {
    return (next) => next;
  }

  return (next) => (state) => {
    if (level >= LogLevel.INFO) {
      logger.log("[Zust] State update:", state);
    }

    const result = next(state);

    if (level >= LogLevel.INFO && logDiff) {
      const diff = getDiff(state, result);
      logger.log("[Zust] State diff:", diff);
    }

    return result;
  };
}

/**
 * Legacy export for backwards compatibility
 * @deprecated Use createLoggingMiddleware instead
 */
export const loggingMiddleware = createLoggingMiddleware;