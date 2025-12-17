import { test, expect } from '@playwright/test'

test('Capture Right Panel Detail', async ({ page }) => {
  test.setTimeout(90000)

  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click first pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  await poolButtons.first().click()
  await page.waitForTimeout(3000)

  // Capture only right side of viewport (detail panel)
  await page.screenshot({
    path: 'test/e2e/screenshots/right-panel-detail.png',
    clip: { x: 700, y: 0, width: 740, height: 900 }
  })

  // Also capture full viewport for reference
  await page.screenshot({
    path: 'test/e2e/screenshots/full-viewport.png'
  })

  // Log what we see
  const poolHeader = await page.locator('h2').filter({ hasText: '/' }).first().textContent()
  console.log('Selected pool:', poolHeader)

  const hasCreateBtn = await page.locator('button').filter({ hasText: 'Create Position' }).isVisible()
  console.log('Create Position button:', hasCreateBtn)

  const hasInvestmentInput = await page.locator('text=Investment Amount').isVisible()
  console.log('Investment Amount:', hasInvestmentInput)

  const hasCurrentPrice = await page.locator('text=Current Price').isVisible()
  console.log('Current Price:', hasCurrentPrice)

  expect(hasCreateBtn).toBeTruthy()
})
