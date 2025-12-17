import { test, expect } from "@playwright/test";

test.describe("MiniApp Unified Experience", () => {
  test("should show bottom navigation on explore page", async ({ page }) => {
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    // Check that bottom nav exists
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: "test/screenshots/miniapp-explore-with-nav.png",
      fullPage: true,
    });
  });

  test("should show bottom navigation on analyze page", async ({ page }) => {
    await page.goto("/analyze");
    await page.waitForLoadState("networkidle");

    // Check that bottom nav exists
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: "test/screenshots/miniapp-analyze-with-nav.png",
      fullPage: true,
    });
  });

  test("should NOT show bottom navigation on landing page", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Bottom nav should not be visible on landing
    const bottomNav = page.locator("nav.fixed.bottom-0");
    await expect(bottomNav).not.toBeVisible();

    // Check quick access cards exist
    const portfolioCard = page.getByText("My Portfolio");
    await expect(portfolioCard).toBeVisible();

    // Screenshot
    await page.screenshot({
      path: "test/screenshots/miniapp-landing.png",
      fullPage: true,
    });
  });

  test("should navigate between pages using bottom nav", async ({ page }) => {
    // Start on explore page
    await page.goto("/explore");
    await page.waitForLoadState("networkidle");

    // Click on Portfolio tab
    await page.click('a[href="/lp"]');
    await page.waitForURL("**/lp**");

    // Check URL changed
    expect(page.url()).toContain("/lp");

    // Click on Analyze tab
    await page.click('a[href="/analyze"]');
    await page.waitForURL("**/analyze**");

    expect(page.url()).toContain("/analyze");
  });

  test("should deep link to analyze page with pool parameter", async ({
    page,
  }) => {
    // Navigate to analyze with pool parameter
    await page.goto("/analyze?pool=WETH-USDC");
    await page.waitForLoadState("networkidle");

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Screenshot
    await page.screenshot({
      path: "test/screenshots/miniapp-analyze-deeplink.png",
      fullPage: true,
    });
  });
});
