import { test, expect } from "./fixtures/wallet";

/**
 * Issue #724 – Visual regression tests for key pages
 *
 * Captures page-level screenshots (baselines) and diffs them on each run.
 * Playwright's toHaveScreenshot() stores baselines in
 *   e2e/visual-regression.spec.ts-snapshots/
 *
 * To update baselines intentionally run:
 *   npx playwright test visual-regression --update-snapshots
 *
 * Unintended visual changes fail CI (threshold: 0.2 % of pixels).
 */

const THRESHOLD = 0.002; // 0.2 % pixel-diff threshold

test.describe("Visual Regression – key pages", () => {
  // ── Home page ────────────────────────────────────────────────────────────
  test("home page matches baseline", async ({ page }) => {
    await page.goto("/");
    // Let fonts + images settle
    await page.waitForLoadState("networkidle");
    // Mask dynamic content (prices, timers, wallet address) to avoid noise
    await expect(page).toHaveScreenshot("home.png", {
      fullPage: true,
      maxDiffPixelRatio: THRESHOLD,
      mask: [
        page.locator("[data-testid='countdown-timer']"),
        page.locator("[data-testid='wallet-address']"),
        page.locator("time"),
      ],
    });
  });

  // ── Campaigns list ────────────────────────────────────────────────────────
  test("campaigns list page matches baseline", async ({ page }) => {
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("campaigns.png", {
      fullPage: true,
      maxDiffPixelRatio: THRESHOLD,
      mask: [
        page.locator("[data-testid='countdown-timer']"),
        page.locator("time"),
      ],
    });
  });

  // ── Campaign detail ───────────────────────────────────────────────────────
  test("campaign detail page matches baseline", async ({ page }) => {
    await page.goto("/campaigns");
    await page.waitForLoadState("networkidle");

    const firstLink = page.locator("a[href*='/campaigns/']").first();
    const href = await firstLink.getAttribute("href");
    if (!href) {
      test.skip();
      return;
    }

    await page.goto(href);
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("campaign-detail.png", {
      fullPage: true,
      maxDiffPixelRatio: THRESHOLD,
      mask: [
        page.locator("[data-testid='countdown-timer']"),
        page.locator("time"),
        page.locator("[role='progressbar']"),
      ],
    });
  });

  // ── Dashboard ────────────────────────────────────────────────────────────
  test("dashboard page matches baseline", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("dashboard.png", {
      fullPage: true,
      maxDiffPixelRatio: THRESHOLD,
      mask: [
        page.locator("[data-testid='wallet-address']"),
        page.locator("[data-testid='countdown-timer']"),
        page.locator("time"),
      ],
    });
  });

  // ── Analytics ────────────────────────────────────────────────────────────
  test("analytics page matches baseline", async ({ page }) => {
    // The app uses [locale] routing; try /en/analytics then fall back
    for (const path of ["/en/analytics", "/analytics"]) {
      const response = await page.goto(path);
      if (response && response.ok()) break;
    }
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("analytics.png", {
      fullPage: true,
      maxDiffPixelRatio: THRESHOLD,
      mask: [
        page.locator("time"),
        page.locator("[data-testid='chart']"),
        page.locator("canvas"),
      ],
    });
  });

  // ── Mobile viewport – home page ──────────────────────────────────────────
  test("home page matches baseline on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");
    await expect(page).toHaveScreenshot("home-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: THRESHOLD,
      mask: [
        page.locator("[data-testid='countdown-timer']"),
        page.locator("time"),
      ],
    });
  });
});
