import { ErrorInfo } from "react";

export interface ErrorLog {
  timestamp: string;
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userAgent: string;
}

/**
 * Log errors to console and optionally to a remote service
 */
export function logError(error: Error, errorInfo?: ErrorInfo): ErrorLog {
  const errorLog: ErrorLog = {
    timestamp: new Date().toISOString(),
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo?.componentStack,
    url: typeof window !== "undefined" ? window.location.href : "unknown",
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
  };

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error logged:", errorLog);
  }

  // Send to error tracking service (e.g., Sentry)
  if (process.env.NEXT_PUBLIC_ERROR_TRACKING_URL) {
    sendErrorToService(errorLog);
  }

  return errorLog;
}

/**
 * Send error to remote tracking service
 */
async function sendErrorToService(errorLog: ErrorLog): Promise<void> {
  try {
    await fetch(process.env.NEXT_PUBLIC_ERROR_TRACKING_URL!, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(errorLog),
    });
  } catch (err) {
    // Silently fail to avoid infinite error loops
    if (process.env.NODE_ENV === "development") {
      console.error("Failed to send error to tracking service:", err);
    }
  }
}

/**
 * Initialize global error handler
 */
export function initializeErrorHandler(): void {
  if (typeof window === "undefined") return;

  // Handle unhandled promise rejections
  window.addEventListener("unhandledrejection", (event) => {
    logError(new Error(event.reason));
  });

  // Set up error logger for error boundaries
  window.__errorLogger = (error: Error, errorInfo: ErrorInfo) => {
    logError(error, errorInfo);
  };
}
