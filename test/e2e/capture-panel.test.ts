import { test, expect } from '@playwright/test'

test('Capture Detail Panel Only', async ({ page }) => {
  test.setTimeout(120000)

  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click WETH/USDC
  await page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first().click()
  await page.waitForTimeout(20000) // Wait for API

  // Find the detail panel container (right side)
  const detailPanel = page.locator('div.space-y-4').first()

  if (await detailPanel.isVisible()) {
    await detailPanel.screenshot({ path: 'test/e2e/screenshots/panel-detail-only.png' })
    console.log('Detail panel captured')
  }

  // Also try to capture the Liquidity Distribution section specifically
  const liquiditySection = page.locator('div:has(h3:has-text("Liquidity Distribution"))').first()
  if (await liquiditySection.isVisible()) {
    await liquiditySection.screenshot({ path: 'test/e2e/screenshots/panel-liquidity-section.png' })
    console.log('Liquidity section captured')
  }

  // Take a non-fullpage screenshot at higher quality
  await page.screenshot({
    path: 'test/e2e/screenshots/panel-viewport-hd.png',
    scale: 'css'
  })

  console.log('All screenshots captured')
})
