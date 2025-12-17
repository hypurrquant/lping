import { test, expect } from '@playwright/test'

test('Verify Pool Explorer works without errors', async ({ page }) => {
  test.setTimeout(120000)

  const consoleErrors: string[] = []
  const networkErrors: string[] = []

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  // Capture network failures
  page.on('requestfailed', request => {
    networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`)
  })

  await page.setViewportSize({ width: 1400, height: 900 })

  // Step 1: Load explore page
  console.log('Step 1: Loading explore page...')
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  // Check pools loaded
  const poolCount = await page.locator('button').filter({ hasText: /WETH|USDC|cbBTC/ }).count()
  console.log(`  - Pools loaded: ${poolCount}`)
  expect(poolCount).toBeGreaterThan(0)

  // Step 2: Select WETH/USDC pool
  console.log('Step 2: Selecting WETH/USDC pool...')
  const wethPool = page.locator('button').filter({ hasText: 'WETH' }).filter({ hasText: 'USDC' }).first()
  await wethPool.click()
  console.log('  - Pool clicked')

  // Step 3: Wait for liquidity data
  console.log('Step 3: Waiting for liquidity data...')
  await page.waitForTimeout(20000)

  // Step 4: Verify chart rendered
  console.log('Step 4: Checking chart rendering...')
  const rechartsCount = await page.locator('[class*="recharts"]').count()
  console.log(`  - Recharts elements: ${rechartsCount}`)

  const liquidityHeading = await page.locator('h3').filter({ hasText: 'Liquidity' }).isVisible()
  console.log(`  - Liquidity heading visible: ${liquidityHeading}`)

  // Step 5: Check for any error states in UI
  console.log('Step 5: Checking for error states...')
  const errorVisible = await page.locator('text=Error').isVisible().catch(() => false)
  const failedVisible = await page.locator('text=Failed').isVisible().catch(() => false)
  console.log(`  - Error text visible: ${errorVisible}`)
  console.log(`  - Failed text visible: ${failedVisible}`)

  // Step 6: Take screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/verify-no-errors.png', fullPage: true })
  console.log('Step 6: Screenshot saved')

  // Report errors
  console.log('\n=== Error Summary ===')
  console.log(`Console errors: ${consoleErrors.length}`)
  consoleErrors.forEach(err => console.log(`  - ${err}`))
  console.log(`Network errors: ${networkErrors.length}`)
  networkErrors.forEach(err => console.log(`  - ${err}`))

  // Assertions
  expect(rechartsCount).toBeGreaterThan(0)
  expect(liquidityHeading).toBe(true)
  expect(errorVisible).toBe(false)
  expect(failedVisible).toBe(false)

  console.log('\n✅ All verifications passed!')
})
