import { test, expect } from '@playwright/test'

test('Liquidity Chart Render Test', async ({ page }) => {
  test.setTimeout(180000)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Find WETH/USDC pool (should have 0x address now)
  const wethPool = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  if (await wethPool.isVisible()) {
    console.log('1. Found WETH/USDC pool')
    await wethPool.click()
  } else {
    // Click first available pool
    const firstPool = page.locator('button').filter({ hasText: /WETH|USDC/ }).first()
    await firstPool.click()
    console.log('1. Clicked first available pool')
  }

  // Wait longer for API response
  console.log('2. Waiting for liquidity data...')
  await page.waitForTimeout(15000)

  // Screenshot before checking
  await page.screenshot({ path: 'test/e2e/screenshots/chart-render-1.png', fullPage: true })

  // Check for Liquidity Distribution
  const liquiditySection = await page.locator('text=Liquidity Distribution').isVisible()
  console.log('3. Liquidity Distribution visible:', liquiditySection)

  // Check for loading state
  const loading = await page.locator('text=Loading liquidity data').isVisible()
  console.log('4. Loading state:', loading)

  // Check for chart elements
  const rechartsSurface = await page.locator('svg.recharts-surface').isVisible()
  console.log('5. Recharts surface visible:', rechartsSurface)

  // Check for any SVG in the page
  const allSvgs = await page.locator('svg').count()
  console.log('6. Total SVG elements:', allSvgs)

  // Check for bar chart specifically
  const barRects = await page.locator('rect[class*="recharts"]').count()
  console.log('7. Recharts rect elements:', barRects)

  // Take final screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/chart-render-final.png', fullPage: true })

  // Get a snapshot of what's visible in the detail panel area
  const detailPanel = page.locator('div:has(button:has-text("Create Position"))').first()
  if (await detailPanel.isVisible()) {
    await detailPanel.screenshot({ path: 'test/e2e/screenshots/detail-panel-only.png' })
    console.log('8. Detail panel screenshot taken')
  }

  expect(liquiditySection).toBeTruthy()
})
