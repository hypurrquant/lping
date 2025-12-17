import { test, expect } from '@playwright/test'

test('Pool Explorer - Load and Select Pool', async ({ page }) => {
  // Set longer timeout
  test.setTimeout(120000)

  console.log('1. Navigating to explore page...')
  await page.goto('http://localhost:4001/explore')

  // Wait for page to load
  await page.waitForLoadState('domcontentloaded')
  console.log('2. DOM loaded, waiting for network...')

  // Wait longer for API response
  await page.waitForTimeout(5000)

  // Take screenshot of initial state
  await page.screenshot({ path: 'test/e2e/screenshots/step1-after-load.png', fullPage: true })
  console.log('3. Screenshot taken after initial load')

  // Check if loading spinner is present
  const spinner = page.locator('.animate-spin')
  const isSpinnerVisible = await spinner.isVisible().catch(() => false)
  console.log('4. Loading spinner visible:', isSpinnerVisible)

  // Wait for loading to complete (spinner to disappear)
  if (isSpinnerVisible) {
    console.log('5. Waiting for loading to complete...')
    await spinner.waitFor({ state: 'hidden', timeout: 60000 }).catch(() => {
      console.log('Spinner did not disappear within timeout')
    })
  }

  await page.waitForTimeout(2000)
  await page.screenshot({ path: 'test/e2e/screenshots/step2-after-spinner.png', fullPage: true })
  console.log('6. Screenshot taken after spinner')

  // Check for pool cards or any content
  const pageContent = await page.content()
  const hasWETH = pageContent.includes('WETH')
  const hasUSDC = pageContent.includes('USDC')
  const hasAPR = pageContent.includes('APR')
  console.log('7. Page content check - WETH:', hasWETH, 'USDC:', hasUSDC, 'APR:', hasAPR)

  // Try to find and click a pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  const poolCount = await poolButtons.count()
  console.log('8. Found pool buttons:', poolCount)

  if (poolCount > 0) {
    // Click first pool
    await poolButtons.first().click()
    console.log('9. Clicked first pool')

    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'test/e2e/screenshots/step3-pool-clicked.png', fullPage: true })
    console.log('10. Screenshot taken after pool click')

    // Check for detail panel
    const detailHeader = page.locator('h2').filter({ hasText: '/' })
    const hasDetail = await detailHeader.isVisible().catch(() => false)
    console.log('11. Detail panel visible:', hasDetail)
  }

  // Final screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/step4-final.png', fullPage: true })
  console.log('12. Final screenshot taken')

  // Assert that pools loaded
  expect(hasWETH || hasUSDC || hasAPR).toBeTruthy()
})
