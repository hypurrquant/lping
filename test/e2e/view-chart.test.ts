import { test, expect } from '@playwright/test'

test('View Liquidity Chart in Browser', async ({ page }) => {
  test.setTimeout(120000)

  // Wide viewport to see both panels
  await page.setViewportSize({ width: 1600, height: 1000 })

  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  console.log('Page loaded')

  // Click WETH/USDC pool
  const wethUsdcPool = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  await wethUsdcPool.click()
  console.log('WETH/USDC pool clicked')

  // Wait for detail panel and API response
  await page.waitForTimeout(20000)

  // Take full page screenshot
  await page.screenshot({
    path: 'test/e2e/screenshots/browser-view-full.png',
    fullPage: true
  })

  // Scroll to show detail panel
  await page.evaluate(() => window.scrollTo(0, 0))

  // Take viewport screenshot
  await page.screenshot({
    path: 'test/e2e/screenshots/browser-view-viewport.png'
  })

  // Try to capture right side only (detail panel)
  await page.screenshot({
    path: 'test/e2e/screenshots/browser-detail-panel.png',
    clip: { x: 800, y: 0, width: 800, height: 1000 }
  })

  console.log('Screenshots taken')
})
