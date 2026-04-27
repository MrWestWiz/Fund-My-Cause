# Error Boundaries

Error boundaries are React components that catch JavaScript errors anywhere in the child component tree, log those errors, and display a fallback UI instead of crashing the entire app.

## Usage

### Basic Usage

```tsx
import { ErrorBoundary } from "@/components/ErrorBoundary";

export function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### With Custom Fallback

```tsx
<ErrorBoundary
  fallback={(error, reset) => (
    <div>
      <h1>Error: {error.message}</h1>
      <button onClick={reset}>Try again</button>
    </div>
  )}
>
  <YourComponent />
</ErrorBoundary>
```

### With Error Handler

```tsx
<ErrorBoundary
  onError={(error, errorInfo) => {
    // Send to error tracking service
    console.error("Error caught:", error, errorInfo);
  }}
>
  <YourComponent />
</ErrorBoundary>
```

### Different Levels

```tsx
// Page-level error boundary
<ErrorBoundary level="page">
  <PageContent />
</ErrorBoundary>

// Section-level error boundary
<ErrorBoundary level="section">
  <SectionContent />
</ErrorBoundary>

// Component-level error boundary
<ErrorBoundary level="component">
  <ComponentContent />
</ErrorBoundary>
```

## Error Logging

Errors are automatically logged using the `errorLogger` utility:

```tsx
import { logError, initializeErrorHandler } from "@/lib/errorLogger";

// Initialize on app startup
initializeErrorHandler();

// Manually log errors
try {
  // some code
} catch (error) {
  logError(error as Error);
}
```

## Features

- **Automatic Error Catching**: Catches errors in child components
- **Error Logging**: Logs errors to console and optional remote service
- **Unhandled Rejection Handling**: Catches unhandled promise rejections
- **Development Mode**: Shows detailed error information in development
- **Production Mode**: Shows user-friendly error messages in production
- **Error Recovery**: Provides "Try again" button to reset error state
- **Customizable Fallback**: Use default or custom error UI

## Configuration

Set the following environment variable to send errors to a remote service:

```bash
NEXT_PUBLIC_ERROR_TRACKING_URL=https://your-error-tracking-service.com/api/errors
```

## Best Practices

1. **Wrap at Multiple Levels**: Use error boundaries at page, section, and component levels
2. **Provide Context**: Include relevant context in error messages
3. **Log Errors**: Always log errors for debugging
4. **User-Friendly Messages**: Show helpful messages to users
5. **Recovery Options**: Provide ways for users to recover from errors

## Limitations

Error boundaries do NOT catch errors for:
- Event handlers (use try-catch instead)
- Asynchronous code (use try-catch or .catch())
- Server-side rendering
- Errors in the error boundary itself

For these cases, use try-catch blocks or the error logger utility.
