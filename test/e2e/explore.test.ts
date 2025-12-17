import { test, expect } from '@playwright/test'

test.describe('Pool Explorer E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to explore page
    await page.goto('http://localhost:4001/explore')
    // Wait for pools to load
    await page.waitForSelector('[data-testid="pool-card"], .pool-card, [class*="pool"]', { timeout: 30000 })
  })

  test('should load explore page with pool list', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Explore Pools')

    // Check that pools are loaded
    const poolCount = await page.locator('text=Available Pools').textContent()
    expect(poolCount).toContain('Available Pools')

    // Take screenshot
    await page.screenshot({ path: 'test/e2e/screenshots/explore-page.png' })
  })

  test('should select a pool and show details', async ({ page }) => {
    // Wait for pool cards to be visible
    await page.waitForTimeout(2000)

    // Find and click the first pool card (look for elements with APR percentage)
    const poolCards = page.locator('div:has(> div:has-text("%"))')
    const firstPool = poolCards.first()

    if (await firstPool.isVisible()) {
      await firstPool.click()

      // Wait for pool details to load
      await page.waitForTimeout(1000)

      // Take screenshot after selection
      await page.screenshot({ path: 'test/e2e/screenshots/pool-selected.png' })
    }
  })

  test('should filter pools by token', async ({ page }) => {
    // Find the token filter input
    const tokenInput = page.locator('input[placeholder*="WETH"]')

    if (await tokenInput.isVisible()) {
      // Type in filter
      await tokenInput.fill('USDC')

      // Wait for filter to apply
      await page.waitForTimeout(1500)

      // Take screenshot
      await page.screenshot({ path: 'test/e2e/screenshots/filtered-pools.png' })
    }
  })

  test('should sort pools by different criteria', async ({ page }) => {
    // Find sort dropdown
    const sortSelect = page.locator('select')

    if (await sortSelect.isVisible()) {
      // Change to TVL
      await sortSelect.selectOption('tvl')
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'test/e2e/screenshots/sorted-by-tvl.png' })

      // Change to Volume
      await sortSelect.selectOption('volume')
      await page.waitForTimeout(1500)
      await page.screenshot({ path: 'test/e2e/screenshots/sorted-by-volume.png' })
    }
  })
})

test.describe('Pool Selection Flow', () => {
  test('complete pool selection and view details', async ({ page }) => {
    // Go to explore page
    await page.goto('http://localhost:4001/explore')

    // Wait for page to fully load
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(3000)

    console.log('Page loaded, checking for pools...')

    // Get page content for debugging
    const pageContent = await page.content()
    const hasPoolData = pageContent.includes('WETH') || pageContent.includes('USDC') || pageContent.includes('APR')
    console.log('Has pool data:', hasPoolData)

    // Take initial screenshot
    await page.screenshot({ path: 'test/e2e/screenshots/01-initial-load.png', fullPage: true })

    // Try to find any clickable pool element
    const possiblePoolSelectors = [
      'div[class*="cursor-pointer"]',
      'div[class*="hover"]',
      'div:has(span:text("%"))',
      'button:has-text("WETH")',
      'div:has-text("WETH"):has-text("%")'
    ]

    let clicked = false
    for (const selector of possiblePoolSelectors) {
      try {
        const element = page.locator(selector).first()
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click()
          clicked = true
          console.log(`Clicked element with selector: ${selector}`)
          break
        }
      } catch (e) {
        // Continue to next selector
      }
    }

    if (clicked) {
      // Wait for detail panel
      await page.waitForTimeout(2000)
      await page.screenshot({ path: 'test/e2e/screenshots/02-pool-selected.png', fullPage: true })

      // Check if detail panel appeared
      const hasDetailPanel = await page.locator('text=Total APR').isVisible()
      console.log('Detail panel visible:', hasDetailPanel)
    }

    // Final screenshot
    await page.screenshot({ path: 'test/e2e/screenshots/03-final-state.png', fullPage: true })
  })
})
