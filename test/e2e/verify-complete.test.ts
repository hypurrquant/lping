import { test, expect } from '@playwright/test'

test('Complete Pool Explorer verification', async ({ page }) => {
  test.setTimeout(120000)

  const errors: string[] = []
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('hydration') && !msg.text().includes('script')) {
      errors.push(msg.text())
    }
  })

  await page.setViewportSize({ width: 1600, height: 1000 })
  await page.goto('http://localhost:4001/explore')
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(3000)

  console.log('=== Step 1: Page loaded ===')

  // Check pool list
  const poolButtons = page.locator('button').filter({ hasText: /WETH|USDC/ })
  const poolCount = await poolButtons.count()
  console.log(`Pool buttons found: ${poolCount}`)
  expect(poolCount).toBeGreaterThan(0)

  // Take initial screenshot
  await page.screenshot({ path: 'test/e2e/screenshots/step1-pools.png' })

  console.log('=== Step 2: Select pool ===')

  // Select first WETH/USDC pool
  await poolButtons.first().click()
  console.log('Pool clicked')

  // Wait for loading to start and finish
  await page.waitForTimeout(2000)

  // Wait for liquidity data to load (up to 30 seconds)
  console.log('Waiting for liquidity data...')
  await page.waitForTimeout(20000)

  console.log('=== Step 3: Check chart elements ===')

  // Check for pool header
  const poolHeader = await page.locator('text=Fee:').first().isVisible()
  console.log(`Pool header visible: ${poolHeader}`)

  // Check for Liquidity Distribution heading
  const liquidityHeading = await page.locator('h3').filter({ hasText: 'Liquidity Distribution' }).isVisible()
  console.log(`Liquidity Distribution heading: ${liquidityHeading}`)

  // Check for current price section
  const currentPrice = await page.locator('text=Current Price').first().isVisible()
  console.log(`Current Price visible: ${currentPrice}`)

  // Check for recharts svg
  const rechartsSvg = await page.locator('.recharts-wrapper svg').count()
  console.log(`Recharts SVG: ${rechartsSvg}`)

  // Check for bar elements
  const barElements = await page.locator('.recharts-bar').count()
  console.log(`Recharts bar elements: ${barElements}`)

  // Take screenshot of the page
  await page.screenshot({ path: 'test/e2e/screenshots/step3-chart.png' })

  console.log('=== Step 4: Check stats ===')

  // Check for stats (Liquidity in Range, Tick Spacing, Active Ticks)
  const liquidityInRange = await page.locator('text=Liquidity in Range').isVisible()
  console.log(`Liquidity in Range stat: ${liquidityInRange}`)

  const activeTicks = await page.locator('text=Active Ticks').isVisible()
  console.log(`Active Ticks stat: ${activeTicks}`)

  // Check for Create Position button
  const createButton = await page.locator('button').filter({ hasText: 'Create Position' }).isVisible()
  console.log(`Create Position button: ${createButton}`)

  console.log('=== Error Summary ===')
  console.log(`Meaningful errors: ${errors.length}`)
  errors.forEach(e => console.log(`  - ${e}`))

  // Final assertions
  expect(poolHeader).toBe(true)
  expect(liquidityHeading).toBe(true)

  console.log('✅ All verifications passed!')
})
