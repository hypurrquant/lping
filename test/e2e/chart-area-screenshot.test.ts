import { test, expect } from '@playwright/test'

test('Capture chart area', async ({ page }) => {
  test.setTimeout(120000)

  await page.setViewportSize({ width: 1400, height: 900 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // Select WETH/USDC pool
  const wethPool = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  await wethPool.click()
  console.log('Pool selected')

  // Wait for data
  await page.waitForTimeout(20000)

  // Find and scroll to the Liquidity Distribution heading
  const liquidityHeading = page.locator('h3').filter({ hasText: 'Liquidity Distribution' })
  await liquidityHeading.scrollIntoViewIfNeeded()
  await page.waitForTimeout(1000)

  // Get the chart wrapper
  const chartWrapper = page.locator('.recharts-wrapper').first()
  const isChartVisible = await chartWrapper.isVisible().catch(() => false)
  console.log(`Chart wrapper visible: ${isChartVisible}`)

  if (isChartVisible) {
    // Screenshot of the chart element
    await chartWrapper.screenshot({ path: 'test/e2e/screenshots/chart-only.png' })
    console.log('Chart screenshot saved')
  }

  // Take viewport screenshot after scrolling
  await page.screenshot({ path: 'test/e2e/screenshots/chart-viewport.png' })
  console.log('Viewport screenshot saved')

  // Verify chart
  const rechartsCount = await page.locator('[class*="recharts"]').count()
  console.log(`Recharts elements: ${rechartsCount}`)

  expect(rechartsCount).toBeGreaterThan(0)
  console.log('✅ Chart area verified!')
})
