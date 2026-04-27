import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorBoundary } from "./ErrorBoundary";

// Component that throws an error
function ThrowError() {
  throw new Error("Test error");
}

// Component that renders normally
function NormalComponent() {
  return <div>Normal content</div>;
}

describe("ErrorBoundary", () => {
  // Suppress console.error for these tests
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("renders error fallback when error is thrown", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("calls onError callback when error occurs", () => {
    const onError = jest.fn();

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
  });

  it("renders custom fallback when provided", () => {
    const customFallback = (error: Error) => (
      <div>Custom error: {error.message}</div>
    );

    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Custom error: Test error")).toBeInTheDocument();
  });

  it("resets error state when reset button is clicked", async () => {
    const user = userEvent.setup();

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    // Click reset button
    const resetButton = screen.getByRole("button", { name: /try again/i });
    await user.click(resetButton);

    // Rerender with normal component
    rerender(
      <ErrorBoundary>
        <NormalComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText("Normal content")).toBeInTheDocument();
  });

  it("applies correct styling for different levels", () => {
    const { container: pageContainer } = render(
      <ErrorBoundary level="page">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(pageContainer.querySelector(".min-h-screen")).toBeInTheDocument();

    const { container: sectionContainer } = render(
      <ErrorBoundary level="section">
        <ThrowError />
      </ErrorBoundary>
    );

    expect(sectionContainer.querySelector(".p-6")).toBeInTheDocument();
  });
});
