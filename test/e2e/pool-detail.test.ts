import { test } from "@playwright/test";

test("screenshot pool detail with emission info", async ({ page }) => {
  await page.goto("/explore");
  await page.waitForLoadState("networkidle");

  // Wait for pools to load
  await page.waitForTimeout(3000);

  // Click on second pool (WETH/USDC)
  await page.click('text=WETH/USDC');

  // Wait for detail to load (including on-chain data)
  await page.waitForTimeout(15000);

  // Screenshot
  await page.screenshot({
    path: "test/screenshots/pool-detail-emissions.png",
    fullPage: true,
  });
});
