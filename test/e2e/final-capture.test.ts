import { test, expect } from '@playwright/test'

test('Final Pool Detail Capture', async ({ page }) => {
  test.setTimeout(90000)

  // Standard viewport
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Screenshot pools list
  await page.screenshot({ path: 'test/e2e/screenshots/final-01-pools.png' })

  // Click a pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  if (await poolButtons.count() > 0) {
    await poolButtons.first().click()
    await page.waitForTimeout(3000)

    // Screenshot after selection
    await page.screenshot({ path: 'test/e2e/screenshots/final-02-selected.png' })

    // Scroll right to see detail panel
    await page.evaluate(() => {
      const detailPanel = document.querySelector('button:has-text("Create Position")')?.closest('div')
      if (detailPanel) detailPanel.scrollIntoView({ behavior: 'smooth' })
    })
    await page.waitForTimeout(1000)

    // Take screenshots of different parts
    // Left side - pool list
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.screenshot({ path: 'test/e2e/screenshots/final-03-left.png', clip: { x: 0, y: 0, width: 720, height: 900 } })

    // Right side - detail panel
    await page.screenshot({ path: 'test/e2e/screenshots/final-04-right.png', clip: { x: 720, y: 0, width: 720, height: 900 } })

    // Verify elements
    const header = await page.locator('h2:has-text("/")').first().textContent()
    console.log('Pool header:', header)

    const feeVisible = await page.locator('text=/Fee:.*%/').isVisible()
    console.log('Fee visible:', feeVisible)

    const simulatorVisible = await page.locator('text=Investment Amount').isVisible()
    console.log('Simulator visible:', simulatorVisible)

    const createBtnVisible = await page.locator('button:has-text("Create Position")').isVisible()
    console.log('Create button visible:', createBtnVisible)

    expect(header).toContain('/')
  }
})
