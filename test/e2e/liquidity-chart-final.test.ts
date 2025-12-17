import { test, expect } from '@playwright/test'

test('Liquidity Chart Display Test', async ({ page }) => {
  test.setTimeout(120000)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click first pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  await poolButtons.first().click()
  console.log('1. Pool clicked')

  // Wait for API call to complete
  await page.waitForTimeout(8000)

  // Check for Liquidity Distribution section
  const liquiditySection = page.locator('text=Liquidity Distribution')
  const hasLiquiditySection = await liquiditySection.isVisible().catch(() => false)
  console.log('2. Liquidity Distribution section:', hasLiquiditySection)

  // Check for Current Price
  const currentPrice = page.locator('text=Current Price')
  const hasCurrentPrice = await currentPrice.isVisible().catch(() => false)
  console.log('3. Current Price:', hasCurrentPrice)

  // Check for Emission Range
  const emissionRange = page.locator('text=Emission Range')
  const hasEmissionRange = await emissionRange.isVisible().catch(() => false)
  console.log('4. Emission Range:', hasEmissionRange)

  // Check for Recharts SVG (the actual chart)
  const chartSVG = page.locator('svg.recharts-surface')
  const hasChart = await chartSVG.isVisible().catch(() => false)
  console.log('5. Recharts chart visible:', hasChart)

  // Check for bar elements in chart
  const bars = page.locator('.recharts-bar-rectangles rect')
  const barsCount = await bars.count()
  console.log('6. Chart bars count:', barsCount)

  // Take screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/liquidity-chart-test.png', fullPage: true })

  // Check for Loading text (if still loading)
  const loading = page.locator('text=Loading liquidity data')
  const isLoading = await loading.isVisible().catch(() => false)
  console.log('7. Is loading:', isLoading)

  // Assert
  expect(hasCurrentPrice || hasLiquiditySection).toBeTruthy()
})
