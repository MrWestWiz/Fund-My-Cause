import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: "http://localhost:3000",
    video: "retain-on-failure",
    trace: "retain-on-failure",
    // Visual regression: store screenshots next to spec files so baselines
    // live in version control and are easy to diff/review.
    screenshot: "only-on-failure",
  },
  // Visual-regression snapshot directory (checked into git for baseline review)
  snapshotDir: "./e2e/snapshots",
  // Baseline update workflow: run `npx playwright test --update-snapshots`
  // CI will fail if screenshots diverge beyond the per-test threshold.
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
      // Visual regression is Chromium-only to keep snapshots consistent
      testIgnore: "**/visual-regression.spec.ts",
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
      testIgnore: "**/visual-regression.spec.ts",
    },
  ],
  webServer: {
    command: "npm run dev --workspace=apps/interface",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
