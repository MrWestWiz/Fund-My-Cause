"use client";

import React, { ReactNode, Component, ErrorInfo } from "react";
import { AlertCircle } from "lucide-react";

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: "page" | "section" | "component";
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component for catching React errors
 * @example
 * <ErrorBoundary level="section">
 *   <SomeComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // Log to error tracking service (e.g., Sentry)
    if (typeof window !== "undefined" && window.__errorLogger) {
      window.__errorLogger(error, errorInfo);
    }
  }

  reset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }

      return <DefaultErrorFallback error={this.state.error} reset={this.reset} level={this.props.level} />;
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: Error;
  reset: () => void;
  level?: "page" | "section" | "component";
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error, reset, level = "component" }: DefaultErrorFallbackProps) {
  const containerClasses = {
    page: "min-h-screen flex items-center justify-center p-4",
    section: "p-6 rounded-lg border border-red-200 bg-red-50",
    component: "p-4 rounded border border-red-200 bg-red-50",
  };

  const titleClasses = {
    page: "text-3xl",
    section: "text-xl",
    component: "text-lg",
  };

  return (
    <div className={containerClasses[level]}>
      <div className="max-w-md w-full">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h2 className={`font-semibold text-red-900 ${titleClasses[level]}`}>
              Something went wrong
            </h2>
            <p className="text-sm text-red-700 mt-2">
              {process.env.NODE_ENV === "development"
                ? error.message
                : "An unexpected error occurred. Please try again."}
            </p>
            {process.env.NODE_ENV === "development" && (
              <details className="mt-3 text-xs text-red-600">
                <summary className="cursor-pointer font-mono">Error details</summary>
                <pre className="mt-2 p-2 bg-red-100 rounded overflow-auto max-h-40">
                  {error.stack}
                </pre>
              </details>
            )}
            <button
              onClick={reset}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extend window interface for error logger
declare global {
  interface Window {
    __errorLogger?: (error: Error, errorInfo: ErrorInfo) => void;
  }
}
