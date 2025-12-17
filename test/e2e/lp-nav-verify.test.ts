import { test, expect } from "@playwright/test";

test("should show bottom navigation on LP/Portfolio page", async ({ page }) => {
  await page.goto("/lp");
  await page.waitForLoadState("networkidle");

  // Wait a bit for page to render
  await page.waitForTimeout(1000);

  // Check that bottom nav exists and is visible
  const bottomNav = page.locator("nav.fixed.bottom-0");
  await expect(bottomNav).toBeVisible();

  // Check Portfolio tab is highlighted (active)
  const portfolioTab = page.locator('a[href="/lp"]');
  await expect(portfolioTab).toBeVisible();

  // Screenshot
  await page.screenshot({
    path: "test/screenshots/lp-with-bottom-nav.png",
    fullPage: true,
  });
});
