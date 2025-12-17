import { test, expect } from '@playwright/test'

test('Verify Liquidity Chart is visible', async ({ page }) => {
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

  // Scroll to liquidity section
  await page.evaluate(() => {
    const liquidityHeading = document.querySelector('h3')
    if (liquidityHeading) {
      liquidityHeading.scrollIntoView({ behavior: 'instant', block: 'start' })
    }
  })
  await page.waitForTimeout(1000)

  // Screenshot of chart area
  await page.screenshot({ path: 'test/e2e/screenshots/chart-visible.png' })
  console.log('Chart screenshot saved')

  // Check recharts
  const rechartsCount = await page.locator('[class*="recharts"]').count()
  console.log(`Recharts elements: ${rechartsCount}`)

  // Check for bars in the chart
  const barCount = await page.locator('.recharts-bar-rectangle').count()
  console.log(`Bar rectangles: ${barCount}`)

  // Get any visible text about liquidity
  const liquidityText = await page.locator('h3').filter({ hasText: 'Liquidity' }).textContent()
  console.log(`Heading: ${liquidityText}`)

  expect(rechartsCount).toBeGreaterThan(0)
  console.log('✅ Chart verified!')
})
