import { test, expect } from '@playwright/test'

test('Pool Detail View with Wide Viewport', async ({ page }) => {
  test.setTimeout(90000)

  // Set wide viewport
  await page.setViewportSize({ width: 1920, height: 1080 })

  console.log('1. Navigating to explore page with wide viewport...')
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Find and click a pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  const count = await poolButtons.count()
  console.log(`2. Found ${count} pools`)

  if (count > 0) {
    await poolButtons.first().click()
    console.log('3. Clicked first pool')
    await page.waitForTimeout(3000)

    // Take wide screenshot
    await page.screenshot({
      path: 'test/e2e/screenshots/detail-01-wide-view.png',
      fullPage: false  // Capture viewport only
    })

    // Check for pool detail header (format: TOKEN0/TOKEN1)
    const detailHeader = page.locator('h2:has-text("/")')
    const headerText = await detailHeader.first().textContent().catch(() => '')
    console.log(`4. Detail header: ${headerText}`)

    // Check for Fee info
    const feeInfo = page.locator('text=/Fee:.*%/')
    const hasFeeInfo = await feeInfo.isVisible().catch(() => false)
    console.log(`5. Fee info visible: ${hasFeeInfo}`)

    // Check for Total APR (large display)
    const totalAPR = page.locator('div:has-text("Total APR") + div, div:has-text("%"):near(text=Total APR)')
    const aprCount = await totalAPR.count()
    console.log(`6. Total APR displays: ${aprCount}`)

    // Check for Liquidity Distribution section
    const liquiditySection = page.locator('text=Liquidity Distribution')
    const hasLiquidity = await liquiditySection.isVisible().catch(() => false)
    console.log(`7. Liquidity Distribution section: ${hasLiquidity}`)

    // Check for Current Price display
    const currentPrice = page.locator('text=Current Price')
    const hasCurrentPrice = await currentPrice.isVisible().catch(() => false)
    console.log(`8. Current Price visible: ${hasCurrentPrice}`)

    // Check for Investment Simulator
    const investmentSection = page.locator('text=Investment Amount')
    const hasInvestment = await investmentSection.isVisible().catch(() => false)
    console.log(`9. Investment section: ${hasInvestment}`)

    // Check for Range presets
    const rangePresets = page.locator('text=/Emission|±5%|±15%/')
    const presetsCount = await rangePresets.count()
    console.log(`10. Range presets found: ${presetsCount}`)

    // Check for Create Position button
    const createBtn = page.locator('button:has-text("Create Position")')
    const hasCreateBtn = await createBtn.isVisible().catch(() => false)
    console.log(`11. Create Position button: ${hasCreateBtn}`)

    // Scroll to see simulator
    await page.evaluate(() => window.scrollTo(0, 300))
    await page.waitForTimeout(500)
    await page.screenshot({
      path: 'test/e2e/screenshots/detail-02-scrolled.png',
      fullPage: false
    })

    // Try to interact with investment amount
    const amountInput = page.locator('input[placeholder*="$"]').first()
    if (await amountInput.isVisible()) {
      await amountInput.fill('10000')
      console.log('12. Filled investment amount')
      await page.waitForTimeout(1000)
      await page.screenshot({
        path: 'test/e2e/screenshots/detail-03-amount-entered.png',
        fullPage: false
      })
    }

    // Final full page screenshot
    await page.screenshot({
      path: 'test/e2e/screenshots/detail-04-fullpage.png',
      fullPage: true
    })

    // Assert pool detail is showing
    expect(headerText).toContain('/')
    expect(hasInvestment).toBeTruthy()
  }
})
