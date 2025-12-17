import { test, expect } from '@playwright/test'

test('Capture Pool Detail Panel', async ({ page }) => {
  test.setTimeout(90000)

  // Set ultra-wide viewport to capture both columns
  await page.setViewportSize({ width: 2560, height: 1440 })

  console.log('1. Navigating to explore page...')
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Screenshot before selecting pool - should show "Select a Pool" placeholder
  await page.screenshot({
    path: 'test/e2e/screenshots/capture-01-before-select.png',
    fullPage: true
  })
  console.log('2. Screenshot before selection taken')

  // Find and click a pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  const count = await poolButtons.count()
  console.log(`3. Found ${count} pools`)

  if (count > 0) {
    // Click second pool (USDC/CBBTC usually has good data)
    const targetPool = count > 1 ? poolButtons.nth(1) : poolButtons.first()
    const poolText = await targetPool.textContent()
    console.log(`4. Clicking pool: ${poolText?.substring(0, 30)}...`)
    await targetPool.click()

    // Wait for detail to load
    await page.waitForTimeout(5000)

    // Full page screenshot
    await page.screenshot({
      path: 'test/e2e/screenshots/capture-02-full-page.png',
      fullPage: true
    })
    console.log('5. Full page screenshot taken')

    // Check what's visible
    const elements = {
      detailHeader: await page.locator('h2:has-text("/")').first().isVisible().catch(() => false),
      feeInfo: await page.locator('text=/Fee:.*%/').isVisible().catch(() => false),
      tickSpacing: await page.locator('text=/Tick Spacing/').isVisible().catch(() => false),
      liquidityDist: await page.locator('text=Liquidity Distribution').isVisible().catch(() => false),
      currentPrice: await page.locator('text=Current Price').isVisible().catch(() => false),
      investmentAmount: await page.locator('text=Investment Amount').isVisible().catch(() => false),
      createButton: await page.locator('button:has-text("Create Position")').isVisible().catch(() => false),
      selectPoolPrompt: await page.locator('text=Select a Pool').isVisible().catch(() => false),
    }

    console.log('6. Element visibility:', JSON.stringify(elements, null, 2))

    // Scroll right panel into view if needed
    const rightPanel = page.locator('div:has(button:has-text("Create Position"))').first()
    if (await rightPanel.isVisible()) {
      await rightPanel.scrollIntoViewIfNeeded()
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: 'test/e2e/screenshots/capture-03-detail-panel.png',
        fullPage: true
      })
      console.log('7. Detail panel screenshot taken')
    }

    // Get the detail header text
    const headerText = await page.locator('h2:has-text("/")').first().textContent().catch(() => 'N/A')
    console.log(`8. Pool detail header: ${headerText}`)

    // Check for loading indicator
    const isLoading = await page.locator('text=Loading liquidity data').isVisible().catch(() => false)
    console.log(`9. Is loading: ${isLoading}`)

    // Assert the detail panel is showing
    expect(elements.investmentAmount || elements.createButton).toBeTruthy()
  }
})
