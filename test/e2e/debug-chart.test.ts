import { test, expect } from '@playwright/test'

test('Debug Liquidity Chart View', async ({ page }) => {
  test.setTimeout(120000)

  // Wide viewport for 2-column layout (lg:1024px+)
  await page.setViewportSize({ width: 1600, height: 1000 })

  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Screenshot before clicking
  await page.screenshot({ path: 'test/e2e/screenshots/debug-1-before-click.png' })

  // Find WETH/USDC pool
  const poolButton = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  const buttonText = await poolButton.textContent()
  console.log('Pool button text:', buttonText?.substring(0, 100))

  // Click the pool
  await poolButton.click()
  console.log('Pool clicked')

  // Wait for state update
  await page.waitForTimeout(3000)

  // Check if detail panel appeared
  const detailHeader = page.locator('h2').filter({ hasText: '/' })
  const detailCount = await detailHeader.count()
  console.log('Detail headers found:', detailCount)

  // Screenshot after click
  await page.screenshot({ path: 'test/e2e/screenshots/debug-2-after-click.png' })

  // Wait for API call
  await page.waitForTimeout(15000)

  // Check for Total APR in detail panel (the large one, not in list)
  const totalAprBig = page.locator('div.text-2xl.font-bold.text-emerald-400')
  const aprCount = await totalAprBig.count()
  console.log('Large APR displays:', aprCount)

  // Check for Fee info
  const feeInfo = page.locator('text=/Fee:.*%/')
  const feeCount = await feeInfo.count()
  console.log('Fee info found:', feeCount)

  // Check for Liquidity Distribution heading
  const liquidityHeading = page.locator('h3').filter({ hasText: 'Liquidity Distribution' })
  const liquidityCount = await liquidityHeading.count()
  console.log('Liquidity Distribution headings:', liquidityCount)

  // Screenshot after waiting
  await page.screenshot({ path: 'test/e2e/screenshots/debug-3-after-wait.png' })

  // Get page state
  const hasDetailPanel = aprCount > 0 || feeCount > 0
  console.log('Detail panel visible:', hasDetailPanel)

  expect(hasDetailPanel).toBeTruthy()
})
