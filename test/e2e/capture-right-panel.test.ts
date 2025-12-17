import { test, expect } from '@playwright/test'

test('Capture right panel with chart', async ({ page }) => {
  test.setTimeout(120000)

  await page.setViewportSize({ width: 1920, height: 1080 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // Click on WETH/USDC pool
  const wethUsdcPool = page.locator('button').filter({ hasText: 'WETH/USDC' }).first()
  await wethUsdcPool.click()
  console.log('WETH/USDC pool selected')

  // Wait for liquidity data
  await page.waitForTimeout(20000)

  // Find the liquidity chart container
  const chartContainer = page.locator('div').filter({ hasText: 'Liquidity Distribution' }).locator('..').first()

  // Try to capture the parent div containing the chart
  const liquiditySection = page.locator('h3').filter({ hasText: 'Liquidity Distribution' }).locator('..')

  if (await liquiditySection.isVisible()) {
    await liquiditySection.screenshot({ path: 'test/e2e/screenshots/liquidity-section.png' })
    console.log('Liquidity section screenshot saved')
  }

  // Get the actual chart values
  const chartData = await page.evaluate(() => {
    // Get current price text
    const currentPriceEl = document.querySelector('[class*="text-lg"][class*="font-bold"]')
    const currentPrice = currentPriceEl?.textContent || 'N/A'

    // Get emission range
    const emissionRangeEl = document.querySelector('.text-emerald-400')
    const emissionRange = emissionRangeEl?.textContent || 'N/A'

    // Get stats
    const statsEls = document.querySelectorAll('[class*="text-lg"][class*="font-bold"]')
    const stats = Array.from(statsEls).map(el => el.textContent).slice(0, 5)

    return { currentPrice, emissionRange, stats }
  })

  console.log('\n=== Chart Data ===')
  console.log(`Current Price: ${chartData.currentPrice}`)
  console.log(`Emission Range: ${chartData.emissionRange}`)
  console.log(`Stats: ${chartData.stats.join(', ')}`)

  // Screenshot the whole page viewport
  await page.screenshot({ path: 'test/e2e/screenshots/viewport.png' })

  // Also try clip to get right side
  await page.screenshot({
    path: 'test/e2e/screenshots/right-side.png',
    clip: { x: 700, y: 100, width: 900, height: 800 }
  })
  console.log('\nRight side screenshot saved')

  console.log('\n✅ Capture complete!')
})
