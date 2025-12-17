import { test, expect } from '@playwright/test'

test('Full page verification with chart', async ({ page }) => {
  test.setTimeout(120000)

  await page.setViewportSize({ width: 1400, height: 1200 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // Select WETH/USDC pool
  const wethPool = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  await wethPool.click()
  console.log('Pool selected')

  // Wait for data
  await page.waitForTimeout(20000)

  // Full page screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/full-page.png', fullPage: true })
  console.log('Full page screenshot saved')

  // Check for key elements
  const poolDetails = await page.locator('text=Tick Spacing').isVisible()
  console.log(`Pool details visible: ${poolDetails}`)

  const liquidityHeading = await page.locator('h3').filter({ hasText: 'Liquidity' }).isVisible()
  console.log(`Liquidity heading: ${liquidityHeading}`)

  const rechartsElements = await page.locator('[class*="recharts"]').count()
  console.log(`Recharts elements: ${rechartsElements}`)

  // Check SVG chart
  const svgElements = await page.locator('svg').count()
  console.log(`SVG elements: ${svgElements}`)

  // Look for chart container
  const chartContainer = await page.locator('.recharts-wrapper').isVisible().catch(() => false)
  console.log(`Chart wrapper visible: ${chartContainer}`)

  expect(poolDetails).toBe(true)
  expect(liquidityHeading).toBe(true)
  expect(rechartsElements).toBeGreaterThan(0)

  console.log('✅ Full page verification passed!')
})
