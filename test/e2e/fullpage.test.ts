import { test, expect } from '@playwright/test'

test('Full Page with Detail Panel', async ({ page }) => {
  test.setTimeout(90000)

  // Use large viewport for 2-column layout (lg breakpoint is 1024px)
  await page.setViewportSize({ width: 1280, height: 800 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click first pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  await poolButtons.first().click()
  await page.waitForTimeout(3000)

  // Take full page screenshot
  await page.screenshot({
    path: 'test/e2e/screenshots/fullpage-with-detail.png',
    fullPage: true
  })

  // Scroll down to see detail panel if it's below
  await page.evaluate(() => window.scrollTo(0, 500))
  await page.waitForTimeout(500)
  await page.screenshot({
    path: 'test/e2e/screenshots/scrolled-down.png'
  })

  // Log the page structure
  const bodyHTML = await page.evaluate(() => {
    return document.body.innerHTML.length
  })
  console.log('Body HTML length:', bodyHTML)

  // Check for detail panel elements
  const detailElements = {
    poolHeader: await page.locator('h2').filter({ hasText: '/' }).count(),
    feeInfo: await page.locator('text=/Fee:.*%/').count(),
    currentPrice: await page.locator('text=Current Price').count(),
    investmentAmount: await page.locator('text=Investment Amount').count(),
    createBtn: await page.locator('button').filter({ hasText: 'Create Position' }).count(),
    liquidityDist: await page.locator('text=Liquidity Distribution').count(),
  }
  console.log('Detail elements found:', JSON.stringify(detailElements, null, 2))

  expect(detailElements.createBtn).toBeGreaterThan(0)
})
