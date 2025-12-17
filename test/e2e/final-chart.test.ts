import { test, expect } from '@playwright/test'

test('Final Liquidity Chart Test', async ({ page }) => {
  test.setTimeout(180000)

  await page.setViewportSize({ width: 1600, height: 1200 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click WETH/USDC pool
  const wethPool = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  await wethPool.click()
  console.log('1. WETH/USDC clicked')

  // Wait for API
  await page.waitForTimeout(25000)

  // Check tick spacing
  const tickSpacingText = await page.locator('text=/Tick Spacing.*\\d+/').first().textContent()
  console.log('2. Tick spacing:', tickSpacingText)

  // Scroll down to see the detail panel
  await page.evaluate(() => {
    const detailSection = document.querySelector('h3')
    if (detailSection) detailSection.scrollIntoView()
  })
  await page.waitForTimeout(1000)

  // Full page screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/final-chart-full.png', fullPage: true })

  // Check for chart
  const chartExists = await page.locator('svg').count()
  console.log('3. SVG elements:', chartExists)

  // Check for Liquidity Distribution content
  const liquidityHeading = await page.locator('h3').filter({ hasText: 'Liquidity' }).isVisible()
  console.log('4. Liquidity heading:', liquidityHeading)

  // Look for any recharts elements
  const rechartsElements = await page.locator('[class*="recharts"]').count()
  console.log('5. Recharts elements:', rechartsElements)

  // Check for loading or error states
  const loadingText = await page.locator('text=Loading').isVisible().catch(() => false)
  const errorText = await page.locator('text=Error').isVisible().catch(() => false)
  console.log('6. Loading:', loadingText, 'Error:', errorText)

  // Get the pool ID being requested
  const poolId = await page.evaluate(() => {
    // Check network requests or state
    return window.location.href
  })
  console.log('7. Current URL:', poolId)

  console.log('Test completed')
})
