/**
 * Production-grade structured logging using Pino.
 *
 * Features:
 * - JSON structured logs in production
 * - Pretty-printed logs in development
 * - Configurable log levels via LOG_LEVEL env var
 * - ISO timestamps
 * - Proper error serialization
 * - Contextual metadata support
 * - Child loggers for modular components
 * - Safe error logging (no secrets)
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info({ userId: "123" }, "User logged in");
 *   logger.error({ err: error, requestId: "abc" }, "Failed to process request");
 */

import pino, { type ChildLoggerOptions, type LoggerOptions } from "pino";

// Sensitive field patterns to redact from logs
const SENSITIVE_FIELDS = [
  "password",
  "secret",
  "token",
  "apiKey",
  "api_key",
  "auth",
  "authorization",
  "bearer",
  "credential",
  "privateKey",
  "access_token",
  "refresh_token",
  "sessionToken",
];

/**
 * Log levels aligned with common observability standards.
 * Maps to Pino's numeric levels internally.
 */
export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Base log entry structure for all structured logs.
 */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string;
  /** Log level */
  level: LogLevel;
  /** Human-readable message */
  message: string;
  /** Optional error object */
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string | number;
  };
  /** Optional contextual metadata */
  context?: Record<string, unknown>;
}

/**
 * Logger interface for application code.
 * Provides type-safe logging with context support.
 */
export interface AppLogger {
  /** Log at debug level (verbose, only in development) */
  debug(obj?: Record<string, unknown> | string, msg?: string): void;
  /** Log at info level (normal operations) */
  info(obj?: Record<string, unknown> | string, msg?: string): void;
  /** Log at warn level (potential issues) */
  warn(obj?: Record<string, unknown> | string, msg?: string): void;
  /** Log at error level (errors that don't crash the app) */
  error(obj?: Record<string, unknown> | string, msg?: string): void;
  /** Log at fatal level (critical failures) */
  fatal(obj?: Record<string, unknown> | string, msg?: string): void;
  /** Create a child logger with additional context */
  child(bindings: Record<string, unknown>): AppLogger;
}

/**
 * Check if pretty printing is enabled.
 * Pretty printing is enabled in development or when LOG_PRETTY=true.
 */
function isPrettyPrintEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.LOG_PRETTY === "true";
}

/**
 * Get the configured log level from environment.
 * Defaults to 'info' in production, 'debug' in development.
 */
function getLogLevel(): LogLevel {
  const envLevel = process.env.LOG_LEVEL?.toLowerCase() as LogLevel | undefined;
  if (!envLevel) {
    return process.env.NODE_ENV === "development" ? "debug" : "info";
  }
  const validLevels: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
  return validLevels.includes(envLevel) ? envLevel : "info";
}

/**
 * Serialize error objects for safe logging.
 * Ensures errors are properly formatted and sensitive data is excluded.
 */
function serializeError(error: unknown): Record<string, unknown> {
  if (!(error instanceof Error)) {
    return { message: String(error) };
  }

  const serialized: Record<string, unknown> = {
    name: error.name,
    message: error.message,
  };

  // Include stack trace in development or for error/fatal level logs
  if (process.env.NODE_ENV === "development" || error.stack) {
    serialized.stack = error.stack;
  }

  // Include error code if present (e.g., Node.js error codes, HTTP status)
  if ("code" in error && error.code !== undefined) {
    serialized.code = error.code;
  }

  return serialized;
}

/**
 * Redact sensitive fields from log data.
 * Prevents accidental logging of secrets, tokens, passwords, etc.
 */
function redactSensitiveData(obj: Record<string, unknown>): Record<string, unknown> {
  const redacted = { ...obj };

  for (const field of SENSITIVE_FIELDS) {
    if (field in redacted) {
      redacted[field] = "[REDACTED]";
    }
  }

  return redacted;
}

/**
 * Create the base Pino logger instance.
 * Configured based on environment (dev vs prod).
 */
function createBaseLogger(): pino.Logger {
  const prettyPrint = isPrettyPrintEnabled();
  const level = getLogLevel();

  const options: LoggerOptions = {
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      // Format the log level for consistency
      level(label, _number) {
        return { level: label };
      },
      // Format bindings (contextual data)
      bindings(bindings) {
        return redactSensitiveData(bindings);
      },
    },
    // Custom error serializer
    serializers: {
      err: serializeError,
    },
    // Include hostname and pid for production debugging
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME ?? "unknown",
    },
  };

  if (prettyPrint) {
    options.transport = {
      target: "pino-pretty",
      options: {
        colorize: true,
        translateTime: "SYS:standard",
        ignore: "pid,hostname",
        levelFirst: true,
        messageFormat: "{msg}",
      },
    };
  }

  return pino(options);
}

/**
 * Internal Pino logger instance.
 * Use the exported `logger` for application code.
 */
const baseLogger = createBaseLogger();

/**
 * Create an AppLogger wrapper around a Pino logger.
 * Provides a consistent interface with proper typing.
 */
function createAppLogger(pinoLogger: pino.Logger): AppLogger {
  const appLogger: AppLogger = {
    debug(obj?: Record<string, unknown> | string, msg?: string) {
      if (obj instanceof Error) {
        pinoLogger.debug({ err: serializeError(obj) }, msg);
      } else if (typeof obj === "string") {
        pinoLogger.debug(obj);
      } else if (obj) {
        pinoLogger.debug(redactSensitiveData(obj), msg);
      } else {
        pinoLogger.debug(msg ?? "");
      }
    },

    info(obj?: Record<string, unknown> | string, msg?: string) {
      if (obj instanceof Error) {
        pinoLogger.info({ err: serializeError(obj) }, msg);
      } else if (typeof obj === "string") {
        pinoLogger.info(obj);
      } else if (obj) {
        pinoLogger.info(redactSensitiveData(obj), msg);
      } else {
        pinoLogger.info(msg ?? "");
      }
    },

    warn(obj?: Record<string, unknown> | string, msg?: string) {
      if (obj instanceof Error) {
        pinoLogger.warn({ err: serializeError(obj) }, msg);
      } else if (typeof obj === "string") {
        pinoLogger.warn(obj);
      } else if (obj) {
        pinoLogger.warn(redactSensitiveData(obj), msg);
      } else {
        pinoLogger.warn(msg ?? "");
      }
    },

    error(obj?: Record<string, unknown> | string, msg?: string) {
      if (obj instanceof Error) {
        pinoLogger.error({ err: serializeError(obj) }, msg);
      } else if (typeof obj === "string") {
        pinoLogger.error(obj);
      } else if (obj) {
        pinoLogger.error(redactSensitiveData(obj), msg);
      } else {
        pinoLogger.error(msg ?? "");
      }
    },

    fatal(obj?: Record<string, unknown> | string, msg?: string) {
      if (obj instanceof Error) {
        pinoLogger.fatal({ err: serializeError(obj) }, msg);
      } else if (typeof obj === "string") {
        pinoLogger.fatal(obj);
      } else if (obj) {
        pinoLogger.fatal(redactSensitiveData(obj), msg);
      } else {
        pinoLogger.fatal(msg ?? "");
      }
    },

    child(bindings: Record<string, unknown>): AppLogger {
      const childLogger = pinoLogger.child({ ...redactSensitiveData(bindings) }, {
        formatters: {
          bindings(bindings) {
            return redactSensitiveData(bindings);
          },
        },
      } as ChildLoggerOptions);
      return createAppLogger(childLogger);
    },
  };

  return appLogger;
}

/**
 * Main application logger.
 * Use this for all logging needs.
 *
 * @example
 *   import { logger } from "@/lib/logger";
 *
 *   // Simple message
 *   logger.info("Server started");
 *
 *   // With context
 *   logger.info({ userId: "123", action: "login" }, "User logged in");
 *
 *   // Error logging
 *   logger.error({ err: error, requestId: "abc" }, "Request failed");
 *
 *   // Child logger for modules
 *   const jobLogger = logger.child({ module: "job-queue" });
 *   jobLogger.info({ jobId: "456" }, "Job started");
 */
export const logger = createAppLogger(baseLogger);

/**
 * Create a child logger with additional context.
 * Useful for modules, components, or specific workflows.
 *
 * @example
 *   const aiLogger = createLogger({ module: "ai" });
 *   aiLogger.info({ model: "gpt-4" }, "Model loaded");
 */
export function createLogger(bindings: Record<string, unknown>): AppLogger {
  return logger.child(bindings);
}

/**
 * Parse a log line from JSON (useful for log analysis tools).
 */
export function parseLogLine(line: string): LogEntry | null {
  try {
    const parsed = JSON.parse(line) as Record<string, unknown>;
    return {
      timestamp: (parsed.time as string) ?? (parsed.timestamp as string) ?? new Date().toISOString(),
      level: (parsed.level as LogLevel) ?? "info",
      message: (parsed.msg as string) ?? (parsed.message as string) ?? "",
      error: parsed.err as LogEntry["error"],
      context: parsed as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

/**
 * Console compatibility layer.
 * Drop-in replacement for console.* that uses structured logging.
 * Use this for migrating existing console.* calls.
 */
export const structuredConsole = {
  log(...args: unknown[]) {
    logger.info({ console_args: args.map(String) }, "console.log");
  },
  debug(...args: unknown[]) {
    logger.debug({ console_args: args.map(String) }, "console.debug");
  },
  info(...args: unknown[]) {
    logger.info({ console_args: args.map(String) }, "console.info");
  },
  warn(...args: unknown[]) {
    logger.warn({ console_args: args.map(String) }, "console.warn");
  },
  error(...args: unknown[]) {
    const [first, ...rest] = args;
    if (first instanceof Error) {
      logger.error({ err: first, console_args: rest.map(String) }, "console.error");
    } else {
      logger.error({ console_args: args.map(String) }, "console.error");
    }
  },
};

export default logger;
