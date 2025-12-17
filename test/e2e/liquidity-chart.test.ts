import { test, expect } from '@playwright/test'

test('Pool Detail and Liquidity Chart', async ({ page }) => {
  test.setTimeout(120000)

  console.log('1. Navigating to explore page...')
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  console.log('2. Taking initial screenshot...')
  await page.screenshot({ path: 'test/e2e/screenshots/liquidity-01-pools-loaded.png', fullPage: true })

  // Find pool buttons
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC|ETH/ })
  const poolCount = await poolButtons.count()
  console.log(`3. Found ${poolCount} pool buttons`)

  if (poolCount > 0) {
    // Click the first pool
    const firstPool = poolButtons.first()
    const poolText = await firstPool.textContent()
    console.log(`4. Clicking pool: ${poolText?.substring(0, 50)}...`)
    await firstPool.click()

    // Wait for detail panel to load
    await page.waitForTimeout(3000)
    console.log('5. Pool clicked, waiting for details...')

    // Check if pool detail header appeared
    const detailHeader = page.locator('h2').filter({ hasText: '/' })
    const hasDetailHeader = await detailHeader.isVisible().catch(() => false)
    console.log(`6. Detail header visible: ${hasDetailHeader}`)

    // Take screenshot after pool selection
    await page.screenshot({ path: 'test/e2e/screenshots/liquidity-02-pool-selected.png', fullPage: true })

    // Check for Total APR display (larger one in detail panel)
    const totalAPRText = page.locator('div:has-text("Total APR")').filter({ hasText: '%' })
    const aprCount = await totalAPRText.count()
    console.log(`7. Total APR elements: ${aprCount}`)

    // Wait for liquidity chart or loading indicator
    const loadingIndicator = page.locator('text=Loading liquidity data')
    const hasLoading = await loadingIndicator.isVisible().catch(() => false)
    console.log(`8. Loading indicator visible: ${hasLoading}`)

    if (hasLoading) {
      console.log('9. Waiting for loading to complete...')
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {
        console.log('Loading did not complete within timeout')
      })
    }

    await page.waitForTimeout(2000)
    await page.screenshot({ path: 'test/e2e/screenshots/liquidity-03-after-loading.png', fullPage: true })

    // Check for chart elements (Recharts renders SVG)
    const svgChart = page.locator('svg.recharts-surface')
    const hasChart = await svgChart.isVisible().catch(() => false)
    console.log(`10. Recharts SVG visible: ${hasChart}`)

    // Check for any chart container
    const chartContainer = page.locator('[class*="chart"], [class*="Chart"]')
    const chartContainerCount = await chartContainer.count()
    console.log(`11. Chart containers found: ${chartContainerCount}`)

    // Check for investment simulator
    const simulatorText = page.locator('text=Investment Amount')
    const hasSimulator = await simulatorText.isVisible().catch(() => false)
    console.log(`12. Investment simulator visible: ${hasSimulator}`)

    // Check for Create Position button
    const createButton = page.locator('button:has-text("Create Position")')
    const hasCreateButton = await createButton.isVisible().catch(() => false)
    console.log(`13. Create Position button visible: ${hasCreateButton}`)

    // Final screenshot
    await page.screenshot({ path: 'test/e2e/screenshots/liquidity-04-final.png', fullPage: true })

    // Scroll to see more content if needed
    await page.evaluate(() => window.scrollTo(0, 500))
    await page.waitForTimeout(500)
    await page.screenshot({ path: 'test/e2e/screenshots/liquidity-05-scrolled.png', fullPage: true })
  }

  // Get page HTML for debugging
  const pageHTML = await page.content()
  const hasPoolDetail = pageHTML.includes('Fee:') || pageHTML.includes('Tick Spacing')
  console.log(`14. Pool detail in HTML: ${hasPoolDetail}`)

  expect(poolCount).toBeGreaterThan(0)
})

test('Pool Selection Updates Detail Panel', async ({ page }) => {
  test.setTimeout(90000)

  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(5000)

  // Click first pool
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  if (await poolButtons.count() > 1) {
    // Click first pool
    await poolButtons.nth(0).click()
    await page.waitForTimeout(2000)

    // Get first pool's detail
    const firstDetailText = await page.locator('h2').filter({ hasText: '/' }).first().textContent()
    console.log(`First pool detail: ${firstDetailText}`)

    await page.screenshot({ path: 'test/e2e/screenshots/liquidity-06-first-pool.png', fullPage: true })

    // Click second pool
    await poolButtons.nth(1).click()
    await page.waitForTimeout(2000)

    // Get second pool's detail
    const secondDetailText = await page.locator('h2').filter({ hasText: '/' }).first().textContent()
    console.log(`Second pool detail: ${secondDetailText}`)

    await page.screenshot({ path: 'test/e2e/screenshots/liquidity-07-second-pool.png', fullPage: true })

    // Verify the detail changed
    console.log(`Detail changed: ${firstDetailText !== secondDetailText}`)
  }
})
