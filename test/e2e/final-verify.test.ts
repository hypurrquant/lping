import { test, expect } from '@playwright/test'

test('Final verification with full page', async ({ page }) => {
  test.setTimeout(120000)

  // Use a wide viewport to see both columns
  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  console.log('Page loaded')

  // Click on WETH/USDC pool specifically
  const wethUsdcPool = page.locator('button').filter({ hasText: 'WETH/USDC' }).first()
  await wethUsdcPool.click()
  console.log('WETH/USDC pool selected')

  // Wait for liquidity data
  await page.waitForTimeout(20000)

  // Check key elements
  const checks = {
    poolHeader: await page.locator('h2').filter({ hasText: 'WETH/USDC' }).isVisible(),
    liquidityHeading: await page.locator('h3').filter({ hasText: 'Liquidity Distribution' }).isVisible(),
    currentPrice: await page.locator('text=Current Price').first().isVisible(),
    emissionRange: await page.locator('text=Emission Range').first().isVisible(),
    liquidityInRange: await page.locator('text=Liquidity in Range').isVisible(),
    createButton: await page.locator('button').filter({ hasText: 'Create Position' }).isVisible(),
  }

  console.log('\n=== Verification Results ===')
  Object.entries(checks).forEach(([key, value]) => {
    console.log(`${key}: ${value ? '✅' : '❌'}`)
  })

  // Get info about recharts
  const rechartsInfo = await page.evaluate(() => {
    const rechartsElements = document.querySelectorAll('[class*="recharts"]')
    return {
      count: rechartsElements.length,
      classes: Array.from(rechartsElements).map(el => el.className).slice(0, 5)
    }
  })
  console.log(`\nRecharts elements: ${rechartsInfo.count}`)
  console.log(`Classes: ${rechartsInfo.classes.join(', ')}`)

  // Take full page screenshot
  await page.screenshot({
    path: 'test/e2e/screenshots/final-full.png',
    fullPage: true
  })
  console.log('\nFull page screenshot saved')

  // Assertions
  expect(checks.poolHeader).toBe(true)
  expect(checks.liquidityHeading).toBe(true)
  expect(checks.currentPrice).toBe(true)

  console.log('\n✅ Final verification passed!')
})
